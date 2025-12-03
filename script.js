// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const powerBar = document.getElementById('powerBar');

// Set canvas size to match container dimensions
const container = document.getElementById('gameContainer');
canvas.width = container.clientWidth;
canvas.height = container.clientHeight;

// Game state
let gameState = {
    power: 50,
    powerDirection: 1,
    footballs: [],
    hits: 0,
    throws: 0,
    timeLeft: 10,
    gameActive: false,
    prize: "Free Appetizer!" // Prize variable
};

// Target configuration
const TARGET = {
    x: canvas.width * 0.8,
    y: canvas.height * 0.3,
    optimalPower: 75,
    tolerance: 15, // ±15%
    size: 80 // Hit zone size
};

// Football class
class Football {
    constructor(throwPower) {
        this.startX = canvas.width * 0.1;
        this.startY = canvas.height * 0.8;
        this.x = this.startX;
        this.y = this.startY;
        this.power = throwPower;
        this.time = 0;
        this.maxTime = 80;
        this.size = 16;
        this.rotation = 0;
        this.active = true;
        this.hasScored = false;

        // Calculate target position based on power
        this.calculateTrajectory();
    }

    calculateTrajectory() {
        const minPower = TARGET.optimalPower - TARGET.tolerance;
        const maxPower = TARGET.optimalPower + TARGET.tolerance;
        
        if (this.power >= minPower && this.power <= maxPower) {
            // Hit trajectory - aim for target
            this.targetX = TARGET.x + (Math.random() - 0.5) * 30;
            this.targetY = TARGET.y + (Math.random() - 0.5) * 30;
        } else {
            // Miss trajectory based on power
            const powerRatio = this.power / 100;
            const targetDistance = Math.sqrt(
                Math.pow(TARGET.x - this.startX, 2) + 
                Math.pow(TARGET.y - this.startY, 2)
            );
            
            // Calculate overshoot/undershoot
            const actualDistance = targetDistance * powerRatio * 1.3;
            const angle = Math.atan2(TARGET.y - this.startY, TARGET.x - this.startX);
            
            this.targetX = this.startX + Math.cos(angle) * actualDistance;
            this.targetY = this.startY + Math.sin(angle) * actualDistance;
            
            // Add some random spread for misses
            this.targetX += (Math.random() - 0.5) * 100;
            this.targetY += (Math.random() - 0.5) * 100;
        }
    }

    update() {
        this.time++;
        const progress = this.time / this.maxTime;

        if (progress >= 1) {
            this.active = false;
            return;
        }

        // Calculate position along trajectory with arc
        this.x = this.startX + (this.targetX - this.startX) * progress;
        
        // Add parabolic arc for realistic trajectory
        const linearY = this.startY + (this.targetY - this.startY) * progress;
        const arcHeight = Math.sin(progress * Math.PI) * 80;
        this.y = linearY - arcHeight;

        // Perspective scaling
        this.size = 16 * (1 - progress * 0.4);
        this.rotation += 0.3;

        // Check for hit - expanded detection window
        if (!this.hasScored && progress > 0.5 && progress < 0.95) {
            const distance = Math.sqrt(
                Math.pow(this.x - TARGET.x, 2) + 
                Math.pow(this.y - TARGET.y, 2)
            );
            
            if (distance < TARGET.size) {
                gameState.hits++;
                this.hasScored = true;
                updateUI();
                flashTarget();
            }
        }
    }

    draw() {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Football shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(2, 4, this.size * 0.9, this.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Football body
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size, this.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Football laces
        if (this.size > 8) {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-this.size * 0.7, 0);
            ctx.lineTo(this.size * 0.7, 0);
            
            for (let i = -1; i <= 1; i++) {
                ctx.moveTo(i * this.size * 0.3, -this.size * 0.25);
                ctx.lineTo(i * this.size * 0.3, this.size * 0.25);
            }
            ctx.stroke();
        }

        ctx.restore();
    }
}

// Target flash effect
let targetFlash = 0;
function flashTarget() {
    targetFlash = 30;
}

// Power meter animation
function animatePowerMeter() {
    gameState.power += gameState.powerDirection * 6.5;
    
    if (gameState.power >= 100 || gameState.power <= 10) {
        gameState.powerDirection *= -1;
    }
    
    powerBar.style.height = gameState.power + '%';
}

