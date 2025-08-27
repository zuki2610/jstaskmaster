function renderEditTask(task) {
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
                  value="${task.title}"
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
                >${task.description}</textarea>
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
                  <option value="john-doe" selected>task</option>
                  <option value="jane-smith">Jane Smith</option>
                  <option value="mike-johnson">Mike Johnson</option>
                  <option value="sarah-wilson">Sarah Wilson</option>
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
                  <option value="backlog" selected>Backlog</option>
                  <option value="inprogress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </form>
          </div>

          <div class="component-modal__footer">
            <button
              type="button"
              class="component-button component-button--secondary"
              data-js="cancel-task"
            >
              Cancel
            </button>
            <button
              type="button"
              class="component-button component-button--primary"
              data-js="save-task"
            >
              Save Changes
            </button>
          </div>
        </div>
      
    `;
  document
    .querySelector('[data-js="save-task"]')
    .addEventListener("click", () => {
      const updatedTask = {
        id: task.id,
        title: document.querySelector('[data-js="task-title"]').value,
        description: document.querySelector('[data-js="task-description"]')
          .value,
        assignee: document.querySelector('[data-js="assigned-user"]').value,
        column: document.querySelector('[data-js="process-stage"]').value,
      };
      localStorage.setItem(
        `task-${updatedTask.id}`,
        JSON.stringify(updatedTask)
      );
      document
        .querySelector('[data-js="modal-overlay"]')
        .classList.add("component-modal-overlay--hidden");
    });

  document
    .querySelector('[data-js="close-modal"]')
    .addEventListener("click", () => {
      document
        .querySelector('[data-js="modal-overlay"]')
        .classList.add("component-modal-overlay--hidden");
    });

  console.log(task);
}
