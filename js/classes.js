// --- Game Element Classes ---

// Base class for static rectangular objects
export class StaticObject {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    // Basic AABB collision check
    checkCollision(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }
}

// Player Class (inherits from StaticObject)
export class Player extends StaticObject {
    constructor(x, y, width, height, TILE_SIZE) {
        super(x, y, width, height, '#FF0000'); // Initial color (red for Mario)
        this.dx = 0;
        this.dy = 0;
        this.onGround = false;
        this.isJumping = false;
        this.facingRight = true;
        this.invincible = false;
        this.invincibilityTimer = 0;
        this.maxInvincibilityTime = 120;
        this.state = 'small'; // 'small', 'big', 'fire'
        this.growTimer = 0;
        this.shrinkTimer = 0;
        this.isGrowing = false;
        this.isShrinking = false;
        this.TILE_SIZE = TILE_SIZE; // Store TILE_SIZE for internal calculations
    }

    draw(ctx) {
        // Apply invincibility flicker
        if (this.invincible && this.invincibilityTimer % 10 < 5) {
            ctx.globalAlpha = 0.5; // Make player semi-transparent
        } else {
            ctx.globalAlpha = 1; // Fully opaque
        }

        let currentHeight = this.height;
        let currentWidth = this.width;
        let currentY = this.y;

        if (this.isGrowing) {
            const progress = (30 - this.growTimer) / 30;
            currentHeight = this.TILE_SIZE + (this.TILE_SIZE * 0.5) * progress;
            currentWidth = this.TILE_SIZE + (this.TILE_SIZE * 0.5) * progress;
            currentY = this.y + (this.height - currentHeight); // Adjust Y to grow upwards
        } else if (this.isShrinking) {
            const progress = this.shrinkTimer / 30;
            currentHeight = this.TILE_SIZE + (this.TILE_SIZE * 0.5) * progress;
            currentWidth = this.TILE_SIZE + (this.TILE_SIZE * 0.5) * progress;
            currentY = this.y + (this.height - currentHeight); // Adjust Y to shrink downwards
        }

        // Determine colors based on state
        let shirtColor = '#FF0000'; // Red
        let overallsColor = '#0000FF'; // Blue
        if (this.state === 'fire') {
            shirtColor = '#FFFFFF'; // White shirt for Fire Mario
            overallsColor = '#FF0000'; // Red overalls
        }

        // Body
        ctx.fillStyle = shirtColor;
        ctx.fillRect(this.x, currentY, currentWidth, currentHeight);

        ctx.fillStyle = overallsColor;
        ctx.fillRect(this.x, currentY + currentHeight * 0.5, currentWidth, currentHeight * 0.5);

        // Hat
        ctx.fillStyle = shirtColor;
        ctx.fillRect(this.x + currentWidth * 0.1, currentY - 5, currentWidth * 0.8, 10); // Hat brim
        ctx.fillRect(this.x + currentWidth * 0.2, currentY - 15, currentWidth * 0.6, 10); // Hat top

        // Face
        ctx.fillStyle = '#FFDEAD'; // NavajoWhite
        ctx.fillRect(this.x + currentWidth * 0.2, currentY + currentHeight * 0.1, currentWidth * 0.6, currentHeight * 0.4);

        // Eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(this.x + currentWidth * 0.35, currentY + currentHeight * 0.25, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + currentWidth * 0.65, currentY + currentHeight * 0.25, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(this.x + currentWidth * 0.35, currentY + currentHeight * 0.25, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + currentWidth * 0.65, currentY + currentHeight * 0.25, 1, 0, Math.PI * 2);
        ctx.fill();

        // Mustache
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x + currentWidth * 0.3, currentY + currentHeight * 0.35, currentWidth * 0.4, 3);

        // Reset globalAlpha after drawing player
        ctx.globalAlpha = 1;
    }
}

// Platform Class (extends StaticObject, adds 3D effect for blocks)
export class Platform extends StaticObject {
    constructor(x, y, width, height, color = '#8B4513') {
        super(x, y, width, height, color);
    }

    draw(ctx) {
        super.draw(ctx); // Draw the base rectangle
        // Simple 3D effect for blocks (if it's a standard block size)
        // Assuming TILE_SIZE is accessible or passed
        if (this.width === 30 && this.height === 30) { // Using hardcoded TILE_SIZE for now
            ctx.fillStyle = '#A0522D'; // Lighter brown for top
            ctx.fillRect(this.x, this.y, this.width, 3);
            ctx.fillStyle = '#654321'; // Darker brown for side
            ctx.fillRect(this.x + this.width - 3, this.y + 3, 3, this.height - 3);
        }
    }
}

