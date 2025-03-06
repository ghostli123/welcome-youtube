const gameArea = document.getElementById('game-area');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const startButton = document.getElementById('start-btn');
const levelElement = document.getElementById('level');
const multiplierElement = document.getElementById('multiplier');
const currentLevelElement = document.getElementById('current-level');

let score = 0;
let timeLeft = 30;
let gameInterval;
let targetInterval;
let gameActive = false;
let level = 1;
let scoreMultiplier = 1;
let targets = [];

const TARGET_TYPES = {
    NORMAL: { class: 'normal', points: 1, probability: 0.6 },
    BONUS: { class: 'bonus', points: 3, probability: 0.2 },
    SPEED: { class: 'speed', points: 2, probability: 0.15 },
    PENALTY: { class: 'penalty', points: -2, probability: 0.05 }
};

function createTarget() {
    if (!gameActive) return;

    const target = document.createElement('div');
    target.className = 'target';
    
    // Determine target type based on probabilities
    const rand = Math.random();
    let type;
    if (rand < TARGET_TYPES.NORMAL.probability) {
        type = TARGET_TYPES.NORMAL;
    } else if (rand < TARGET_TYPES.NORMAL.probability + TARGET_TYPES.BONUS.probability) {
        type = TARGET_TYPES.BONUS;
    } else if (rand < TARGET_TYPES.NORMAL.probability + TARGET_TYPES.BONUS.probability + TARGET_TYPES.SPEED.probability) {
        type = TARGET_TYPES.SPEED;
    } else {
        type = TARGET_TYPES.PENALTY;
    }
    
    target.classList.add(type.class);
    target.dataset.points = type.points;
    
    const maxX = gameArea.clientWidth - 40;
    const maxY = gameArea.clientHeight - 40;
    const randomX = Math.floor(Math.random() * maxX);
    const randomY = Math.floor(Math.random() * maxY);
    
    target.style.left = randomX + 'px';
    target.style.top = randomY + 'px';
    
    if (type === TARGET_TYPES.SPEED) {
        moveTargetRandomly(target);
    }
    
    target.addEventListener('click', () => targetClicked(target));
    gameArea.appendChild(target);
    targets.push(target);
    
    // Remove target after random time if not clicked
    setTimeout(() => {
        if (target.parentNode === gameArea) {
            gameArea.removeChild(target);
            targets = targets.filter(t => t !== target);
        }
    }, 2000 - (level * 100));
}

function moveTargetRandomly(target) {
    const move = () => {
        if (!gameActive || !target.parentNode) return;
        
        const maxX = gameArea.clientWidth - 40;
        const maxY = gameArea.clientHeight - 40;
        const newX = Math.floor(Math.random() * maxX);
        const newY = Math.floor(Math.random() * maxY);
        
        target.style.left = newX + 'px';
        target.style.top = newY + 'px';
        
        setTimeout(move, 1000);
    };
    move();
}

function targetClicked(target) {
    if (!gameActive) return;
    
    const points = parseInt(target.dataset.points);
    score += points * scoreMultiplier;
    scoreElement.textContent = score;
    
    // Special effects based on target type
    if (target.classList.contains('bonus')) {
        activateScoreMultiplier();
    } else if (target.classList.contains('speed')) {
        addExtraTime();
    }
    
    gameArea.removeChild(target);
    targets = targets.filter(t => t !== target);
    
    checkLevelProgress();
}

function activateScoreMultiplier() {
    scoreMultiplier = 2;
    multiplierElement.textContent = 'x2';
    const powerUpIndicator = document.createElement('div');
    powerUpIndicator.className = 'power-up-active';
    powerUpIndicator.textContent = '2x Score!';
    gameArea.appendChild(powerUpIndicator);
    
    setTimeout(() => {
        scoreMultiplier = 1;
        multiplierElement.textContent = 'x1';
        if (powerUpIndicator.parentNode) {
            gameArea.removeChild(powerUpIndicator);
        }
    }, 5000);
}

function addExtraTime() {
    timeLeft += 3;
    timerElement.textContent = timeLeft;
}

function checkLevelProgress() {
    if (score >= level * 10) {
        level++;
        levelElement.textContent = level;
        currentLevelElement.textContent = level;
        // Increase target spawn rate with level
        clearInterval(targetInterval);
        targetInterval = setInterval(createTarget, Math.max(500, 1000 - (level * 50)));
    }
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
    
    // Reset game state
    gameActive = true;
    score = 0;
    timeLeft = 30;
    level = 1;
    scoreMultiplier = 1;
    targets.forEach(target => target.remove());
    targets = [];
    
    // Reset display elements
    scoreElement.textContent = score;
    timerElement.textContent = timeLeft;
    levelElement.textContent = level;
    currentLevelElement.textContent = level;
    multiplierElement.textContent = 'x1';
    
    startButton.textContent = 'Game In Progress';
    startButton.disabled = true;
    
    // Start game intervals
    gameInterval = setInterval(updateTimer, 1000);
    targetInterval = setInterval(createTarget, 1000);
}

function endGame() {
    gameActive = false;
    clearInterval(gameInterval);
    clearInterval(targetInterval);
    startButton.textContent = 'Play Again';
    startButton.disabled = false;
    
    // Remove all remaining targets
    targets.forEach(target => target.remove());
    targets = [];
    
    const message = `Game Over!\nFinal Score: ${score}\nLevel Reached: ${level}`;
    setTimeout(() => alert(message), 100);
}

startButton.addEventListener('click', startGame);