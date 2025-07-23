import { StaticObject, Player, Platform, Block, PowerUp, Enemy, Coin, Flagpole, Axe, Projectile, Springboard, FireBar, Thwomp, DonutLift, P_Switch } from './classes.js';
import { levelData } from './levels.js';

// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Get UI elements
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const levelDisplay = document.getElementById('level');
const gameMessageDiv = document.getElementById('gameMessage');
const messageText = document.getElementById('messageText');
const startButton = document.getElementById('startButton');

// Get mobile control buttons
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const jumpBtn = document.getElementById('jumpBtn');
const actionBtn = document.getElementById('actionBtn');

// Game Constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 450;
const GRAVITY = 0.5;
const JUMP_STRENGTH = -10;
const PLAYER_SPEED = 4;
const TILE_SIZE = 30; // Standard size for player, blocks, enemies, coins

// Game State Variables
let currentLevelIndex = 0;
let score = 0;
let lives = 3;
let gameState = 'start'; // 'start', 'playing', 'level_complete', 'game_over', 'game_complete'
let animationFrameId; // To store the requestAnimationFrame ID for stopping/pausing

// Player Object (instance of Player class)
const player = new Player(0, 0, TILE_SIZE, TILE_SIZE, TILE_SIZE);

// Arrays for game elements in the current level
let platforms = [];
let blocks = []; // For question mark and brick blocks
let enemies = [];
let coins = [];
let powerUps = []; // For mushrooms, fire flowers, 1-ups
let projectiles = []; // For fireballs and hammers
let flagpole = null;
let axe = null; // For Level 1-4 mini-boss
let springboards = []; // For Level 1-3
let firebars = []; // For Level 1-4
let thwomps = []; // For Level 1-4
let donutLifts = []; // For Level 1-4
let waterAreas = []; // For Level 1-2
let pSwitches = []; // For P-Switches

// Input handling - now supports both keyboard and touch
const keys = {}; // Object to keep track of pressed keys/buttons

// Keyboard event listeners
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space' && gameState === 'start') {
        startGame();
    }
});
window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Touch event listeners for mobile buttons
function setupTouchControls() {
    // Left Button
    leftBtn.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent scrolling/zooming
        keys['ArrowLeft'] = true;
    });
    leftBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys['ArrowLeft'] = false;
    });

    // Right Button
    rightBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys['ArrowRight'] = true;
    });
    rightBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys['ArrowRight'] = false;
    });

    // Jump Button
    jumpBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys['Space'] = true;
        if (gameState === 'start') { // Allow starting game with jump button
            startGame();
        }
    });
    jumpBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys['Space'] = false;
    });

    // Action/Throw Button
    actionBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys['KeyZ'] = true; // Using 'KeyZ' for a generic action/throw button
    });
    actionBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys['KeyZ'] = false;
    });
}


// --- Game Functions ---

// Resize canvas to fit screen while maintaining aspect ratio
function resizeCanvas() {
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;

    const aspectRatio = GAME_WIDTH / GAME_HEIGHT;
    let displayWidth = window.innerWidth * 0.95;
    let displayHeight = window.innerHeight * 0.8;

    // Adjust display height if mobile controls are visible
    if (window.innerWidth <= 768) { // Assuming 768px is the breakpoint for mobile controls
        displayHeight = window.innerHeight * 0.7; // Make more space for controls
    }

    if (displayWidth / displayHeight > aspectRatio) {
        displayWidth = displayHeight * aspectRatio;
    } else {
        displayHeight = displayWidth / aspectRatio;
    }

    const gameContainer = document.querySelector('.game-container');
    gameContainer.style.width = `${displayWidth}px`;
    gameContainer.style.height = `${displayHeight}px`;
}

