const target = document.getElementById('target');
const gameArea = document.getElementById('game-area');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const startButton = document.getElementById('start-btn');

let score = 0;
let timeLeft = 30;
let gameInterval;
let gameActive = false;

function moveTarget() {
    const maxX = gameArea.clientWidth - target.clientWidth;
    const maxY = gameArea.clientHeight - target.clientHeight;
    
    const randomX = Math.floor(Math.random() * maxX);
    const randomY = Math.floor(Math.random() * maxY);
    
    target.style.left = randomX + 'px';
    target.style.top = randomY + 'px';
}

function updateTimer() {
    timerElement.textContent = timeLeft;
    if (timeLeft <= 0) {
        endGame();
    }
    timeLeft--;
}

function startGame() {
    if (gameActive) return;
    
    gameActive = true;
    score = 0;
    timeLeft = 30;
    scoreElement.textContent = score;
    timerElement.textContent = timeLeft;
    
    startButton.textContent = 'Game In Progress';
    startButton.disabled = true;
    
    moveTarget();
    gameInterval = setInterval(() => {
        updateTimer();
    }, 1000);
}

function endGame() {
    gameActive = false;
    clearInterval(gameInterval);
    startButton.textContent = 'Play Again';
    startButton.disabled = false;
    alert(`Game Over! Your score: ${score}`);
}

target.addEventListener('click', () => {
    if (!gameActive) return;
    
    score++;
    scoreElement.textContent = score;
    moveTarget();
});

startButton.addEventListener('click', startGame);

// Initial target position
moveTarget();