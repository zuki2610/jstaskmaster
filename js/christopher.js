//para cargar las tareas desde la api

const STORAGE_KEY = "ttm:tasks";
const API_URL = "https://68a8eeb4b115e67576ea102a.mockapi.io/tareas";

async function cargarTareasIniciales() {
  let tareasLocal = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

  if (tareasLocal.length === 0) {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Error al obtener las tareas desde la API");

      let tareas = await response.json();

      tareas = tareas.map(t => ({
        id: t.id,
        title: t.title || "-",
        asignado: t.asignado || "-",
        descripcion: t.descripcion || "-",
        column: t.column || "backlog"
      }));

      localStorage.setItem(STORAGE_KEY, JSON.stringify(tareas));
      console.log("Tareas cargadas desde API y guardadas en localStorage.");
    } catch (error) {
      console.error("Fallo al cargar tareas:", error);
    }
  } else {
    console.log("Tareas ya existen en localStorage, no se hace fetch.");
  }
}

cargarTareasIniciales();





//aqui empiezan los graficos


EventBus.on("app:user_logged_in", () => {
  setTimeout(initStatsSection, 100);
});
EventBus.on("stats:ready", () => {
  initStatsSection();
});


let estadoChartInstance = null;
function updateEstadoChart() {
  const tareas = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  const completadas = tareas.filter(t => t.column === "done").length;
  const pendientes = tareas.length - completadas;

  const canvas = document.getElementById("task-status-chart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  if (estadoChartInstance) estadoChartInstance.destroy();

  estadoChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Completadas", "Pendientes"],
      datasets: [{
        label: "Estado de tareas",
        data: [completadas, pendientes],
        backgroundColor: ["rgb(226, 153, 86)", "rgb(156, 92, 76)"],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        title: { display: true, text: 'Estado actual de las tareas' }
      }
    }
  });
}


let asignadoChartInstance = null;

const PALETA_PERSONAS = [
  "#BF9064",
  "#9A7F67",
  "#E39A56",
  "#766A5F",
  "#514B45",
  "#332B24"
];

function updateAsignadoChart() {
  const tareas = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  const conteoPorPersona = {};
  for (const tarea of tareas) {
    const persona = tarea.asignado && tarea.asignado !== "-" ? tarea.asignado : "Sin asignar";
    conteoPorPersona[persona] = (conteoPorPersona[persona] || 0) + 1;
  }

  const personas = Object.keys(conteoPorPersona);
  const cantidades = Object.values(conteoPorPersona);
  const totalTareas = cantidades.reduce((a, b) => a + b, 0);
  const promedio = totalTareas / personas.length;

  const canvas = document.getElementById("asign-status-chart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  if (asignadoChartInstance) asignadoChartInstance.destroy();

  asignadoChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: personas,
      datasets: [{
        label: "Tareas por persona",
        data: cantidades,
        backgroundColor: personas.map((_, i) => PALETA_PERSONAS[i % PALETA_PERSONAS.length]),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        title: {
          display: true,
          text: `Distribución de tareas por persona (Promedio: ${promedio.toFixed(2)})`
        }
      }
    }
  });
}


let notStatusChartInstance = null;
function updateNotStatusChart() {
  const tareas = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  let noAsignadas = 0;
  let asignadasPendientes = 0;
  let completadas = 0;

  for (const tarea of tareas) {
    const asignado = (tarea.asignado || "").trim();
    const column = tarea.column;

    if (asignado === "" || asignado === "-") {
      noAsignadas++;
    } else if (column !== "done") {
      asignadasPendientes++;
    } else {
      completadas++;
    }
  }

  const canvas = document.getElementById("not-status-chart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (notStatusChartInstance) notStatusChartInstance.destroy();

  notStatusChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["No asignadas", "Asignadas pendientes", "Completadas"],
      datasets: [{
        label: "Resumen de tareas",
        data: [noAsignadas, asignadasPendientes, completadas],
        backgroundColor: ["rgb(25, 43, 34)", "rgb(226, 153, 86)", "rgb(156, 92, 76)"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: "Distribución de tareas por estado y asignación" }
      },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  });
}


function initStatsSection() {
  updateEstadoChart();
  updateAsignadoChart();
  updateNotStatusChart();
}