// Load a specific level
function loadLevel(levelIndex) {
    if (levelIndex >= levelData.length) {
        // All levels completed!
        gameState = 'game_complete';
        showMessage('Congratulations! You finished all levels!', 'Play Again', resetGame);
        return;
    }

    const currentLevel = levelData[levelIndex];
    player.x = currentLevel.playerStart.x;
    player.y = currentLevel.playerStart.y;
    player.dx = 0;
    player.dy = 0;
    player.onGround = false;
    player.isJumping = false;
    player.invincible = false;
    player.invincibilityTimer = 0;
    player.isGrowing = false;
    player.isShrinking = false;
    player.growTimer = 0;
    player.shrinkTimer = 0;
    // player.state is NOT reset here, it persists across levels unless Mario takes damage
    // player.height and player.width are updated by player.isGrowing/isShrinking logic

    // Instantiate game elements from level data
    platforms = currentLevel.platforms.map(p => new Platform(p.x, p.y, p.width, p.height, p.color));
    blocks = currentLevel.blocks.map(b => new Block(b.x, b.y, TILE_SIZE, b.type, b.content));
    enemies = currentLevel.enemies.map(e => new Enemy(e.x, e.y, TILE_SIZE, GRAVITY, JUMP_STRENGTH, e.type, e.speed, e.range));
    coins = currentLevel.coins.map(c => new Coin(c.x, c.y, c.radius));
    powerUps = []; // Clear power-ups from previous level
    projectiles = []; // Clear projectiles
    flagpole = currentLevel.flagpole ? new Flagpole(currentLevel.flagpole.x, currentLevel.flagpole.y, currentLevel.flagpole.height) : null;
    axe = currentLevel.axe ? new Axe(currentLevel.axe.x, currentLevel.axe.y, TILE_SIZE) : null;

    springboards = currentLevel.springboards.map(s => new Springboard(s.x, s.y, TILE_SIZE));
    firebars = currentLevel.firebars.map(fb => new FireBar(fb.centerX, fb.centerY, fb.radius, fb.numBalls, fb.speed));
    thwomps = currentLevel.thwomps.map(t => new Thwomp(t.x, t.y, TILE_SIZE, t.dropHeight, t.dropSpeed));
    donutLifts = currentLevel.donutLifts.map(dl => new DonutLift(dl.x, dl.y, TILE_SIZE, GRAVITY));
    waterAreas = currentLevel.water.map(w => new StaticObject(w.x, w.y, w.width, w.height, w.color));
    pSwitches = currentLevel.pSwitches.map(ps => new P_Switch(ps.x, ps.y, TILE_SIZE));


    levelDisplay.textContent = levelIndex + 1;
    gameState = 'playing';
    hideMessage();
    // console.log(`Loaded Level ${levelIndex + 1}`); // Debugging
}

// Start the game from the beginning
function startGame() {
    score = 0;
    lives = 3;
    currentLevelIndex = 0;
    player.state = 'small'; // Reset player size
    player.height = TILE_SIZE; // Reset player height
    player.width = TILE_SIZE; // Reset player width
    updateUI();
    loadLevel(currentLevelIndex);
    gameLoop();
}

// Reset game after game over
function resetGame() {
    cancelAnimationFrame(animationFrameId); // Stop previous loop
    startGame();
}

// Advance to the next level
function nextLevel() {
    currentLevelIndex++;
    loadLevel(currentLevelIndex);
}

// Handle player taking damage
function takeDamage() {
    if (player.invincible || player.isGrowing || player.isShrinking) return;

    if (player.state === 'fire' || player.state === 'big') {
        player.state = 'small';
        player.isShrinking = true;
        player.shrinkTimer = 30; // Short animation frames
        player.height = TILE_SIZE; // Reset height immediately for collision
        player.width = TILE_SIZE;
        // Sound: Shrink sound
    } else {
        lives--;
        updateUI();
        // Sound: Lose life sound
        if (lives <= 0) {
            gameOver();
            return; // Stop further processing
        }
    }

    player.invincible = true;
    player.invincibilityTimer = player.maxInvincibilityTime;
}