// Block Class (for question mark, brick, and hidden blocks)
export class Block extends StaticObject {
    constructor(x, y, TILE_SIZE, type, content = null) { // type: 'question', 'brick', 'hidden', 'pipe'
        super(x, y, TILE_SIZE, TILE_SIZE, '#FFD700'); // Default to gold for question block
        this.originalY = y; // Store original Y for bounce
        this.type = type;
        this.content = content; // 'coin', 'mushroom', 'fireflower', '1up', 'pipe_warp'
        this.hit = false; // For question blocks, once hit, they become empty
        this.bounceOffset = 0; // For bounce animation
        this.bounceSpeed = 2;
        this.bounceHeight = 10;
        this.originalType = type; // Store original type for P-Switch
        this.TILE_SIZE = TILE_SIZE;

        if (type === 'brick') {
            this.color = '#A0522D'; // Brown for brick
        } else if (type === 'hidden') {
            this.color = 'rgba(0,0,0,0)'; // Invisible
            this.visible = false;
        } else if (type === 'pipe') {
            this.color = '#008000'; // Green for pipe top
        }
    }

    draw(ctx) {
        if (this.type === 'hidden' && !this.visible) return; // Don't draw if hidden and not visible

        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y + this.bounceOffset, this.width, this.height);

        if (this.type === 'question' && !this.hit) {
            // Draw question mark
            ctx.fillStyle = '#8B4513'; // Brown
            ctx.font = 'bold 20px Arial'; // Simple font for '?'
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', this.x + this.width / 2, this.y + this.height / 2 + this.bounceOffset);
        } else if (this.type === 'question' && this.hit) {
            // Draw empty block
            ctx.fillStyle = '#696969'; // Grey
            ctx.fillRect(this.x, this.y + this.bounceOffset, this.width, this.height);
            ctx.fillStyle = '#333333'; // Darker grey for lines
            ctx.fillRect(this.x + 5, this.y + 5 + this.bounceOffset, this.width - 10, 2);
            ctx.fillRect(this.x + 5, this.y + this.height - 7 + this.bounceOffset, this.width - 10, 2);
        } else if (this.type === 'brick') {
            // Draw brick pattern
            ctx.fillStyle = '#654321'; // Darker brown for lines
            ctx.fillRect(this.x, this.y + this.height / 2, this.width, 2);
            ctx.fillRect(this.x + this.width / 3, this.y, 2, this.height / 2);
            ctx.fillRect(this.x + this.width * 2 / 3, this.y + this.height / 2, 2, this.height / 2);
        } else if (this.type === 'pipe') {
            // Draw pipe top lip
            ctx.fillStyle = '#006400'; // Darker green
            ctx.fillRect(this.x - 5, this.y + this.bounceOffset, this.width + 10, 5);
            // Draw pipe body
            ctx.fillStyle = '#008000'; // Green
            ctx.fillRect(this.x, this.y + 5 + this.bounceOffset, this.width, this.height - 5);
        } else if (this.type === 'coin_block_temp') { // For P-Switch transformed blocks
            ctx.fillStyle = '#FFD700'; // Gold
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2 + this.bounceOffset, this.width / 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    update() {
        if (this.bounceOffset < 0) {
            this.bounceOffset += this.bounceSpeed;
            if (this.bounceOffset >= 0) {
                this.bounceOffset = 0;
            }
        }
    }

    // Trigger bounce animation
    doBounce() {
        this.bounceOffset = -this.bounceHeight;
    }
}

// PowerUp Class (for mushrooms, fire flowers, 1-ups)
export class PowerUp extends StaticObject {
    constructor(x, y, TILE_SIZE, type, GRAVITY) { // type: 'mushroom', 'fireflower', '1up'
        super(x, y, TILE_SIZE, TILE_SIZE, '#FF0000'); // Default mushroom red
        this.type = type;
        this.dx = 1; // Power-ups move slightly
        this.dy = 0;
        this.onGround = false;
        this.GRAVITY = GRAVITY;
        this.TILE_SIZE = TILE_SIZE;

        if (type === 'fireflower') {
            this.color = '#FFA500'; // Orange
        } else if (type === '1up') {
            this.color = '#00FF00'; // Green
        } else if (type === 'superstar') {
            this.color = '#FFFF00'; // Yellow
        }
    }

