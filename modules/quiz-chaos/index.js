import {
  DEFAULT_REGION1,
  DEFAULT_REGION2,
  norm,
  isNameMatch,
  isCodeMatch,
  sample,
  loadCustomRegionData
} from "../../shared/shared-logic.js";

export function mount(root){

  root.innerHTML = `
    <section class="card" id="chaosSetup">
      <h2>🌀 Tryb CHAOS</h2>

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
            <option value="name2code">Nazwa → skrót</option>
            <option value="code2name">Skrót → nazwa</option>
            <option value="mixed" selected>Losowo (mieszane)</option>
          </select>
        </label>

        <label>⏱️ Czas startowy (sekundy)
          <input id="ch_time" type="number" value="10" min="3" max="120">
        </label>
      </div>

      <div style="margin-top:12px;">
        <button id="ch_start">🚀 Start</button>
      </div>
    </section>


    <section class="card" id="chaosGame" style="display:none; text-align:center;">
      <div id="ch_timer" style="font-size:48px;font-weight:800;color:var(--accent);">10.0</div>

      <div style="margin-top:16px; font-size:22px; font-weight:700;">
        <div id="ch_stem"></div>
      </div>

      <input id="ch_answer" class="big-input"
        placeholder="Twoja odpowiedź... (ENTER = zatwierdź)"
        autocomplete="off" />

      <div id="ch_feedback" style="margin-top:10px;"></div>
    </section>


    <section class="card" id="chaosEnd" style="display:none;text-align:center;">
      <h2>⏳ Koniec czasu!</h2>
      <div style="font-size:48px;font-weight:800;">
        Wynik: <span id="ch_total"></span>
      </div>

      <div style="margin-top:12px;">
        <button id="ch_restart" class="success">🔄 Jeszcze raz</button>
      </div>
    </section>
  `;

  const $ = sel => root.querySelector(sel);

  const STATE = {
    pool: [],
    dir: "mixed",
    total: 0,
    current: null,
    time: 10,
    timerID: null
  };

  function uniqueByCode(arr){
    const map=new Map();
    arr.forEach(x=>{
      if(x?.code && !map.has(x.code)) map.set(x.code, x);
    });
    return [...map.values()];
  }

  function buildPool(regionSel){
    const customs = loadCustomRegionData();
    let data = [];

    if(regionSel==='r1')   data=[...DEFAULT_REGION1];
    if(regionSel==='r2')   data=[...DEFAULT_REGION2];
    if(regionSel==='both') data=[...DEFAULT_REGION1,...DEFAULT_REGION2];
    if(regionSel==='all')  data=[...DEFAULT_REGION1,...DEFAULT_REGION2,...customs];

    return uniqueByCode(data);
  }

  function pickQuestion(){
    const item = STATE.pool[Math.floor(Math.random()*STATE.pool.length)];
    const dir = (STATE.dir === 'mixed')
      ? (Math.random() < 0.5 ? 'name2code' : 'code2name')
      : STATE.dir;

    if(dir === 'name2code'){
      return {
        type: "code",
        stem: `Jaki skrót ma stacja <strong>${item.name}</strong>?`,
        correct: item.code
      };
    } else {
      return {
        type: "name",
        stem: `Jaka nazwa odpowiada skrótowi <code>${item.code}</code>?`,
        correct: item.name
      };
    }
  }

  function renderQuestion(){
    STATE.current = pickQuestion();
    $('#ch_stem').innerHTML = STATE.current.stem;
    $('#ch_answer').value = "";
    $('#ch_feedback').innerHTML = "";
    $('#ch_answer').focus();
  }

  function checkAnswer(){
    const val = $('#ch_answer').value.trim();
    if(!val) return;

    const q = STATE.current;
    const ok = q.type === "code"
      ? isCodeMatch(val, q.correct)
      : isNameMatch(val, q.correct);

    if(ok){
      STATE.time += 0.75;
      STATE.total++;
      $('#ch_feedback').innerHTML = `<span style="color:var(--green)">✔ +0,75 s</span>`;
    } else {
      STATE.time -= 0.50;
      $('#ch_feedback').innerHTML = `<span style="color:var(--red)">✖ -0,50 s<br>Poprawna: ${q.correct}</span>`;
    }

    renderQuestion();
  }

  function tick(){
    STATE.time -= 0.1;
    if(STATE.time <= 0){
      STATE.time = 0;
      endGame();
      return;
    }
    $('#ch_timer').textContent = STATE.time.toFixed(1);
  }

  function startGame(){
    STATE.pool = buildPool($('#ch_region').value);
    STATE.dir  = $('#ch_dir').value;
    STATE.time = parseFloat($('#ch_time').value) || 10;
    STATE.total = 0;

    $('#chaosSetup').style.display='none';
    $('#chaosGame').style.display='block';
    $('#chaosEnd').style.display='none';

    renderQuestion();

    if(STATE.timerID) clearInterval(STATE.timerID);
    STATE.timerID = setInterval(tick, 100);
  }

  function endGame(){
    clearInterval(STATE.timerID);
    $('#chaosGame').style.display='none';
    $('#chaosEnd').style.display='block';
    $('#ch_total').textContent = STATE.total;
  }

  $('#ch_start').onclick = startGame;
  $('#ch_answer').addEventListener('keydown', e => {
    if(e.key === "Enter") checkAnswer();
  });
  $('#ch_restart').onclick = ()=>location.reload();
}

export function unmount(root){ root.innerHTML=''; }
