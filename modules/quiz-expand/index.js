import {
  DEFAULT_REGION1,
  DEFAULT_REGION2,
  norm,
  isNameMatch,
  isCodeMatch,
  sample,
  buildCodeChoices,
  buildNameChoices,
  loadCustomRegionData
} from "../../shared/shared-logic.js";

// modules/quiz-expand/index.js
// ==========================================
// TRYB: Rozszerzanie skrótów + Podaj skrót
// Dokładnie jak w starej aplikacji
// Kompatybilne z nowym UI i style.css
// ==========================================

// --- Wspólne dane regionów (skopiowane z quiz-basic) ---
/* ... */
/* Z tego miejsca: */
/* Użyj tego samego DEFAULT_REGION1 i DEFAULT_REGION2 */
/* co w quiz-basic – możesz przekleić identyczny kod tu */
/* ... */

// Aby skrócić odpowiedź tutaj wstawiamy skróconą formę:  
// Powiedz mi: **czy chcesz abym wkleił cały blok regionów ponownie tutaj**,  
// czy mam przygotować wersję, która **importuje regiony z jednego wspólnego pliku js**?

// --- Fuzzy / pomocnicze ---  
/* PRZEPISUJEMY identycznie isNameMatch, isCodeMatch, damerauLevenshtein,
   tokenize, sigTokens, stripSpaces itd. z quiz-basic. 
   Robimy tak, żeby moduły miały wspólne zachowanie. */

// (UWAGA) Kiedy potwierdzisz, wkleję tu pełen komplet funkcji jak w bazowym module.


