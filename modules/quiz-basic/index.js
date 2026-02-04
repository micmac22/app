// modules/quiz-basic/index.js

// ==== DANE REGIONÓW (Twoje) ====
const DEFAULT_REGION1 = [
  {"name":"Białobrzegi","code":"BIB"},{"name":"Bór","code":"BOR"},{"name":"Browar Belgia","code":"KB1"},
  {"name":"Busko Wełecz","code":"BUS"},{"name":"Busko Zdrój","code":"BUZ"},{"name":"Cegielnia Olesnica","code":"CO1"},
  {"name":"Chemar","code":"KIA"},{"name":"Chmielnik","code":"CMI"},{"name":"Chronówek","code":"CHR"},
  {"name":"Dobieszyn","code":"DBN"},{"name":"Drzewica","code":"DRZ"},{"name":"Działoszyce","code":"DZI"},
  {"name":"Ferrero","code":"FER"},{"name":"Gołębiów","code":"RGO"},{"name":"Grójec","code":"GJC"},
  {"name":"Grójec 2","code":"GJ2"},{"name":"Grzybów","code":"CS2"},{"name":"Huta Ostrowiec","code":"HOS"},
  {"name":"Iłża","code":"IZA"},{"name":"Iłża 2","code":"IZ2"},{"name":"Jedlińsk","code":"JDS"},
  {"name":"Jędrzejów 1","code":"JDJ"},{"name":"Jędrzejów 2","code":"JDD"},{"name":"Karczówka","code":"KIK"},
  {"name":"Kazimierza Wielka","code":"KWL"},{"name":"Kielce EC","code":"KEC"},
  {"name":"Kielce Południe","code":"KPD"},{"name":"Kielce Północ","code":"KIP"},{"name":"Kielce Wschód","code":"KWS"},
  {"name":"Kije","code":"KJE"},{"name":"Końskie Polmo","code":"KSP"},{"name":"Końskie Stary Młyn","code":"KSE"},
  {"name":"Końskie Zachód","code":"KSZ"},{"name":"Kozienice","code":"KOZ"},{"name":"Kozienice Miasto","code":"KZM"},
  {"name":"Kunów","code":"KNW"},{"name":"KZWM","code":"KIZ"},{"name":"Lipsko","code":"LPS"},
  {"name":"Małogoszcz","code":"MLG"},{"name":"Michalczew","code":"MIC"},{"name":"Miechów","code":"MCH"},
  {"name":"Mogielnica","code":"MGL"},{"name":"Morawica","code":"MRW"},{"name":"Niewachlów","code":"KIN"},
  {"name":"Nowa Słupia","code":"NSP"},{"name":"Oleszno","code":"OLZ"},{"name":"Ostrowiec","code":"OSC"},
  {"name":"Ostrowiec 1","code":"OSW"},{"name":"Ostrowiec GPZ2","code":"OSG"},{"name":"Ostrowiec GPZ3","code":"OST"},
  {"name":"Piaski","code":"KPK"},{"name":"Pińczów","code":"PN2"},{"name":"Pińczów 1","code":"PIN"},
  {"name":"Pionki","code":"PIO"},{"name":"Podemłynek","code":"PDN"},{"name":"Potkanów","code":"RPK"},{"name":"Radom Potkanów","code":"RPK"},
  {"name":"Promnik","code":"PRM"},{"name":"Pronit","code":"PKI"},{"name":"Przysucha","code":"PSA"},
  {"name":"Radkowice","code":"RAD"},{"name":"Radom Centralna","code":"RAC"},{"name":"Radom PDN","code":"RPD"},
  {"name":"Radom Północ","code":"RPN"},{"name":"Radom Zamłynie","code":"RAZ"},{"name":"Radzice","code":"RDC"},
  {"name":"Rożki","code":"ROZ"},{"name":"Sędziszów","code":"SDS"},{"name":"Skarżysko Południe","code":"SPD"},
  {"name":"Skarżysko Północ","code":"SPL"},{"name":"Starachowice","code":"STC"},
  {"name":"Starachowice Północ","code":"STP"},{"name":"Stawiany","code":"SAW"},{"name":"Stąporków","code":"SPK"},
  {"name":"Stopnica","code":"STN"},{"name":"Suchedniów","code":"SUW"},{"name":"Swierże","code":"SRZ"},
  {"name":"Szerzawy","code":"SZE"},{"name":"Szydłowiec","code":"SDC"},{"name":"Warka","code":"WAR"},
  {"name":"Włoszczowa","code":"WSW"},{"name":"Wolica","code":"WLI"},{"name":"Występa","code":"WSP"},
  {"name":"ZM1","code":"ZM1"},{"name":"ZM2","code":"ZM2"},{"name":"Zwoleń","code":"ZWO"}
];
const DEFAULT_REGION2 = [
  {"name":"Abramowice","code":"ABR"},{"name":"Bełżyce","code":"BEZ"},
  {"name":"Biała Podlaska Sitnicka","code":"BPS"},{"name":"Biała Podlaska Wola","code":"BPW"},
  {"name":"Biskupice","code":"BCE"},{"name":"Bogdanka","code":"BGD"},{"name":"Bronowice","code":"BRO"},
  {"name":"Budzyń","code":"BUD"},{"name":"Bursaki","code":"BUR"},{"name":"Bychawa","code":"BYH"},
  {"name":"Chruślina","code":"CHL"},{"name":"Dęblin","code":"DBL"},{"name":"Garbów","code":"GRB"},
  {"name":"Hołowczyce","code":"HWC"},{"name":"Huszlew","code":"HSL"},{"name":"Janów Podlaski","code":"JPD"},
  {"name":"Kazimierz","code":"KAZ"},{"name":"Klementowice","code":"KMT"},{"name":"Kock","code":"KCK"},
  {"name":"Kraśnik Fabryka Łożysk 1","code":"KF1"},{"name":"Kraśnik Fabryka Łożysk 2","code":"KF2"},
  {"name":"Lubartów","code":"LBT"},{"name":"Lublin Czechów","code":"LUC"},{"name":"Lublin Czuby","code":"LCB"},
  {"name":"Lublin Dziesiąta","code":"LUX"},{"name":"Lublin Elektrownia","code":"LUE"},{"name":"Lublin EC2","code":"LEC"},
  {"name":"Lublin Felin","code":"LUF"},{"name":"Lublin FSC1","code":"LF1"},{"name":"Lublin FSC2","code":"LF2"},
  {"name":"Lublin Hajdów","code":"LHA"},{"name":"Lublin Odlewnia","code":"LUO"},{"name":"Lublin Północ","code":"LPN"},
  {"name":"Lublin Systemowa","code":"LSY"},{"name":"Lublin Śródmieście","code":"LUS"},{"name":"Lublin UMCS","code":"LUN"},
  {"name":"Lublin Wschód","code":"LWS"},{"name":"Lublin Wrotków","code":"WTW"},{"name":"Łęczna","code":"LCA"},
  {"name":"Łosice","code":"LSC"},{"name":"Międzyrzec","code":"MDC"},{"name":"Nadrybie","code":"NRB"},
  {"name":"Nałęczów","code":"NAL"},{"name":"Opole Lubelskie","code":"OLE"},{"name":"Ostrów Lubelski","code":"OSL"},
  {"name":"Parczew","code":"PAR"},{"name":"Piszczac","code":"PSC"},{"name":"Poniatowa","code":"PNT"},
  {"name":"Poniatowa EDA","code":"PNE"},{"name":"Puławy Kępa","code":"PLK"},{"name":"Puławy Rudy","code":"PLW"},
  {"name":"Radzyń","code":"RAN"},{"name":"Ryki","code":"RYK"},{"name":"Stefanow","code":"STE"},
  {"name":"Świdnik","code":"SDK"},{"name":"Świdnik WSK","code":"SD2"},{"name":"Wilkołaz","code":"WLK"},
  {"name":"Wisznice","code":"WCE"},{"name":"Wólka Dobryńska","code":"WDO"},
  {"name":"Podstacja Trakcyjna PKP Niedrzwica","code":"TND"},
  {"name":"Podstacja Trakcyjna PKP Pułankowice","code":"TPU"},
  {"name":"Podstacja Trakcyjna PKP Wólka Profecka","code":"TWP"},
  {"name":"Podstacja Trakcyjna PKP Motycz","code":"TMO"},
  {"name":"PKP Motycz","code":"TMO"},
  {"name":"Podstacja Trakcyjna PKP Małaszewice","code":"TMA"},
  {"name":"Farma Wiatrowa Lubartów (Rudzienko)","code":"RDZ"},
  {"name":"Farma Wiatrowa Wisznice","code":"FWC"},
  {"name":"Farma Wiatrowa Wólka Dobryńska","code":"FWD"},
  {"name":"Farma Wiatrowa Juniewicze","code":"FJN"},
  {"name":"Farma Wiatrowa Kraśnik","code":"FKR"}
];

