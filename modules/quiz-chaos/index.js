// modules/quiz-chaos/index.js
import {
  DEFAULT_REGION1,
  DEFAULT_REGION2,
  isNameMatch,
  isCodeMatch,
  loadCustomRegionData,
} from "../../shared/shared-logic.js";

export function mount(root) {
  root.innerHTML = `
    <section class="card" id="ch_setup">
      <h2>🌀 Chaos danych</h2>
      <div class="grid" style="margin-top:10px;">
        <label>🗺️ Region danych
          <select id="ch_region">
            <option value="r1">Region 1</option>
            <option value="r2">Region 2</option>
            <option value="both" selected>Oba regiony</option>
            <option value="all">Wszystkie (z niestandardowymi)</option>
          </select>
        </label>

        <label>🔄 Kierunek pytań
          <select id="ch_dir">
            <option value="name2code" selected>Nazwa → skrót</option>
            <option value="code2name">Skrót → nazwa</option>
            <option value="mixed">Losowo (mieszane)</option>
          </select>
        </label>

        <label>⏱️ Czas startowy (sekundy)
          <input id="ch_time" type="number" min="3" max="300" value="10" />
        </label>
      </div>

      <div style="margin-top:12px;">
        <button id="ch_start">🚀 Start</button>
      </div>

      <p class="muted" style="margin-top:8px;">
        Zasady: dobra odpowiedź <strong>+0,75 s</strong>, zła <strong>−0,5 s</strong>. ENTER = zatwierdź i przejdź dalej.
      </p>
    </section>

    <section class="card" id="ch_game" style="display:none;">
      <div class="row" style="justify-content:space-between;align-items:center;">
        <div class="stats-badge">✅ <span id="ch_score">0</span></div>
        <!-- Używamy #timer, by wykorzystać Twoje style #timer/#timer.warning/#timer.danger -->
        <div id="timer" aria-live="polite">10.0</div>
      </div>

      <div style="margin: 16px 0;">
        <div id="ch_stem" style="font-size:22px;font-weight:700;"></div>
      </div>

      <input id="ch_input" type="text" placeholder="Twoja odpowiedź… (ENTER = zatwierdź)"
             autocomplete="off" inputmode="latin" />

      <div id="ch_feedback" class="muted" style="margin-top:10px;"></div>
    </section>

    <section class="card" id="ch_end" style="display:none;text-align:center;">
      <h2>⏳ Koniec czasu!</h2>
      <div style="font-size:48px;font-weight:800;">
        Wynik: <span id="ch_final">0</span>
      </div>
      <div class="muted" style="margin-top:6px;">
        Startowy: <span id="ch_starttime">10</span>s • Kierunek: <span id="ch_finaldir">mixed</span> • Pula: <span id="ch_poolsize">0</span>
      </div>
      <div style="margin-top:12px;">
        <button id="ch_again" class="success">🔄 Jeszcze raz</button>
      </div>
    </section>
  `;

  const $ = (sel) => root.querySelector(sel);

  const STATE = {
    pool: [],
    dir: "mixed",
    time: 10,
    startTime: 10,
    score: 0,
    timerId: null,
    current: null,
  };

  function uniqueByCode(arr) {
    const map = new Map();
    arr.forEach((x) => {
      if (x?.code && !map.has(x.code)) map.set(x.code, x);
    });
    return [...map.values()];
  }

  function buildPool(regionSel) {
    const customs = loadCustomRegionData();
    let data = [];
    if (regionSel === "r1") data = [...DEFAULT_REGION1];
    if (regionSel === "r2") data = [...DEFAULT_REGION2];
    if (regionSel === "both") data = [...DEFAULT_REGION1, ...DEFAULT_REGION2];
    if (regionSel === "all") data = [...DEFAULT_REGION1, ...DEFAULT_REGION2, ...customs];
    return uniqueByCode(data);
  }

  function pickQuestion() {
    const item = STATE.pool[Math.floor(Math.random() * STATE.pool.length)];
    const dir =
      STATE.dir === "mixed"
        ? Math.random() < 0.5
          ? "name2code"
          : "code2name"
        : STATE.dir;

    if (dir === "name2code") {
      return {
        expect: "code",
        correct: item.code,
        stem: `Jaki skrót ma stacja <strong>${item.name}</strong>?`,
      };
    } else {
      return {
        expect: "name",
        correct: item.name,
        stem: `Jaka nazwa odpowiada skrótowi <code>${item.code}</code>?`,
      };
    }
  }

  function setTimerVisual(t) {
    const el = $("#timer");
    el.textContent = Math.max(0, t).toFixed(1);
    el.classList.remove("warning", "danger");
    if (t <= 2) el.classList.add("danger");
    else if (t <= 5) el.classList.add("warning");
  }

  function renderQuestion() {
    STATE.current = pickQuestion();
    $("#ch_stem").innerHTML = STATE.current.stem;
    $("#ch_input").value = "";
    // Nie czyścimy feedbacku — pokazujemy wynik poprzedniej odpowiedzi, jak w trybach “szybkich”.
    $("#ch_input").focus();
  }

  function endGame() {
    if (STATE.timerId) {
      clearInterval(STATE.timerId);
      STATE.timerId = null;
    }

    $("#ch_game").style.display = "none";
    $("#ch_end").style.display = "block";

    $("#ch_final").textContent = STATE.score;
    $("#ch_starttime").textContent = STATE.startTime;
    $("#ch_finaldir").textContent = STATE.dir;
    $("#ch_poolsize").textContent = STATE.pool.length;
  }

  function applyDeltaTime(delta) {
    STATE.time += delta;
    if (STATE.time <= 0) {
      STATE.time = 0;
      setTimerVisual(STATE.time);
      endGame();
      return false; // przerwij flow
    }
    setTimerVisual(STATE.time);
    return true;
  }

  function checkAnswer() {
    const val = $("#ch_input").value.trim();
    if (!val) return;

    const q = STATE.current;
    const ok =
      q.expect === "code" ? isCodeMatch(val, q.correct) : isNameMatch(val, q.correct);

    if (ok) {
      STATE.score += 1;
      $("#ch_score").textContent = STATE.score;
      $("#ch_feedback").innerHTML = `<span style="color: var(--green); font-weight:600;">✔ +0,75 s</span>`;
      if (!applyDeltaTime(+0.75)) return;
    } else {
      // Pokaż poprawną odpowiedź, ale nie zatrzymuj gry – Enter już idzie dalej.
      const corr =
        q.expect === "code"
          ? `<code>${q.correct}</code>`
          : `<strong>${q.correct}</strong>`;
      $("#ch_feedback").innerHTML = `<span style="color: var(--red); font-weight:600;">✖ −0,50 s</span> &nbsp; <span class="muted">(poprawna: ${corr})</span>`;
      if (!applyDeltaTime(-0.5)) return;
    }

    // Od razu przejdź do następnego pytania (ENTER = zatwierdź i dalej).
    renderQuestion();
  }

  function tick() {
    STATE.time -= 0.1;
    if (STATE.time <= 0) {
      STATE.time = 0;
      setTimerVisual(STATE.time);
      endGame();
      return;
    }
    setTimerVisual(STATE.time);
  }

  function startGame() {
    const regionSel = $("#ch_region").value;
    STATE.pool = buildPool(regionSel);
    STATE.dir = $("#ch_dir").value;
    STATE.startTime = Math.max(3, Math.min(300, parseFloat($("#ch_time").value) || 10));
    STATE.time = STATE.startTime;
    STATE.score = 0;

    if (!STATE.pool.length) {
      alert("Brak danych w wybranym regionie.");
      return;
    }

    $("#ch_setup").style.display = "none";
    $("#ch_game").style.display = "block";
    $("#ch_end").style.display = "none";

    $("#ch_score").textContent = "0";
    $("#ch_feedback").textContent = "";
    setTimerVisual(STATE.time);
    renderQuestion();

    if (STATE.timerId) clearInterval(STATE.timerId);
    STATE.timerId = setInterval(tick, 100);
  }

  // === Zdarzenia ===
  $("#ch_start").onclick = startGame;

  $("#ch_input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      checkAnswer();
    }
  });

  $("#ch_again").onclick = () => {
    // Powrót do ekranu startowego (jak w basic)
    if (STATE.timerId) {
      clearInterval(STATE.timerId);
      STATE.timerId = null;
    }
    $("#ch_setup").style.display = "block";
    $("#ch_game").style.display = "none";
    $("#ch_end").style.display = "none";
    $("#ch_input").value = "";
  };
}

export function unmount(root) {
  // Bezpiecznie zatrzymaj timer i wyczyść DOM
  try {
    const timerEl = root.querySelector("#timer");
    // nic nie trzeba czyścić na elemencie, ale czyścimy interwał:
  } catch {}
  root.innerHTML = "";
}

// Dodatkowo default export – dla zgodności z różnymi loaderami w app.js
export default { mount, unmount };
