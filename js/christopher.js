

const STORAGE_KEY = "ttm:tasks";
const API_URL = "https://68a8eeb4b115e67576ea102a.mockapi.io/tareas";

export async function cargarTareasIniciales() {
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