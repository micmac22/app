// modules/saper/index.js

export function mount(root) {
  // ——— Jednorazowe style (wygląd pól: normal, revealed, flag, bomb) ———
  if (!document.getElementById("saperStyles")) {
    const style = document.createElement("style");
    style.id = "saperStyles";
    style.textContent = `
      .sap_grid { display:grid; gap:2px; }

      .sap_cell {
        width: 32px; height: 32px;
        display:flex; align-items:center; justify-content:center;
        user-select:none; cursor:pointer; font-weight:700; font-size:17px;
        background:#e5e7eb;
        border:1px solid #cbd5e1;
        box-shadow: 0 1px 0 #ffffff80 inset, 0 -1px 0 #0000000d inset; /* lekkie uwypuklenie */
        transition: background .12s, box-shadow .12s, color .12s;
      }
      .sap_cell:hover { filter: brightness(1.05); }

      .sap_cell--revealed {
        background:#f1f5f9;
        cursor:default;
        box-shadow: inset 0 2px 2px rgba(0,0,0,.08); /* wciśnięte */
      }
      .sap_cell--flag {
        background:#fde047;
      }
      .sap_cell--bomb {
        background:#f87171; color:#111;
      }
      /* Kolory cyfr jak w klasycznym Saperze */
      .num-1 { color:#1d4ed8; } /* niebieski */
      .num-2 { color:#15803d; } /* zielony */
      .num-3 { color:#b91c1c; } /* czerwony */
      .num-4 { color:#1e3a8a; } /* ciemny nieb. */
      .num-5 { color:#4b5563; } /* szary */
      .num-6 { color:#0e7490; } /* cyjan */
      .num-7 { color:#7c3aed; } /* fiolet */
      .num-8 { color:#111827; } /* prawie czarny */
    `;
    document.head.appendChild(style);
  }

  // ——— UI ———
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

      <div id="sap_board" class="sap_grid" style="margin-top:12px;"></div>

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

  // ——— Helper selektor ———
  const $ = (sel) => root.querySelector(sel);

  // Cache elementów (unikamy pomyłek w id + null guard)
  const elMenu  = $("#saper_menu");
  const elGame  = $("#saper_game");
  const elEnd   = $("#saper_end");
  const elBoard = $("#sap_board");
  const elTime  = $("#sap_time");
  const elLeft  = $("#sap_left");
  const elStart = $("#sap_start");
  const elBack  = $("#sap_back");
  const elRestart = $("#sap_restart");
  const elEndTitle  = $("#sap_end_title");
  const elEndStatus = $("#sap_end_status");
  const elEndTime   = $("#sap_end_time");

  const STATE = {
    size: 12,
    bombs: 20,
    board: [],        // 2D: "B" | number
    revealed: [],     // 2D: bool
    flagged: [],      // 2D: bool
    firstClick: true, // generowanie bomb dopiero przy pierwszym kliknięciu
    timer: 0,
    timerId: null,
    gameOver: false,
  };

  // ——— Logika ———

  function initEmptyBoard() {
    STATE.board   = Array.from({ length: STATE.size }, () => Array(STATE.size).fill(0));
    STATE.revealed= Array.from({ length: STATE.size }, () => Array(STATE.size).fill(false));
    STATE.flagged = Array.from({ length: STATE.size }, () => Array(STATE.size).fill(false));
  }

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
        const count = neighbors(x,y).filter(([nx,ny]) => STATE.board[ny][nx] === "B").length;
        STATE.board[y][x] = count;
      }
    }
  }

  // Generowanie bomb po pierwszym kliknięciu (safeX, safeY nie może mieć bomby)
  function generateBoard(safeX, safeY) {
    // start od pustej
    initEmptyBoard();

    let b = STATE.bombs;
    while (b > 0) {
      const x = Math.floor(Math.random() * STATE.size);
      const y = Math.floor(Math.random() * STATE.size);
      if (x === safeX && y === safeY) continue;     // pierwsze kliknięcie bezpieczne
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
      if (elTime) elTime.textContent = STATE.timer.toFixed(1);
    },100);
  }

  function stopTimer() {
    if (STATE.timerId) {
      clearInterval(STATE.timerId);
      STATE.timerId = null;
    }
  }

  function drawBoard() {
    if (!elBoard) return;
    elBoard.style.gridTemplateColumns = `repeat(${STATE.size}, 32px)`;
    elBoard.innerHTML = "";

    for (let y=0; y<STATE.size; y++) {
      for (let x=0; x<STATE.size; x++) {
        const cell = document.createElement("div");
        cell.dataset.x = x;
        cell.dataset.y = y;
        cell.className = "sap_cell";
        elBoard.appendChild(cell);
      }
    }
    updateDisplay();
  }

  function updateDisplay() {
    if (!elBoard) return;

    let flags = 0;

    for (let y=0; y<STATE.size; y++) {
      for (let x=0; x<STATE.size; x++) {
        const cell = elBoard.children[y*STATE.size + x];
        if (!cell) continue;

        const r = STATE.revealed[y]?.[x] ?? false;
        const f = STATE.flagged[y]?.[x] ?? false;
        const v = STATE.board[y]?.[x];

        // Reset klas
        cell.className = "sap_cell";
        cell.textContent = "";

        if (f) flags++;

        if (STATE.gameOver && v === "B") {
          cell.classList.add("sap_cell--bomb");
          cell.textContent = "💣";
          continue;
        }

        if (r) {
          cell.classList.add("sap_cell--revealed");
          if (v && v !== 0 && v !== "B") {
            cell.textContent = String(v);
            cell.classList.add(`num-${v}`);
          }
        } else if (f) {
          cell.classList.add("sap_cell--flag");
          cell.textContent = "🚩";
        }
      }
    }

    if (elLeft) elLeft.textContent = Math.max(0, STATE.bombs - flags);
  }

  function reveal(x,y) {
    if (STATE.revealed[y][x] || STATE.flagged[y][x] || STATE.gameOver) return;

    // Pierwszy klik: rozkładamy bomby z wykluczeniem klikniętego pola
    if (STATE.firstClick) {
      STATE.firstClick = false;
      generateBoard(x, y);
    }

    STATE.revealed[y][x] = true;

    // Trafiona bomba po pierwszym kliknięciu nie jest możliwa (safe first),
    // ale na wszelki wypadek:
    if (STATE.board[y][x] === "B") {
      gameOver(false);
      return;
    }

    if (STATE.board[y][x] === 0) {
      neighbors(x,y).forEach(([nx,ny]) => reveal(nx,ny));
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

    // Odsłoń wszystkie bomby
    for (let y=0; y<STATE.size; y++) {
      for (let x=0; x<STATE.size; x++) {
        if (STATE.board[y][x] === "B") {
          STATE.revealed[y][x] = true;
        }
      }
    }

    // Ekrany – null‑safe (błąd, który widziałeś, wynikał z błędnego id)
    if (elGame) elGame.style.display = "none";
    if (elEnd)  elEnd.style.display  = "block";

    if (elEndTitle && elEndStatus && elEndTime) {
      if (win) {
        elEndTitle.textContent  = "🎉 Wygrana!";
        elEndStatus.textContent = "Udało się!";
      } else {
        elEndTitle.textContent  = "💥 Przegrana!";
        elEndStatus.textContent = "Trafiłeś bombę!";
      }
      elEndTime.textContent = STATE.timer.toFixed(1);
    }

    updateDisplay();
  }

  // ——— Zdarzenia ———

  if (elBoard) {
    elBoard.addEventListener("click", (e)=>{
      if (STATE.gameOver) return;
      const cell = e.target;
      if (!cell || cell.dataset.x === undefined) return;
      const x = +cell.dataset.x, y = +cell.dataset.y;

      reveal(x,y);
      updateDisplay();

      if (!STATE.gameOver && checkWin()) gameOver(true);
    });

    elBoard.addEventListener("contextmenu", (e)=>{
      e.preventDefault();
      if (STATE.gameOver) return;
      const cell = e.target;
      if (!cell || cell.dataset.x === undefined) return;
      const x = +cell.dataset.x, y = +cell.dataset.y;

      if (!STATE.revealed[y][x]) {
        STATE.flagged[y][x] = !STATE.flagged[y][x];
      }
      updateDisplay();
    });
  }

  if (elStart) {
    elStart.onclick = () => {
      STATE.size  = Math.max(2, parseInt($("#sap_size").value, 10) || 12);
      STATE.bombs = Math.max(1, Math.min(STATE.size*STATE.size - 1, parseInt($("#sap_bombs").value, 10) || 20));

      STATE.firstClick = true;
      STATE.gameOver   = false;

      initEmptyBoard();
      drawBoard();
      startTimer();

      if (elMenu) elMenu.style.display = "none";
      if (elGame) elGame.style.display = "block";
      if (elEnd)  elEnd.style.display  = "none";
      if (elLeft) elLeft.textContent   = String(STATE.bombs);
      if (elTime) elTime.textContent   = "0.0";
    };
  }

  if (elBack) {
    elBack.onclick = () => {
      stopTimer();
      if (elMenu) elMenu.style.display = "block";
      if (elGame) elGame.style.display = "none";
      if (elEnd)  elEnd.style.display  = "none";
    };
  }

  if (elRestart) {
    elRestart.onclick = () => {
      STATE.firstClick = true;
      STATE.gameOver   = false;
      initEmptyBoard();
      drawBoard();
      startTimer();

      if (elGame) elGame.style.display = "block";
      if (elEnd)  elEnd.style.display  = "none";
      if (elLeft) elLeft.textContent   = String(STATE.bombs);
      if (elTime) elTime.textContent   = "0.0";
    };
  }
}

export function unmount(root) {
  root.innerHTML = "";
}

export default { mount, unmount };