// Draw the cartoon receiver
function drawReceiver() {
    const x = TARGET.x;
    const y = TARGET.y;

    // Flash effect
    if (targetFlash > 0) {
        ctx.save();
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 25;
        targetFlash--;
    }

    // Player body (side view)
    ctx.fillStyle = '#0066FF';
    ctx.fillRect(x - 25, y - 15, 50, 60);

    // Player head
    ctx.fillStyle = '#FFDBAC';
    ctx.beginPath();
    ctx.arc(x, y - 40, 20, 0, Math.PI * 2);
    ctx.fill();

    // Helmet
    ctx.fillStyle = '#003399';
    ctx.beginPath();
    ctx.arc(x, y - 45, 22, Math.PI, 0);
    ctx.fill();

    // Face mask
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 15, y - 35);
    ctx.lineTo(x + 15, y - 35);
    ctx.moveTo(x - 10, y - 30);
    ctx.lineTo(x + 10, y - 30);
    ctx.stroke();

    // Jersey number
    ctx.fillStyle = 'white';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('19', x, y + 10);

    // Legs
    ctx.fillStyle = 'white';
    ctx.fillRect(x - 15, y + 45, 12, 35);
    ctx.fillRect(x + 3, y + 45, 12, 35);

    // Arms reaching up
    ctx.fillStyle = '#FFDBAC';
    
    // Left arm
    ctx.save();
    ctx.translate(x - 30, y - 5);
    ctx.rotate(-Math.PI / 2.5);
    ctx.fillRect(-8, 0, 16, 40);
    ctx.restore();

    // Right arm
    ctx.save();
    ctx.translate(x + 30, y - 5);
    ctx.rotate(Math.PI / 2.5);
    ctx.fillRect(-8, 0, 16, 40);
    ctx.restore();

    // Hands/gloves
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(x - 45, y - 30, 10, 0, Math.PI * 2);
    ctx.arc(x + 45, y - 30, 10, 0, Math.PI * 2);
    ctx.fill();

    // Target zone - smaller visual size
    const minPower = TARGET.optimalPower - TARGET.tolerance;
    const maxPower = TARGET.optimalPower + TARGET.tolerance;
    const isInRange = gameState.power >= minPower && gameState.power <= maxPower;
    
    ctx.strokeStyle = isInRange ? '#00FF00' : 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y - 10, 35, 0, Math.PI * 2);
    ctx.stroke();

    // Target rings - smaller visual size
    ctx.lineWidth = 2;
    for (let r = 15; r < 35; r += 10) {
        ctx.beginPath();
        ctx.arc(x, y - 10, r, 0, Math.PI * 2);
        ctx.stroke();
    }

    if (targetFlash > 0) {
        ctx.restore();
    }
}

// Draw field
function drawField() {
    // Field lines for perspective
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;

    for (let i = 0; i < 8; i++) {
        const y = canvas.height * 0.65 + i * 35;
        const width = 80 + i * 120;
        
        ctx.beginPath();
        ctx.moveTo(canvas.width * 0.05, y);
        ctx.lineTo(canvas.width * 0.05 + width, y);
        ctx.stroke();
    }
}

// Update UI
function updateUI() {
    document.getElementById('hitsCount').textContent = gameState.hits;
    document.getElementById('throwsCount').textContent = gameState.throws;
}

// Throw football
function throwFootball() {
    if (!gameState.gameActive) {
        startGame();
        return;
    }

    const football = new Football(gameState.power);
    gameState.footballs.push(football);
    gameState.throws++;
    updateUI();
}

// Start game
function startGame() {
    gameState.gameActive = true;
    gameState.timeLeft = 10;

    const timer = setInterval(() => {
        gameState.timeLeft--;
        document.getElementById('timeLeft').textContent = gameState.timeLeft;

        if (gameState.timeLeft <= 0) {
            endGame();
            clearInterval(timer);
        }
    }, 1000);
}

// End game
function endGame() {
    gameState.gameActive = false;
    
    const accuracy = gameState.throws > 0 ? 
        Math.round((gameState.hits / gameState.throws) * 100) : 0;

    document.getElementById('finalStats').innerHTML = `
        <h3>Final Score</h3>
        <p>Hits: ${gameState.hits}</p>
        <p>Total Throws: ${gameState.throws}</p>
        <p>Accuracy: ${accuracy}%</p>
    `;

    document.getElementById('prizeDisplay').textContent = `You won a ${gameState.prize}`;
    document.getElementById('gameOverScreen').style.display = 'block';
}

// Reset game
function resetGame() {
    gameState = {
        power: 50,
        powerDirection: 1,
        footballs: [],
        hits: 0,
        throws: 0,
        timeLeft: 10,
        gameActive: false,
        prize: "Free Appetizer!"
    };

    updateUI();
    document.getElementById('timeLeft').textContent = '10';
    document.getElementById('gameOverScreen').style.display = 'none';
}

// Main game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawField();
    drawReceiver();

    // Update and draw footballs
    for (let i = gameState.footballs.length - 1; i >= 0; i--) {
        const football = gameState.footballs[i];
        football.update();
        football.draw();

        if (!football.active) {
            gameState.footballs.splice(i, 1);
        }
    }

    // Draw throwing position indicator
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(canvas.width * 0.1, canvas.height * 0.8, 5, 0, Math.PI * 2);
    ctx.fill();

    requestAnimationFrame(gameLoop);
}

// Event listeners
document.getElementById('throwButton').addEventListener('click', throwFootball);
document.getElementById('playAgainBtn').addEventListener('click', resetGame);

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        throwFootball();
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    const container = document.getElementById('gameContainer');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    TARGET.x = canvas.width * 0.8;
    TARGET.y = canvas.height * 0.3;
});

// Start the game
setInterval(animatePowerMeter, 60);
gameLoop();
