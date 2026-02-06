// PEŁNY PLIK — skrócony komentarz u góry dla czytelności
import {
  DEFAULT_REGION1,
  DEFAULT_REGION2,
  norm,
  isNameMatch,
  sample,
  tokenize,
  sigTokens,
  dl
} from "../../shared/shared-logic.js";

// --- MATCHERY ---
function isNameMatchExpand(input, correct) {
  const A = tokenize(input || "");
  const B = tokenize(correct || "");
  const AT = sigTokens(A);
  const BT = sigTokens(B);
  if (!BT.length) return isNameMatch(input, correct);
  const matches = BT.filter(bt => AT.some(at => dl(at, bt) <= 1)).length;
  const ratio = BT.length ? (matches / BT.length) : 1;
  if (ratio >= 0.8) return true;
  const AS = norm(input).replace(/\s+/g, "");
  const BS = norm(correct).replace(/\s+/g, "");
  if (Math.abs(AS.length - BS.length) <= 2 && dl(AS, BS) <= 2) return true;
  return false;
}
function isValidCodeFormat(s) { return /^[A-Z0-9]+$/i.test(s); }
function isCodeMatchStrict(input, correct) {
  const a = String(input ?? '').trim();
  const b = String(correct ?? '').trim();
  if (!isValidCodeFormat(a)) return false;
  return a.toUpperCase() === b.toUpperCase();
}

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
        <div class="row" style="gap:12px; align-items:center;">
          <div class="stats-badge" style="color:var(--green);">✅ <span id="exp_ok">0</span></div>
          <div class="stats-badge" style="color:var(--red);">❌ <span id="exp_bad">0</span></div>
          <div class="stats-badge">⏱️ <span id="exp_timer">0.0</span>s</div>
        </div>
      </div>
      <div id="progressBar"><div id="progress"></div></div>
      <div id="exp_stem" style="font-size:22px;font-weight:700;margin-top:12px;"></div>
      <div class="input-wrapper" style="margin-top:12px;">
        <input type="text" id="exp_input" placeholder="Wpisz odpowiedź... (ENTER = sprawdź / ENTER = dalej)">
        <button id="exp_check">✓ Sprawdź</button>
      </div>
      <div id="exp_feedback" style="margin-top:8px;" aria-live="polite"></div>
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
      <div style="text-align:left; max-width:680px; margin:16px auto 0;">
        <h3>📈 Statystyki czasu</h3>
        <ul id="exp_timeStats" class="muted" style="line-height:1.8;"></ul>
        <div id="exp_modeStatsWrap" style="margin-top:12px;">
          <h3>🎯 Statystyki wg trybu pytania</h3>
          <ul id="exp_modeStats" class="muted" style="line-height:1.8;"></ul>
        </div>
      </div>
      <div style="margin-top:12px;">
        <button id="exp_export">📥 Eksport CSV</button>
        <button id="exp_restart" class="success">🔄 Jeszcze raz</button>
      </div>
    </section>
  `;

  const $ = s => root.querySelector(s);

  const STATE = {
    pool: [], questions: [], idx: 0, ok: 0, bad: 0,
    startAt: 0, timerId: null, times: [], review: [],
    cats: { expand: { ok: 0, total: 0 }, shorten: { ok: 0, total: 0 } }
  };

  const nowMs = () => (window.performance?.now?.() ?? Date.now());
  const stripHtml = (s='') => s.replace(/<[^>]*>/g, '').trim();

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
    if (region === "r1")   return [...DEFAULT_REGION1];
    if (region === "r2")   return [...DEFAULT_REGION2];
    if (region === "both") return [...DEFAULT_REGION1, ...DEFAULT_REGION2];
    if (region === "all")  return [...DEFAULT_REGION1, ...DEFAULT_REGION2, ...loadCustoms()];
    return [...DEFAULT_REGION1, ...DEFAULT_REGION2];
  }

  function makeExpandQuestions(pool, mode, count) {
    const base = sample(pool, count);
    return base.map(({ name, code }) => {
      let dir = mode;
      if (mode === "mixed") dir = Math.random() < 0.5 ? "expand" : "shorten";
      if (dir === "expand") {
        return { stem: `Rozwiń skrót <code>${code}</code>`, expect: "name", correct: name, _checked: false, _t0: 0, _dt: 0 };
      } else {
        return { stem: `Podaj skrót dla stacji <strong>${name}</strong>`, expect: "code", correct: code, _checked: false, _t0: 0, _dt: 0 };
      }
    });
  }

  function updateProgress() {
    const total = STATE.questions.length || 0;
    const curr = STATE.idx;
    const checked = STATE.questions[curr]?._checked ? 1 : 0;
    const pct = total ? Math.round(100 * (curr + checked) / total) : 0;
    $("#progress").style.width = pct + "%";
  }

  function renderQuestion() {
    const q = STATE.questions[STATE.idx];
    q._checked = false; q._t0 = nowMs(); q._dt = 0;
    $("#exp_stem").innerHTML = q.stem;
    $("#exp_input").value = "";
    $("#exp_feedback").innerHTML = "";
    $("#exp_curr").textContent = STATE.idx + 1;
    $("#exp_total").textContent = STATE.questions.length;
    updateProgress();
    $("#exp_input").focus();
  }

  function check() {
    const q = STATE.questions[STATE.idx];
    if (q._checked) return;
    const val = $("#exp_input").value.trim();
    let ok = false;
    if (q.expect === "name") {
      ok = isNameMatchExpand(val, q.correct);
      STATE.cats.expand.total += 1;
      if (ok) STATE.cats.expand.ok += 1;
    } else {
      ok = isCodeMatchStrict(val, q.correct);
      STATE.cats.shorten.total += 1;
      if (ok) STATE.cats.shorten.ok += 1;
    }
    q._checked = true;
    q._dt = Math.max(0, (nowMs() - q._t0) / 1000);
    STATE.times.push(q._dt);
    STATE.review.push({ i: STATE.idx + 1, stem: stripHtml(q.stem), expect: q.expect, correct: q.correct, answer: val, ok, timeSec: q._dt.toFixed(2) });

    if (ok) { STATE.ok++; $("#exp_feedback").innerHTML = `<div class="feedback success">Poprawnie! 🎉 <span class="muted">(${q._dt.toFixed(2)} s)</span></div>`; }
    else { STATE.bad++; $("#exp_feedback").innerHTML = `<div class="feedback error">Błędnie! Poprawna: <strong>${q.correct}</strong> <span class="muted">(${q._dt.toFixed(2)} s)</span></div>`; }

    $("#exp_ok").textContent = STATE.ok;
    $("#exp_bad").textContent = STATE.bad;
    updateProgress();
  }

  function next() {
    const q = STATE.questions[STATE.idx];
    if (!q._checked) {
      $("#exp_feedback").innerHTML = `<div class="feedback warn">Najpierw sprawdź odpowiedź (Enter lub “✓ Sprawdź”).</div>`;
      return;
    }
    if (STATE.idx < STATE.questions.length - 1) { STATE.idx++; renderQuestion(); }
    else finish();
  }

  function prev() { if (STATE.idx > 0) { STATE.idx--; renderQuestion(); } }

  function median(arr) { if (!arr.length) return 0; const a=[...arr].sort((x,y)=>x-y); const m=Math.floor(a.length/2); return a.length%2?a[m]:(a[m-1]+a[m])/2; }
  function percentile(arr,p){ if(!arr.length)return 0; const a=[...arr].sort((x,y)=>x-y); const i=Math.ceil((p/100)*a.length)-1; return a[Math.max(0,Math.min(i,a.length-1))]; }

  function finish() {
    if (STATE.timerId) { clearInterval(STATE.timerId); STATE.timerId = null; }
    $("#expQuiz").style.display = "none";
    $("#expResult").style.display = "block";
    const total = STATE.questions.length;
    const pct = total ? Math.round(100 * STATE.ok / total) : 0;
    $("#exp_score").textContent = pct;
    $("#exp_scoreDetails").textContent = `${STATE.ok} / ${total} poprawnych`;

    const times = STATE.times, count = times.length, sum = times.reduce((a,b)=>a+b,0);
    const avg = count ? (sum / count) : 0, med = median(times);
    const fastest = count ? Math.min(...times) : 0, slowest = count ? Math.max(...times) : 0;
    const p95 = percentile(times, 95);
    const sesElapsed = Math.max(0, (nowMs() - STATE.startAt) / 1000);
    $("#exp_timeStats").innerHTML = `
      <li>⏱️ Czas sesji: <strong>${sesElapsed.toFixed(2)} s</strong></li>
      <li>⚡ Średni czas na pytanie: <strong>${avg.toFixed(2)} s</strong></li>
      <li>📍 Mediana czasu na pytanie: <strong>${med.toFixed(2)} s</strong></li>
      <li>🎯 P95 czasu: <strong>${p95.toFixed(2)} s</strong></li>
      <li>🏃‍♂️ Najszybciej: <strong>${fastest.toFixed(2)} s</strong>, 🐢 Najwolniej: <strong>${slowest.toFixed(2)} s</strong></li>
    `;
    const ms = [];
    if (STATE.cats.expand.total > 0) {
      const p = Math.round(100 * STATE.cats.expand.ok / STATE.cats.expand.total);
      ms.push(`<li>🔎 Rozwiń skrót (kod→nazwa): <strong>${STATE.cats.expand.ok}/${STATE.cats.expand.total}</strong> (${p}%)</li>`);
    }
    if (STATE.cats.shorten.total > 0) {
      const p = Math.round(100 * STATE.cats.shorten.ok / STATE.cats.shorten.total);
      ms.push(`<li>✂️ Podaj skrót (nazwa→kod): <strong>${STATE.cats.shorten.ok}/${STATE.cats.shorten.total}</strong> (${p}%)</li>`);
    }
    $("#exp_modeStats").innerHTML = ms.join("") || `<li class="muted">Brak rozbicia (jednolity tryb).</li>`;
  }

  function startStopwatch() {
    STATE.startAt = nowMs();
    const tick = () => {
      const sec = Math.max(0, (nowMs() - STATE.startAt) / 1000);
      const el = $("#exp_timer");
      if (el) el.textContent = sec.toFixed(1);
    };
    if (STATE.timerId) clearInterval(STATE.timerId);
    STATE.timerId = setInterval(tick, 100);
    tick();
  }

  function csvSanitize(v) {
    const s = String(v ?? '');
    return /^[=+\-@]/.test(s) ? `'${s.replace(/"/g,'""')}` : s.replace(/"/g,'""');
  }
  function exportCSV(rows, filename='wynik_expand.csv') {
    if (!rows.length) return alert("Brak danych do eksportu.");
    const header = Object.keys(rows[0]).join(';');
    const body = rows.map(r => Object.values(r).map(v => `"${csvSanitize(v)}"`).join(';')).join('\n');
    const csv = '\uFEFF' + header + '\n' + body;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // Zdarzenia
  $("#exp_start").onclick = () => {
    const pool = buildPool($("#exp_region").value);
    const mode = $("#exp_mode").value;
    const cnt = Math.max(1, Math.min(parseInt($("#exp_count").value || "0", 10), pool.length));
    STATE.pool = pool; STATE.questions = makeExpandQuestions(pool, mode, cnt);
    STATE.idx = 0; STATE.ok = 0; STATE.bad = 0;
    STATE.times = []; STATE.review = [];
    STATE.cats = { expand: { ok:0, total:0 }, shorten: { ok:0, total:0 } };
    $("#expSetup").style.display = "none";
    $("#expQuiz").style.display = "block";
    $("#expResult").style.display = "none";
    startStopwatch();
    renderQuestion();
  };

  $("#exp_check").onclick = check;
  $("#exp_next").onclick = next;
  $("#exp_prev").onclick = prev;

  $("#exp_input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); e.stopPropagation();
      const q = STATE.questions[STATE.idx];
      if (!q._checked) check(); else next();
    }
  });

  $("#exp_export").onclick = () => exportCSV(STATE.review);

  $("#exp_restart").onclick = () => {
    if (STATE.timerId) { clearInterval(STATE.timerId); STATE.timerId = null; }
    Object.assign(STATE, {
      pool: [], questions: [], idx: 0, ok: 0, bad: 0,
      startAt: 0, timerId: null, times: [], review: [],
      cats: { expand: { ok:0, total:0 }, shorten: { ok:0, total:0 } }
    });
    $("#expResult").style.display = "none";
    $("#expSetup").style.display = "block";
  };
}

export function unmount(root) {
  try { /* nic */ } catch {}
  root.innerHTML = "";
}
