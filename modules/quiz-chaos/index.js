// modules/quiz-chaos/index.js
import {
  DEFAULT_REGION1,
  DEFAULT_REGION2,
  isNameMatch,
  isCodeMatch,
  loadCustomRegionData,
} from "../../shared/shared-logic.js";

export function mount(root) {
  // ---- STAŁE CZASOWE ----
  const BONUS_GOOD = 1.4;   // +1,4 s za dobrą odpowiedź
  const PENALTY_BAD = -0.6; // −0,6 s za złą odpowiedź

  // ---- JEDNORAZOWE WSTRZYKNIĘCIE STYLI (animacje, pasek wyniku) ----
  if (!document.getElementById("quizChaosStyles")) {
    const style = document.createElement("style");
    style.id = "quizChaosStyles";
    style.textContent = `
      /* Pasek wyniku (poziomy, krótkie "błyśnięcie") */
      .result-bar {
        height: 6px;
        width: 0%;
        background: transparent;
        border-radius: 4px;
        transition: width 220ms ease, background-color 120ms ease, opacity 200ms ease;
        opacity: 0.95;
      }
      .result-bar.success { background: var(--green, #16a34a); width: 100%; }
      .result-bar.error   { background: var(--red,   #dc2626); width: 100%; }
      .result-bar.fadeout { opacity: 0.25; }

      /* Animacja "shake" na błąd */
      @keyframes ch-shake {
        0%   { transform: translateX(0); }
        20%  { transform: translateX(-6px); }
        40%  { transform: translateX(6px); }
        60%  { transform: translateX(-4px); }
        80%  { transform: translateX(4px); }
        100% { transform: translateX(0); }
      }
      .shake { animation: ch-shake 300ms ease; }

      /* Badge/etykiety pomocnicze */
      .stats-badge { background: var(--surface-2, #f3f4f6); padding: 4px 8px; border-radius: 10px; font-weight: 600; }
      .streak-line { margin-top: 6px; font-size: 13px; }
    `;
    document.head.appendChild(style);
  }

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
          <input id="ch_time" type="number" min="3" max="200" value="10" />
        </label>
      </div>

      <div style="margin-top:12px;">
        <button id="ch_start">🚀 Start</button>
      </div>

      <p class="muted" style="margin-top:8px;">
        Zasady: dobra odpowiedź <strong>+1,4 s</strong>, zła <strong>−0,6 s</strong>. ENTER = zatwierdź i przejdź dalej.
      </p>
    </section>

    <section class="card" id="ch_game" style="display:none;">
      <div class="row" style="justify-content:space-between;align-items:center;">
        <div class="stats-badge">✅ <span id="ch_score">0</span></div>
        <div id="timer" aria-live="polite">10.0</div>
      </div>

      <!-- Pasek zależny od wyniku -->
      <div id="ch_result_bar" class="result-bar" aria-hidden="true"></div>

      <!-- Linia informacji o serii -->
      <div class="streak-line muted">
        🔥 Seria: <span id="ch_streak">0</span> • Rekord: <span id="ch_beststreak">0</span>
      </div>

      <div style="margin: 16px 0;">
        <div id="ch_stem" style="font-size:22px;font-weight:700;"></div>
      </div>

      <input id="ch_input" type="text"
             placeholder="Twoja odpowiedź… (ENTER = zatwierdź)"
             autocomplete="off" inputmode="latin" />

      <div id="ch_feedback" class="muted" style="margin-top:10px;"></div>
    </section>

    <section class="card" id="ch_end" style="display:none;text-align:center;">
      <h2>⏳ Koniec czasu!</h2>
      <div style="font-size:48px;font-weight:800;">
        Wynik: <span id="ch_final">0</span>
      </div>
      <div class="muted" style="margin-top:6px;">
        Startowy: <span id="ch_starttime">10</span>s • Kierunek: <span id="ch_finaldir">mixed</span> • Pula: <span id="ch_poolsize">0</span> • Najdłuższa seria: <span id="ch_best_final">0</span>
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
    streak: 0,
    bestStreak: 0,
    barTimeoutId: null,
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
    $("#ch_input").focus();
    // Feedback zostawiamy widoczny, żeby gracz widział wynik poprzedniej odpowiedzi
  }

  function endGame() {
    if (STATE.timerId) {
      clearInterval(STATE.timerId);
      STATE.timerId = null;
    }
    // Wyczyść ewentualny timeout paska wyniku
    if (STATE.barTimeoutId) {
      clearTimeout(STATE.barTimeoutId);
      STATE.barTimeoutId = null;
    }

    $("#ch_game").style.display = "none";
    $("#ch_end").style.display = "block";

    $("#ch_final").textContent = STATE.score;
    $("#ch_starttime").textContent = STATE.startTime;
    $("#ch_finaldir").textContent = STATE.dir;
    $("#ch_poolsize").textContent = STATE.pool.length;
    $("#ch_best_final").textContent = STATE.bestStreak;
  }

  function applyDeltaTime(delta) {
    STATE.time += delta;
    if (STATE.time <= 0) {
      STATE.time = 0;
      setTimerVisual(STATE.time);
      endGame();
      return false;
    }
    setTimerVisual(STATE.time);
    return true;
  }

  // --- Efekty wizualne: pasek i shake ---
  function flashResultBar(isSuccess) {
    const bar = $("#ch_result_bar");
    // Usuń poprzednie klasy i timery
    bar.classList.remove("success", "error", "fadeout");
    if (STATE.barTimeoutId) {
      clearTimeout(STATE.barTimeoutId);
      STATE.barTimeoutId = null;
    }
    // Włącz kolor i 100% szerokości
    bar.classList.add(isSuccess ? "success" : "error");
    // Delikatne wygaszenie i zwinięcie po krótkim czasie
    STATE.barTimeoutId = setTimeout(() => {
      bar.classList.add("fadeout");
      // Po wygaszeniu wycofaj do stanu 0%
      setTimeout(() => {
        bar.classList.remove("success", "error", "fadeout");
      }, 220);
    }, 260);
  }

  function shakeOnError() {
    const input = $("#ch_input");
    const feed = $("#ch_feedback");
    // Dodaj klasę shake, a po animacji usuń
    [input, feed].forEach((el) => {
      el.classList.remove("shake"); // restart animacji
      // Siłowe wyzwolenie reflow, by animacja mogła zadziałać ponownie
      // eslint-disable-next-line no-unused-expressions
      el.offsetHeight;
      el.classList.add("shake");
      const remove = () => el.classList.remove("shake");
      el.addEventListener("animationend", remove, { once: true });
    });
  }

  function updateStreakUI() {
    $("#ch_streak").textContent = STATE.streak;
    $("#ch_beststreak").textContent = STATE.bestStreak;
  }

  function checkAnswer() {
    const val = $("#ch_input").value.trim();
    if (!val) return;

    const q = STATE.current;
    const ok =
      q.expect === "code" ? isCodeMatch(val, q.correct) : isNameMatch(val, q.correct);

    if (ok) {
      STATE.score += 1;
      STATE.streak += 1;
      if (STATE.streak > STATE.bestStreak) STATE.bestStreak = STATE.streak;

      $("#ch_score").textContent = STATE.score;
      updateStreakUI();

      $("#ch_feedback").innerHTML =
        `<span style="color: var(--green); font-weight:600;">✔ +1,4 s</span>`;
      flashResultBar(true);

      if (!applyDeltaTime(+BONUS_GOOD)) return;
    } else {
      STATE.streak = 0;
      updateStreakUI();

      const corr =
        q.expect === "code"
          ? `<code>${q.correct}</code>`
          : `<strong>${q.correct}</strong>`;

      $("#ch_feedback").innerHTML =
        `<span style="color: var(--red); font-weight:600;">✖ −0,6 s</span>
         <span class="muted" style="margin-left:8px;">(poprawna: ${corr})</span>`;

      flashResultBar(false);
      shakeOnError();

      if (!applyDeltaTime(PENALTY_BAD)) return;
    }

    // ENTER = zatwierdź i natychmiast następne pytanie
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
    STATE.streak = 0;
    STATE.bestStreak = 0;
    updateStreakUI();

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
    if (STATE.timerId) {
      clearInterval(STATE.timerId);
      STATE.timerId = null;
    }
    if (STATE.barTimeoutId) {
      clearTimeout(STATE.barTimeoutId);
      STATE.barTimeoutId = null;
    }
    $("#ch_setup").style.display = "block";
    $("#ch_game").style.display = "none";
    $("#ch_end").style.display = "none";
    $("#ch_input").value = "";
  };
}

export function unmount(root) {
  // Zatrzymaj interwały i wyczyść DOM
  root.innerHTML = "";
}

// Dodatkowo default export – będzie też działać, jeśli kiedyś zmienisz loader na mod.default
export default { mount, unmount };
