// app.js

// ===== Pomocnicze =====
function setActiveButton(btn) {
  const menu = document.getElementById("menu");
  [...menu.querySelectorAll("button")].forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
}

function showError(host, err, entry) {
  console.error(err);
  host.innerHTML = `
    <section class="card">
      <h2>❗ Błąd ładowania modułu</h2>
      <p class="muted">Nie udało się załadować: <code>${entry}</code></p>
      <pre style="white-space:pre-wrap;background:#0b1220;border-radius:8px;padding:12px;border:1px solid rgba(255,255,255,0.08);overflow:auto;">${String(err)}</pre>
    </section>
  `;
}

// ===== Stan aplikacji =====
let currentModule = null;   // przestrzeń nazw importu (named) lub obiekt default
let currentEntry = null;
let currentHost  = null;
let loadToken    = 0;       // licznik do rozstrzygania wyścigów
let modulesCache = null;    // cache modules.json

// ===== API =====
async function loadModulesList() {
  if (modulesCache) return modulesCache;  // cache
  const res = await fetch("modules.json", { cache: "no-cache" });
  const data = await res.json();
  modulesCache = data.modules;
  return modulesCache;
}

async function mountModule(entry, btnEl) {
  const myToken = ++loadToken; // znacznik: tylko ostatnie wywołanie jest ważne
  const host = document.getElementById("module-host");

  // Bezpiecznie odmontuj poprzedni moduł, jeśli istnieje
  if (currentModule?.unmount && typeof currentModule.unmount === "function" && currentHost) {
    try { currentModule.unmount(currentHost); } catch (e) { console.warn("unmount error:", e); }
  }

  // Placeholder „Ładowanie…”
  host.innerHTML = `
    <section class="card">
      <h2>Ładowanie…</h2>
      <p class="muted">Pobieranie modułu <code>${entry}</code>.</p>
    </section>
  `;

  // Podświetl aktywny przycisk
  setActiveButton(btnEl);

  try {
    // Dynamiczny import — ważne: względnie do app.js
    const ns = await import("./" + entry);

    // Jeżeli w międzyczasie kliknięto inny moduł — przerwij
    if (myToken !== loadToken) return;

    // Preferuj named export `mount`, w przeciwnym wypadku spróbuj przez default
    const mod = ns?.mount ? ns : ns?.default;

    if (!mod?.mount || typeof mod.mount !== "function") {
      throw new Error(`Moduł ${entry} nie eksportuje funkcji "mount". Dostępne klucze: ${Object.keys(ns || {}).join(", ")}`);
    }

    // Wyczyść host i montuj
    host.innerHTML = "";
    mod.mount(host);

    // Zapamiętaj kontekst
    currentModule = mod;
    currentEntry  = entry;
    currentHost   = host;

    // Opcjonalnie: prefetch tego samego modułu (nic nie robi, ale przeglądarka może cache'ować)
    // await import(/* @vite-ignore */ "./" + entry);

  } catch (err) {
    if (myToken !== loadToken) return; // inny moduł już ładowany
    showError(host, err, entry);
  }
}

async function init() {
  const modules = await loadModulesList();
  const menu = document.getElementById("menu");

  // Wyczyść menu (gdyby init został wywołany ponownie)
  menu.innerHTML = "";

  // Zbuduj przyciski
  for (const key in modules) {
    const { name, entry } = modules[key];
    const btn = document.createElement("button");
    btn.textContent = name;
    btn.onclick = () => mountModule(entry, btn);
    menu.appendChild(btn);

    // Opcjonalny prefetch (asynchronicznie)
    // import("./" + entry).catch(() => {});
  }
}

init();

// (Opcjonalnie) Eksportuj mountModule do debugowania z konsoli
// window.mountModule = mountModule;
