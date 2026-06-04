const size = 4;
let board = [];
let gameOver = false;
let historyMax = 0;
let winNotified = false;
let dialogOpen = false;

const gridEl = document.getElementById('grid');
const maxValueEl = document.getElementById('maxValue');
const winModal = document.getElementById('winModal');
const gameOverModal = document.getElementById('gameOverModal');
const continueBtn = document.getElementById('continueBtn');
const newGameFromWinBtn = document.getElementById('newGameFromWinBtn');
const newGameFromOverBtn = document.getElementById('newGameFromOverBtn');

function createGridCells() {
    gridEl.innerHTML = '';
    for (let i = 0; i < size * size; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.setAttribute('data-value', '0');
        gridEl.appendChild(cell);
    }
}

function hideAllDialogs() {
    winModal.style.display = 'none';
    gameOverModal.style.display = 'none';
    dialogOpen = false;
}

function showWinDialog() {
    dialogOpen = true;
    winModal.style.display = 'flex';
}

function showGameOverDialog() {
    dialogOpen = true;
    gameOverModal.style.display = 'flex';
}

function loadHistoryMax() {
    const saved = localStorage.getItem('2048_max');
    historyMax = saved ? parseInt(saved) : 0;
    maxValueEl.textContent = historyMax;
}

function saveHistoryMax(value) {
    if (value > historyMax) {
        historyMax = value;
        localStorage.setItem('2048_max', historyMax);
        maxValueEl.textContent = historyMax;
    }
}

function initBoard() {
    board = Array.from({ length: size }, () => Array(size).fill(0));
    gameOver = false;
    winNotified = false;
    addRandomTile();
    addRandomTile();
    renderBoard();
    hideAllDialogs();
}

function addRandomTile() {
    const emptyCells = [];
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (board[r][c] === 0) emptyCells.push({ r, c });
        }
    }
    if (emptyCells.length === 0) return false;
    const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    board[r][c] = Math.random() < 0.9 ? 2 : 4;
    return true;
}

function getCurrentMax() {
    let max = 0;
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (board[r][c] > max) max = board[r][c];
        }
    }
    return max;
}

function renderBoard() {
    const cells = gridEl.children;
    const oldValues = [];
    for (let i = 0; i < cells.length; i++) {
        oldValues.push(parseInt(cells[i].getAttribute('data-value')) || 0);
    }
    for (let i = 0, r = 0; r < size; r++) {
        for (let c = 0; c < size; c++, i++) {
            const val = board[r][c];
            cells[i].textContent = val === 0 ? '' : val;
            cells[i].setAttribute('data-value', val);
            if (oldValues[i] !== val) {
                cells[i].classList.add('animate');
                setTimeout(() => {
                    cells[i].classList.remove('animate');
                }, 100);
            }
        }
    }
    const currentMax = getCurrentMax();
    saveHistoryMax(currentMax);
    if (currentMax >= 2048 && !winNotified && !gameOver) {
        winNotified = true;
        showWinDialog();
        return;
    }
    if (!gameOver && isGameOver()) {
        gameOver = true;
        showGameOverDialog();
    }
}

function slideAndMerge(line) {
    let filtered = line.filter(v => v !== 0);
    for (let i = 0; i < filtered.length - 1; i++) {
        if (filtered[i] === filtered[i + 1]) {
            filtered[i] *= 2;
            filtered[i + 1] = 0;
        }
    }
    filtered = filtered.filter(v => v !== 0);
    while (filtered.length < size) filtered.push(0);
    return filtered;
}

function moveLeft() {
    let moved = false;
    for (let r = 0; r < size; r++) {
        const oldRow = [...board[r]];
        const newRow = slideAndMerge(oldRow);
        if (newRow.join(',') !== oldRow.join(',')) moved = true;
        board[r] = newRow;
    }
    return moved;
}

function moveRight() {
    let moved = false;
    for (let r = 0; r < size; r++) {
        const oldRow = [...board[r]];
        const reversed = oldRow.reverse();
        const merged = slideAndMerge(reversed);
        const newRow = merged.reverse();
        if (newRow.join(',') !== oldRow.reverse().join(',')) moved = true;
        board[r] = newRow;
    }
    return moved;
}

function moveUp() {
    let moved = false;
    for (let c = 0; c < size; c++) {
        const column = [board[0][c], board[1][c], board[2][c], board[3][c]];
        const newColumn = slideAndMerge(column);
        if (newColumn.join(',') !== column.join(',')) moved = true;
        for (let r = 0; r < size; r++) board[r][c] = newColumn[r];
    }
    return moved;
}

function moveDown() {
    let moved = false;
    for (let c = 0; c < size; c++) {
        const column = [board[3][c], board[2][c], board[1][c], board[0][c]];
        const newColumn = slideAndMerge(column);
        const finalColumn = newColumn.reverse();
        const originalColumn = [board[0][c], board[1][c], board[2][c], board[3][c]];
        if (finalColumn.join(',') !== originalColumn.join(',')) moved = true;
        for (let r = 0; r < size; r++) board[r][c] = finalColumn[r];
    }
    return moved;
}

function checkAndShowGameOver() {
    if (!gameOver && !dialogOpen && isGameOver()) {
        gameOver = true;
        showGameOverDialog();
    }
}

function move(direction) {
    if (gameOver || dialogOpen) return;
    let moved = false;
    if (direction === 'left') moved = moveLeft();
    else if (direction === 'right') moved = moveRight();
    else if (direction === 'up') moved = moveUp();
    else if (direction === 'down') moved = moveDown();
    if (moved) {
        addRandomTile();
        renderBoard();
    } else {
        checkAndShowGameOver();
    }
}

function isGameOver() {
    for (let r = 0; r < size; r++)
        for (let c = 0; c < size; c++)
            if (board[r][c] === 0) return false;
    for (let r = 0; r < size; r++)
        for (let c = 0; c < size - 1; c++)
            if (board[r][c] === board[r][c + 1]) return false;
    for (let c = 0; c < size; c++)
        for (let r = 0; r < size - 1; r++)
            if (board[r][c] === board[r + 1][c]) return false;
    return true;
}

function initGame() {
    initBoard();
}

continueBtn.addEventListener('click', () => {
    hideAllDialogs();
    if (!gameOver && isGameOver()) {
        gameOver = true;
        showGameOverDialog();
    }
});

newGameFromWinBtn.addEventListener('click', () => {
    initGame();
    hideAllDialogs();
});

newGameFromOverBtn.addEventListener('click', () => {
    initGame();
    hideAllDialogs();
});

document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', () => move(btn.dataset.dir));
});
document.getElementById('resetBtn').addEventListener('click', initGame);

window.addEventListener('keydown', (e) => {
    if (dialogOpen) {
        e.preventDefault();
        return;
    }
    const key = e.key;
    if (key === 'ArrowUp' || key === 'w' || key === 'W') { e.preventDefault(); move('up'); }
    else if (key === 'ArrowDown' || key === 's' || key === 'S') { e.preventDefault(); move('down'); }
    else if (key === 'ArrowLeft' || key === 'a' || key === 'A') { e.preventDefault(); move('left'); }
    else if (key === 'ArrowRight' || key === 'd' || key === 'D') { e.preventDefault(); move('right'); }
});

createGridCells();
loadHistoryMax();
initGame();