    update(platforms, blocks, GAME_WIDTH) {
        this.dy += this.GRAVITY;
        this.x += this.dx;
        this.y += this.dy;

        // Simple collision with ground/platforms
        this.onGround = false;
        for (const platform of platforms) {
            if (this.checkCollision(platform)) {
                if (this.dy > 0 && this.y + this.height - this.dy <= platform.y) {
                    this.y = platform.y - this.height;
                    this.dy = 0;
                    this.onGround = true;
                }
            }
        }
        for (const block of blocks) {
            if (block.type !== 'hidden' && this.checkCollision(block)) {
                if (this.dy > 0 && this.y + this.height - this.dy <= block.y) {
                    this.y = block.y - this.height;
                    this.dy = 0;
                    this.onGround = true;
                }
            }
        }

        // Reverse if hitting side of canvas
        if (this.x < 0 || this.x + this.width > GAME_WIDTH) {
            this.dx *= -1;
        }
    }

    draw(ctx) {
        if (this.type === 'mushroom' || this.type === '1up') {
            // Mushroom cap
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, Math.PI, Math.PI * 2);
            ctx.fill();
            // Mushroom stem
            ctx.fillStyle = '#FFDEAD'; // Skin tone
            ctx.fillRect(this.x + this.width / 4, this.y + this.height / 2, this.width / 2, this.height / 2);
            // Spots
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(this.x + this.width * 0.3, this.y + this.height * 0.3, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + this.width * 0.7, this.y + this.height * 0.3, 3, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'fireflower') {
            // Petals
            ctx.fillStyle = this.color; // Orange
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height * 0.3, this.width * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFFF00'; // Yellow center
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height * 0.3, this.width * 0.2, 0, Math.PI * 2);
            ctx.fill();
            // Stem
            ctx.fillStyle = '#008000'; // Green
            ctx.fillRect(this.x + this.width / 2 - 2, this.y + this.height * 0.3, 4, this.height * 0.7);
        } else if (this.type === 'superstar') {
            ctx.fillStyle = this.color; // Yellow
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y);
            for (let i = 0; i < 5; i++) {
                ctx.lineTo(this.x + this.width / 2 + this.width / 2 * Math.sin(i * Math.PI * 2 / 5 * 2 + Math.PI / 2),
                           this.y + this.height / 2 - this.height / 2 * Math.cos(i * Math.PI * 2 / 5 * 2 + Math.PI / 2));
                ctx.lineTo(this.x + this.width / 2 + this.width / 4 * Math.sin(i * Math.PI * 2 / 5 * 2 + Math.PI / 2 + Math.PI / 5),
                           this.y + this.height / 2 - this.height / 4 * Math.cos(i * Math.PI * 2 / 5 * 2 + Math.PI / 2 + Math.PI / 5));
            }
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#DAA520'; // Gold outline
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}

// Enemy Class (Base for all enemies)
export class Enemy extends StaticObject {
    constructor(x, y, TILE_SIZE, GRAVITY, JUMP_STRENGTH, type, speed, range = 0) { // type: 'goomba', 'koopa_green', 'koopa_red', 'buzzy', 'cheep_cheep', 'hammer_bro', 'dry_bones', 'mini_bowser'
        super(x, y, TILE_SIZE, TILE_SIZE, '#8B4513'); // Default Goomba brown
        this.type = type;
        this.dx = speed;
        this.dy = 0;
        this.originalX = x;
        this.range = range;
        this.onGround = false;
        this.isShelled = false; // For Koopas
        this.shellTimer = 0; // For Koopa shell duration
        this.maxShellTime = 300; // Frames for shell to revert
        this.isDead = false; // For Dry Bones and general removal
        this.hitPoints = 1; // For mini-boss
        this.tempInvincible = false; // For mini-boss after hit
        this.TILE_SIZE = TILE_SIZE;
        this.GRAVITY = GRAVITY;
        this.JUMP_STRENGTH = JUMP_STRENGTH;

        // Type-specific properties
        if (type === 'koopa_green' || type === 'koopa_red') {
            this.color = (type === 'koopa_green') ? '#00FF00' : '#FF0000'; // Green or Red
            this.shellColor = '#654321'; // Brown shell
        } else if (type === 'buzzy') {
            this.color = '#333333'; // Dark grey
        } else if (type === 'cheep_cheep') {
            this.color = '#FF4500'; // Orange-red
            this.width = TILE_SIZE * 1.5; // Wider fish
            this.height = TILE_SIZE;
            this.y -= TILE_SIZE / 2; // Adjust for water level
        } else if (type === 'hammer_bro') {
            this.color = '#0000FF'; // Blue
            this.width = TILE_SIZE;
            this.height = TILE_SIZE * 1.5; // Taller
            this.jumpTimer = 0;
            this.jumpInterval = 90; // Frames between jumps
            this.throwTimer = 0;
            this.throwInterval = 60; // Frames between throws
        } else if (type === 'dry_bones') {
            this.color = '#CCCCCC'; // Light grey for bones
            this.isDead = false; // Is currently a pile of bones
            this.reanimateTimer = 0;
            this.maxReanimateTime = 180; // Frames to reanimate
        } else if (type === 'mini_bowser') {
            this.color = '#008000'; // Greenish for Bowser
            this.width = TILE_SIZE * 1.5;
            this.height = TILE_SIZE * 1.5;
            this.fireballTimer = 0;
            this.fireballInterval = 120;
            this.hitPoints = 3; // Mini Bowser takes 3 hits
            this.tempInvincibleTimer = 0;
        }
    }