// Game Over state
function gameOver() {
    gameState = 'game_over';
    showMessage('Game Over!', 'Try Again', resetGame);
    cancelAnimationFrame(animationFrameId); // Stop game loop
    // Sound: Game over music
}

// Show game message (start, level complete, game over)
function showMessage(text, buttonText, buttonAction) {
    messageText.textContent = text;
    startButton.textContent = buttonText;
    startButton.onclick = buttonAction;
    gameMessageDiv.style.display = 'block';
}

// Hide game message
function hideMessage() {
    gameMessageDiv.style.display = 'none';
}

// Update score and lives display
function updateUI() {
    scoreDisplay.textContent = score;
    livesDisplay.textContent = lives;
}


// --- Game Update Logic ---

function update() {
    if (gameState !== 'playing') return;

    // Handle player growth/shrink animation
    if (player.isGrowing) {
        player.growTimer--;
        if (player.growTimer <= 0) {
            player.isGrowing = false;
            player.height = TILE_SIZE * 1.5; // Final big height
            player.width = TILE_SIZE * 1.5;
        } else {
            player.height = TILE_SIZE + (TILE_SIZE * 0.5) * (30 - player.growTimer) / 30;
            player.width = TILE_SIZE + (TILE_SIZE * 0.5) * (30 - player.growTimer) / 30;
        }
    } else if (player.isShrinking) {
        player.shrinkTimer--;
        if (player.shrinkTimer <= 0) {
            player.isShrinking = false;
            player.height = TILE_SIZE; // Final small height
            player.width = TILE_SIZE;
        } else {
            player.height = TILE_SIZE + (TILE_SIZE * 0.5) * player.shrinkTimer / 30;
            player.width = TILE_SIZE + (TILE_SIZE * 0.5) * player.shrinkTimer / 30;
        }
    }


    // Player horizontal movement
    player.dx = 0;
    if (keys['ArrowLeft']) {
        player.dx = -PLAYER_SPEED;
        player.facingRight = false;
    }
    if (keys['ArrowRight']) {
        player.dx = PLAYER_SPEED;
        player.facingRight = true;
    }

    // Player jump
    if (keys['Space'] && player.onGround) {
        player.dy = JUMP_STRENGTH;
        player.onGround = false;
        player.isJumping = true;
        // Sound: Jump sound
    }

    // Handle 'Throw' action (fireball)
    if (keys['KeyZ'] && player.state === 'fire' && projectiles.filter(p => p.type === 'fireball_player').length < 2) { // Limit fireballs
        projectiles.push(new Projectile(player.x + player.width / 2, player.y + player.height / 2, 'fireball_player', player.facingRight ? 5 : -5, -3, GRAVITY));
        keys['KeyZ'] = false; // Consume key press
        // Sound: Fireball sound
    }


    // Apply gravity (reduced in water)
    let inWater = false;
    for (const water of waterAreas) {
        if (player.checkCollision(water)) {
            inWater = true;
            break;
        }
    }
    player.dy += inWater ? GRAVITY * 0.2 : GRAVITY;
    if (inWater && player.dy > 2) player.dy = 2; // Max swim speed

    // Update player position
    player.x += player.dx;
    player.y += player.dy;

    // Handle player invincibility timer
    if (player.invincible) {
        player.invincibilityTimer--;
        if (player.invincibilityTimer <= 0) {
            player.invincible = false;
        }
    }

    // Keep player within horizontal canvas bounds
    if (player.x < 0) {
        player.x = 0;
    }
    if (player.x + player.width > GAME_WIDTH) {
        player.x = GAME_WIDTH - player.width;
    }

    // Player-Platform Collision
    player.onGround = false;
    for (const platform of platforms) {
        if (player.checkCollision(platform)) {
            const overlapX = Math.min(player.x + player.width, platform.x + platform.width) - Math.max(player.x, platform.x);
            const overlapY = Math.min(player.y + player.height, platform.y + platform.height) - Math.max(player.y, platform.y);

            if (overlapX > 0 && overlapY > 0) {
                if (overlapX > overlapY) { // Vertical collision
                    if (player.dy > 0 && player.y + player.height - player.dy <= platform.y) { // From above
                        player.y = platform.y - player.height;
                        player.dy = 0;
                        player.onGround = true;
                        player.isJumping = false;
                    } else if (player.dy < 0 && player.y - player.dy >= platform.y + platform.height) { // From below
                        player.y = platform.y + platform.height;
                        player.dy = 0;
                    }
                } else { // Horizontal collision
                    if (player.dx > 0 && player.x + player.width - player.dx <= platform.x) { // From left
                        player.x = platform.x - player.width;
                        player.dx = 0;
                    } else if (player.dx < 0 && player.x - player.dx >= platform.x + platform.width) { // From right
                        player.x = platform.x + platform.width;
                        player.dx = 0;
                    }
                }
            }
        }
    }

    // Player-Block Collision
    for (const block of blocks) {
        block.update(); // Update block bounce animation
        if (player.checkCollision(block)) {
            // Check for fake wall (walk-through)
            if (block.type === 'brick' && block.content === 'fake_wall') {
                // Allow player to pass through, no collision response
                continue;
            }

            const overlapX = Math.min(player.x + player.width, block.x + block.width) - Math.max(player.x, block.x);
            const overlapY = Math.min(player.y + player.height, block.y + block.height) - Math.max(player.y, block.y);

            if (overlapX > 0 && overlapY > 0) {
                if (overlapX > overlapY) { // Vertical collision
                    if (player.dy > 0 && player.y + player.height - player.dy <= block.y) { // From above (landing on block)
                        player.y = block.y - player.height;
                        player.dy = 0;
                        player.onGround = true;
                        player.isJumping = false;
                        if (block.type === 'donut_lift') { // Start donut lift fall
                            block.startFall();
                        }
                    } else if (player.dy < 0 && player.y - player.dy >= block.y + block.height) { // From below (hitting head on block)
                        player.y = block.y + block.height;
                        player.dy = 0; // Stop upward movement
                        block.doBounce(); // Make block bounce

                        if (block.type === 'question' && !block.hit) {
                            block.hit = true;
                            // Spawn content
                            if (block.content === 'coin') {
                                score += 200; // Coin from block
                                updateUI();
                                // Sound: Coin sound
                            } else if (block.content === 'mushroom') {
                                powerUps.push(new PowerUp(block.x, block.y - TILE_SIZE, TILE_SIZE, 'mushroom', GRAVITY));
                                // Sound: Power-up appear sound
                            } else if (block.content === 'fireflower') {
                                powerUps.push(new PowerUp(block.x, block.y - TILE_SIZE, TILE_SIZE, 'fireflower', GRAVITY));
                                // Sound: Power-up appear sound
                            } else if (block.content === '1up') {
                                powerUps.push(new PowerUp(block.x, block.y - TILE_SIZE, TILE_SIZE, '1up', GRAVITY));
                                // Sound: 1-Up sound
                            } else if (block.content === 'superstar') {
                                powerUps.push(new PowerUp(block.x, block.y - TILE_SIZE, TILE_SIZE, 'superstar', GRAVITY));
                                // Sound: Starman sound
                            } else if (block.content && block.content.startsWith('pipe_warp')) {
                                // Handle specific pipe warps
                                if (block.content === 'pipe_warp_1-2_underground' && currentLevelIndex === 1) {
                                    player.x = TILE_SIZE * 8 + 10; // Position above water
                                    player.y = GAME_HEIGHT - TILE_SIZE * 2 - player.height;
                                    player.dy = 0;
                                } else if (block.content === 'warp_level_3' && currentLevelIndex === 0) { // Secret warp from 1-1 to 1-4
                                    currentLevelIndex = 3; // Warp to Level 1-4 (index 3)
                                    loadLevel(currentLevelIndex);
                                } else if (block.content === 'warp_level_2_alt' && currentLevelIndex === 1) { // Alternate exit from 1-2
                                    currentLevelIndex = 2; // Warp to Level 1-3 (index 2)
                                    loadLevel(currentLevelIndex);
                                }
                                // Sound: Pipe warp sound
                            }
                        } else if (block.type === 'brick') {
                            if (player.state === 'big' || player.state === 'fire') {
                                // Break brick block
                                blocks = blocks.filter(b => b !== block);
                                // Sound: Block break sound
                            } else {
                                // Sound: Bump sound
                            }
                        } else if (block.type === 'hidden' && !block.visible) {
                            block.visible = true;
                            block.color = '#FFD700'; // Make it look like a question block
                            if (block.content === '1up') {
                                powerUps.push(new PowerUp(block.x, block.y - TILE_SIZE, TILE_SIZE, '1up', GRAVITY));
                            } else if (block.content === 'coin') {
                                score += 200;
                                updateUI();
                            } else if (block.content === 'superstar') {
                                powerUps.push(new PowerUp(block.x, block.y - TILE_SIZE, TILE_SIZE, 'superstar', GRAVITY));
                            }
                        } else if (block.type === 'pipe' && block.content === 'warp_1-2_start' && player.dy < 0) {
                            // Pipe entrance for Level 1-2
                            if (currentLevelIndex === 0) {
                                // Warp player down into the pipe area
                                player.x = block.x + block.width / 2 - player.width / 2;
                                player.y = block.y + block.height - player.height;
                                player.dy = 0;
                                // This is a special pipe that loads the next level
                                currentLevelIndex++;
                                loadLevel(currentLevelIndex);
                                // Sound: Pipe warp sound
                            }
                        } else if (block.type === 'pipe' && block.content === 'warp_1-3_start' && player.dy < 0) {
                             if (currentLevelIndex === 1) {
                                // Warp player to the next level
                                currentLevelIndex++;
                                loadLevel(currentLevelIndex);
                                // Sound: Pipe warp sound
                            }
                        } else if (block.type === 'pipe' && block.content === 'warp_level_3_alt' && player.dy < 0) { // Secret exit from 1-4
                             if (currentLevelIndex === 3) {
                                gameState = 'game_complete'; // Treat as game complete for now
                                showMessage('Secret Exit Found! You win!', 'Play Again', resetGame);
                                cancelAnimationFrame(animationFrameId);
                            }
                        }
                    }
                } else { // Horizontal collision
                    if (player.dx > 0 && player.x + player.width - player.dx <= block.x) { // From left
                        player.x = block.x - player.width;
                        player.dx = 0;
                    } else if (player.dx < 0 && player.x - player.dx >= block.x + block.width) { // From right
                        player.x = block.x + block.width;
                        player.dx = 0;
                    }
                }
            }
        }
    }

    // Player falls off screen
    if (player.y > GAME_HEIGHT + 50) { // Give a little extra fall room
        takeDamage();
        loadLevel(currentLevelIndex); // Reset player position to start of current level
    }

    // Update Enemies and Enemy-Player Collision
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.update(platforms, blocks, GAME_WIDTH, GAME_HEIGHT);

        if (enemy.isDead && enemy.type !== 'dry_bones') continue; // Skip truly dead enemies

        // Check for Hammer Bro throwing hammers or Mini Bowser shooting fireballs
        if (enemy.type === 'hammer_bro' && enemy.throwTimer === enemy.throwInterval - 1) { // Just before throwing
            projectiles.push(new Projectile(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 'hammer', enemy.dx > 0 ? 3 : -3, 0, GRAVITY));
        }
        if (enemy.type === 'mini_bowser' && enemy.fireballTimer === enemy.fireballInterval - 1) { // Just before shooting
            projectiles.push(new Projectile(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 'fireball_enemy', enemy.dx > 0 ? 2 : -2, 0, GRAVITY));
        }

        if (!player.invincible && player.checkCollision(enemy)) {
            // Player-Enemy interaction
            if (player.dy > 0 && player.y + player.height - player.dy <= enemy.y) { // Player stomped on enemy
                if (enemy.type === 'koopa_green' || enemy.type === 'koopa_red') {
                    if (!enemy.isShelled) {
                        enemy.isShelled = true;
                        enemy.shellTimer = enemy.maxShellTime;
                        enemy.dx = 0; // Stop moving
                        score += 100;
                        // Sound: Stomp sound
                    } else { // Kick the shell
                        enemy.dx = player.facingRight ? 5 : -5; // Kick in direction Mario is facing
                        enemy.isShelled = true; // Keep it shelled
                        enemy.shellTimer = enemy.maxShellTime; // Reset timer
                        // Sound: Kick shell sound
                    }
                } else if (enemy.type === 'dry_bones') {
                    enemy.isDead = true; // Turn into bones
                    enemy.reanimateTimer = enemy.maxReanimateTime;
                    enemy.dx = 0;
                    score += 100;
                    // Sound: Stomp sound
                } else if (enemy.type === 'mini_bowser') {
                    // Mini Bowser is not defeated by stomp, only axe or fireballs
                    takeDamage();
                } else { // Goomba, Buzzy, Cheep Cheep (stompable)
                    score += 100; // Score for defeating enemy
                    enemies.splice(i, 1); // Remove enemy
                    // Sound: Stomp sound
                }
                updateUI();
                player.dy = JUMP_STRENGTH * 0.7; // Small bounce for player
            } else { // Player touched enemy from side or below
                takeDamage();
            }
        }

        // Shell-Enemy collision (Koopa shells hitting other enemies)
        if (enemy.isShelled && enemy.dx !== 0) { // If it's a moving shell
            for (let j = enemies.length - 1; j >= 0; j--) {
                const otherEnemy = enemies[j];
                if (enemy !== otherEnemy && enemy.type !== 'mini_bowser' && enemy.checkCollision(otherEnemy)) { // Shells don't defeat mini-boss
                    enemies.splice(j, 1); // Remove other enemy
                    score += 200; // Bonus for chain reaction
                    updateUI();
                    // Sound: Enemy defeated by shell
                    break;
                }
            }
        }
    }

    // Update PowerUps and Player-PowerUp Collision
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        powerUp.update(platforms, blocks, GAME_WIDTH);
        if (player.checkCollision(powerUp)) {
            if (powerUp.type === 'mushroom') {
                if (player.state === 'small') {
                    player.state = 'big';
                    player.isGrowing = true;
                    player.growTimer = 30; // Animation frames
                    // Sound: Grow sound
                }
            } else if (powerUp.type === 'fireflower') {
                player.state = 'fire';
                player.isGrowing = true; // Reuse grow animation
                player.growTimer = 30;
                // Sound: Power-up sound
            } else if (powerUp.type === '1up') {
                lives++;
                updateUI();
                // Sound: 1-Up sound
            } else if (powerUp.type === 'superstar') {
                player.invincible = true;
                player.invincibilityTimer = 600; // Longer invincibility for star
                // Sound: Starman music
            }
            powerUps.splice(i, 1); // Remove collected power-up
            score += 500; // Bonus for power-up
            updateUI();
        }
    }

    // Update Projectiles and their collisions
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        projectile.update(platforms, blocks, GAME_WIDTH, GAME_HEIGHT);

        if (!projectile.active) {
            projectiles.splice(i, 1);
            continue;
        }

        if (projectile.type === 'fireball_player') {
            // Fireball-Enemy collision
            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];
                if (projectile.checkCollision(enemy) && enemy.type !== 'buzzy' && enemy.type !== 'mini_bowser') { // Fireballs don't defeat Buzzy or Mini Bowser
                    enemies.splice(j, 1);
                    projectile.active = false;
                    score += 100;
                    updateUI();
                    // Sound: Enemy defeated by fireball
                    break;
                } else if (projectile.checkCollision(enemy) && enemy.type === 'mini_bowser' && !enemy.tempInvincible) {
                    enemy.hitPoints--;
                    enemy.tempInvincibleTimer = 30; // Brief invincibility after hit
                    projectile.active = false;
                    if (enemy.hitPoints <= 0) {
                        enemies.splice(j, 1);
                        score += 1000;
                        updateUI();
                        powerUps.push(new PowerUp(enemy.x, enemy.y, TILE_SIZE, '1up', GRAVITY)); // Mini-boss drops 1-Up
                    }
                    // Sound: Boss hit sound
                    break;
                }
            }
        } else if (projectile.type === 'hammer' || projectile.type === 'fireball_enemy') {
            // Enemy projectile - Player collision
            if (!player.invincible && player.checkCollision(projectile)) {
                takeDamage();
                projectile.active = false;
                // Sound: Player hit sound
            }
        }
    }

    // Coin Collection
    for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        if (coin.checkCollection(player)) {
            score += 10;
            updateUI();
            coins.splice(i, 1); // Remove collected coin
            // Sound: Coin sound
        }
    }

    // Springboard interaction
    for (const springboard of springboards) {
        if (player.checkCollision(springboard) && player.dy > 0) { // Landing on springboard
            player.dy = JUMP_STRENGTH * 1.5; // Super jump
            player.onGround = false;
            player.isJumping = true;
            springboard.compress();
            // Sound: Springboard sound
        } else {
            springboard.release();
        }
    }

    // FireBar interaction
    for (const firebar of firebars) {
        firebar.update();
        if (!player.invincible && firebar.checkCollision(player)) {
            takeDamage();
        }
    }

    // Thwomp interaction
    for (const thwomp of thwomps) {
        thwomp.update(player);
        if (!player.invincible && thwomp.checkCollision(player) && thwomp.state === 'dropping') {
            takeDamage();
        }
    }

    // Donut Lift interaction
    for (const donutLift of donutLifts) {
        donutLift.update();
        if (player.checkCollision(donutLift) && player.onGround) {
            donutLift.fallTimer--;
            if (donutLift.fallTimer <= 0) {
                donutLift.falling = true;
            }
        } else if (!donutLift.falling) {
            donutLift.fallTimer = donutLift.maxFallTime; // Reset timer if player leaves
        }

        if (donutLift.falling && donutLift.y > GAME_HEIGHT + TILE_SIZE) {
            donutLift.reset(); // Reset off-screen for next use
        }
    }

    // P-Switch interaction
    for (const pSwitch of pSwitches) {
        pSwitch.update();
        if (player.checkCollision(pSwitch) && player.dy > 0 && !pSwitch.pressed) { // Player stomps P-Switch
            pSwitch.press();
            // Transform blocks
            for (const block of blocks) {
                if (block.content === 'p_switch_affected') {
                    if (block.type === 'brick') {
                        block.type = 'coin_block_temp';
                        block.color = '#FFD700'; // Make it look like a coin
                    } else if (block.type === 'coin_block_temp') {
                        block.type = 'brick';
                        block.color = '#A0522D';
                    }
                }
            }
        } else if (!pSwitch.pressed && pSwitch.activeTimer <= 0) { // P-Switch deactivates
            for (const block of blocks) {
                if (block.content === 'p_switch_affected') {
                    block.type = block.originalType; // Revert to original type
                    block.color = (block.originalType === 'brick') ? '#A0522D' : '#FFD700';
                }
            }
        }
    }


    // Axe Check (Level 1-4 specific)
    if (axe && !axe.cut) {
        if (player.checkCollision(axe)) {
            axe.cut = true;
            // Defeat mini-bowser
            enemies = enemies.filter(e => e.type !== 'mini_bowser');
            score += 1000; // Big bonus for mini-boss
            updateUI();
            // Sound: Axe cut sound, Bowser fall sound
            gameState = 'level_complete';
            showMessage('Fortress Cleared!', 'Next Level', nextLevel);
            cancelAnimationFrame(animationFrameId);
        }
    }

    // Flagpole Check (Levels 1-1, 1-3)
    if (flagpole && flagpole.checkReach(player) && !flagpole.reached) {
        flagpole.reached = true;
        gameState = 'level_complete';
        showMessage('Level Complete!', 'Next Level', nextLevel);
        cancelAnimationFrame(animationFrameId); // Stop game loop
        // Sound: Level clear sound
    }
}