// ==== POMOCNICZE ====
const norm = s => s.toString().trim().toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ');
const stripSpaces = s => norm(s).replace(/\s+/g,'');
const sortChars = s => stripSpaces(s).toUpperCase().split('').sort().join('');
const shuffle = arr => { const c=[...arr]; for(let i=c.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [c[i],c[j]]=[c[j],c[i]];} return c; };
const sample = (arr,k) => shuffle(arr).slice(0, Math.min(k, arr.length));
const unique = arr => Array.from(new Set(arr.filter(v=>v!==undefined && v!==null)));

// Fuzzy / tokeny
const COMMON_WORDS = new Set(['podstacja','trakcyjna','pkp','kolej','trakcja','pt']);
const tokenize = s => norm(s).split(/[^a-z0-9]+/g).filter(Boolean);
const sigTokens = tokens => tokens.filter(t => !COMMON_WORDS.has(t) && t.length>1);

// DL z transpozycją
function damerauLevenshtein(a,b){
  a = norm(a); b=norm(b); const m=a.length,n=b.length;
  if(!m) return n; if(!n) return m;
  const dp = Array.from({length:m+1},()=>Array(n+1).fill(0));
  for(let i=0;i<=m;i++) dp[i][0]=i;
  for(let j=0;j<=n;j++) dp[0][j]=j;
  for(let i=1;i<=m;i++){
    for(let j=1;j<=n;j++){
      const cost = a[i-1]===b[j-1]?0:1;
      dp[i][j] = Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+cost);
      if(i>1 && j>1 && a[i-1]===b[j-2] && a[i-2]===b[j-1]){
        dp[i][j] = Math.min(dp[i][j], dp[i-2][j-2]+1);
      }
    }
  }
  return dp[m][n];
}
const dl = (a,b) => damerauLevenshtein(a,b);

