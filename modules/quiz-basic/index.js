import {
  DEFAULT_REGION1,
  DEFAULT_REGION2,
  norm,
  isNameMatch,   // używane tylko do generowania pytań? (tu MC porównuje ściśle)
  isCodeMatch,   // jw.
  sample,
  buildCodeChoices,
  buildNameChoices,
  loadCustomRegionData,
  // pomocnicze z shared (do podobieństwa / tworzenia dystraktorów)
  tokenize,
  dl
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
        <div class="row" style="gap:12px;align-items:center;">
          <div class="stats-badge" style="color: var(--green);">✅ <span id="qb_ok">0</span></div>
          <div class="stats-badge" style="color: var(--red);">❌ <span id="qb_bad">0</span></div>
          <div class="stats-badge">⏱️ <span id="qb_timer">0.0</span>s</div>
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
      <div class="muted small" style="margin-top:8px;">
        Skróty: [1–6] wybierz odpowiedź • [Enter] przejdź dalej (po sprawdzeniu)
      </div>
    </section>

    <section class="card" id="resultCard" style="display:none;text-align:center;">
      <h2>🎉 Wynik</h2>
      <div style="font-size:48px;font-weight:800;">
        <span id="qb_score">0</span>%
      </div>
      <div id="qb_scoreDetails" class="muted" style="margin-top:6px;"></div>

      <div style="text-align:left; max-width:680px; margin:16px auto 0;">
        <h3>📈 Statystyki czasu</h3>
        <ul id="qb_timeStats" class="muted" style="line-height:1.8;"></ul>
      </div>

      <div style="margin-top:12px;">
        <button id="qb_restart" class="success">🔄 Jeszcze raz</button>
      </div>
    </section>
  `;

  const $ = sel => root.querySelector(sel);

  const STATE = {
    pool:[],
    questions:[],
    idx:0,
    ok:0,
    bad:0,
    // czas
    sessionStart: 0,
    sessionTimerId: null,
    times: [], // czasy poszczególnych pytań (sek)
    answerButtons: []
  };

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

  // ====== UTRUDNIENIE DYSTRAKTORÓW ======

  function shuffleArray(arr){
    const a=[...arr];
    for(let i=a.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [a[i],a[j]]=[a[j],a[i]];
    }
    return a;
  }

  function firstLetterName(s){
    const t = norm(s);
    return t[0] || '';
  }
  function firstLetterCode(s){
    const t = (s || '').toString().trim().toUpperCase();
    return t[0] || '';
  }

  // Zwraca N nazw z tej samej pierwszej litery (najbliższe wg DL)
  function similarNamesSameFirst(correctName, pool, need){
    const fl = firstLetterName(correctName);
    const cand = pool
      .map(x=>x.name)
      .filter(n => n && n !== correctName && firstLetterName(n) === fl);

    return cand
      .map(n => ({ n, d: dl(norm(n), norm(correctName)) }))
      .sort((a,b)=>a.d-b.d)
      .slice(0, need)
      .map(o=>o.n);
  }

  // Zwraca N kodów z tej samej pierwszej litery
  function similarCodesSameFirst(correctCode, pool, need){
    const fl = firstLetterCode(correctCode);
    const cand = pool
      .map(x=> (x.code || '').toUpperCase())
      .filter(c => c && c !== correctCode.toUpperCase() && firstLetterCode(c) === fl);

    return Array.from(new Set(cand)).slice(0, need);
  }

  // Syntetyczny dystraktor kodu: mix znaków przy zachowaniu pierwszej litery,
  // fallback: 3-znakowa kombinacja z liter nazwy (pierwsza zgodna z kodem)
  function syntheticCodeDistractor(correctCode, correctName){
    const target = (correctCode || '').toUpperCase();
    if(!target) return null;
    const first = target[0];
    const rest  = target.slice(1).split('');
    // permutacje rest
    for(let attempt=0; attempt<10; attempt++){
      const arr=[...rest];
      for(let i=arr.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [arr[i],arr[j]]=[arr[j],arr[i]];
      }
      const mixed = first + arr.join('');
      if(mixed !== target) return mixed;
    }
    // fallback: 3-znakowa kombinacja z nazwy
    const letters = norm(correctName || '').replace(/[^a-z0-9]/g,'').toUpperCase();
    const pool = letters.split('').filter(ch=>/[A-Z0-9]/.test(ch));
    for(let attempt=0; attempt<20; attempt++){
      if(pool.length<2) break;
      const a = pool[Math.floor(Math.random()*pool.length)];
      const b = pool[Math.floor(Math.random()*pool.length)];
      const cand = (first + a + b).slice(0, target.length); // dopasuj długość
      if(cand !== target && cand[0] === first) return cand;
    }
    return null;
  }

  // Ulepszanie wyborów NAZW: zapewnij co najmniej 1 dystraktor z tej samej pierwszej litery
  function enhanceNameChoices(choices, correctName, pool, optsCount){
    const out = new Set(choices);
    const fl = firstLetterName(correctName);
    const sameFirstInChoices = [...out].filter(n => n !== correctName && firstLetterName(n) === fl);
    if(sameFirstInChoices.length === 0){
      const [cand] = similarNamesSameFirst(correctName, pool, 1);
      if(cand && !out.has(cand) && cand !== correctName){
        for(const v of out){
          if(v !== correctName){
            out.delete(v);
            out.add(cand);
            break;
          }
        }
      }
    }
    return shuffleArray([...out]).slice(0, optsCount);
  }

  // Ulepszanie wyborów KODÓW
  function enhanceCodeChoices(choices, correctCode, correctName, pool, optsCount){
    let set = new Set(choices.map(c => (c || '').toUpperCase()));
    const upperCorrect = (correctCode || '').toUpperCase();

    // 1) zapewnij dystraktor zaczynający się jak poprawny
    const sameFirst = similarCodesSameFirst(upperCorrect, pool, 3);
    const hasSameFirst = [...set].some(c => c !== upperCorrect && firstLetterCode(c) === firstLetterCode(upperCorrect));
    if(!hasSameFirst && sameFirst.length){
      for(const swap of set){
        if(swap !== upperCorrect){
          set.delete(swap);
          set.add(sameFirst[0]);
          break;
        }
      }
    }

    // 2) syntetyczny dystraktor (mix / 3-lit)
    const synth = syntheticCodeDistractor(upperCorrect, correctName);
    if(synth && !set.has(synth) && synth !== upperCorrect){
      if(set.size >= optsCount){
        for(const swap of set){
          if(swap !== upperCorrect){
            set.delete(swap);
            break;
          }
        }
      }
      set.add(synth);
    }

    const out = shuffleArray([...set]).slice(0, optsCount);
    if(!out.includes(upperCorrect)){
      out[Math.floor(Math.random()*out.length)] = upperCorrect;
    }
    return out;
  }

  // ====== GENERATOR PYTAŃ ======

  function makeQuestions(pool, modeDir, count, opts){
    const base = sample(pool, count);
    return base.map(({name, code})=>{
      const dir = (modeDir==='mixed') ? (Math.random()<0.5?'name2code':'code2name') : modeDir;

      if(dir==='name2code'){
        // Nazwa → skrót (kody)
        let choices = buildCodeChoices(code, opts, pool);
        choices = enhanceCodeChoices(choices, code, name, pool, opts);
        if(choices.length<opts) choices=[...choices,code];

        return {
          type:'mc',
          dir,
          stem:`Jaki skrót ma stacja <strong>${name}</strong>?`,
          correct: (code || '').toUpperCase(),
          expect:'code',
          choices: choices.map(c => (c || '').toUpperCase()),
          _answered:false,
          _t0:0,
          _dt:0
        };
      } else {
        // Skrót → nazwa
        let choices = buildNameChoices(name, opts, pool);
        choices = enhanceNameChoices(choices, name, pool, opts);
        if(choices.length<opts) choices=[...choices,name];

        return {
          type:'mc',
          dir,
          stem:`Która nazwa odpowiada skrótowi <code>${code}</code>?`,
          correct:name,
          expect:'name',
          choices,
          _answered:false,
          _t0:0,
          _dt:0
        };
      }
    });
  }

  // ====== RENDER / LOGIKA ======

  function renderProgress(){
    $('#qb_curr').textContent = (STATE.idx+1);
    $('#qb_total').textContent = STATE.questions.length;
    $('#qb_ok').textContent = STATE.ok;
    $('#qb_bad').textContent = STATE.bad;
    const pct = STATE.questions.length? Math.round(100*STATE.idx/STATE.questions.length) : 0;
    $('#progress').style.width = pct + '%';
  }

  function startStopwatch(){
    STATE.sessionStart = performance.now();
    if(STATE.sessionTimerId) clearInterval(STATE.sessionTimerId);
    const tick = ()=>{
      const sec = Math.max(0, (performance.now() - STATE.sessionStart) / 1000);
      $('#qb_timer').textContent = sec.toFixed(1);
    };
    STATE.sessionTimerId = setInterval(tick, 100);
    tick();
  }

  function renderQuestion(){
    const q = STATE.questions[STATE.idx];
    if(!q) return;

    q._answered = false;
    q._t0 = performance.now();
    q._dt = 0;

    $('#qb_stem').innerHTML = q.stem;
    $('#qb_feedback').innerHTML = '';
    const answers = $('#qb_answers'); answers.innerHTML = '';
    STATE.answerButtons = [];

    q.choices.forEach((choice, idx)=>{
      const btn = document.createElement('button');
      btn.className='choice';
      btn.textContent=choice;
      btn.dataset.index = String(idx+1); // skróty 1–6
      btn.onclick = ()=>selectMC(q, btn, choice);
      answers.appendChild(btn);
      STATE.answerButtons.push(btn);
    });

    renderProgress();
  }

  // === MC: ścisłe porównanie (BEZ fuzzy) ===
  function isChoiceEqual(q, value) {
    if (q.expect === 'code') {
      return String(value).trim().toUpperCase() === String(q.correct).trim().toUpperCase();
    }
    return String(value).trim() === String(q.correct).trim();
  }

  function selectMC(q, btn, value){
    if(q._answered) return;
    q._answered = true;

    const ok = isChoiceEqual(q, value);

    // zmierz czas
    q._dt = Math.max(0, (performance.now() - q._t0)/1000);
    STATE.times.push(q._dt);

    // Zablokuj wszystkie i wyczyść klasy
    const all = [...$('#qb_answers').querySelectorAll('.choice')];
    all.forEach(b => {
      b.disabled = true;
      b.classList.remove('correct', 'wrong');
    });

    // Podświetl kliknięty
    if(ok){ STATE.ok++; btn.classList.add('correct'); }
    else  { STATE.bad++; btn.classList.add('wrong'); }

    // Podświetl WYŁĄCZNIE jedną poprawną (ścisła równość)
    const correctBtn = all.find(b => isChoiceEqual(q, b.textContent));
    if (correctBtn) correctBtn.classList.add('correct');

    // feedback
    $('#qb_feedback').innerHTML = ok
      ? `<span style="color:var(--green);font-weight:600;">✔ Dobrze</span> <span class="muted">(${q._dt.toFixed(2)} s)</span>`
      : `<span style="color:var(--red);font-weight:600;">✖ Źle</span> <span class="muted">(${q._dt.toFixed(2)} s)</span>`;

    renderProgress();

    // auto-next przy poprawnej po krótkim opóźnieniu
    if(ok){
      setTimeout(()=>{
        if(STATE.idx < STATE.questions.length-1) next();
        else finish();
      }, 400);
    }
  }

  function next(){
    if(STATE.idx < STATE.questions.length-1){
      STATE.idx++;
      renderQuestion();
    } else finish();
  }
  function prev(){
    if(STATE.idx>0){
      STATE.idx--;
      renderQuestion();
    }
  }

  function start(){
    const pool = buildPool($('#qb_region').value);
    const dir  = $('#qb_dir').value;
    const opts = parseInt($('#qb_opts').value||'4',10);
    const cnt  = Math.max(1, Math.min(parseInt($('#qb_count').value||'20',10), pool.length));

    STATE.pool=pool;
    STATE.questions = makeQuestions(pool, dir, cnt, opts);
    STATE.idx=0; STATE.ok=0; STATE.bad=0; STATE.times=[];

    $('#setupCard').style.display='none';
    $('#quizCard').style.display='block';
    $('#resultCard').style.display='none';

    startStopwatch();
    renderQuestion();
  }

  function finish(){
    $('#setupCard').style.display='none';
    $('#quizCard').style.display='none';
    $('#resultCard').style.display='block';
    if(STATE.sessionTimerId){ clearInterval(STATE.sessionTimerId); STATE.sessionTimerId=null; }

    const total=STATE.questions.length;
    const pct = total? Math.round(100*STATE.ok/total) : 0;
    $('#qb_score').textContent = pct;
    $('#qb_scoreDetails').textContent = `${STATE.ok} / ${total} poprawnych`;

    const times = STATE.times;
    const count = times.length;
    const sum = times.reduce((a,b)=>a+b,0);
    const avg = count ? (sum/count) : 0;
    const fastest = count ? Math.min(...times) : 0;
    const slowest = count ? Math.max(...times) : 0;
    const sessionSec = (performance.now() - STATE.sessionStart)/1000;

    $('#qb_timeStats').innerHTML = `
      <li>⏱️ Czas sesji: <strong>${sessionSec.toFixed(2)} s</strong></li>
      <li>⚡ Średni czas na pytanie: <strong>${avg.toFixed(2)} s</strong></li>
      <li>🏃‍♂️ Najszybciej: <strong>${fastest.toFixed(2)} s</strong>, 🐢 Najwolniej: <strong>${slowest.toFixed(2)} s</strong></li>
    `;
  }

  // === Zdarzenia ===
  $('#qb_start').onclick = start;
  $('#qb_next').onclick = next;
  $('#qb_prev').onclick = prev;
  $('#qb_restart').onclick = ()=>{
    if(STATE.sessionTimerId){ clearInterval(STATE.sessionTimerId); STATE.sessionTimerId=null; }
    $('#setupCard').style.display='block';
    $('#quizCard').style.display='none';
    $('#resultCard').style.display='none';
  };

  // Skróty klawiaturowe: 1–6 wybierają opcję, Enter przechodzi dalej po sprawdzeniu
  function onKeydown(e){
    const quizVisible = $('#quizCard').style.display !== 'none';
    if(!quizVisible) return;

    if(e.key === 'Enter'){
      const q = STATE.questions[STATE.idx];
      if(q?._answered){
        e.preventDefault(); e.stopPropagation();
        next();
      }
      return;
    }

    if(/^[1-6]$/.test(e.key)){
      const idx = parseInt(e.key,10)-1;
      const btn = STATE.answerButtons[idx];
      if(btn && !btn.disabled){
        e.preventDefault(); e.stopPropagation();
        btn.click();
      }
    }
  }
  window.addEventListener('keydown', onKeydown);
  root.__onKeydownBasic = onKeydown;
}

export function unmount(root){
  if(root.__onKeydownBasic){
    window.removeEventListener('keydown', root.__onKeydownBasic);
    delete root.__onKeydownBasic;
  }
  root.innerHTML='';
}