// Main Draw Function
function draw() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT); // Clear canvas

    // Draw background elements (e.g., clouds, mountains - simple shapes)
    let bgColor = '#87CEEB'; // Sky blue for overworld
    if (currentLevelIndex === 1 || currentLevelIndex === 3) { // Underground or Fortress
        bgColor = '#333333'; // Dark grey/black
    }
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw simple clouds (only for overworld levels)
    if (currentLevelIndex === 0 || currentLevelIndex === 2) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(100, 80, 30, 0, Math.PI * 2);
        ctx.arc(140, 70, 25, 0, Math.PI * 2);
        ctx.arc(120, 100, 35, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(GAME_WIDTH - 150, 120, 25, 0, Math.PI * 2);
        ctx.arc(GAME_WIDTH - 110, 110, 30, 0, Math.PI * 2);
        ctx.arc(GAME_WIDTH - 130, 140, 20, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw water areas
    for (const water of waterAreas) {
        water.draw(ctx);
    }

    // Draw platforms
    for (const platform of platforms) {
        platform.draw(ctx);
    }

    // Draw blocks
    for (const block of blocks) {
        block.draw(ctx);
    }

    // Draw enemies
    for (const enemy of enemies) {
        enemy.draw(ctx);
    }

    // Draw coins
    for (const coin of coins) {
        coin.draw(ctx);
    }

    // Draw power-ups
    for (const powerUp of powerUps) {
        powerUp.draw(ctx);
    }

    // Draw projectiles
    for (const projectile of projectiles) {
        projectile.draw(ctx);
    }

    // Draw flagpole
    if (flagpole) {
        flagpole.draw(ctx);
    }

    // Draw axe
    if (axe) {
        axe.draw(ctx);
    }

    // Draw springboards
    for (const springboard of springboards) {
        springboard.draw(ctx);
    }

    // Draw firebars
    for (const firebar of firebars) {
        firebar.draw(ctx);
    }

    // Draw thwomps
    for (const thwomp of thwomps) {
        thwomp.draw(ctx);
    }

    // Draw donut lifts
    for (const donutLift of donutLifts) {
        donutLift.draw(ctx);
    }

    // Draw P-Switches
    for (const pSwitch of pSwitches) {
        pSwitch.draw(ctx);
    }

    // Draw player (Mario)
    player.draw(ctx);
}

// Main Game Loop
function gameLoop() {
    update();
    draw();
    animationFrameId = requestAnimationFrame(gameLoop);
}

// --- Event Listeners and Initial Setup ---

// Initial setup on window load
window.addEventListener('load', () => {
    resizeCanvas();
    setupTouchControls(); // Initialize touch controls
    showMessage('Welcome to Mario!', 'Start Game', startGame);
});

// Resize canvas on window resize
window.addEventListener('resize', resizeCanvas);

// Start button click handler
startButton.addEventListener('click', () => {
    if (gameState === 'start') {
        startGame();
    } else if (gameState === 'game_over' || gameState === 'game_complete') {
        resetGame();
    } else if (gameState === 'level_complete') {
        nextLevel();
    }
});
