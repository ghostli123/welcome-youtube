const canvas = document.getElementById('game');
const nextPieceCanvas = document.getElementById('nextPiece');
const ctx = canvas.getContext('2d');
const nextCtx = nextPieceCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const linesElement = document.getElementById('lines');
const startButton = document.getElementById('start-btn');

const BLOCK_SIZE = 30;
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const COLORS = [
    '#000000',
    '#FF0000',
    '#00FF00',
    '#0000FF',
    '#FFFF00',
    '#FF00FF',
    '#00FFFF',
    '#FFA500'
];

const SHAPES = [
    [], // empty for easier indexing
    [[1, 1, 1, 1]],     // I
    [[1, 1], [1, 1]],   // O
    [[1, 1, 1], [0, 1, 0]], // T
    [[1, 1, 1], [1, 0, 0]], // L
    [[1, 1, 1], [0, 0, 1]], // J
    [[1, 1, 0], [0, 1, 1]], // S
    [[0, 1, 1], [1, 1, 0]]  // Z
];

let board = [];
let score = 0;
let lines = 0;
let level = 1;
let currentPiece = null;
let nextPiece = null;
let gameLoop = null;
let gameOver = false;
let isPaused = false;

class Piece {
    constructor(shape = null) {
        this.shape = shape || SHAPES[Math.floor(Math.random() * (SHAPES.length - 1)) + 1];
        this.color = COLORS[Math.floor(Math.random() * (COLORS.length - 1)) + 1];
        this.x = Math.floor((BOARD_WIDTH - this.shape[0].length) / 2);
        this.y = 0;
    }

    rotate() {
        const newShape = [];
        for(let i = 0; i < this.shape[0].length; i++) {
            newShape.push([]);
            for(let j = this.shape.length - 1; j >= 0; j--) {
                newShape[i].push(this.shape[j][i]);
            }
        }
        if (!this.collision(0, 0, newShape)) {
            this.shape = newShape;
        }
    }

    collision(offsetX, offsetY, shape = this.shape) {
        for(let y = 0; y < shape.length; y++) {
            for(let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const newX = this.x + x + offsetX;
                    const newY = this.y + y + offsetY;
                    if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
                        return true;
                    }
                    if (newY >= 0 && board[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
}

function createBoard() {
    board = [];
    for(let y = 0; y < BOARD_HEIGHT; y++) {
        board.push(new Array(BOARD_WIDTH).fill(0));
    }
}

function drawBlock(x, y, color, context = ctx) {
    context.fillStyle = color;
    context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
}

function drawPiece(piece, context = ctx, offsetX = 0, offsetY = 0) {
    piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                drawBlock(piece.x + x + offsetX, piece.y + y + offsetY, piece.color, context);
            }
        });
    });
}

function drawBoard() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                drawBlock(x, y, COLORS[value]);
            }
        });
    });

    if (currentPiece) {
        drawPiece(currentPiece);
    }
}

function drawNextPiece() {
    nextCtx.fillStyle = '#000';
    nextCtx.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);

    if (nextPiece) {
        const offsetX = Math.floor((3 - nextPiece.shape[0].length) / 2);
        const offsetY = Math.floor((3 - nextPiece.shape.length) / 2);
        drawPiece(nextPiece, nextCtx, offsetX + 1, offsetY + 1);
    }
}

function mergePiece() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                board[currentPiece.y + y][currentPiece.x + x] = COLORS.indexOf(currentPiece.color);
            }
        });
    });
}

function clearLines() {
    let linesCleared = 0;
    for(let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        if (board[y].every(cell => cell)) {
            board.splice(y, 1);
            board.unshift(new Array(BOARD_WIDTH).fill(0));
            linesCleared++;
            y++;
        }
    }
    if (linesCleared) {
        lines += linesCleared;
        score += linesCleared * 100 * level;
        level = Math.floor(lines / 10) + 1;
        scoreElement.textContent = score;
        levelElement.textContent = level;
        linesElement.textContent = lines;
    }
}

function newPiece() {
    currentPiece = nextPiece || new Piece();
    nextPiece = new Piece();
    drawNextPiece();

    if (currentPiece.collision(0, 0)) {
        gameOver = true;
        clearInterval(gameLoop);
        startButton.textContent = 'Game Over! Play Again?';
        startButton.disabled = false;
    }
}

function dropPiece() {
    if (!currentPiece.collision(0, 1)) {
        currentPiece.y++;
    } else {
        mergePiece();
        clearLines();
        newPiece();
    }
    drawBoard();
}

function moveLeft() {
    if (!currentPiece.collision(-1, 0)) {
        currentPiece.x--;
        drawBoard();
    }
}

function moveRight() {
    if (!currentPiece.collision(1, 0)) {
        currentPiece.x++;
        drawBoard();
    }
}

function hardDrop() {
    while (!currentPiece.collision(0, 1)) {
        currentPiece.y++;
    }
    dropPiece();
}

function handleKeyPress(event) {
    if (gameOver || isPaused) return;

    switch(event.keyCode) {
        case 37: // Left arrow
            moveLeft();
            break;
        case 39: // Right arrow
            moveRight();
            break;
        case 40: // Down arrow
            dropPiece();
            break;
        case 38: // Up arrow
            currentPiece.rotate();
            drawBoard();
            break;
        case 32: // Space
            hardDrop();
            break;
        case 80: // P key
            togglePause();
            break;
    }
}

function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        clearInterval(gameLoop);
        startButton.textContent = 'Resume';
    } else {
        gameLoop = setInterval(dropPiece, Math.max(100, 1000 - (level * 100)));
        startButton.textContent = 'Pause';
    }
}

function startGame() {
    // Reset game state
    createBoard();
    score = 0;
    lines = 0;
    level = 1;
    gameOver = false;
    isPaused = false;
    
    // Reset display
    scoreElement.textContent = '0';
    levelElement.textContent = '1';
    linesElement.textContent = '0';
    
    // Clear any existing game loop
    if (gameLoop) clearInterval(gameLoop);
    
    // Start new game
    nextPiece = new Piece();
    newPiece();
    gameLoop = setInterval(dropPiece, 1000);
    startButton.textContent = 'Pause';
}

// Event Listeners
document.addEventListener('keydown', handleKeyPress);
startButton.addEventListener('click', () => {
    if (gameOver) {
        startGame();
    } else {
        togglePause();
    }
});

// Initial setup
createBoard();
drawBoard();