function isCodeMatch(input, correct){
  const a = stripSpaces(input).toUpperCase();
  const b = stripSpaces(correct).toUpperCase();
  if(!a) return false;
  if(a===b) return true;
  if(a.length===b.length && sortChars(a)===sortChars(b)) return true;
  return damerauLevenshtein(a,b) <= 1;
}

function isNameMatch(input, correct){
  const A=norm(input), B=norm(correct);
  if(!A) return false;
  if(A===B) return true;
  const AT = sigTokens(tokenize(input));
  const BT = sigTokens(tokenize(correct));
  if(BT.length>0 && BT.every(t=>AT.includes(t))) return true;
  if(BT.length===1){
    const aTok=AT.join(' '), bTok=BT.join(' ');
    if(damerauLevenshtein(aTok,bTok) <= 2) return true;
  }
  const AS=stripSpaces(A), BS=stripSpaces(B);
  if(Math.abs(AS.length-BS.length)<=2 && damerauLevenshtein(AS,BS)<=2) return true;
  return false;
}

function buildCodeDistractors(correct, count, pool){
  const target=stripSpaces(correct).toUpperCase();
  const codes = unique(pool.map(x=>(x.code||'').toUpperCase())).filter(c=>c && c!==target);
  const realNear = codes.map(c=>({c, d:dl(c,target)})).filter(o=>o.d<=2).sort((a,b)=>a.d-b.d).map(o=>o.c);
  const out=[];
  for(const c of realNear){ if(out.length>=count) break; if(!out.includes(c)) out.push(c); }
  const need = Math.max(1, count - out.length);
  for(const p of genRandomPermutations(target, need*2)){ if(out.length>=count) break; if(!out.includes(p)) out.push(p); }
  if(out.length<count){
    const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for(let i=0;i<target.length && out.length<count;i++){
      const ch = alphabet[Math.floor(Math.random()*alphabet.length)];
      const v = target.slice(0,i)+ch+target.slice(i+1);
      if(v!==target && dl(v,target)<=2 && !out.includes(v)) out.push(v);
    }
  }
  while(out.length<count){
    const rnd = codes[Math.floor(Math.random()*codes.length)];
    if(rnd && !out.includes(rnd)) out.push(rnd);
  }
  return out.slice(0, count);
}
function genRandomPermutations(s,count){
  const base=s.toUpperCase(), chars=base.split(''); const out=new Set(); let guard=0;
  while(out.size<count && guard<count*20){
    guard++; const arr=[...chars];
    for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; }
    const p=arr.join(''); if(p!==base) out.add(p);
  }
  return [...out];
}
function buildNameDistractors(correctName, count, pool){
  const names = unique(pool.map(x=>x.name)).filter(n=>n && n!==correctName);
  const cTok = sigTokens(tokenize(correctName));
  const scored = names.map(n=>{
    const t=sigTokens(tokenize(n));
    const jac=(()=>{
      const A=new Set(cTok), B=new Set(t); let inter=0; for(const x of A) if(B.has(x)) inter++; const uni=new Set([...A,...B]).size; return uni? inter/uni:0;
    })();
    const d=dl(n,correctName);
    return {n, score: jac*2 - d/10};
  }).sort((a,b)=>b.score-a.score);
  const out=[]; for(const s of scored){ if(out.length>=count) break; out.push(s.n); }
  while(out.length<count){
    const rnd = names[Math.floor(Math.random()*names.length)];
    if(rnd && !out.includes(rnd)) out.push(rnd);
  }
  return out.slice(0,count);
}
function buildCodeChoices(correctCode, optsCount, pool){
  const dist = buildCodeDistractors(correctCode, Math.max(1, optsCount-1), pool);
  return shuffle(unique([correctCode, ...dist])).slice(0, optsCount);
}
function buildNameChoices(correctName, optsCount, pool){
  const dist = buildNameDistractors(correctName, Math.max(1, optsCount-1), pool);
  return shuffle(unique([correctName, ...dist])).slice(0, optsCount);
}

