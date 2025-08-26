export const EventBus = {
  on: (event, handler) => { document.addEventListener(event, e => handler(e.detail)); },
  emit: (event, payload) => { document.dispatchEvent(new CustomEvent(event, { detail: payload })); }
};

export const Storage = {
  get(key, fallback = []) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
};

export function mountAssignment() {
  const rootEl = document.querySelector('[data-js="assignment-section"]');
  if (!rootEl) return;

  render();

  document.querySelector('.task-create').addEventListener("click", e => {
    if (e.target.matches('[data-js="task-add"]')) {
      const input = document.querySelector('[data-js="task-title"]');
      if (!input.value.trim()) return;
      addTask(input.value.trim());
      input.value = "";
    }
    if (e.target.matches('[data-js="task-remove-completed"]')) {
      removeCompletedTasks();
    }
  });

  rootEl.addEventListener("click", e => {
    if (e.target.matches('[data-js="task-toggle"]')) {
      const id = e.target.closest("[data-id]").dataset.id;
      toggleTaskStatus(id);
    }
    if (e.target.matches('[data-js="remove-user"]')) {
      const taskId = e.target.closest("[data-id]").dataset.id;
      const userId = e.target.dataset.userId;
      removeUser(taskId, userId);
    }
  });

  rootEl.addEventListener("change", e => {
    if (e.target.matches('[data-js="task-assign"]')) {
      const taskId = e.target.closest("[data-id]").dataset.id;
      const userId = e.target.value;
      assignTask(taskId, userId);
    }
  });
}

function render() {
  const rootEl = document.querySelector('[data-js="assignment-section"]');
  const tasks = Storage.get("ttm:tasks", []);
  const users = Storage.get("ttm:users", []);

  rootEl.innerHTML = tasks.map(t =>
    `<article class="component-task-card component-task-card--${t.status}" data-id="${t.id}">
      <h3 class="component-task-card__title">${t.title}</h3>
      <div class="component-task-card__status">
        ${t.status === "pending" ? "Pendiente" : t.status === "in-progress" ? "En progreso" : "Completada"}
      </div>
      <div class="task-assignment-window">
        <div class="task-column task-users-list">
          <h4>Usuarios disponibles</h4>
          <select class="component-select" data-js="task-assign">
            <option value="">-- Asignar usuario --</option>
            ${users.map(u => `<option value="${u.id}">${u.name}</option>`).join("")}
          </select>
        </div>
        <div class="task-column task-buttons">
          <button class="component-button component-button--secondary" data-js="task-toggle">
            ${t.status === "done" ? "Reabrir" : t.status === "in-progress" ? "Completar" : "Iniciar"}
          </button>
        </div>
        <div class="task-column task-assigned">
          <h4>Usuarios asignados</h4>
          ${t.assignee?.length ? t.assignee.map(uId => {
            const user = users.find(u => u.id === uId);
            return `<div>${user?.name ?? uId} 
                      <button class="component-button component-button--danger" data-js="remove-user" data-user-id="${uId}">X</button>
                    </div>`;
          }).join("") : "-"}
        </div>
      </div>
    </article>`).join("");
}

function addTask(title) {
  const tasks = Storage.get("ttm:tasks", []);
  tasks.push({ id: `task-${Date.now()}`, title, status: "pending", assignee: [] });
  Storage.set("ttm:tasks", tasks);
  render();
}

function toggleTaskStatus(id) {
  const tasks = Storage.get("ttm:tasks", []);
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  if (task.status === "pending") task.status = "in-progress";
  else if (task.status === "in-progress") task.status = "done";
  else task.status = "pending";

  Storage.set("ttm:tasks", tasks);
  render();
}

function removeCompletedTasks() {
  let tasks = Storage.get("ttm:tasks", []);
  tasks = tasks.filter(t => t.status !== "done");
  Storage.set("ttm:tasks", tasks);
  render();
}

function assignTask(taskId, userId) {
  if (!userId) return;
  const tasks = Storage.get("ttm:tasks", []);
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  if (!task.assignee) task.assignee = [];
  if (!task.assignee.includes(userId)) task.assignee.push(userId);

  Storage.set("ttm:tasks", tasks);
  render();
}

function removeUser(taskId, userId) {
  const tasks = Storage.get("ttm:tasks", []);
  const task = tasks.find(t => t.id === taskId);
  if (!task || !task.assignee) return;

  task.assignee = task.assignee.filter(uId => uId !== userId);
  Storage.set("ttm:tasks", tasks);
  render();
}









