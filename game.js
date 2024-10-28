const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let spaceship = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 60,
    width: 50,
    height: 50,
    dx: 0,
    maxSpeed: 10,
    acceleration: 0.3,
    isInvincible: false
};

let bullets = [];
let enemies = [];
let powerUps = [];
let enemyInterval = 1000;
let lastEnemySpawn = 0;
let keys = {};
let score = 0;
let gameOver = false;
let level = 1;
let powerUpActive = false;
let powerUpDuration = 5000; // 5 seconds
let lastPowerUpTime = 0;
let lives = 3;
let gameStarted = false;
let activePowerUps = [];

const powerUpTypes = [
    { type: 'invincibility', color: 'yellow' },
    { type: 'doubleBullets', color: 'purple' },
    { type: 'speedBoost', color: 'blue' }, // New power-up type
    { type: 'extraLife', color: 'green' }  // New power-up type
];

let powerUpMessage = '';
let powerUpMessageTime = 0;

function drawSpaceship() {
    const pixelSize = 10; // Increased pixel size
    const spaceshipPattern = [
        [0, 1, 1, 0],
        [1, 1, 1, 1],
        [0, 1, 1, 0],
        [1, 0, 0, 1]
    ];

    ctx.fillStyle = spaceship.isInvincible ? 'yellow' : 'white';
    spaceshipPattern.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            if (cell) {
                ctx.fillRect(
                    spaceship.x + colIndex * pixelSize,
                    spaceship.y + rowIndex * pixelSize,
                    pixelSize,
                    pixelSize
                );
            }
        });
    });
}

function drawBullets() {
    ctx.fillStyle = 'red';
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

function drawEnemies() {
    const pixelSize = 10; // Increased pixel size
    const enemyPattern = [
        [1, 0, 0, 1],
        [0, 1, 1, 0],
        [1, 1, 1, 1],
        [0, 1, 1, 0]
    ];

    ctx.fillStyle = 'green';
    enemies.forEach(enemy => {
        enemyPattern.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                if (cell) {
                    ctx.fillRect(
                        enemy.x + colIndex * pixelSize,
                        enemy.y + rowIndex * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            });
        });
    });
}

function drawPowerUps() {
    const pixelSize = 10; // Increased pixel size
    const powerUpPattern = [
        [0, 1, 0],
        [1, 1, 1],
        [0, 1, 0]
    ];

    powerUps.forEach(powerUp => {
        ctx.fillStyle = powerUp.color;
        powerUpPattern.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                if (cell) {
                    ctx.fillRect(
                        powerUp.x + colIndex * pixelSize,
                        powerUp.y + rowIndex * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            });
        });
    });
}

function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.fillText(`Score: ${score}`, canvas.width - 200, 40); // Adjusted x position
    ctx.fillText(`Level: ${level}`, canvas.width - 200, 80); // Adjusted x position
    ctx.fillText(`Lives: ${lives}`, canvas.width - 200, 120); // Adjusted x position
}

function drawGameOver() {
    ctx.fillStyle = 'white';
    ctx.font = '50px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 50);
    ctx.font = '30px Arial';
    ctx.fillText(`Your Score: ${score}`, canvas.width / 2, canvas.height / 2);
    ctx.fillText('Press R to Restart', canvas.width / 2, canvas.height / 2 + 50);
}

function drawStartScreen() {
    ctx.fillStyle = 'white';
    ctx.font = '50px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Space Shooter', canvas.width / 2, canvas.height / 2 - 150);
    ctx.font = '30px Arial';
    ctx.fillText('Press S to Start', canvas.width / 2, canvas.height / 2 - 100);
    ctx.fillText('Power-ups:', canvas.width / 2, canvas.height / 2 - 50);

    // Automatically display power-up descriptions
    powerUpTypes.forEach((powerUp, index) => {
        let description = '';
        switch (powerUp.type) {
            case 'invincibility':
                description = 'Invincibility';
                break;
            case 'doubleBullets':
                description = 'Double Bullets';
                break;
            case 'speedBoost':
                description = 'Speed Boost';
                break;
            case 'extraLife':
                description = 'Extra Life';
                break;
        }
        ctx.fillText(`${powerUp.color.charAt(0).toUpperCase() + powerUp.color.slice(1)}: ${description}`, canvas.width / 2, canvas.height / 2 + index * 30);
    });

    // Game rules and controls
    ctx.fillText('Game Rules:', canvas.width / 2, canvas.height / 2 + 150);
    ctx.fillText('Use Arrow Keys to Move', canvas.width / 2, canvas.height / 2 + 190);
    ctx.fillText('Press Space to Shoot', canvas.width / 2, canvas.height / 2 + 230);
    ctx.fillText('Avoid Enemies and Collect Power-ups', canvas.width / 2, canvas.height / 2 + 270);
}

