function renderEditTask(id) {
  const tasks = Storage.get(TASKS_KEY);
  const selectedTask = tasks.find((item) => item.id === id);
  console.log(selectedTask);

  const USERS = ["john doe", "maria", "jose"];

  const el = document.querySelector('[data-js="modal-overlay"]');
  el.classList.remove("component-modal-overlay--hidden");
  el.innerHTML = `
        <div
          class="component-modal"
          role="dialog"
          aria-labelledby="modal-title"
          aria-modal="true"
          data-js="modal"
        >
          <div class="component-modal__header">
            <h2 id="modal-title" class="component-modal__title">
              Editar Tarea
            </h2>
            <button
              class="component-modal__close-button"
              data-js="close-modal"
              aria-label="Close modal"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="component-modal__content">
            <form id="taskForm" data-js="task-form">
              <div class="component-form__group">
                <label for="taskTitle" class="component-form__label"
                  >Título</label
                >
                <input
                  type="text"
                  id="taskTitle"
                  class="component-form__input"
                  value="${selectedTask.title}"
                  placeholder="Ingresa un Título para la tarea"
                  data-js="task-title"
                />
              </div>

              <div class="component-form__group">
                <label for="taskDescription" class="component-form__label"
                  >Descripción</label
                >
                <textarea
                  id="taskDescription"
                  class="component-form__textarea"
                  placeholder="Describe la tarea..."
                  data-js="task-description"
                  value=""
                >${selectedTask?.descripcion ?? ""}</textarea>
              </div>

              <div class="component-form__group">
                <label for="assignedUser" class="component-form__label"
                  >Asignar miembro</label
                >
                <select
                  id="assignedUser"
                  class="component-form__select"
                  data-js="assigned-user"
                >
                <option value="">Select user</option>
                ${USERS.map((user) => {
                  return `<option value="${user}" ${
                    selectedTask.asignado === user ? "selected" : ""
                  }>${user}</option>`;
                })}
          
                </select>
              </div>

              <div class="component-form__group">
                <label for="processStage" class="component-form__label"
                  >Estado</label
                >
                <select
                  id="processStage"
                  class="component-form__select"
                  data-js="process-stage"
                >
                  <option value="backlog" ${
                    selectedTask.column === "backlog" ? "selected" : ""
                  }>Backlog</option>
                  <option value="inprogress" ${
                    selectedTask.column === "inprogress" ? "selected" : ""
                  }>En Progreso</option>
                  <option value="done" ${
                    selectedTask.column === "done" ? "selected" : ""
                  }>Hecho</option>
                </select>
              </div>
            </form>
          </div>

          <div class="component-modal__footer">
            <button
              type="button"
              class="component-button component-button--danger__taskModal"
              data-js="delete-task"
            >
              Borrar Tarea
            </button>
            <button
              type="button"
              class="component-button component-button--primary"
              data-js="save-task"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      
    `;
  document
    .querySelector('[data-js="save-task"]')
    .addEventListener("click", () => {
      handleClickUpdateTask(selectedTask);
    });

  document
    .querySelector('[data-js="delete-task"]')
    .addEventListener("click", () => {
      renderDeleteConfirmation(selectedTask.id);
    });

  document
    .querySelector('[data-js="close-modal"]')
    .addEventListener("click", handleCloseTaskModal());

  el.addEventListener("click", (event) => {
    if (event.target === el) {
      el.classList.add("component-modal-overlay--hidden");
    }
  });
}

function updatedTask() {}

function handleClickUpdateTask(task) {
  const updatedTask = {
    id: task.id,
    title: document.querySelector('[data-js="task-title"]').value,
    asignado: document.querySelector('[data-js="assigned-user"]').value,
    descripcion:
      document.querySelector?.('[data-js="task-description"]')?.value ?? "",
    column: document.querySelector('[data-js="process-stage"]').value,
  };

  Storage.patch(TASKS_KEY, (previousValue) => {
    if (!Array.isArray(previousValue)) {
      return;
    }

    const updatedTasks = previousValue.map((itemTask) => {
      if (itemTask.id === task.id) {
        itemTask = {
          ...updatedTask,
        };
        return itemTask;
      }
      return itemTask;
    });
    return updatedTasks;
  });

  document
    .querySelector('[data-js="modal-overlay"]')
    .classList.add("component-modal-overlay--hidden");

  if (typeof renderBoard === "function") {
    renderBoard();
  }
}

function handleCloseTaskModal() {
  document
    .querySelector('[data-js="close-modal"]')
    .addEventListener("click", () => {
      document
        .querySelector('[data-js="modal-overlay"]')
        .classList.add("component-modal-overlay--hidden");
    });
}

function renderDeleteConfirmation(id) {
  const el = document.querySelector('[data-js="modal-overlay"]');
  el.classList.remove("component-modal-overlay--hidden");
  el.innerHTML = `
    <div class="component-modal" role="dialog" aria-modal="true">
      <div class="component-modal__header">
        <h2 class="component-modal__title">Confirmar Eliminación</h2>
      </div>
      <div class="component-modal__content">
        <p>¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer.</p>
      </div>
      <div class="component-modal__footer">
        <button class="component-button component-button--secondary" data-js="cancel-delete">Cancelar</button>
        <button class="component-button component-button--danger" data-js="confirm-delete">Eliminar</button>
      </div>
    </div>
  `;

  el.querySelector('[data-js="cancel-delete"]').onclick = () => {
    el.classList.add("component-modal-overlay--hidden");
  };

  el.querySelector('[data-js="confirm-delete"]').onclick = () => {
    Storage.set(
      TASKS_KEY,
      Storage.get(TASKS_KEY, []).filter((t) => t.id !== id)
    );
    el.classList.add("component-modal-overlay--hidden");
    renderBoard();
    if (typeof initStatsSection === "function") initStatsSection();
  };

  el.onclick = (event) => {
    if (event.target === el) {
      el.classList.add("component-modal-overlay--hidden");
    }
  };
}
