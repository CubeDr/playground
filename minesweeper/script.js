document.addEventListener('DOMContentLoaded', () => {
  let board = [];
  let mines = 10;
  let minesLeft = mines;
  let time = 0;
  let timer;
  let isGameStarted = false;
  let isGameOver = false;
  let width, height;

  const boardElement = document.getElementById('game-board');
  const minesLeftElement = document.getElementById('mines-left');
  const timeElement = document.getElementById('time');

  // 난이도 수준 버튼
  const beginnerBtn = document.getElementById('beginner');
  const intermediateBtn = document.getElementById('intermediate');
  const advancedBtn = document.getElementById('advanced');

  beginnerBtn.addEventListener('click', () => startGame('beginner'));
  intermediateBtn.addEventListener('click', () => startGame('intermediate'));
  advancedBtn.addEventListener('click', () => startGame('advanced'));

  function startGame(level) {
    if (level === 'beginner') {
      width = 9;
      height = 9;
      mines = 10;
    } else if (level === 'intermediate') {
      width = 16;
      height = 16;
      mines = 40;
    } else if (level === 'advanced') {
      width = 30;
      height = 16;
      mines = 99;
    }
    minesLeft = mines;
    resetGame();
  }

  function resetGame() {
    clearInterval(timer);
    time = 0;
    isGameStarted = false;
    isGameOver = false;
    board = [];
    minesLeftElement.textContent = String(minesLeft).padStart(3, '0');
    timeElement.textContent = String(time).padStart(3, '0');
    createBoard();
  }

  function createBoard() {
    boardElement.innerHTML = '';
    board = [];

    // 빈 보드 생성
    for (let i = 0; i < height; i++) {
      const row = [];
      for (let j = 0; j < width; j++) {
        const cell = {
          isRevealed: false,
          isMine: false,
          isFlagged: false,
          adjacentMines: 0,
        };
        row.push(cell);
      }
      board.push(row);
    }

    // 지뢰 심기
    let minesPlanted = 0;
    while (minesPlanted < mines) {
      const x = Math.floor(Math.random() * height);
      const y = Math.floor(Math.random() * width);
      if (!board[x][y].isMine) {
        board[x][y].isMine = true;
        minesPlanted++;
      }
    }

    // 인접 지뢰 수 계산
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        if (!board[i][j].isMine) {
          board[i][j].adjacentMines = countAdjacentMines(i, j);
        }
      }
    }

    // HTML 테이블 생성
    for (let i = 0; i < height; i++) {
      const rowElement = boardElement.insertRow();
      for (let j = 0; j < width; j++) {
        const cellElement = rowElement.insertCell();
        cellElement.addEventListener('click', () => handleClick(i, j));
        cellElement.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          handleRightClick(i, j);
        });
        cellElement.addEventListener('mousedown', (e) => {
          if (e.button === 1) {
            handleWheelClick(i, j);
          }
        });
      }
    }
  }

  function countAdjacentMines(x, y) {
    let count = 0;
    for (let i = x - 1; i <= x + 1; i++) {
      for (let j = y - 1; j <= y + 1; j++) {
        if (i >= 0 && i < height && j >= 0 && j < width && board[i][j].isMine) {
          count++;
        }
      }
    }
    return count;
  }

  function handleClick(x, y) {
    if (isGameOver) return;
    if (!isGameStarted) {
      startTimer();
      isGameStarted = true;
    }
    const cell = board[x][y];
    if (cell.isRevealed || cell.isFlagged) return;
    if (cell.isMine) {
      gameOver();
    } else {
      revealCell(x, y);
    }
  }

  function handleRightClick(x, y) {
    if (isGameOver) return;
    if (!isGameStarted) {
      startTimer();
      isGameStarted = true;
    }
    const cell = board[x][y];
    if (cell.isRevealed) return;
    if (!cell.isFlagged) {
      if (minesLeft > 0) {
        cell.isFlagged = true;
        minesLeft--;
        updateCellDisplay(x, y);
      }
    } else {
      cell.isFlagged = false;
      minesLeft++;
      updateCellDisplay(x, y);
    }
    minesLeftElement.textContent = String(minesLeft).padStart(3, '0');
  }

  function handleWheelClick(x, y) {
    if (isGameOver) return;
    const cell = board[x][y];
    if (!cell.isRevealed) return;

    const adjacentFlags = countAdjacentFlags(x, y);
    if (adjacentFlags === cell.adjacentMines) {
      for (let i = x - 1; i <= x + 1; i++) {
        for (let j = y - 1; j <= y + 1; j++) {
          if (i >= 0 && i < height && j >= 0 && j < width) {
            if (!board[i][j].isRevealed && !board[i][j].isFlagged) {
              revealCell(i, j);
            }
          }
        }
      }
    }
  }

  function countAdjacentFlags(x, y) {
    let count = 0;
    for (let i = x - 1; i <= x + 1; i++) {
      for (let j = y - 1; j <= y + 1; j++) {
        if (
          i >= 0 &&
          i < height &&
          j >= 0 &&
          j < width &&
          board[i][j].isFlagged
        ) {
          count++;
        }
      }
    }
    return count;
  }

  function revealCell(x, y) {
    const cell = board[x][y];
    if (cell.isRevealed || cell.isFlagged) return;
    cell.isRevealed = true;
    updateCellDisplay(x, y);
    if (cell.adjacentMines === 0) {
      for (let i = x - 1; i <= x + 1; i++) {
        for (let j = y - 1; j <= y + 1; j++) {
          if (i >= 0 && i < height && j >= 0 && j < width) {
            revealCell(i, j);
          }
        }
      }
    }
    checkWinCondition();
  }

  function updateCellDisplay(x, y) {
    const cellElement = boardElement.rows[x].cells[y];
    const cell = board[x][y];

    if (cell.isFlagged) {
      cellElement.textContent = '🚩';
      cellElement.classList.add('flagged');
    } else if (cell.isRevealed) {
      cellElement.classList.remove('hidden');
      cellElement.classList.add('revealed');
      if (cell.isMine) {
        cellElement.textContent = '💣';
        cellElement.classList.add('mine');
      } else if (cell.adjacentMines > 0) {
        cellElement.textContent = cell.adjacentMines;
      }
    } else {
      cellElement.textContent = '';
      cellElement.classList.remove('flagged');
    }
  }

  function startTimer() {
    clearInterval(timer);
    timer = setInterval(() => {
      time++;
      timeElement.textContent = String(time).padStart(3, '0');
    }, 1000);
  }

  function gameOver() {
    isGameOver = true;
    clearInterval(timer);
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        if (board[i][j].isMine) {
          revealCell(i, j);
        }
      }
    }
    alert('Game Over! You hit a mine.');
  }

  function checkWinCondition() {
    let nonMineCells = 0;
    let revealedNonMineCells = 0;

    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        if (!board[i][j].isMine) {
          nonMineCells++;
          if (board[i][j].isRevealed) {
            revealedNonMineCells++;
          }
        }
      }
    }

    if (nonMineCells === revealedNonMineCells) {
      isGameOver = true;
      clearInterval(timer);
      alert(`You win in ${time} seconds!`);
    }
  }

  // 게임을 초보자 수준으로 초기화
  startGame('beginner');
});
