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
let currentEntry  = null;
let currentHost   = null;
let loadToken     = 0;      // licznik do rozstrzygania wyścigów
let modulesCache  = null;   // cache modules.json

// ===== Build ID do bustowania cache (próbuje meta[name=build-id], inaczej timestamp) =====
const BUILD_ID = (() => {
  const m = document.querySelector('meta[name="build-id"]');
  return m?.getAttribute('content') || String(Date.now());
})();

// ===== Resolver ścieżek do modułów =====
// Przyjmuje:
//  - "saper"                   -> "./modules/saper/index.js"
//  - "modules/saper/index.js"  -> "./modules/saper/index.js"
//  - absolutne "https://..."   -> (pozostawia bez zmian) – niezalecane na GH Pages
function resolveEntry(entry) {
  if (!entry) throw new Error("Brak 'entry' dla modułu.");
  let e = String(entry).trim();

  // Jeśli to krótka forma (bez .js i bez http), zbuduj pełną ścieżkę:
  const isHttp = /^https?:\/\//i.test(e);
  const hasJs  = /\.js$/i.test(e);

  if (!isHttp && !hasJs) {
    // np. "saper" -> "modules/saper/index.js"
    e = `modules/${e}/index.js`;
  }

  // Zapewnij ścieżkę względną (dla GH Pages i lokalnie)
  if (!isHttp && !e.startsWith("./")) {
    e = `./${e}`;
  }

  // Zbuduj finalny URL względem bieżącego dokumentu
  return new URL(e, window.location.href);
}

// ===== API =====
async function loadModulesList() {
  if (modulesCache) return modulesCache; // cache

  // modules.json musi być serwowany z tego samego katalogu co index.html
  const res = await fetch("modules.json", { cache: "no-cache" });
  if (!res.ok) throw new Error(`Nie można pobrać modules.json (${res.status})`);
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
    // 1) Rozwiąż ścieżkę względem bieżącej lokalizacji strony
    const url = resolveEntry(entry);

    // 2) Bustowanie cache (GH Pages bywa agresywny)
    url.searchParams.set('v', BUILD_ID);

    // 3) Dynamiczny import (wymuś literalny URL – bez bundlingu)
    const ns = await import(/* @vite-ignore */ url.href);

    // Jeżeli w międzyczasie kliknięto inny moduł — przerwij
    if (myToken !== loadToken) return;

    // Preferuj named export `mount`, w przeciwnym wypadku spróbuj przez default
    const mod = ns?.mount ? ns : ns?.default;

    if (!mod?.mount || typeof mod.mount !== "function") {
      throw new Error(`Moduł ${entry} nie eksportuje funkcji "mount". Dostępne klucze: ${Object.keys(ns || {}).join(", ")}`);
    }

    // Wyczyść host i montuj
    host.innerHTML = "";
    await mod.mount(host);

    // Zapamiętaj kontekst
    currentModule = mod;
    currentEntry  = entry;
    currentHost   = host;

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
    const modInfo = modules[key];
    if (modInfo.hidden) continue;   // ⬅️ IGNORUJ UKRYTE MODUŁY

    const btn = document.createElement("button");
    btn.textContent = modInfo.name || key;

    // Uwaga: dopuszczamy dwie formy wpisu:
    //  - modInfo.entry === "saper" (krótko)
    //  - modInfo.entry === "modules/saper/index.js" (pełna ścieżka)
    const entry = modInfo.entry || key;

    btn.onclick = () => mountModule(entry, btn);
    menu.appendChild(btn);
  }
}

init();
// === Sekwencja "Konami" => odpal saper ===
(function setupKonami() {
  const pattern = ["arrowup","arrowup","arrowdown","arrowdown","arrowleft","arrowright","arrowleft","arrowright","b","a"];
  let idx = 0;
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (k === pattern[idx]) {
      idx++;
      if (idx === pattern.length) {
        idx = 0;
        mountModule("saper", null);
      }
    } else {
      // jeśli klawisz jest początkiem sekwencji – zacznij od 1
      idx = (k === pattern[0]) ? 1 : 0;
    }
  });
})();
// (Opcjonalnie) Eksportuj mountModule do debugowania z konsoli
// window.mountModule = mountModule;

