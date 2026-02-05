// modules/saper/index.js

export function mount(root) {
  root.innerHTML = `
    <section class="card" id="saper_menu">
      <h2>💣 Saper</h2>

      <div class="grid" style="margin-top:10px;">
        <label>Rozmiar planszy
          <select id="sap_size">
            <option value="8">8×8 (łatwy)</option>
            <option value="12" selected>12×12 (średni)</option>
            <option value="16">16×16 (trudny)</option>
          </select>
        </label>

        <label>Ilość bomb
          <input id="sap_bombs" type="number" min="5" max="150" value="20">
        </label>
      </div>

      <div style="margin-top:12px;">
        <button id="sap_start">🎮 Start</button>
      </div>

      <p class="muted" style="margin-top:8px;">PPM = flaga 🚩, LPM = odkryj pole.</p>
    </section>

    <section class="card" id="saper_game" style="display:none;">
      <div class="row" style="justify-content:space-between;align-items:center;">
        <div>⏱️ <span id="sap_time">0.0</span>s</div>
        <div>💣 <span id="sap_left">0</span></div>
      </div>

      <div id="sap_board" style="margin-top:12px; display:grid; gap:2px;"></div>

      <div style="margin-top:12px;">
        <button id="sap_back">◀️ Do menu</button>
      </div>
    </section>

    <section class="card" id="saper_end" style="display:none; text-align:center;">
      <h2 id="sap_end_title">Koniec!</h2>
      <div style="font-size:40px; font-weight:800;"><span id="sap_end_status"></span></div>
      <div class="muted" style="margin-top:6px;">Czas: <span id="sap_end_time">0.0</span>s</div>

      <div style="margin-top:12px;">
        <button id="sap_restart" class="success">🔄 Jeszcze raz</button>
      </div>
    </section>
  `;

  const $ = (sel) => root.querySelector(sel);

  const STATE = {
    size: 12,
    bombs: 20,
    board: [],
    revealed: [],
    flagged: [],
    timer: 0,
    timerId: null,
    gameOver: false,
  };

  function neighbors(x, y) {
    const dirs = [
      [-1,-1],[0,-1],[1,-1],
      [-1, 0],       [1, 0],
      [-1, 1],[0, 1],[1, 1]
    ];
    return dirs
      .map(([dx,dy]) => [x+dx, y+dy])
      .filter(([nx, ny]) => nx>=0 && ny>=0 && nx<STATE.size && ny<STATE.size);
  }

  function calcNumbers() {
    for (let y=0; y<STATE.size; y++) {
      for (let x=0; x<STATE.size; x++) {
        if (STATE.board[y][x] === "B") continue;
        const count = neighbors(x,y).filter(([nx,ny]) => STATE.board[ny][nx]==="B").length;
        STATE.board[y][x] = count;
      }
    }
  }

  function generateBoard() {
    const size = STATE.size;
    const bombs = STATE.bombs;

    STATE.board = Array.from({length:size},()=>Array(size).fill(0));
    STATE.revealed = Array.from({length:size},()=>Array(size).fill(false));
    STATE.flagged  = Array.from({length:size},()=>Array(size).fill(false));
    STATE.gameOver = false;

    let b = bombs;
    while (b>0) {
      const x = Math.floor(Math.random()*size);
      const y = Math.floor(Math.random()*size);
      if (STATE.board[y][x] !== "B") {
        STATE.board[y][x] = "B";
        b--;
      }
    }

    calcNumbers();
  }

  function startTimer() {
    STATE.timer = 0;
    if (STATE.timerId) clearInterval(STATE.timerId);
    STATE.timerId = setInterval(()=>{
      STATE.timer += 0.1;
      $("#sap_time").textContent = STATE.timer.toFixed(1);
    },100);
  }

  function stopTimer() {
    if (STATE.timerId) {
      clearInterval(STATE.timerId);
      STATE.timerId = null;
    }
  }

  function drawBoard() {
    const size = STATE.size;
    const board = $("#sap_board");
    board.style.gridTemplateColumns = `repeat(${size}, 32px)`;
    board.style.gridTemplateRows    = `repeat(${size}, 32px)`;
    board.innerHTML = "";

    for (let y=0; y<size; y++) {
      for (let x=0; x<size; x++) {
        const cell = document.createElement("div");
        cell.dataset.x = x;
        cell.dataset.y = y;
        cell.className = "sap_cell";
        cell.style.width = "32px";
        cell.style.height = "32px";
        cell.style.display = "flex";
        cell.style.alignItems = "center";
        cell.style.justifyContent = "center";
        cell.style.userSelect = "none";
        cell.style.background = "#e5e7eb";
        cell.style.border = "1px solid #cbd5e1";
        cell.style.cursor = "pointer";
        cell.style.fontWeight = "700";
        cell.style.fontSize = "18px";
        board.appendChild(cell);
      }
    }

    updateDisplay();
  }

  function updateDisplay() {
    const size = STATE.size;
    let flags = 0;

    for (let y=0; y<size; y++) {
      for (let x=0; x<size; x++) {

        const cell = $("#sap_board").children[y*size + x];
        const r = STATE.revealed[y][x];
        const f = STATE.flagged[y][x];
        const v = STATE.board[y][x];

        if (f) flags++;

        if (STATE.gameOver && v === "B") {
          cell.style.background = "#f87171";
          cell.textContent = "💣";
          continue;
        }

        if (r) {
          cell.style.background = "#f1f5f9";
          cell.style.cursor = "default";

          if (v === 0) {
            cell.textContent = "";
          } else if (v > 0) {
            cell.textContent = v;
            cell.style.color = "#1e3a8a";
          }
        } else if (f) {
          cell.textContent = "🚩";
          cell.style.background = "#fde047";
        } else {
          cell.textContent = "";
        }
      }
    }

    $("#sap_left").textContent = STATE.bombs - flags;
  }

  function reveal(x,y) {
    if (STATE.revealed[y][x] || STATE.flagged[y][x] || STATE.gameOver) return;

    STATE.revealed[y][x] = true;

    if (STATE.board[y][x] === "B") {
      // 🔥 KLUCZOWA POPRAWKA: odsłaniamy bombę
      STATE.revealed[y][x] = true;

      gameOver(false);
      updateDisplay();
      return;
    }

    if (STATE.board[y][x] === 0) {
      neighbors(x,y).forEach(([nx,ny])=>reveal(nx,ny));
    }
  }

  function checkWin() {
    for (let y=0; y<STATE.size; y++) {
      for (let x=0; x<STATE.size; x++) {
        if (STATE.board[y][x] !== "B" && !STATE.revealed[y][x]) return false;
      }
    }
    return true;
  }

  function gameOver(win) {
    STATE.gameOver = true;
    stopTimer();

    // 🔥 ODSŁONIĘCIE WSZYSTKICH BOMB
    for (let yy = 0; yy < STATE.size; yy++) {
      for (let xx = 0; xx < STATE.size; xx++) {
        if (STATE.board[yy][xx] === "B") {
          STATE.revealed[yy][xx] = true;
        }
      }
    }

    $("#sap_game").style.display = "none";
    $("#sap_end").style.display = "block";

    if (win) {
      $("#sap_end_title").textContent = "🎉 Wygrana!";
      $("#sap_end_status").textContent = "Udało się!";
    } else {
      $("#sap_end_title").textContent = "💥 Przegrana!";
      $("#sap_end_status").textContent = "Trafiona bomba!";
    }

    $("#sap_end_time").textContent = STATE.timer.toFixed(1);

    updateDisplay();
  }

  $("#sap_board").addEventListener("click", (e)=>{
    if (STATE.gameOver) return;
    const cell = e.target;
    if (!cell.dataset.x) return;
    const x = +cell.dataset.x;
    const y = +cell.dataset.y;

    reveal(x,y);
    updateDisplay();

    if (!STATE.gameOver && checkWin()) gameOver(true);
  });

  $("#sap_board").addEventListener("contextmenu", (e)=>{
    e.preventDefault();
    if (STATE.gameOver) return;
    const cell = e.target;
    if (!cell.dataset.x) return;
    const x = +cell.dataset.x;
    const y = +cell.dataset.y;

    if (!STATE.revealed[y][x]) {
      STATE.flagged[y][x] = !STATE.flagged[y][x];
    }

    updateDisplay();
  });

  $("#sap_start").onclick = () => {
    STATE.size = parseInt($("#sap_size").value);
    STATE.bombs = Math.max(5, Math.min(150, parseInt($("#sap_bombs").value)||20));

    generateBoard();
    drawBoard();
    startTimer();

    $("#saper_menu").style.display = "none";
    $("#saper_game").style.display = "block";
    $("#saper_end").style.display = "none";
  };

  $("#sap_back").onclick = () => {
    stopTimer();
    $("#saper_menu").style.display = "block";
    $("#saper_game").style.display = "none";
    $("#saper_end").style.display = "none";
  };

  $("#sap_restart").onclick = () => {
    generateBoard();
    drawBoard();
    startTimer();
    $("#saper_game").style.display = "block";
    $("#saper_end").style.display = "none";
  };
}

export function unmount(root) {
  root.innerHTML = "";
}

export default { mount, unmount };