    update(platforms, blocks, GAME_WIDTH, GAME_HEIGHT) {
        if (this.isDead && this.type !== 'dry_bones') return; // Dead enemies (except Dry Bones) don't update

        // Apply gravity (except for Cheep Cheeps in water)
        if (this.type !== 'cheep_cheep') {
            this.dy += this.GRAVITY;
        }

        // Update position
        this.x += this.dx;
        this.y += this.dy;

        // Horizontal movement for patrolling enemies
        if (this.range > 0 && !this.isShelled) {
            if (this.x <= this.originalX - this.range || this.x + this.width >= this.originalX + this.range + this.width) {
                this.dx *= -1;
            }
        }

        // Koopa shell logic
        if (this.isShelled) {
            this.shellTimer--;
            if (this.shellTimer <= 0 && this.dx === 0) { // Only revert if not moving
                this.isShelled = false;
                this.dx = (this.x > this.originalX ? 1 : -1) * (this.type === 'koopa_green' ? 1.5 : 2); // Revert to original speed
                // Revert to original position if it moved too far
                this.x = this.originalX;
            }
        }

        // Dry Bones reanimation
        if (this.type === 'dry_bones' && this.isDead) {
            this.reanimateTimer--;
            if (this.reanimateTimer <= 0) {
                this.isDead = false; // Reanimate
                this.dx = (this.dx > 0 ? 1 : -1) * 1; // Start walking again
            }
        }

        // Hammer Bro behavior
        if (this.type === 'hammer_bro' && !this.isDead) {
            this.jumpTimer++;
            if (this.jumpTimer >= this.jumpInterval && this.onGround) {
                this.dy = this.JUMP_STRENGTH * 0.7; // Smaller jump
                this.jumpTimer = 0;
            }
            this.throwTimer++;
            if (this.throwTimer >= this.throwInterval) {
                // Projectiles need to be added to the global projectiles array in game.js
                // This will be handled in the main game loop's update function
                // For now, just simulate the throw
                // projectiles.push(new Projectile(this.x + this.width / 2, this.y + this.height / 2, 'hammer', this.dx > 0 ? 3 : -3, 0));
                this.throwTimer = 0;
            }
        }

        // Mini Bowser behavior
        if (this.type === 'mini_bowser' && !this.isDead) {
            this.fireballTimer++;
            if (this.fireballTimer >= this.fireballInterval) {
                // Projectiles need to be added to the global projectiles array in game.js
                // projectiles.push(new Projectile(this.x + this.width / 2, this.y + this.height / 2, 'fireball_enemy', this.dx > 0 ? 2 : -2, 0));
                this.fireballTimer = 0;
            }
            if (this.tempInvincibleTimer > 0) {
                this.tempInvincibleTimer--;
            }
        }

        // Collision with platforms/ground
        this.onGround = false;
        let collidedWithPlatform = false;
        for (const platform of platforms) {
            if (this.checkCollision(platform)) {
                if (this.dy > 0 && this.y + this.height - this.dy <= platform.y) {
                    this.y = platform.y - this.height;
                    this.dy = 0;
                    this.onGround = true;
                    collidedWithPlatform = true;
                }
            }
        }
        for (const block of blocks) {
            if (block.type !== 'hidden' && this.checkCollision(block)) {
                if (this.dy > 0 && this.y + this.height - this.dy <= block.y) {
                    this.y = block.y - this.height;
                    this.dy = 0;
                    this.onGround = true;
                    collidedWithPlatform = true;
                }
            }
        }

        // Koopa Red: turn around at edge of platform
        if (this.type === 'koopa_red' && !this.isShelled && this.onGround && this.dx !== 0) {
            // Check if there's no platform ahead
            const lookAheadX = this.x + (this.dx > 0 ? this.width : 0) + this.dx * 5; // Look slightly ahead
            const lookAheadY = this.y + this.height + 5; // Look slightly below
            let foundPlatformAhead = false;
            for (const p of platforms.concat(blocks.filter(b => b.type !== 'hidden' && b.type !== 'coin_block_temp'))) {
                if (lookAheadX >= p.x && lookAheadX <= p.x + p.width && lookAheadY >= p.y && lookAheadY <= p.y + p.height) {
                    foundPlatformAhead = true;
                    break;
                }
            }
            if (!foundPlatformAhead) {
                this.dx *= -1; // Turn around
            }
        }

        // Fall to ground if no platform below and not already on ground (except Cheep Cheeps)
        if (this.type !== 'cheep_cheep' && !collidedWithPlatform && this.y + this.height > GAME_HEIGHT - this.TILE_SIZE) {
            this.y = GAME_HEIGHT - this.TILE_SIZE - this.height;
            this.dy = 0;
            this.onGround = true;
        }
    }

