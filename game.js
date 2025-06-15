const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Constants
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 12;
const BALL_RADIUS = 8;
const BALL_SPEED = 5; // px per frame

const BRICK_ROWS = 3;
const BRICK_COLS = 10;
const BRICK_WIDTH = 70;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 10;
const BRICK_OFFSET_TOP = 50;
const BRICK_OFFSET_LEFT = 35;

const BRICK_COLORS = ["#ff4d4d", "#ffa64d", "#ffff4d"];

// Stage management
let currentStage = 1;
const MAX_STAGE = 2;


// Game state
let paddleX;
let paddleWidth = PADDLE_WIDTH; // dynamic width
let ballX;
let ballY;
let ballDX;
let ballDY;
let bricks = [];
let score = 0;
let playing = true; // true => playing, false => stopped (win/lose)

const scoreEl = document.getElementById("score");
const restartBtn = document.getElementById("restartBtn");

function initBricks() {
  bricks = [];
  for (let r = 0; r < BRICK_ROWS; r++) {
    bricks[r] = [];
    for (let c = 0; c < BRICK_COLS; c++) {
      bricks[r][c] = { x: 0, y: 0, destroyed: false };
    }
  }
}

function resetGame(keepScore = false) {
  // Adjust difficulty based on stage
  if (currentStage === 1) {
    paddleWidth = PADDLE_WIDTH;
  } else {
    paddleWidth = PADDLE_WIDTH * 0.75; // narrower paddle on stage 2
  }
  paddleX = (canvas.width - paddleWidth) / 2;
  ballX = canvas.width / 2;
  ballY = canvas.height - 60;
  // 45° angle: dx = speed / sqrt(2)
  const speedFactor = currentStage === 1 ? 1 : 1.5;
  ballDX = BALL_SPEED * speedFactor * Math.cos(Math.PI / 4);
  ballDY = -BALL_SPEED * speedFactor * Math.sin(Math.PI / 4);
  if (!keepScore) {
    score = 0;
    scoreEl.textContent = score;
  }
  playing = true;
  initBricks();
  removeMessage();
}

function drawPaddle() {
  ctx.fillStyle = "#00e5ff";
  ctx.shadowColor = "#00e5ff";
  ctx.shadowBlur = 10;
  ctx.fillRect(paddleX, canvas.height - PADDLE_HEIGHT - 10, paddleWidth, PADDLE_HEIGHT);
  ctx.shadowBlur = 0; // reset
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(ballX, ballY, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = "#00e5ff";
  ctx.shadowColor = "#00e5ff";
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.closePath();
  ctx.shadowBlur = 0;
}

function drawBricks() {
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      const brick = bricks[r][c];
      if (!brick.destroyed) {
        const brickX = c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
        const brickY = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
        brick.x = brickX;
        brick.y = brickY;
        ctx.fillStyle = BRICK_COLORS[r];
        ctx.fillRect(brickX, brickY, BRICK_WIDTH, BRICK_HEIGHT);
      }
    }
  }
}

function collisionDetection() {
  // Wall collisions
  if (ballX + ballDX > canvas.width - BALL_RADIUS || ballX + ballDX < BALL_RADIUS) {
    ballDX = -ballDX;
  }
  if (ballY + ballDY < BALL_RADIUS) {
    ballDY = -ballDY;
  }

  // Paddle collision
  if (
    ballY + BALL_RADIUS >= canvas.height - PADDLE_HEIGHT - 10 &&
    ballX > paddleX &&
    ballX < paddleX + paddleWidth
  ) {
    ballDY = -ballDY;
  } else if (ballY + BALL_RADIUS > canvas.height) {
    gameOver();
  }

  // Brick collisions
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      const brick = bricks[r][c];
      if (!brick.destroyed) {
        if (
          ballX > brick.x &&
          ballX < brick.x + BRICK_WIDTH &&
          ballY > brick.y &&
          ballY < brick.y + BRICK_HEIGHT
        ) {
          ballDY = -ballDY;
          brick.destroyed = true;
          score += 10;
          scoreEl.textContent = score;
          if (score === BRICK_ROWS * BRICK_COLS * 10) {
            win();
          }
        }
      }
    }
  }
}

function draw() {
  if (!playing) return; // stop drawing if game over/win

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawBall();
  drawPaddle();
  collisionDetection();

  // Move ball
  ballX += ballDX;
  ballY += ballDY;

  requestAnimationFrame(draw);
}

function showMessage(text) {
  removeMessage();
  const msg = document.createElement("div");
  msg.className = "message";
  msg.textContent = text;
  document.body.appendChild(msg);
}

function removeMessage() {
  const existing = document.querySelector(".message");
  if (existing) existing.remove();
}

function gameOver() {
  playing = false;
  showMessage("GAME OVER");
}

function win() {
  playing = false;
  if (currentStage < MAX_STAGE) {
    showMessage(`STAGE ${currentStage} CLEARED`);
    setTimeout(() => {
      currentStage++;
      resetGame(true);
      playing = true;
      draw();
    }, 1500);
  } else {
    showMessage("YOU WIN");
  }
}

// Event listeners
restartBtn.addEventListener("click", () => {
  resetGame(); // keep currentStage as is
  draw();
});

document.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const relativeX = e.clientX - rect.left;
  paddleX = Math.min(Math.max(relativeX - paddleWidth / 2, 0), canvas.width - paddleWidth);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    paddleX = Math.max(paddleX - 20, 0);
  } else if (e.key === "ArrowRight") {
    paddleX = Math.min(paddleX + 20, canvas.width - paddleWidth);
  }
});

// Init
resetGame();
draw();
