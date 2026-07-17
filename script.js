const boxes = document.querySelectorAll(".box");
const resultText = document.querySelector("#results");
const playAgainButton = document.querySelector("#play-again");
const undoButton = document.querySelector("#undo-move");
const resetStatsButton = document.querySelector("#reset-stats");
const turnGlow = document.querySelector(".turn-glow");
const turnBoxes = document.querySelectorAll(".turn-box");
const historyList = document.querySelector("#match-history");

const scoreElements = {
    X: document.querySelector("#x-wins"),
    O: document.querySelector("#o-wins"),
    draws: document.querySelector("#draws"),
    totalMatches: document.querySelector("#total-matches"),
    maxWins: document.querySelector("#max-wins"),
    maxLosses: document.querySelector("#max-losses"),
    bestStreak: document.querySelector("#best-streak"),
    historyCount: document.querySelector("#history-count")
};

const winConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

const emptyStats = {
    X: 0,
    O: 0,
    draws: 0,
    currentStreakPlayer: "",
    currentStreak: 0,
    bestStreak: 0,
    history: []
};

let board = Array(9).fill("");
let moveStack = [];
let turn = "X";
let isGameOver = false;
let stats = loadStats();

boxes.forEach((box, index) => {
    box.addEventListener("click", () => makeMove(index));
});

playAgainButton.addEventListener("click", startNewMatch);
undoButton.addEventListener("click", undoMove);
resetStatsButton.addEventListener("click", resetStats);

renderBoard();
renderStats();
updateTurnUI();
updateControls();

function makeMove(index) {
    if (isGameOver || board[index]) {
        return;
    }

    board[index] = turn;
    moveStack.push(index);
    renderBoard();

    const winLine = findWinLine();

    if (winLine) {
        finishGame(turn, winLine);
        return;
    }

    if (board.every(Boolean)) {
        finishGame("Draw");
        return;
    }

    turn = turn === "X" ? "O" : "X";
    resultText.textContent = `${turn}'s turn`;
    updateTurnUI();
    updateControls();
}

function finishGame(result, winLine = []) {
    isGameOver = true;

    if (result === "Draw") {
        stats.draws += 1;
        stats.currentStreakPlayer = "";
        stats.currentStreak = 0;
        resultText.textContent = "Match Drawn";
    } else {
        stats[result] += 1;
        updateStreak(result);
        resultText.textContent = `${result} wins the match`;
        winLine.forEach(index => boxes[index].classList.add("winner"));
    }

    addHistory(result);
    saveStats();
    renderStats();
    updateControls();
}

function findWinLine() {
    return winConditions.find(condition => {
        const [first, second, third] = condition;
        return board[first] && board[first] === board[second] && board[first] === board[third];
    });
}

function updateStreak(player) {
    if (stats.currentStreakPlayer === player) {
        stats.currentStreak += 1;
    } else {
        stats.currentStreakPlayer = player;
        stats.currentStreak = 1;
    }

    stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
}

function addHistory(result) {
    const matchNumber = stats.X + stats.O + stats.draws;
    const moves = moveStack.length;
    const message = result === "Draw" ? "Draw" : `${result} defeated ${result === "X" ? "O" : "X"}`;

    stats.history.unshift({
        matchNumber,
        result,
        message,
        moves,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    });

    stats.history = stats.history.slice(0, 10);
}

function undoMove() {
    if (isGameOver || moveStack.length === 0) {
        return;
    }

    const lastMove = moveStack.pop();
    board[lastMove] = "";
    turn = turn === "X" ? "O" : "X";
    resultText.textContent = `${turn}'s turn`;
    renderBoard();
    updateTurnUI();
    updateControls();
}

function startNewMatch() {
    board = Array(9).fill("");
    moveStack = [];
    turn = "X";
    isGameOver = false;
    resultText.textContent = "X starts the match";
    renderBoard();
    updateTurnUI();
    updateControls();
}

function resetStats() {
    stats = { ...emptyStats, history: [] };
    saveStats();
    renderStats();
}

function renderBoard() {
    boxes.forEach((box, index) => {
        box.textContent = board[index];
        box.className = "box";

        if (board[index]) {
            box.classList.add(board[index].toLowerCase());
        }
    });
}

function renderStats() {
    const xLosses = stats.O;
    const oLosses = stats.X;
    const maxWins = Math.max(stats.X, stats.O);
    const maxLosses = Math.max(xLosses, oLosses);

    scoreElements.X.textContent = stats.X;
    scoreElements.O.textContent = stats.O;
    scoreElements.draws.textContent = stats.draws;
    scoreElements.totalMatches.textContent = stats.X + stats.O + stats.draws;
    scoreElements.maxWins.textContent = maxWins;
    scoreElements.maxLosses.textContent = maxLosses;
    scoreElements.bestStreak.textContent = stats.bestStreak;
    scoreElements.historyCount.textContent = stats.history.length;

    historyList.innerHTML = stats.history.length
        ? stats.history.map(match => `
            <li class="${match.result.toLowerCase()}">
                <strong>#${match.matchNumber} ${match.message}</strong>
                <span>${match.moves} moves at ${match.time}</span>
            </li>
        `).join("")
        : `<li class="empty-history"><strong>No matches yet</strong><span>Play to build history</span></li>`;
}

function updateTurnUI() {
    turnGlow.style.transform = turn === "X" ? "translateX(0)" : "translateX(100%)";

    turnBoxes.forEach(box => {
        box.classList.toggle("active", box.dataset.player === turn);
    });
}

function updateControls() {
    undoButton.disabled = isGameOver || moveStack.length === 0;
    playAgainButton.textContent = isGameOver ? "Play Again" : "Restart";
}

function loadStats() {
    const savedStats = localStorage.getItem("neonTicTacToeStats");

    if (!savedStats) {
        return { ...emptyStats, history: [] };
    }

    try {
        return { ...emptyStats, ...JSON.parse(savedStats) };
    } catch {
        return { ...emptyStats, history: [] };
    }
}

function saveStats() {
    localStorage.setItem("neonTicTacToeStats", JSON.stringify(stats));
}