function update() {
    if (!gameStarted) {
        drawStartScreen();
        return;
    }

    if (gameOver) {
        drawGameOver();
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSpaceship();
    drawBullets();
    drawEnemies();
    drawPowerUps();
    drawScore();

    // Draw the power-up messages and duration bars for active power-ups
    activePowerUps.forEach((powerUp, index) => {
        const elapsedTime = Date.now() - powerUp.startTime;
        const remainingTime = Math.max(0, powerUpDuration - elapsedTime);
        const barWidth = 200;
        const barHeight = 20;
        const barX = (canvas.width - barWidth) / 2;
        const barY = 50 + index * 40; // Adjust y position for each power-up
        const fillWidth = (remainingTime / powerUpDuration) * barWidth;

        ctx.fillStyle = 'yellow';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(powerUp.message, canvas.width / 2, barY - 10);

        ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.fillRect(barX, barY, fillWidth, barHeight);
        ctx.strokeStyle = 'yellow';
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Remove power-up if duration is over
        if (remainingTime <= 0) {
            deactivatePowerUp(powerUp.type);
            activePowerUps.splice(index, 1);
        }
    });

    moveBullets();
    moveEnemies();
    movePowerUps();
    checkCollisions();
    moveSpaceship();
    checkLevelUp();
}

function moveSpaceship() {
    if (keys['ArrowLeft']) {
        spaceship.dx = Math.max(spaceship.dx - spaceship.acceleration, -spaceship.maxSpeed);
    } else if (keys['ArrowRight']) {
        spaceship.dx = Math.min(spaceship.dx + spaceship.acceleration, spaceship.maxSpeed);
    } else {
        spaceship.dx *= 0.9; // 감속
    }

    spaceship.x += spaceship.dx;

    // 화면 밖으로 나가지 않도록 제한
    if (spaceship.x < 0) spaceship.x = 0;
    if (spaceship.x > canvas.width - spaceship.width) spaceship.x = canvas.width - spaceship.width;
}

function shootBullet() {
    bullets.push({ x: spaceship.x + spaceship.width / 2 - 2.5, y: spaceship.y, width: 5, height: 10, dy: 5 });
    if (powerUpActive && powerUpTypes.some(p => p.type === 'doubleBullets')) {
        bullets.push({ x: spaceship.x + spaceship.width / 2 + 10, y: spaceship.y, width: 5, height: 10, dy: 5 });
    }
}

function moveBullets() {
    bullets.forEach((bullet, index) => {
        bullet.y -= bullet.dy;
        if (bullet.y < 0) {
            bullets.splice(index, 1);
        }
    });
}

function spawnEnemy() {
    const x = Math.random() * (canvas.width - 50);
    const speed = 2 + Math.random() * level; // 적의 속도는 레벨에 따라 증가
    enemies.push({ x: x, y: 0, width: 50, height: 50, dy: speed });
}

function moveEnemies() {
    enemies.forEach((enemy, index) => {
        enemy.y += enemy.dy;
        if (enemy.y > canvas.height) {
            enemies.splice(index, 1);
            // Deduct a life if an enemy crosses the bottom line
            lives--;
            if (lives <= 0) {
                gameOver = true;
            }
        }
    });
}

function spawnPowerUp(x, y) {
    const typeIndex = Math.floor(Math.random() * powerUpTypes.length);
    const powerUpType = powerUpTypes[typeIndex];
    powerUps.push({ x: x, y: y, width: 30, height: 30, dy: 1, type: powerUpType.type, color: powerUpType.color });
}

function movePowerUps() {
    powerUps.forEach((powerUp, index) => {
        powerUp.y += powerUp.dy;
        if (powerUp.y > canvas.height) {
            powerUps.splice(index, 1);
        }
    });
}

function checkCollisions() {
    bullets.forEach((bullet, bIndex) => {
        enemies.forEach((enemy, eIndex) => {
            if (bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y) {
                bullets.splice(bIndex, 1);
                enemies.splice(eIndex, 1);
                score += 10; // 점수 증가

                // Randomly spawn a power-up when an enemy is destroyed
                if (Math.random() < 0.2) { // 20% chance to spawn a power-up
                    spawnPowerUp(enemy.x, enemy.y);
                }
            }
        });
    });

    enemies.forEach((enemy, eIndex) => {
        if (spaceship.x < enemy.x + enemy.width &&
            spaceship.x + spaceship.width > enemy.x &&
            spaceship.y < enemy.y + enemy.height &&
            spaceship.y + spaceship.height > enemy.y) {
            if (spaceship.isInvincible) {
                enemies.splice(eIndex, 1); // Remove enemy if invincible
                score += 10; // 점수 증가
            } else {
                gameOver = true;
                powerUpActive = false; // Deactivate double bullets
                activePowerUps = []; // Clear active power-ups
            }
        }
    });

    powerUps.forEach((powerUp, pIndex) => {
        if (spaceship.x < powerUp.x + powerUp.width &&
            spaceship.x + spaceship.width > powerUp.x &&
            spaceship.y < powerUp.y + powerUp.height &&
            spaceship.y + spaceship.height > powerUp.y) {
            powerUps.splice(pIndex, 1);
            activatePowerUp(powerUp.type);
        }
    });
}

function activatePowerUp(type) {
    let message = '';
    if (type === 'invincibility') {
        spaceship.isInvincible = true;
        message = 'Invincibility Activated!';
    } else if (type === 'doubleBullets') {
        powerUpActive = true;
        message = 'Double Bullets Activated!';
    } else if (type === 'speedBoost') {
        spaceship.maxSpeed += 5;
        message = 'Speed Boost Activated!';
    } else if (type === 'extraLife') {
        lives++;
        message = 'Extra Life Gained!';
    }

    activePowerUps.push({ type, message, startTime: Date.now() });
}

function deactivatePowerUp(type) {
    if (type === 'invincibility') {
        spaceship.isInvincible = false;
    } else if (type === 'doubleBullets') {
        powerUpActive = false;
    } else if (type === 'speedBoost') {
        spaceship.maxSpeed -= 5;
    }
}

function checkLevelUp() {
    if (score >= level * 100) {
        level++;
        enemyInterval = Math.max(500, enemyInterval - 100); // 적 생성 간격 감소
    }
}

function initializeGameState() {
    spaceship = {
        x: canvas.width / 2 - 25,
        y: canvas.height - 60,
        width: 50,
        height: 50,
        dx: 0,
        maxSpeed: 10,
        acceleration: 0.3,
        isInvincible: false
    };

    bullets = [];
    enemies = [];
    powerUps = [];
    activePowerUps = [];
    score = 0;
    level = 1;
    lives = 3;
    gameOver = false;
    enemyInterval = 1000;
    powerUpActive = false;
    powerUpMessage = '';
}

initializeGameState(); // Initial setup

function resetGame() {
    initializeGameState(); // Reset game state
}

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') {
        shootBullet();
    }
    if (e.key === 'r' && gameOver) {
        resetGame();
    }
    if (e.key === 's' && !gameStarted) {
        gameStarted = true;
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

function gameLoop(timestamp) {
    if (gameStarted && !gameOver && timestamp - lastEnemySpawn > enemyInterval) {
        spawnEnemy();
        lastEnemySpawn = timestamp;
    }
    if (gameStarted && !powerUpActive && Math.random() < 0.005) { // 파워업 생성 확률 감소
        spawnPowerUp();
    }
    update();
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
