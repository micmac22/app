// modules/quiz-chaos/index.js
import {
  DEFAULT_REGION1,
  DEFAULT_REGION2,
  loadCustomRegionData,
} from "../../shared/shared-logic.js";

export function mount(root) {
  // ---- STAŁE ----
  const BONUS_GOOD = 1.4;    // +1,4 s za dobrą odpowiedź
  const PENALTY_BAD = -0.6;  // −0,6 s za złą odpowiedź

  // Statyczny pasek równowagi: parametry
  const BALANCE_STEP = 2;              // przesunięcie markera [%] po każdej odpowiedzi
  const BALANCE_DECAY_PER_TICK = 0.2;  // powrót do środka [%] co tick (100 ms) ~2%/s
  const BALANCE_MIN = -40;             // lewe ograniczenie
  const BALANCE_MAX = 40;              // prawe ograniczenie
  const EDGE_DAMPING_MIN = 0.35;       // minimalne tłumienie przy krawędziach (35%)

  // ---- STYLE (animacje, paski) – wstrzyknięcie jednokrotne ----
  if (!document.getElementById("quizChaosStyles")) {
    const style = document.createElement("style");
    style.id = "quizChaosStyles";
    style.textContent = `
      /* Pasek błyskowy po odpowiedzi (szybki flash) */
      .result-bar {
        height: 6px;
        width: 0%;
        background: transparent;
        border-radius: 4px;
        transition: width 220ms ease, background-color 120ms ease, opacity 200ms ease;
        opacity: 0.95;
        margin-top: 8px;
      }
      .result-bar.success { background: var(--green, #16a34a); width: 100%; }
      .result-bar.error   { background: var(--red,   #dc2626); width: 100%; }
      .result-bar.fadeout { opacity: 0.25; }

      /* Statyczny pasek równowagi: lewo czerwone, prawo zielone, marker pośrodku */
      .balance-wrap {
        position: relative;
        height: 12px;
        border-radius: 6px;
        margin-top: 8px;
        background: linear-gradient(
          90deg,
          var(--red, #dc2626) 0%,
          var(--red, #dc2626) 50%,
          var(--green, #16a34a) 50%,
          var(--green, #16a34a) 100%
        );
        box-shadow: inset 0 0 0 1px rgba(0,0,0,0.06), inset 0 2px 6px rgba(0,0,0,0.08);
      }
      .balance-marker {
        position: absolute;
        top: 50%;
        left: calc(50% + var(--offset, 0%));
        transform: translate(-50%, -50%);
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--surface-1, #fff);
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        transition: left 220ms ease;
      }

      /* Shake na błąd – sekcja gry + input + feedback */
      @keyframes ch-shake {
        0%   { transform: translateX(0); }
        20%  { transform: translateX(-6px); }
        40%  { transform: translateX(6px); }
        60%  { transform: translateX(-4px); }
        80%  { transform: translateX(4px); }
        100% { transform: translateX(0); }
      }
      .shake { animation: ch-shake 300ms ease; }

      /* Drobne */
      .stats-badge { background: var(--surface-2, #f3f4f6); padding: 4px 8px; border-radius: 10px; font-weight: 600; }
      .streak-line { margin-top: 6px; font-size: 13px; }
    `;
    document.head.appendChild(style);
  }

  // ---- DOM ----
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

      <!-- Pasek błyskowy (flash) -->
      <div id="ch_result_bar" class="result-bar" aria-hidden="true"></div>

      <!-- Statyczny pasek równowagi -->
      <div id="ch_balance_wrap" class="balance-wrap" aria-hidden="true">
        <div id="ch_balance_marker" class="balance-marker" role="presentation" aria-label="Wskaźnik skuteczności"></div>
      </div>

      <!-- Seria -->
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

  // ---- STAN ----
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
    balance: 0, // pozycja markera [%]
  };

  // ---- NORMALIZACJA I DOPASOWANIA ----

  // Słowa-klucze traktowane jako rozwinięcia skrótów (możesz dopisać kolejne)
  const KEY_TERMS = new Set(["pkp", "trakcja"]);

  const stripDiacritics = (s) =>
    String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Kody: wielkość bez znaczenia, ignorujemy znaki niealfanumeryczne
  const normalizeCode = (s) =>
    stripDiacritics(s).toUpperCase().replace(/[^A-Z0-9]/g, "").trim();

  // Nazwy: bez polskich znaków, małe litery, zredukowane spacje
  const normalizeName = (s) =>
    stripDiacritics(s).toLowerCase().replace(/\s+/g, " ").trim();

  // 1) KOD: pełna zgodność po normalizacji (bez częściowych dopasowań)
  function strictCodeMatch(input, correct) {
    return normalizeCode(input) === normalizeCode(correct);
  }

  // 2) NAZWA (rozwinięcie):
  //    - akceptuj dokładną zgodność po normalizacji
  //    - ALBO: jeśli wpis zawiera słowo-klucz (np. pkp/trakcja) i to samo słowo-klucz jest w poprawnej nazwie
  //    - dodatkowo: jeśli wpis to pojedynczy token i NIE jest słowem-kluczem → odrzuć (np. "lublin" nie przejdzie)
  function flexibleNameMatch(input, correct) {
    const inN = normalizeName(input);
    const corN = normalizeName(correct);

    if (!inN) return false;
    if (inN === corN) return true;

    const inTokens = inN.split(/[^a-z0-9]+/).filter(Boolean);
    const corTokensSet = new Set(corN.split(/[^a-z0-9]+/).filter(Boolean));

    if (inTokens.length === 1 && !KEY_TERMS.has(inTokens[0])) {
      return false; // sama miejscowość/pojedynczy token ≠ zaliczenie
    }

    if (inTokens.some((t) => KEY_TERMS.has(t) && corTokensSet.has(t))) {
      return true; // zawiera wspólny termin-klucz
    }

    return false;
  }

  // ---- DANE I LOSOWANIE ----
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

  // ---- UI ----
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
  }

  function endGame() {
    if (STATE.timerId) {
      clearInterval(STATE.timerId);
      STATE.timerId = null;
    }
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

  // ---- Efekty wizualne (flash, shake, balance) ----
  function flashResultBar(isSuccess) {
    const bar = $("#ch_result_bar");
    bar.className = "result-bar";
    void bar.offsetWidth; // restart animacji
    bar.classList.add(isSuccess ? "success" : "error");

    if (STATE.barTimeoutId) {
      clearTimeout(STATE.barTimeoutId);
      STATE.barTimeoutId = null;
    }
    STATE.barTimeoutId = setTimeout(() => {
      bar.classList.add("fadeout");
      setTimeout(() => {
        bar.className = "result-bar";
      }, 220);
    }, 260);
  }

  function shakeOnError() {
    const els = [$("#ch_game"), $("#ch_input"), $("#ch_feedback")];
    els.forEach((el) => {
      if (!el) return;
      el.classList.remove("shake");
      void el.offsetWidth; // restart animacji
      el.classList.add("shake");
      el.addEventListener("animationend", () => el.classList.remove("shake"), { once: true });
    });
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function updateBalance(delta = 0) {
    // Tłumienie przy krawędziach: im bliżej skrajów, tym mniejszy efektywny krok
    const edgeRatio = Math.min(1, Math.abs(STATE.balance) / BALANCE_MAX);
    const damping = EDGE_DAMPING_MIN + (1 - EDGE_DAMPING_MIN) * (1 - edgeRatio); // [0.35..1]
    const applied = delta * damping;

    STATE.balance = clamp(STATE.balance + applied, BALANCE_MIN, BALANCE_MAX);
    $("#ch_balance_marker")?.style.setProperty("--offset", `${STATE.balance}%`);
  }

  function decayBalanceTowardsCenter() {
    if (STATE.balance === 0) return;
    const sign = STATE.balance > 0 ? -1 : 1;
    if (Math.abs(STATE.balance) <= BALANCE_DECAY_PER_TICK) {
      STATE.balance = 0;
    } else {
      STATE.balance += sign * BALANCE_DECAY_PER_TICK;
    }
    $("#ch_balance_marker")?.style.setProperty("--offset", `${STATE.balance}%`);
  }

  function updateStreakUI() {
    $("#ch_streak").textContent = STATE.streak;
    $("#ch_beststreak").textContent = STATE.bestStreak;
  }

  function showGoodFeedback() {
    $("#ch_feedback").innerHTML =
      `<span style="color: var(--green, #16a34a); font-weight:600;">✔ +1,4 s</span>`;
  }

  function showBadFeedback(correctHtml) {
    $("#ch_feedback").innerHTML =
      `<span style="color: var(--red, #dc2626); font-weight:600;">✖ −0,6 s</span>
       <span class="muted" style="margin-left:8px;">(poprawna: ${correctHtml})</span>`;
  }

  // ---- LOGIKA ODPOWIEDZI ----
  function checkAnswer() {
    const val = $("#ch_input").value.trim();
    if (!val) return;

    const q = STATE.current;
    const ok = q.expect === "code"
      ? strictCodeMatch(val, q.correct)     // skrót: pełna zgodność (case-insensitive, bez symboli)
      : flexibleNameMatch(val, q.correct);  // nazwa: zasady z PKP/Trakcja itd.

    if (ok) {
      STATE.score += 1;
      STATE.streak += 1;
      if (STATE.streak > STATE.bestStreak) STATE.bestStreak = STATE.streak;

      $("#ch_score").textContent = STATE.score;
      updateStreakUI();
      showGoodFeedback();
      flashResultBar(true);
      updateBalance(+BALANCE_STEP);

      if (!applyDeltaTime(BONUS_GOOD)) return;
    } else {
      STATE.streak = 0;
      updateStreakUI();

      const corr =
        q.expect === "code"
          ? `<code>${q.correct}</code>`
          : `<strong>${q.correct}</strong>`;

      showBadFeedback(corr);
      flashResultBar(false);
      shakeOnError();
      updateBalance(-BALANCE_STEP);

      if (!applyDeltaTime(PENALTY_BAD)) return;
    }

    // Od razu następne pytanie
    renderQuestion();
  }

  // ---- ZEGAR ----
  function tick() {
    STATE.time -= 0.1;
    if (STATE.time <= 0) {
      STATE.time = 0;
      setTimerVisual(STATE.time);
      endGame();
      return;
    }
    setTimerVisual(STATE.time);

    // delikatny, ciągły powrót markera do środka
    decayBalanceTowardsCenter();
  }

  // ---- START/RESET ----
  function startGame() {
    const regionSel = $("#ch_region").value;
    STATE.pool = buildPool(regionSel);
    STATE.dir = $("#ch_dir").value;
    STATE.startTime = Math.max(3, Math.min(300, parseFloat($("#ch_time").value) || 10));
    STATE.time = STATE.startTime;
    STATE.score = 0;
    STATE.streak = 0;
    STATE.bestStreak = 0;
    STATE.balance = 0;
    updateStreakUI();
    $("#ch_balance_marker")?.style.setProperty("--offset", `0%`);

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

  // ---- ZDARZENIA ----
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
  // Zatrzymaj interwały i wyczyść DOM (timery były w STATE w mount; tu czyścimy DOM)
  root.innerHTML = "";
}

export default { mount, unmount };
