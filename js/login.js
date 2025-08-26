const EventBus = (() => {
  const listeners = new Map();
  return {
    on(eventName, handler) {
      (listeners.get(eventName) ?? listeners.set(eventName, new Set()).get(eventName)).add(handler);
    },
    off(eventName, handler) { listeners.get(eventName)?.delete(handler); },
    emit(eventName, payload) { listeners.get(eventName)?.forEach(h => h(payload)); },
  };
})();
const Storage = {
  get(key, fallback = null) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
  patch(key, updater) { this.set(key, updater(this.get(key))); },
  remove(key) { localStorage.removeItem(key); },
};


class User {
  constructor({ id, name, email, passwordHash, loggedIn = false }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.passwordHash = passwordHash;
    this.loggedIn = loggedIn;
  }
}

const USERS_KEY = "ttm:users";
const SESSION_KEY = "ttm:session";
const TASKS_KEY = "ttm:tasks";
const THEME_KEY = "ttm:theme";


function applyTheme(theme){
  const html = document.documentElement;
  html.setAttribute("data-theme", theme);
  Storage.set(THEME_KEY, theme);
}
function initTheme(){
  const saved = Storage.get(THEME_KEY, "light");
  applyTheme(saved);
  document.getElementById("theme-toggle")?.addEventListener("click", () => {
    const next = (document.documentElement.getAttribute("data-theme") === "light") ? "dark" : "light";
    applyTheme(next);
  });
}


function mountAuth(rootEl){
  ensureSeeds();
  EventBus.on("app:session_check", () => render(rootEl));
  EventBus.on("ui:logout", handleLogout);
  render(rootEl);

  rootEl.addEventListener("submit", (e) => {
    const form = e.target;
    if (form.matches('[data-js="login-form"]')) {
      e.preventDefault();
      handleLogin(new FormData(form), rootEl);
    }
    if (form.matches('[data-js="register-form"]')) {
      e.preventDefault();
      handleRegister(new FormData(form), rootEl);
    }
  });

  rootEl.addEventListener("click", (e) => {
    if (e.target.matches('[data-js="go-register"]')) {
      e.preventDefault();
      showRegister(rootEl);
    }
    if (e.target.matches('[data-js="go-login"]')) {
      e.preventDefault();
      showLogin(rootEl);
    }
  });
}

function hash(s){
  let h = 0; for (let i=0;i<s.length;i++){ h = ((h<<5)-h)+s.charCodeAt(i); h|=0; }
  return `${h}`;
}

function ensureSeeds(){
  if (!Storage.get(USERS_KEY)) Storage.set(USERS_KEY, []);
  if (!Storage.get(TASKS_KEY)) Storage.set(TASKS_KEY, []);
}

function currentSession(){ return Storage.get(SESSION_KEY, null); }
function setSession(userId){ Storage.set(SESSION_KEY, { userId }); }
function clearSession(){ Storage.remove(SESSION_KEY); }

function handleLogout(){
  const session = currentSession();
  if (session){
    const users = Storage.get(USERS_KEY, []);
    const idx = users.findIndex(u => u.id === session.userId);
    if (idx >= 0){ users[idx].loggedIn = false; Storage.set(USERS_KEY, users); }
  }
  clearSession();
  EventBus.emit("app:user_logged_out");
  EventBus.emit("app:session_check");
}

function handleLogin(fd, rootEl){
  ensureSeeds();
  const email = (fd.get("email") || "").trim().toLowerCase();
  const password = fd.get("password") || "";
  const errors = {};

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.email = "Correo inválido.";
  if (!password || password.length < 6) errors.password = "Mínimo 6 caracteres.";

  if (Object.keys(errors).length){
    return showLogin(rootEl, { errors, values: { email } });
  }

  const users = Storage.get(USERS_KEY, []);
  const user = users.find(u => u.email === email && u.passwordHash === hash(password));
  if (!user){
    return showLogin(rootEl, { errors: { general: "Credenciales inválidas." }, values: { email } });
  }

  users.forEach(u => u.loggedIn = false);
  user.loggedIn = true;
  Storage.set(USERS_KEY, users);
  setSession(user.id);

  EventBus.emit("app:user_logged_in", { user });
  render(rootEl);
  showAppSections();
}