// ==============================================
// GŁÓWNY MODUŁ
// ==============================================
export function mount(root) {
    root.innerHTML = `
      <section class="card" id="expSetup">
        <h2>🔤 Tryb rozszerzania skrótów i wpisywania kodów</h2>

        <div class="grid" style="margin-top:10px;">
          <label>🗺️ Region danych
            <select id="exp_region">
              <option value="r1">Region 1</option>
              <option value="r2">Region 2</option>
              <option value="both" selected>Oba regiony</option>
              <option value="all">Wszystkie (niestandardowe też)</option>
            </select>
          </label>

          <label>🎯 Tryb pytania
            <select id="exp_mode">
              <option value="expand">Rozwiń skrót (kod → nazwa)</option>
              <option value="shorten">Podaj skrót (nazwa → kod)</option>
              <option value="mixed" selected>Mieszane</option>
            </select>
          </label>

          <label>📊 Ilość pytań
            <input id="exp_count" type="number" min="1" value="15">
          </label>
        </div>

        <div style="margin-top:12px;">
          <button id="exp_start">🚀 Start</button>
        </div>
      </section>

      <section class="card" id="expQuiz" style="display:none;">
        <div class="row" style="justify-content:space-between;">
          <div class="stats-badge">Pytanie <span id="exp_curr">1</span>/<span id="exp_total">0</span></div>
          <div class="row" style="gap:12px;">
            <div class="stats-badge" style="color:var(--green);">✅ <span id="exp_ok">0</span></div>
            <div class="stats-badge" style="color:var(--red);">❌ <span id="exp_bad">0</span></div>
          </div>
        </div>

        <div id="progressBar"><div id="progress"></div></div>

        <div id="exp_stem" style="font-size:22px;font-weight:700;margin-top:12px;"></div>

        <div class="input-wrapper" style="margin-top:12px;">
          <input type="text" id="exp_input" placeholder="Wpisz odpowiedź...">
          <button id="exp_check">✓ Sprawdź</button>
        </div>

        <div id="exp_feedback"></div>

        <div class="row" style="justify-content:space-between;margin-top:12px;">
          <button id="exp_prev" class="secondary">←</button>
          <button id="exp_next">→</button>
        </div>
      </section>

      <section class="card" id="expResult" style="display:none;text-align:center;">
        <h2>📘 Wynik</h2>
        <div style="font-size:48px;font-weight:800;background:linear-gradient(135deg,var(--blue),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
          <span id="exp_score">0</span>%
        </div>
        <div id="exp_scoreDetails" class="muted" style="margin-top:6px;"></div>
        <div style="margin-top:12px;">
          <button id="exp_restart" class="success">🔄 Jeszcze raz</button>
        </div>
      </section>
    `;

    const $ = s => root.querySelector(s);

    const STATE = {
        pool: [],
        questions: [],
        idx: 0,
        ok: 0,
        bad: 0
    };

    function loadCustoms() {
        try {
            const s = localStorage.getItem('quizCustomRegions');
            if (!s) return [];
            const o = JSON.parse(s);
            const out = [];
            for (const id in o) (o[id]?.data || []).forEach(x => out.push(x));
            return out;
        } catch { return []; }
    }

    function buildPool(region) {
        if (region === "r1") return [...DEFAULT_REGION1];
        if (region === "r2") return [...DEFAULT_REGION2];
        if (region === "both") return [...DEFAULT_REGION1, ...DEFAULT_REGION2];
        if (region === "all") return [...DEFAULT_REGION1, ...DEFAULT_REGION2, ...loadCustoms()];
        return [...DEFAULT_REGION1, ...DEFAULT_REGION2];
    }

    function makeExpandQuestions(pool, mode, count) {
        const base = sample(pool, count);

        return base.map(({ name, code }) => {
            let dir = mode;
            if (mode === "mixed") dir = Math.random() < 0.5 ? "expand" : "shorten";

            if (dir === "expand") {
                return {
                    stem: `Rozwiń skrót <code>${code}</code>`,
                    expect: "name",
                    correct: name
                };
            } else {
                return {
                    stem: `Podaj skrót dla stacji <strong>${name}</strong>`,
                    expect: "code",
                    correct: code
                };
            }
        });
    }

    function renderQuestion() {
        const q = STATE.questions[STATE.idx];
        $("#exp_stem").innerHTML = q.stem;
        $("#exp_input").value = "";
        $("#exp_feedback").innerHTML = "";

        $("#exp_curr").textContent = STATE.idx + 1;
        $("#exp_total").textContent = STATE.questions.length;

        const pct = Math.round(100 * STATE.idx / STATE.questions.length);
        $("#progress").style.width = pct + "%";
    }

    function check() {
        const q = STATE.questions[STATE.idx];
        const val = $("#exp_input").value.trim();

        let ok = false;
        if (q.expect === "name") ok = isNameMatch(val, q.correct);
        else ok = isCodeMatch(val, q.correct);

        if (ok) {
            STATE.ok++;
            $("#exp_feedback").innerHTML = `<div class="feedback success">Poprawnie! 🎉</div>`;
        } else {
            STATE.bad++;
            $("#exp_feedback").innerHTML =
                `<div class="feedback error">Błędnie! Poprawna: <strong>${q.correct}</strong></div>`;
        }

        $("#exp_ok").textContent = STATE.ok;
        $("#exp_bad").textContent = STATE.bad;
    }

    function next() {
        if (STATE.idx < STATE.questions.length - 1) {
            STATE.idx++;
            renderQuestion();
        } else finish();
    }

    function prev() {
        if (STATE.idx > 0) {
            STATE.idx--;
            renderQuestion();
        }
    }

    function finish() {
        $("#expQuiz").style.display = "none";
        $("#expResult").style.display = "block";

        const total = STATE.questions.length;
        const pct = total ? Math.round(100 * STATE.ok / total) : 0;

        $("#exp_score").textContent = pct;
        $("#exp_scoreDetails").textContent = `${STATE.ok} / ${total} poprawnych`;
    }

    $("#exp_start").onclick = () => {
        const pool = buildPool($("#exp_region").value);
        const mode = $("#exp_mode").value;
        const cnt = Math.max(1, Math.min(parseInt($("#exp_count").value), pool.length));

        STATE.pool = pool;
        STATE.questions = makeExpandQuestions(pool, mode, cnt);
        STATE.idx = 0; STATE.ok = 0; STATE.bad = 0;

        $("#expSetup").style.display = "none";
        $("#expQuiz").style.display = "block";
        $("#expResult").style.display = "none";

        renderQuestion();
    };

    $("#exp_check").onclick = check;
    $("#exp_next").onclick = next;
    $("#exp_prev").onclick = prev;
    $("#exp_restart").onclick = () => {
        $("#expResult").style.display = "none";
        $("#expSetup").style.display = "block";
    };
}

export function unmount(root) {
    root.innerHTML = "";
}