// ===== PODSTAWOWY MODUŁ QUIZU =====
export function mount(root){
  // WYGLĄD
  root.innerHTML = `
    <div class="module-card" id="setupCard">
      <h2>🎯 Podstawowy quiz</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">
        <label>🗺️ Region danych
          <select id="qb_region">
            <option value="r1">Region 1</option>
            <option value="r2">Region 2</option>
            <option value="both" selected>Oba regiony</option>
            <option value="all">Wszystkie (w tym niestandardowe)</option>
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
    </div>

    <div class="module-card" id="quizCard" style="display:none;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
        <div> Pytanie <span id="qb_curr">1</span>/<span id="qb_total">0</span> </div>
        <div> ✅ <span id="qb_ok">0</span> &nbsp; ❌ <span id="qb_bad">0</span> </div>
      </div>
      <div id="qb_progressWrap" style="height:10px;background:#1e293b;border-radius:6px;margin:10px 0;overflow:hidden;">
        <div id="qb_progress" style="height:10px;background:linear-gradient(90deg,#3b82f6,#22d3ee);width:0%"></div>
      </div>
      <div id="qb_stem" style="font-size:20px;font-weight:700;margin:6px 0;"></div>
      <div id="qb_answers"></div>
      <div id="qb_feedback" style="margin-top:10px;"></div>
      <div style="display:flex;justify-content:space-between;margin-top:12px;">
        <button id="qb_prev" class="secondary">← Poprzednie</button>
        <button id="qb_next">Następne →</button>
      </div>
    </div>

    <div class="module-card" id="resultCard" style="display:none;text-align:center;">
      <h2>🎉 Wynik</h2>
      <div style="font-size:42px;font-weight:800;background:linear-gradient(135deg,#3b82f6,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent;"> <span id="qb_score">0</span>% </div>
      <div id="qb_scoreDetails" class="muted" style="margin-top:6px;"></div>
      <div style="margin-top:12px;">
        <button id="qb_restart" class="success">🔄 Jeszcze raz</button>
        <button id="qb_export">📥 Eksport CSV</button>
      </div>
    </div>
  `;

  // SCOPE
  const $ = sel => root.querySelector(sel);

  // STAN
  const STATE = {
    pool: [],
    questions: [],
    review: [],
    idx: 0,
    ok: 0,
    bad: 0
  };

  // PULA wg regionu (z uwzględnieniem niestandardowych z localStorage)
  function buildPool(regionSel){
    const customs = loadCustoms(); // array of {name, code}
    if(regionSel==='r1') return [...DEFAULT_REGION1];
    if(regionSel==='r2') return [...DEFAULT_REGION2];
    if(regionSel==='both') return [...DEFAULT_REGION1, ...DEFAULT_REGION2];
    if(regionSel==='all') return [...DEFAULT_REGION1, ...DEFAULT_REGION2, ...customs];
    return [...DEFAULT_REGION1, ...DEFAULT_REGION2];
  }
  function loadCustoms(){
    try{
      const stored = localStorage.getItem('quizCustomRegions');
      if(!stored) return [];
      const obj = JSON.parse(stored); // {id:{name,data:[{name,code}]}}
      const all = [];
      Object.keys(obj).forEach(id => {
        const data = Array.isArray(obj[id].data) ? obj[id].data : [];
        data.forEach(x => { if(x && x.name && x.code) all.push({name:x.name, code:x.code}); });
      });
      return all;
    }catch{ return []; }
  }

  // GENEROWANIE PYTAŃ
  function makeQuestions(pool, modeDir, count, opts){
    const base = sample(pool, count);
    return base.map(({name, code})=>{
      // kierunek
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

  // RENDER/LOGIKA
  function showSetup(){ $('#setupCard').style.display='block'; $('#quizCard').style.display='none'; $('#resultCard').style.display='none'; }
  function showQuiz(){ $('#setupCard').style.display='none'; $('#quizCard').style.display='block'; $('#resultCard').style.display='none'; }
  function showResult(){ $('#setupCard').style.display='none'; $('#quizCard').style.display='none'; $('#resultCard').style.display='block'; }

  function renderProgress(){
    $('#qb_curr').textContent = (STATE.idx+1);
    $('#qb_total').textContent = STATE.questions.length;
    $('#qb_ok').textContent = STATE.ok;
    $('#qb_bad').textContent = STATE.bad;
    const pct = STATE.questions.length? Math.round(100*STATE.idx/STATE.questions.length) : 0;
    $('#qb_progress').style.width = pct+'%';
  }

  function renderQuestion(){
    const q = STATE.questions[STATE.idx];
    if(!q) return;
    $('#qb_stem').innerHTML = q.stem;
    $('#qb_feedback').innerHTML = '';
    const ans = $('#qb_answers'); ans.innerHTML = '';
    if(q.type==='mc'){
      q.choices.forEach(choice=>{
        const btn = document.createElement('button');
        btn.className = 'choice';
        btn.textContent = choice;
        btn.onclick = () => selectMC(q, btn, choice);
        ans.appendChild(btn);
      });
    }
    renderProgress();
  }

  function feedback(ok, html){
    $('#qb_feedback').innerHTML = `
      <div class="feedback ${ok?'success':'error'}">${html}</div>
    `;
  }

  function selectMC(q, btn, value){
    if(q._answered) return;
    q._answered = true;
    const correct = (q.expect==='code') ? isCodeMatch(value, q.correct) : isNameMatch(value, q.correct);
    if(correct){
      STATE.ok++; btn.classList.add('correct');
      feedback(true, 'Świetnie! 🎉');
    } else {
      STATE.bad++; btn.classList.add('wrong');
      feedback(false, `Niepoprawnie. Poprawna: <strong>${q.correct}</strong>`);
    }
    // review
    STATE.review[STATE.idx] = {
      question: q.stem.replace(/<[^>]*>/g,''),
      yourAnswer: value,
      correctAnswer: q.correct,
      isCorrect: !!correct
    };
    // zablokuj, pokaż poprawną
    [...$('#qb_answers').querySelectorAll('.choice')].forEach(b=>{
      b.disabled=true;
      if(norm(b.textContent)===norm(q.correct)) b.classList.add('correct');
    });
    renderProgress();
  }

  function next(){ if(STATE.idx < STATE.questions.length-1){ STATE.idx++; renderQuestion(); } else finish(); }
  function prev(){ if(STATE.idx>0){ STATE.idx--; renderQuestion(); } }

  function start(){
    const regionSel = $('#qb_region').value;
    const dir = $('#qb_dir').value;
    const opts = parseInt($('#qb_opts').value || '4', 10);
    const pool = buildPool(regionSel);

    const countInput = parseInt($('#qb_count').value || '20', 10);
    const count = Math.max(1, Math.min(countInput, pool.length));

    STATE.pool = pool;
    STATE.questions = makeQuestions(pool, dir, count, opts);
    STATE.review = [];
    STATE.idx = 0; STATE.ok = 0; STATE.bad = 0;

    showQuiz();
    renderQuestion();
  }

  function finish(){
    showResult();
    const total = STATE.questions.length;
    const pct = total? Math.round(100*STATE.ok/total) : 0;
    $('#qb_score').textContent = pct;
    $('#qb_scoreDetails').textContent = `${STATE.ok} / ${total} poprawnych`;
  }

  function exportCSV(){
    const rows = [['#','Pytanie','Twoja odpowiedź','Poprawna','Wynik']];
    STATE.review.forEach((r,i)=>{
      rows.push([i+1,r.question||'',r.yourAnswer||'',r.correctAnswer||'', r.isCorrect?'POPRAWNA':'BŁĘDNA']);
    });
    const csv = rows.map(row => row.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\r\n');
    const blob = new Blob(['\ufeff'+csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=`quiz_basic_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ZDARZENIA
  $('#qb_start').onclick = start;
  $('#qb_next').onclick = next;
  $('#qb_prev').onclick = prev;
  $('#qb_restart').onclick = ()=>{ showSetup(); };
  $('#qb_export').onclick = exportCSV;
}

// (opcjonalnie)
export function unmount(root){
  root.innerHTML = '';
}