function handleRegister(fd, rootEl){
  ensureSeeds();
  const name = (fd.get("name")||"").trim();
  const email = (fd.get("email")||"").trim().toLowerCase();
  const password = fd.get("password")||"";
  const password2 = fd.get("password2")||"";
  const errors = {};

  if (!name) errors.name = "Nombre requerido.";
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.email = "Correo inválido.";
  if (!password || password.length < 6) errors.password = "Mínimo 6 caracteres.";
  if (password !== password2) errors.password2 = "Las contraseñas no coinciden.";

  const users = Storage.get(USERS_KEY, []);
  if (users.some(u => u.email === email)) errors.email = "El correo ya está registrado.";

  if (Object.keys(errors).length){
    return showRegister(rootEl, { errors, values: { name, email } });
  }

  const newUser = new User({
    id: `user_${Date.now()}`,
    name,
    email,
    passwordHash: hash(password),
    loggedIn: true,
  });
  users.forEach(u => u.loggedIn = false);
  Storage.set(USERS_KEY, [...users, newUser]);
  setSession(newUser.id);

  EventBus.emit("app:user_registered", { user: newUser });
  render(rootEl);
  showAppSections();
}

function showLogin(rootEl, state = {}){
  const { errors = {}, values = {} } = state;
  rootEl.innerHTML = `
    <div class="auth-box">
      <h2 class="component-panel__title">Iniciar sesión</h2>
      ${errors.general ? `<p class="component-form__error utility-margin-top-4">${errors.general}</p>` : ""}
      <form class="component-form utility-margin-top-4" data-js="login-form" novalidate>
        <div class="component-form__row">
          <label class="component-form__label" for="email">Correo</label>
          <input class="component-form__input" type="email" id="email" name="email" placeholder="tu@email.com" value="${values.email ?? ""}" required />
          ${errors.email ? `<small class="component-form__error">${errors.email}</small>` : ""}
        </div>
        <div class="component-form__row">
          <label class="component-form__label" for="password">Contraseña</label>
          <input class="component-form__input" type="password" id="password" name="password" placeholder="••••••••" required minlength="6" />
          ${errors.password ? `<small class="component-form__error">${errors.password}</small>` : ""}
        </div>
        <div class="component-form__row utility-flex utility-gap-4">
          <button class="component-button" type="submit">Entrar</button>
          <button class="component-button component-button--ghost" data-js="go-register">Crear cuenta</button>
        </div>
      </form>
    </div>
  `;
  updateNavVisibility();
}

function showRegister(rootEl, state = {}){
  const { errors = {}, values = {} } = state;
  rootEl.innerHTML = `
    <div class="auth-box">
      <h2 class="component-panel__title">Registro</h2>
      <form class="component-form utility-margin-top-4" data-js="register-form" novalidate>
        <div class="component-form__row">
          <label class="component-form__label" for="name">Nombre</label>
          <input class="component-form__input" type="text" id="name" name="name" placeholder="Ana Pérez" value="${values.name ?? ""}" required />
          ${errors.name ? `<small class="component-form__error">${errors.name}</small>` : ""}
        </div>
        <div class="component-form__row">
          <label class="component-form__label" for="email">Correo</label>
          <input class="component-form__input" type="email" id="email" name="email" placeholder="ana@example.com" value="${values.email ?? ""}" required />
          ${errors.email ? `<small class="component-form__error">${errors.email}</small>` : ""}
        </div>
        <div class="component-form__row">
          <label class="component-form__label" for="password">Contraseña</label>
          <input class="component-form__input" type="password" id="password" name="password" placeholder="Mínimo 6 caracteres" required minlength="6" />
          ${errors.password ? `<small class="component-form__error">${errors.password}</small>` : ""}
        </div>
        <div class="component-form__row">
          <label class="component-form__label" for="password2">Repite la contraseña</label>
          <input class="component-form__input" type="password" id="password2" name="password2" placeholder="Repite tu contraseña" required minlength="6" />
          ${errors.password2 ? `<small class="component-form__error">${errors.password2}</small>` : ""}
        </div>
        <div class="component-form__row utility-flex utility-gap-4">
          <button class="component-button" type="submit">Crear cuenta</button>
          <button class="component-button component-button--ghost" data-js="go-login">Ya tengo cuenta</button>
        </div>
      </form>
    </div>
  `;
  updateNavVisibility();
}

