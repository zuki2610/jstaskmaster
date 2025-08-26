// js/franco.js

const EventBus = {
  on: () => {},
  emit: (eventName, payload) => console.log("Emit:", eventName, payload)
};

const Storage = {
  get(key, fallback = []) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

export function mountAssignment() {
  const rootEl = document.querySelector('[data-js="assignment-section"]');
  if (!rootEl) return;

  render();

  rootEl.addEventListener("click", (e) => {
    const taskId = e.target.closest("[data-id]")?.dataset.id;
    if (!taskId) return;

    if (e.target.matches('[data-js="task-toggle"]')) {
      toggleTaskDone(taskId);
    }

    if (e.target.matches('[data-js="task-assign-button"]')) {
      const selectEl = e.target.closest("[data-id]").querySelector('[data-js="task-assign"]');
      const selectedIds = Array.from(selectEl.selectedOptions).map(o => o.value);
      assignTask(taskId, selectedIds);
    }

    if (e.target.matches('[data-js="task-remove-button"]')) {
      const selectEl = e.target.closest("[data-id]").querySelector('[data-js="task-assign"]');
      const selectedIds = Array.from(selectEl.selectedOptions).map(o => o.value);
      removeAssignees(taskId, selectedIds);
    }
  });
}

function render() {
  const rootEl = document.querySelector('[data-js="assignment-section"]');
  const tasks = Storage.get("ttm:tasks", []);
  const users = Storage.get("ttm:users", []);

  rootEl.innerHTML = tasks.map(t => `
    <article class="component-task-card ${t.done ? "component-task-card--completed" : ""}" data-id="${t.id}">
      <h3 class="component-task-card__title">${t.title}</h3>

      <div class="component-task-card__body">
        <div class="task-users-list">
          <select class="component-select" data-js="task-assign" multiple>
            ${users.map(u => `
              <option value="${u.id}" ${t.assignees && t.assignees.includes(u.id) ? "selected" : ""}>
                ${u.name}
              </option>
            `).join("")}
          </select>
        </div>

        <div class="task-buttons">
          <button class="component-button" data-js="task-toggle">
            ${t.done ? "Reabrir" : "Completar"}
          </button>
          <button class="component-button component-button--secondary" data-js="task-assign-button">
            Asignar
          </button>
          <button class="component-button component-button--danger" data-js="task-remove-button">
            Remover
          </button>
        </div>

        <div class="task-assigned">
          ${t.assignees && t.assignees.length > 0
            ? t.assignees.map(id => users.find(u => u.id === id)?.name ?? "-").join(", ")
            : "-"}
        </div>
      </div>
    </article>
  `).join("");
}

function toggleTaskDone(id) {
  const tasks = Storage.get("ttm:tasks", []);
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  if (!task.assignees || task.assignees.length === 0) {
    alert("Debes asignar al menos un usuario antes de completar la tarea.");
    return;
  }

  task.done = !task.done;
  Storage.set("ttm:tasks", tasks);
  render();
  EventBus.emit("ui:toggle_complete", { id });
}

function assignTask(taskId, selectedIds) {
  const tasks = Storage.get("ttm:tasks", []);
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  const current = task.assignees || [];
  const merged = Array.from(new Set([...current, ...selectedIds]));

  task.assignees = merged;
  Storage.set("ttm:tasks", tasks);
  render();
  EventBus.emit("ui:assign_task", { taskId, assignees: merged });
}

function removeAssignees(taskId, selectedIds) {
  const tasks = Storage.get("ttm:tasks", []);
  const task = tasks.find(t => t.id === taskId);
  if (!task || !task.assignees) return;

  task.assignees = task.assignees.filter(id => !selectedIds.includes(id));
  Storage.set("ttm:tasks", tasks);
  render();
  EventBus.emit("ui:remove_assignees", { taskId, removed: selectedIds });
}