    draw(ctx) {
        if (this.isDead && this.type !== 'dry_bones') return; // Don't draw if dead (except Dry Bones)

        // Invincibility flicker for Dry Bones when dead or Mini Bowser when hit
        if ((this.type === 'dry_bones' && this.isDead && this.reanimateTimer % 10 < 5) ||
            (this.type === 'mini_bowser' && this.tempInvincibleTimer > 0 && this.tempInvincibleTimer % 10 < 5)) {
            ctx.globalAlpha = 0.5;
        }

        ctx.fillStyle = this.color;
        if (this.isShelled) {
            ctx.fillStyle = this.shellColor;
            ctx.fillRect(this.x, this.y + this.height / 2, this.width, this.height / 2); // Shell body
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        // Type-specific drawing details
        if (this.type === 'goomba') {
            ctx.fillStyle = '#FFFFFF'; // Eyes
            ctx.beginPath();
            ctx.arc(this.x + this.width * 0.3, this.y + this.height * 0.3, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + this.width * 0.7, this.y + this.height * 0.3, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000000'; // Mouth
            ctx.fillRect(this.x + this.width * 0.3, this.y + this.height * 0.7, this.width * 0.4, 3);
        } else if (this.type === 'koopa_green' || this.type === 'koopa_red') {
            if (!this.isShelled) {
                ctx.fillStyle = '#FFDEAD'; // Skin tone for head
                ctx.beginPath();
                ctx.arc(this.x + this.width / 2, this.y + this.height * 0.2, this.width * 0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#000000'; // Eyes
                ctx.beginPath();
                ctx.arc(this.x + this.width * 0.4, this.y + this.height * 0.15, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(this.x + this.width * 0.6, this.y + this.height * 0.15, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (this.type === 'buzzy') {
            ctx.fillStyle = '#8B4513'; // Shell top
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height * 0.3, this.width * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF'; // Eyes
            ctx.beginPath();
            ctx.arc(this.x + this.width * 0.3, this.y + this.height * 0.4, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + this.width * 0.7, this.y + this.height * 0.4, 3, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'cheep_cheep') {
            ctx.fillStyle = '#FFFFFF'; // Eye
            ctx.beginPath();
            ctx.arc(this.x + this.width * (this.dx > 0 ? 0.2 : 0.8), this.y + this.height * 0.3, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000000'; // Pupil
            ctx.beginPath();
            ctx.arc(this.x + this.width * (this.dx > 0 ? 0.2 : 0.8), this.y + this.height * 0.3, 2, 0, Math.PI * 2);
            ctx.fill();
            // Fins
            ctx.fillStyle = '#FF8C00'; // Darker orange
            ctx.beginPath();
            ctx.moveTo(this.x + this.width * (this.dx > 0 ? 0.9 : 0.1), this.y + this.height * 0.5);
            ctx.lineTo(this.x + this.width * (this.dx > 0 ? 1 : 0), this.y + this.height * 0.3);
            ctx.lineTo(this.x + this.width * (this.dx > 0 ? 1 : 0), this.y + this.height * 0.7);
            ctx.closePath();
            ctx.fill();
        } else if (this.type === 'hammer_bro') {
            ctx.fillStyle = '#FFDEAD'; // Skin tone
            ctx.fillRect(this.x + this.width * 0.1, this.y + this.height * 0.1, this.width * 0.8, this.height * 0.4);
            ctx.fillStyle = '#000000'; // Eyes
            ctx.beginPath();
            ctx.arc(this.x + this.width * 0.3, this.y + this.height * 0.25, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + this.width * 0.7, this.y + this.height * 0.25, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#A0522D'; // Helmet
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height * 0.1, this.width * 0.6, Math.PI, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'dry_bones') {
            if (!this.isDead) { // Alive
                ctx.fillStyle = '#000000'; // Eyes
                ctx.beginPath();
                ctx.arc(this.x + this.width * 0.3, this.y + this.height * 0.3, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(this.x + this.width * 0.7, this.y + this.height * 0.3, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#000000'; // Mouth
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(this.x + this.width * 0.3, this.y + this.height * 0.7);
                ctx.lineTo(this.x + this.width * 0.7, this.y + this.height * 0.7);
                ctx.stroke();
            } else { // Dead (pile of bones)
                ctx.fillStyle = '#CCCCCC';
                ctx.fillRect(this.x + this.width * 0.2, this.y + this.height * 0.7, this.width * 0.6, this.height * 0.3);
                ctx.beginPath();
                ctx.arc(this.x + this.width * 0.5, this.y + this.height * 0.5, this.width * 0.3, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (this.type === 'mini_bowser') {
            ctx.fillStyle = '#FF4500'; // Orange belly
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height * 0.7, this.width * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000000'; // Eyes
            ctx.beginPath();
            ctx.arc(this.x + this.width * 0.35, this.y + this.height * 0.3, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + this.width * 0.65, this.y + this.height * 0.3, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF'; // Pupils
            ctx.beginPath();
            ctx.arc(this.x + this.width * 0.35, this.y + this.height * 0.3, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + this.width * 0.65, this.y + this.height * 0.3, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#654321'; // Horns
            ctx.beginPath();
            ctx.moveTo(this.x + this.width * 0.2, this.y + this.height * 0.1);
            ctx.lineTo(this.x + this.width * 0.3, this.y);
            ctx.lineTo(this.x + this.width * 0.4, this.y + this.height * 0.1);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(this.x + this.width * 0.8, this.y + this.height * 0.1);
            ctx.lineTo(this.x + this.width * 0.7, this.y);
            ctx.lineTo(this.x + this.width * 0.6, this.y + this.height * 0.1);
            ctx.fill();
        }

        ctx.globalAlpha = 1; // Reset alpha
    }
}

// Coin Class
export class Coin extends StaticObject {
    constructor(x, y, radius) {
        super(x, y, radius * 2, radius * 2, '#FFD700'); // Use radius for width/height for AABB
        this.radius = radius;
        this.collected = false;
    }

    draw(ctx) {
        if (!this.collected) {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x + this.radius, this.y + this.radius, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#DAA520'; // Darker gold outline
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    // Check if player collects coin
    checkCollection(player) {
        if (this.collected) return false;
        // Use center points for circle-rectangle collision approximation
        const circleX = this.x + this.radius;
        const circleY = this.y + this.radius;
        const rectX = player.x;
        const rectY = player.y;
        const rectWidth = player.width;
        const rectHeight = player.height;

        const closestX = Math.max(rectX, Math.min(circleX, rectX + rectWidth));
        const closestY = Math.max(rectY, Math.min(circleY, rectY + rectHeight));

        const distanceX = circleX - closestX;
        const distanceY = circleY - closestY;

        return (distanceX * distanceX + distanceY * distanceY) < (this.radius * this.radius);
    }
}

// Flagpole Class
export class Flagpole extends StaticObject {
    constructor(x, y, height) {
        super(x, y, 10, height, '#696969'); // Pole color
        this.flagX = x - 20; // Flag position
        this.flagY = y + 20;
        this.flagWidth = 30;
        this.flagHeight = 20;
        this.reached = false;
    }

    draw(ctx) {
        // Pole
        super.draw(ctx);

        // Base
        ctx.fillStyle = '#A0522D'; // Brown base
        ctx.fillRect(this.x - 10, this.y + this.height - 10, this.width + 20, 10);

        // Flag
        ctx.fillStyle = '#FF4500'; // Orange-red flag
        ctx.beginPath();
        ctx.moveTo(this.flagX, this.flagY);
        ctx.lineTo(this.flagX + this.flagWidth, this.flagY + this.flagHeight / 2);
        ctx.lineTo(this.flagX, this.flagY + this.flagHeight);
        ctx.closePath();
        ctx.fill();
    }

    checkReach(player) {
        if (this.reached) return false;
        return player.x + player.width > this.x && player.x < this.x + this.width &&
               player.y + player.height > this.y;
    }
}

// Axe Class (for Bowser's Mini-Fortress)
export class Axe extends StaticObject {
    constructor(x, y, TILE_SIZE) {
        super(x, y, TILE_SIZE, TILE_SIZE, '#A0522D'); // Handle color
        this.cut = false;
    }

    draw(ctx) {
        if (this.cut) return;
        ctx.fillStyle = '#8B4513'; // Handle
        ctx.fillRect(this.x + this.width / 3, this.y, this.width / 3, this.height);
        ctx.fillStyle = '#696969'; // Blade
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height / 3);
        ctx.lineTo(this.x + this.width / 3, this.y);
        ctx.lineTo(this.x + this.width * 2 / 3, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height / 3);
        ctx.lineTo(this.x + this.width * 2 / 3, this.y + this.height);
        ctx.lineTo(this.x + this.width / 3, this.y + this.height);
        ctx.closePath();
        ctx.fill();
    }
}

// Projectile Class (for Fireballs and Hammers)
export class Projectile extends StaticObject {
    constructor(x, y, type, dx, dy, GRAVITY) { // type: 'fireball_player', 'hammer', 'fireball_enemy'
        super(x, y, 10, 10, '#FF4500'); // Default fireball color
        this.type = type;
        this.dx = dx;
        this.dy = dy;
        this.onGround = false;
        this.bounces = 0; // For player fireballs
        this.maxBounces = 3;
        this.active = true; // To mark for removal
        this.GRAVITY = GRAVITY;

        if (type === 'hammer') {
            this.color = '#654321'; // Brown for hammer
            this.width = 15;
            this.height = 15;
        } else if (type === 'fireball_enemy') {
            this.color = '#FF0000'; // Red for enemy fireball
        }
    }

    update(platforms, blocks, GAME_WIDTH, GAME_HEIGHT) {
        if (!this.active) return;

        this.dy += this.GRAVITY * 0.5; // Lighter gravity for projectiles
        this.x += this.dx;
        this.y += this.dy;

        // Collision with platforms/blocks
        for (const platform of platforms.concat(blocks.filter(b => b.type !== 'hidden' && b.type !== 'coin_block_temp'))) {
            if (this.checkCollision(platform)) {
                if (this.dy > 0 && this.y + this.height - this.dy <= platform.y) { // Hit top of platform
                    this.y = platform.y - this.height;
                    this.dy = -this.dy * 0.7; // Bounce
                    this.bounces++;
                } else if (this.dx !== 0) { // Hit side of platform
                    this.dx *= -1; // Bounce horizontally
                }
            }
        }

        // Deactivate if out of bounds or too many bounces
        if (this.y > GAME_HEIGHT || this.x < -this.width || this.x > GAME_WIDTH || (this.type === 'fireball_player' && this.bounces >= this.maxBounces)) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.fillStyle = this.color;
        if (this.type === 'fireball_player' || this.type === 'fireball_enemy') {
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'hammer') {
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

// Springboard Class
export class Springboard extends StaticObject {
    constructor(x, y, TILE_SIZE) {
        super(x, y, TILE_SIZE, TILE_SIZE, '#8B4513'); // Base color
        this.springY = 0; // For compression animation
        this.springSpeed = 5;
        this.compressed = false;
    }

    draw(ctx) {
        // Base
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y + this.springY, this.width, this.height - this.springY);
        // Spring
        ctx.fillStyle = '#CCCCCC'; // Grey
        ctx.fillRect(this.x + this.width / 4, this.y + this.springY, this.width / 2, 10);
        ctx.fillRect(this.x + this.width / 4, this.y + this.height / 2 + this.springY, this.width / 2, 10);
    }

    compress() {
        this.compressed = true;
        this.springY = this.height / 2;
    }

    release() {
        this.compressed = false;
        this.springY = 0;
    }
}

// FireBar Class
export class FireBar {
    constructor(centerX, centerY, radius, numBalls, speed) {
        this.centerX = centerX;
        this.centerY = centerY;
        this.radius = radius;
        this.numBalls = numBalls;
        this.speed = speed; // Radians per frame
        this.angle = 0;
        this.ballSize = 8;
        this.color = '#FF4500'; // Orange-red
    }

    update() {
        this.angle += this.speed;
    }

    draw(ctx) {
        for (let i = 0; i < this.numBalls; i++) {
            const currentAngle = this.angle + (i * (Math.PI * 2 / this.numBalls));
            const ballX = this.centerX + this.radius * Math.cos(currentAngle);
            const ballY = this.centerY + this.radius * Math.sin(currentAngle);

            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(ballX, ballY, this.ballSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Check collision with player
    checkCollision(player) {
        for (let i = 0; i < this.numBalls; i++) {
            const currentAngle = this.angle + (i * (Math.PI * 2 / this.numBalls));
            const ballX = this.centerX + this.radius * Math.cos(currentAngle);
            const ballY = this.centerY + this.radius * Math.sin(currentAngle);

            // Simple circle-rectangle collision
            const closestX = Math.max(player.x, Math.min(ballX, player.x + player.width));
            const closestY = Math.max(player.y, Math.min(ballY, player.y + player.height));

            const distanceX = ballX - closestX;
            const distanceY = ballY - closestY;

            if ((distanceX * distanceX + distanceY * distanceY) < (this.ballSize * this.ballSize)) {
                return true;
            }
        }
        return false;
    }
}

// Thwomp Class
export class Thwomp extends StaticObject {
    constructor(x, y, TILE_SIZE, dropHeight, dropSpeed) {
        super(x, y, TILE_SIZE * 1.5, TILE_SIZE * 1.5, '#696969'); // Grey
        this.originalY = y;
        this.dropHeight = dropHeight;
        this.dropSpeed = dropSpeed;
        this.state = 'idle'; // 'idle', 'dropping', 'resting', 'rising'
        this.restTimer = 0;
        this.maxRestTime = 60; // Frames to rest at bottom
    }

    update(player) {
        if (this.state === 'idle') {
            // Check if player is below
            if (player.x + player.width > this.x && player.x < this.x + this.width && player.y + player.height > this.y) {
                this.state = 'dropping';
            }
        } else if (this.state === 'dropping') {
            this.y += this.dropSpeed;
            if (this.y >= this.originalY + this.dropHeight) {
                this.y = this.originalY + this.dropHeight;
                this.state = 'resting';
                this.restTimer = this.maxRestTime;
            }
        } else if (this.state === 'resting') {
            this.restTimer--;
            if (this.restTimer <= 0) {
                this.state = 'rising';
            }
        } else if (this.state === 'rising') {
            this.y -= this.dropSpeed / 2; // Rise slower
            if (this.y <= this.originalY) {
                this.y = this.originalY;
                this.state = 'idle';
            }
        }
    }

    draw(ctx) {
        super.draw(ctx);
        ctx.fillStyle = '#333333'; // Darker grey for eyes/mouth
        // Eyes
        ctx.fillRect(this.x + this.width * 0.2, this.y + this.height * 0.3, this.width * 0.2, this.height * 0.15);
        ctx.fillRect(this.x + this.width * 0.6, this.y + this.height * 0.3, this.width * 0.2, this.height * 0.15);
        // Mouth
        ctx.fillRect(this.x + this.width * 0.3, this.y + this.height * 0.6, this.width * 0.4, this.height * 0.1);
    }
}

// DonutLift Class
export class DonutLift extends StaticObject {
    constructor(x, y, TILE_SIZE, GRAVITY) {
        super(x, y, TILE_SIZE * 2, TILE_SIZE / 2, '#A0522D'); // Brown
        this.fallTimer = 0;
        this.maxFallTime = 60; // Frames before falling
        this.falling = false;
        this.originalY = y;
        this.GRAVITY = GRAVITY;
    }

    update() {
        if (this.falling) {
            this.y += this.GRAVITY * 2; // Fall faster
        }
    }

    draw(ctx) {
        super.draw(ctx);
        ctx.fillStyle = '#654321'; // Darker for holes
        ctx.beginPath();
        ctx.arc(this.x + this.width / 4, this.y + this.height / 2, this.height / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + this.width * 3 / 4, this.y + this.height / 2, this.height / 4, 0, Math.PI * 2);
        ctx.fill();
    }

    startFall() {
        if (!this.falling) {
            this.fallTimer = this.maxFallTime;
        }
    }

    reset() {
        this.y = this.originalY;
        this.falling = false;
        this.fallTimer = 0;
    }
}

// P_Switch Class
export class P_Switch extends StaticObject {
    constructor(x, y, TILE_SIZE) {
        super(x, y, TILE_SIZE, TILE_SIZE, '#800080'); // Purple
        this.pressed = false;
        this.activeTimer = 0;
        this.maxActiveTime = 300; // 5 seconds
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y + (this.pressed ? this.height / 2 : 0), this.width, this.height - (this.pressed ? this.height / 2 : 0));
        ctx.fillStyle = '#FFFFFF'; // P letter
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('P', this.x + this.width / 2, this.y + this.height / 2 + (this.pressed ? this.height / 4 : 0));
    }

    press() {
        if (!this.pressed) {
            this.pressed = true;
            this.activeTimer = this.maxActiveTime;
            // Sound: P-Switch sound
        }
    }

    update() {
        if (this.pressed && this.activeTimer > 0) {
            this.activeTimer--;
            if (this.activeTimer <= 0) {
                this.pressed = false;
                // Sound: P-Switch deactivation sound
            }
        }
    }
}
