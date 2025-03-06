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
    null,  // no piece
    '#FF0000',  // I piece - red
    '#00FF00',  // O piece - green
    '#0000FF',  // T piece - blue
    '#FFFF00',  // L piece - yellow
    '#FF00FF',  // J piece - magenta
    '#00FFFF',  // S piece - cyan
    '#FFA500'   // Z piece - orange
];

const SHAPES = [
    null,  // no piece
    [[1, 1, 1, 1]],     // I
    [[1, 1], [1, 1]],   // O
    [[0, 1, 0], [1, 1, 1]], // T
    [[0, 0, 1], [1, 1, 1]], // L
    [[1, 0, 0], [1, 1, 1]], // J
    [[0, 1, 1], [1, 1, 0]], // S
    [[1, 1, 0], [0, 1, 1]]  // Z
];

let board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
let score = 0;
let lines = 0;
let level = 1;
let currentPiece = null;
let nextPiece = null;
let gameLoop = null;
let gameOver = false;
let isPaused = false;

class Piece {
    constructor(shape = null, color = null) {
        const pieceType = Math.floor(Math.random() * 7) + 1;
        this.shape = shape || SHAPES[pieceType];
        this.color = color || COLORS[pieceType];
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

function drawBlock(x, y, color, context = ctx) {
    context.fillStyle = color;
    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 1;
    context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
    context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
}

function drawPiece(piece, context = ctx, offsetX = 0, offsetY = 0) {
    if (!piece) return;
    piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                drawBlock(piece.x + x + offsetX, piece.y + y + offsetY, piece.color, context);
            }
        });
    });
}

function drawBoard() {
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw board
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                drawBlock(x, y, COLORS[value]);
            }
        });
    });

    // Draw current piece
    if (currentPiece) {
        drawPiece(currentPiece);
    }
}

function drawNextPiece() {
    // Clear next piece canvas
    nextCtx.fillStyle = '#000000';
    nextCtx.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);

    if (nextPiece) {
        const offsetX = 1;
        const offsetY = 1;
        drawPiece(nextPiece, nextCtx, offsetX, offsetY);
    }
}

function mergePiece() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                const pieceType = COLORS.indexOf(currentPiece.color);
                board[currentPiece.y + y][currentPiece.x + x] = pieceType;
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
    board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
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
    
    // Initialize pieces
    nextPiece = new Piece();
    newPiece();
    
    // Start game loop
    gameLoop = setInterval(dropPiece, 1000);
    startButton.textContent = 'Pause';
    startButton.disabled = false;
    
    // Initial draw
    drawBoard();
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
drawBoard();