document.addEventListener("DOMContentLoaded", () => {
  const USERS_KEY = "ttm:users";
  const TASKS_KEY = "ttm:tasks";

  const usersBtn = document.querySelector('[data-js="users-btn"]');
  const tasksSection = document.querySelector('[data-js="tasks-section"]');
  const usersSection = document.querySelector('[data-js="users-section"]');
  const backToTasksBtn = document.querySelector(
    '[data-js="back-to-tasks-btn"]'
  );
  const usersList = document.querySelector('[data-js="users-list"]');
  const userForm = document.querySelector('[data-js="user-form"]');
  const saveUserBtn = document.querySelector('[data-js="save-user-btn"]');
  const searchInput = document.querySelector('[data-js="search-user"]');
  const sortSelect = document.querySelector('[data-js="sort-user"]');
  const newRoleInput = document.querySelector('[data-js="new-role"]');

  let editUserId = null;

  usersBtn.addEventListener("click", () => {
    tasksSection.classList.add("utility-hidden");
    usersSection.classList.remove("utility-hidden");
    renderUsers();
  });

  backToTasksBtn.addEventListener("click", () => {
    usersSection.classList.add("utility-hidden");
    tasksSection.classList.remove("utility-hidden");
  });

  userForm.addEventListener("submit", (e) => {
    e.preventDefault();
    let name = userForm.name.value.trim();
    let email = userForm.email.value.trim();
    let role = newRoleInput.value.trim() || userForm.role.value;
    if (!name || !email) return;

    let users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];

    if (editUserId !== null) {
      users = users.map((u) =>
        u.id === editUserId ? { ...u, name, email, role } : u
      );
      editUserId = null;
    } else {
      users.push({ id: Date.now(), name, email, role, activo: true });
    }

    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    userForm.reset();
    renderUsers();
  });

  searchInput.addEventListener("input", renderUsers);
  sortSelect.addEventListener("change", renderUsers);

  /**
   * Renders the list of users based on search and sort criteria.
   */
  function renderUsers() {
    let users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    const tasks = JSON.parse(localStorage.getItem(TASKS_KEY)) || [];

    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(searchTerm) ||
          u.email.toLowerCase().includes(searchTerm)
      );
    }

    const sortVal = sortSelect.value;
    if (sortVal) {
      switch (sortVal) {
        case "name-asc":
          users.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case "name-desc":
          users.sort((a, b) => b.name.localeCompare(a.name));
          break;
        case "role":
          users.sort((a, b) => a.role.localeCompare(b.role));
          break;
        case "tasks":
          users.sort((a, b) => countTasks(b.id) - countTasks(a.id));
          break;
      }
    }

    usersList.innerHTML = "";
    if (users.length === 0) {
      usersList.innerHTML =
        "<p class='utility-muted'>No hay usuarios registrados.</p>";
      return;
    }

    users.forEach((user) => {
      const card = document.createElement("div");
      card.classList.add("user-card");

      const tareasAsignadas = countTasks(user.id);

      card.innerHTML = `
        <div class="user-card__info">
          <div class="user-card__id">ID: ${user.id}</div>
          <div class="user-card__name">${user.name}</div>
          <div class="user-card__email">${user.email}</div>
          <div class="user-card__role">${user.role}</div>
          <div class="user-card__estado">
            Estado: <button data-js="toggle-active" class="user-card__btn">${
              user.activo ? "Activo" : "Inactivo"
            }</button>
          </div>
          <div class="user-card__tasks-count">Tareas asignadas: ${tareasAsignadas}</div>
        </div>
        <div class="user-card__actions">
          <button class="user-card__btn user-card__btn--edit">Editar</button>
          <button class="user-card__btn user-card__btn--delete">Eliminar</button>
        </div>
      `;

      card
        .querySelector(".user-card__btn--edit")
        .addEventListener("click", () => {
          userForm.name.value = user.name;
          userForm.email.value = user.email;
          userForm.role.value = user.role;
          newRoleInput.value = "";
          editUserId = user.id;
          userForm.scrollIntoView({ behavior: "smooth", block: "start" });
          document.getElementById("user-name").focus();
        });

      card
        .querySelector(".user-card__btn--delete")
        .addEventListener("click", () => {
          if (!confirm(`¿Eliminar a ${user.name}?`)) return;
          const updatedUsers = JSON.parse(
            localStorage.getItem(USERS_KEY)
          ).filter((u) => u.id !== user.id);
          localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
          renderUsers();
        });

      card
        .querySelector('[data-js="toggle-active"]')
        .addEventListener("click", () => {
          user.activo = !user.activo;
          const usersData = JSON.parse(localStorage.getItem(USERS_KEY));
          const updated = usersData.map((u) =>
            u.id === user.id ? { ...u, activo: user.activo } : u
          );
          localStorage.setItem(USERS_KEY, JSON.stringify(updated));
          renderUsers();
        });

      usersList.appendChild(card);
    });
  }

  /**
   * Counts the number of tasks assigned to a user.
   * @param {string} userId - The ID of the user.
   * @returns {number} The number of tasks assigned to the user.
   */
  function countTasks(userId) {
    const tasks = JSON.parse(localStorage.getItem(TASKS_KEY)) || [];
    return tasks.filter((t) => String(t.asignado) === String(userId)).length;
  }
});