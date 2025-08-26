

const STORAGE_KEY = "ttm:tasks";
const API_URL = "https://68a8eeb4b115e67576ea102a.mockapi.io/tareas";

async function cargarTareasIniciales() {
  const yaExisten = localStorage.getItem(STORAGE_KEY);

  if (!yaExisten) {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Error al obtener las tareas desde la API");
      
      const tareas = await response.json();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tareas));
      console.log("Tareas cargadas y guardadas en localStorage por primera vez.");
    } catch (error) {
      console.error("Fallo al cargar tareas:", error);
    }
  } else {
    console.log("Tareas ya existen en localStorage. No se hace fetch.");
  }
}

cargarTareasIniciales();



document.addEventListener("DOMContentLoaded", () => {
  updateEstadoChart();
  updateAsignadoChart();
  updateNotStatusChart();
});





let estadoChartInstance = null;

function updateEstadoChart() {
  const tareas = JSON.parse(localStorage.getItem("ttm:tasks")) || [];

  const completadas = tareas.filter(t => t.estado === true).length;
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
        backgroundColor: ["#4caf50", "#f44336"],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        title: {
          display: true,
          text: 'Estado actual de las tareas'
        }
      }
    }
  });
}




let asignadoChartInstance = null;

function updateAsignadoChart() {
  const tareas = JSON.parse(localStorage.getItem("ttm:tasks")) || [];

  const conteoPorPersona = {};
  for (const tarea of tareas) {
    const persona = tarea.asignado || "Sin asignar";
    conteoPorPersona[persona] = (conteoPorPersona[persona] || 0) + 1;
  }

  const personas = Object.keys(conteoPorPersona);
  const cantidades = Object.values(conteoPorPersona);
  const totalTareas = cantidades.reduce((a, b) => a + b, 0);
  const promedio = totalTareas / personas.length;

  const canvas = document.getElementById("asign-status-chart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  // Destruir gráfico anterior si ya existe
  if (asignadoChartInstance) {
    asignadoChartInstance.destroy();
  }

  asignadoChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: personas,
      datasets: [{
        label: "Tareas por persona",
        data: cantidades,
        backgroundColor: personas.map((_, i) => `hsl(${i * 60}, 70%, 60%)`),
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
  const tareas = JSON.parse(localStorage.getItem("ttm:tasks")) || [];

  let noAsignadas = 0;
  let asignadasPendientes = 0;
  let completadas = 0;

  for (const tarea of tareas) {
    const asignado = (tarea.asignado || "").trim();
    const estado = tarea.estado === true;

    if (asignado === "" || asignado === "-") {
      noAsignadas++;
    } else if (!estado) {
      asignadasPendientes++;
    } else {
      completadas++;
    }
  }

  const canvas = document.getElementById("not-status-chart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (notStatusChartInstance) {
    notStatusChartInstance.destroy();
  }

  notStatusChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["No asignadas", "Asignadas pendientes", "Completadas"],
      datasets: [{
        label: "Resumen de tareas",
        data: [noAsignadas, asignadasPendientes, completadas],
        backgroundColor: ["#ff9800", "#2196f3", "#4caf50"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Distribución de tareas por estado y asignación"
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    }
  });
}