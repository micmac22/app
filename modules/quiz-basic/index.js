// modules/quiz-basic/index.js
// Podstawowy quiz (MC): nazwa→skrót, skrót→nazwa, mieszane
// Wersja kompatybilna ze wspólną logiką (shared/shared-logic.js)

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

export function mount(root){
  root.innerHTML = `
    <section class="card" id="setupCard">
      <h2>🎯 Podstawowy quiz</h2>
      <div class="grid" style="margin-top:10px;">
        <label>🗺️ Region danych
          <select id="qb_region">
            <option value="r1">Region 1</option>
            <option value="r2">Region 2</option>
            <option value="both" selected>Oba regiony</option>
            <option value="all">Wszystkie (z niestandardowymi)</option>
          </select>
        </label>
        <label>🔄 Kierunek pytań
          <select id="qb_dir">
            <option value="name2code" selected>Nazwa → skrót</option>
            <option value="code2name">Skrót → nazwa</option>
            <option value="mixed">Losowo (mieszane)</option>
          </select>
        </label>
        <label>📊 Liczba pytań
          <input id="qb_count" type="number" min="1" value="20">
        </label>
        <label>📝 Opcje odpowiedzi
          <select id="qb_opts">
            <option value="3">3</option>
            <option value="4" selected>4</option>
            <option value="5">5</option>
            <option value="6">6</option>
          </select>
        </label>
      </div>
      <div style="margin-top:12px;">
        <button id="qb_start">🚀 Start</button>
      </div>
    </section>

    <section class="card" id="quizCard" style="display:none;">
      <div class="row" style="justify-content:space-between;align-items:center;">
        <div class="row" style="gap:12px;">
          <div class="stats-badge">Pytanie <span id="qb_curr">1</span>/<span id="qb_total">0</span></div>
        </div>
        <div class="row" style="gap:12px;">
          <div class="stats-badge" style="color: var(--green);">✅ <span id="qb_ok">0</span></div>
          <div class="stats-badge" style="color: var(--red);">❌ <span id="qb_bad">0</span></div>
        </div>
      </div>

      <div id="progressBar"><div id="progress"></div></div>

      <div style="margin: 16px 0;">
        <div id="qb_stem" style="font-size:22px;font-weight:700;"></div>
      </div>

      <div id="qb_answers"></div>
      <div id="qb_feedback" style="margin-top:10px;"></div>

      <div class="row" style="justify-content:space-between;margin-top:12px;">
        <button id="qb_prev" class="secondary">← Poprzednie</button>
        <button id="qb_next">Następne →</button>
      </div>
    </section>

    <section class="card" id="resultCard" style="display:none;text-align:center;">
      <h2>🎉 Wynik</h2>
      <div style="font-size:48px;font-weight:800;background:linear-gradient(135deg,var(--blue),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
        <span id="qb_score">0</span>%
      </div>
      <div id="qb_scoreDetails" class="muted" style="margin-top:6px;"></div>
      <div style="margin-top:12px;">
        <button id="qb_restart" class="success">🔄 Jeszcze raz</button>
        <button id="qb_export">📥 Eksport CSV</button>
      </div>
    </section>
  `;

  const $ = sel => root.querySelector(sel);

  const STATE = { pool:[], questions:[], review:[], idx:0, ok:0, bad:0 };

  // ————— PULA WG REGIONU (z niestandardowymi z localStorage) —————
  function buildPool(regionSel){
    const customs = loadCustomRegionData();
    if(regionSel==='r1')   return [...DEFAULT_REGION1];
    if(regionSel==='r2')   return [...DEFAULT_REGION2];
    if(regionSel==='both') return [...DEFAULT_REGION1, ...DEFAULT_REGION2];
    if(regionSel==='all')  return [...DEFAULT_REGION1, ...DEFAULT_REGION2, ...customs];
    return [...DEFAULT_REGION1, ...DEFAULT_REGION2];
  }

  // ————— GENEROWANIE PYTAŃ (MC) —————
  function makeQuestions(pool, modeDir, count, opts){
    const base = sample(pool, count);
    return base.map(({name, code})=>{
      const dir = (modeDir==='mixed') ? (Math.random()<0.5?'name2code':'code2name') : modeDir;
      if(dir==='name2code'){
        const choices = buildCodeChoices(code, opts, pool);
        return { type:'mc', stem:`Jaki skrót ma stacja <strong>${name}</strong>?`, correct:code, expect:'code', choices };
      } else {
        const choices = buildNameChoices(name, opts, pool);
        return { type:'mc', stem:`Która nazwa odpowiada skrótowi <code>${code}</code>?`, correct:name, expect:'name', choices };
      }
    });
  }

  // ————— RENDER / LOGIKA —————
  function renderProgress(){
    $('#qb_curr').textContent = (STATE.idx+1);
    $('#qb_total').textContent = STATE.questions.length;
    $('#qb_ok').textContent = STATE.ok;
    $('#qb_bad').textContent = STATE.bad;
    const pct = STATE.questions.length? Math.round(100*STATE.idx/STATE.questions.length) : 0;
    $('#progress').style.width = pct + '%';
  }

  function feedback(ok, html){
    $('#qb_feedback').innerHTML = `<div class="feedback ${ok?'success':'error'}">${html}</div>`;
  }

  function renderQuestion(){
    const q = STATE.questions[STATE.idx];
    if(!q) return;
    $('#qb_stem').innerHTML = q.stem;
    $('#qb_feedback').innerHTML = '';
    const answers = $('#qb_answers'); answers.innerHTML = '';
    if(q.type==='mc'){
      q.choices.forEach(choice=>{
        const btn = document.createElement('button');
        btn.className='choice'; btn.textContent=choice;
        btn.onclick = ()=>selectMC(q, btn, choice);
        answers.appendChild(btn);
      });
    }
    renderProgress();
  }

  function selectMC(q, btn, value){
    if(q._answered) return; q._answered=true;
