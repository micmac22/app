// Ładowanie listy modułów z modules.json
async function loadModulesList() {
    const res = await fetch("modules.json");
    const data = await res.json();
    return data.modules;
}

// Ładowanie i montowanie modułu
async function mountModule(entry) {
    const host = document.getElementById("module-host");

    // wyczyść zawartość
    host.innerHTML = "";

    // import modułu ES6
    const mod = await import("./" + entry);

    // uruchom funkcję mount
    mod.mount(host);
}

// Inicjalizacja menu i modułów
async function init() {
    const modules = await loadModulesList();
    const menu = document.getElementById("menu");

    // Generuj przyciski menu na podstawie modules.json
    for (const key in modules) {
        const modInfo = modules[key];
        const btn = document.createElement("button");
        btn.textContent = modInfo.name;
        btn.onclick = () => mountModule(modInfo.entry);
        menu.appendChild(btn);
    }
}

init();