function render(rootEl){
  const session = currentSession();
  if (!session){
    showLogin(rootEl);
    hideAppSections();
    return;
  }
  const users = Storage.get(USERS_KEY, []);
  const me = users.find(u => u.id === session.userId);
  if (!me){
    showLogin(rootEl);
    hideAppSections();
    return;
  }

  rootEl.innerHTML = `
    <div class="auth-box auth-box--welcome">
      <h2 class="component-panel__title">Bienvenido, ${me.name} 👋</h2>
      <p class="utility-muted">Tu sesión está activa. Puedes continuar al tablero de tareas.</p>
      <div class="utility-margin-top-4 utility-flex utility-gap-4">
        <a class="component-button" href="#" data-js="go-tasks">Ir a Tareas</a>
        <button class="component-button component-button--ghost" data-js="do-logout">Cerrar sesión</button>
      </div>
    </div>
  `;
  document.querySelector('[data-js="auth-section"]').addEventListener("click", (e) => {
    if (e.target.matches('[data-js="go-tasks"]')){
      e.preventDefault();
      showAppSections();
    }
    if (e.target.matches('[data-js="do-logout"]')){
      e.preventDefault();
      EventBus.emit("ui:logout");
      showLogin(rootEl);
    }
  });
  updateNavVisibility(true);
}


function hideAppSections(){
  document.querySelector('[data-js="tasks-section"]').classList.add("utility-hidden");
  document.querySelector('[data-js="stats-section"]').classList.add("utility-hidden");
}
function showAppSections(){
  document.querySelector('[data-js="tasks-section"]').classList.remove("utility-hidden");
  document.querySelector('[data-js="stats-section"]').classList.remove("utility-hidden");
}


function updateNavVisibility(isLogged = !!Storage.get(SESSION_KEY)){
  const logoutBtn = document.querySelector('[data-js="logout-btn"]');
  if (!logoutBtn) return;
  if (isLogged){
    logoutBtn.classList.remove("utility-hidden");
    logoutBtn.onclick = () => EventBus.emit("ui:logout");
  } else {
    logoutBtn.classList.add("utility-hidden");
    logoutBtn.onclick = null;
  }
}
function qs(sel){ return document.querySelector(sel); }


function renderBoard(){
  const tasks = Storage.get(TASKS_KEY, []);
  const cols = {
    backlog: qs('[data-js="col-backlog"]'),
    inprogress: qs('[data-js="col-inprogress"]'),
    done: qs('[data-js="col-done"]'),
  };
  Object.values(cols).forEach(el => el && (el.innerHTML = ""));
  for (const t of tasks){
    const el = document.createElement("div");
    el.className = "card";
    el.innerHTML = `
      <span class="card__title">${escapeHtml(t.title)}</span>
      <span class="card__actions">
        <button class="card__btn" data-js="move" data-id="${t.id}">➡</button>
        <button class="card__btn" data-js="delete" data-id="${t.id}">🗑</button>
      </span>
    `;
    cols[t.column]?.appendChild(el);
  }
}

function escapeHtml(s){ return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }

function initBoard(){
  const form = document.querySelector('[data-js="board-add-form"]');
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const title = (fd.get("title") || "").toString().trim();
    const column = (fd.get("column") || "backlog").toString();
    if (!title) return;
    const tasks = Storage.get(TASKS_KEY, []);
    tasks.push({ id: `t_${Date.now()}`, title, column });
    Storage.set(TASKS_KEY, tasks);
    form.reset();
    renderBoard();
  });

  document.querySelector('[data-js="tasks-section"]').addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    if (btn.matches('[data-js="delete"]')){
      const id = btn.getAttribute("data-id");
      Storage.set(TASKS_KEY, Storage.get(TASKS_KEY, []).filter(t => t.id !== id));
      renderBoard();
    }
    if (btn.matches('[data-js="move"]')){
      const id = btn.getAttribute("data-id");
      const tasks = Storage.get(TASKS_KEY, []);
      const idx = tasks.findIndex(t => t.id === id);
      if (idx >= 0){
        const order = ["backlog","inprogress","done"];
        const next = order[(order.indexOf(tasks[idx].column)+1)%order.length];
        tasks[idx].column = next;
        Storage.set(TASKS_KEY, tasks);
        renderBoard();
      }
    }
  });

  renderBoard();
}


const authRoot = qs('[data-js="auth-section"]');
initTheme();
mountAuth(authRoot);
initBoard();

EventBus.on("app:user_logged_in", ({ user }) => {
  console.log("Usuario logueado:", user.email);
});
EventBus.on("app:user_logged_out", () => {
  console.log("Usuario salió.");
});
EventBus.emit("app:session_check");
