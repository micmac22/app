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
        <div class="stats-badge">Pytanie <span id="qb_curr">1</span>/<span id="qb_total">0</span></div>
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
      <div style="font-size:48px;font-weight:800;">
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

  function uniqueByCode(arr){
    const map=new Map();
    arr.forEach(x=>{
      if(x?.code && !map.has(x.code)) map.set(x.code,x);
    });
    return [...map.values()];
  }

  function buildPool(regionSel){
    const customs = loadCustomRegionData();
    let data=[];
    if(regionSel==='r1')   data=[...DEFAULT_REGION1];
    if(regionSel==='r2')   data=[...DEFAULT_REGION2];
    if(regionSel==='both') data=[...DEFAULT_REGION1,...DEFAULT_REGION2];
    if(regionSel==='all')  data=[...DEFAULT_REGION1,...DEFAULT_REGION2,...customs];
    return uniqueByCode(data);
  }

  function makeQuestions(pool, modeDir, count, opts){
    const base = sample(pool, count);
    return base.map(({name, code})=>{
      const dir = (modeDir==='mixed') ? (Math.random()<0.5?'name2code':'code2name') : modeDir;

      if(dir==='name2code'){
        let choices = buildCodeChoices(code, opts, pool);
        if(choices.length<opts) choices=[...choices,code];
        return { type:'mc', stem:`Jaki skrót ma stacja <strong>${name}</strong>?`, correct:code, expect:'code', choices };
      } else {
        let choices = buildNameChoices(name, opts, pool);
        if(choices.length<opts) choices=[...choices,name];
        return { type:'mc', stem:`Która nazwa odpowiada skrótowi <code>${code}</code>?`, correct:name, expect:'name', choices };
      }
    });
  }

  function renderProgress(){
    $('#qb_curr').textContent = (STATE.idx+1);
    $('#qb_total').textContent = STATE.questions.length;
    $('#qb_ok').textContent = STATE.ok;
    $('#qb_bad').textContent = STATE.bad;
    const pct = STATE.questions.length? Math.round(100*STATE.idx/STATE.questions.length) : 0;
    $('#progress').style.width = pct + '%';
  }

  function renderQuestion(){
    const q = STATE.questions[STATE.idx];
    if(!q) return;

    $('#qb_stem').innerHTML = q.stem;
    $('#qb_feedback').innerHTML = '';
    const answers = $('#qb_answers'); answers.innerHTML = '';

    q.choices.forEach(choice=>{
      const btn = document.createElement('button');
      btn.className='choice';
      btn.textContent=choice;
      btn.onclick = ()=>selectMC(q, btn, choice);
      answers.appendChild(btn);
    });

    renderProgress();
  }

  function selectMC(q, btn, value){
    if(q._answered) return;
    q._answered=true;

    const ok = q.expect==='code'
      ? isCodeMatch(value, q.correct)
      : isNameMatch(value, q.correct);

    if(ok){ STATE.ok++; btn.classList.add('correct'); }
    else  { STATE.bad++; btn.classList.add('wrong'); }

    [...$('#qb_answers').querySelectorAll('.choice')].forEach(b=>{
      b.disabled=true;
      const match = q.expect==='code'
        ? isCodeMatch(b.textContent,q.correct)
        : isNameMatch(b.textContent,q.correct);
      if(match) b.classList.add('correct');
    });

    renderProgress();
  }

  function next(){ if(STATE.idx < STATE.questions.length-1){ STATE.idx++; renderQuestion(); } else finish(); }
  function prev(){ if(STATE.idx>0){ STATE.idx--; renderQuestion(); } }

  function start(){
    const pool = buildPool($('#qb_region').value);
    const dir  = $('#qb_dir').value;
    const opts = parseInt($('#qb_opts').value||'4',10);
    const cnt  = Math.max(1, Math.min(parseInt($('#qb_count').value||'20',10), pool.length));

    STATE.pool=pool;
    STATE.questions = makeQuestions(pool, dir, cnt, opts);
    STATE.review=[]; STATE.idx=0; STATE.ok=0; STATE.bad=0;

    $('#setupCard').style.display='none';
    $('#quizCard').style.display='block';
    $('#resultCard').style.display='none';

    renderQuestion();
  }

  function finish(){
    $('#setupCard').style.display='none';
    $('#quizCard').style.display='none';
    $('#resultCard').style.display='block';
    const total=STATE.questions.length;
    const pct = total? Math.round(100*STATE.ok/total) : 0;
    $('#qb_score').textContent = pct;
    $('#qb_scoreDetails').textContent = `${STATE.ok} / ${total} poprawnych`;
  }

  $('#qb_start').onclick = start;
  $('#qb_next').onclick = next;
  $('#qb_prev').onclick = prev;
  $('#qb_restart').onclick = ()=>{ $('#setupCard').style.display='block'; $('#quizCard').style.display='none'; $('#resultCard').style.display='none'; };
}

export function unmount(root){ root.innerHTML=''; }