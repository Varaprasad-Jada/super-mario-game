// Import necessary classes for level data instantiation
// These imports are for the level data structure, not for direct use in this file's logic
// The classes will be passed to the game.js to create actual objects.
// This file just defines the blueprints for the levels.

// Note: TILE_SIZE, GRAVITY, JUMP_STRENGTH are constants from game.js
// They are not directly used here but are implicitly part of the level design.

export const levelData = [
    // Level 1-1: Grassy Beginnings
    {
        playerStart: { x: 50, y: 390 }, // GAME_HEIGHT - TILE_SIZE * 2
        platforms: [
            { x: 0, y: 420, width: 800, height: 30, color: '#32CD32' }, // Ground
            { x: 100, y: 390, width: 60, height: 30, color: '#32CD32' }, // Small hill
            { x: 250, y: 360, width: 30, height: 30, color: '#32CD32' }, // Hill
            { x: 400, y: 390, width: 90, height: 30, color: '#32CD32' }, // Longer hill
            { x: 600, y: 360, width: 60, height: 30, color: '#32CD32' }, // Another hill
            { x: 300, y: 270, width: 60, height: 30, color: '#32CD32' } // Platform for hidden coin heaven
        ],
        blocks: [
            { x: 180, y: 330, type: 'question', content: 'coin' },
            { x: 210, y: 330, type: 'question', content: 'mushroom' },
            { x: 240, y: 330, type: 'brick' },
            { x: 450, y: 330, type: 'question', content: 'coin' },
            { x: 480, y: 330, type: 'question', content: 'fireflower' },
            { x: 510, y: 330, type: 'brick' },
            { x: 510, y: 300, type: 'hidden', content: '1up' }, // Hidden 1-Up above bricks
            { x: 680, y: 390, type: 'pipe', content: 'warp_1-2_start' }, // Pipe to Level 1-2 (main exit)

            // Secret Warp Zone (The Infamous -1 World homage)
            // This pipe is intentionally placed high and looks like a regular pipe, but is 'hidden'
            // The content 'warp_level_3' will send Mario to level index 3 (Level 1-4)
            { x: 550, y: 240, type: 'hidden', content: 'warp_level_3' }, // Secret pipe to Level 4 (index 3)
            { x: 500, y: 240, type: 'hidden', content: 'superstar' }, // Hidden Starman near warp zone to guide player

            // Hidden Coin Heaven (invisible staircase)
            { x: 240, y: 360, type: 'hidden', content: 'coin' }, // Invisible block to start staircase
            { x: 270, y: 330, type: 'hidden', content: 'coin' },
            { x: 300, y: 300, type: 'hidden', content: 'coin' }, // Leads to platform above
            { x: 330, y: 300, type: 'hidden', content: 'coin' },
            { x: 360, y: 300, type: 'hidden', content: 'coin' },
            { x: 390, y: 300, type: 'hidden', content: 'coin' },
            { x: 420, y: 300, type: 'hidden', content: 'coin' },
            { x: 450, y: 300, type: 'hidden', content: 'coin' },
            { x: 480, y: 300, type: 'hidden', content: 'coin' },
            { x: 510, y: 300, type: 'hidden', content: 'coin' },
            { x: 540, y: 300, type: 'hidden', content: 'coin' },
            { x: 570, y: 300, type: 'hidden', content: 'coin' },
            { x: 600, y: 300, type: 'hidden', content: 'coin' },
            { x: 630, y: 300, type: 'hidden', content: 'coin' },
            { x: 660, y: 300, type: 'hidden', content: 'coin' },
            { x: 690, y: 300, type: 'hidden', content: 'coin' },
            { x: 720, y: 300, type: 'hidden', content: 'coin' }
        ],
        enemies: [
            { x: 120, y: 390, type: 'goomba', speed: 1.5, range: 30 },
            { x: 300, y: 390, type: 'koopa_green', speed: 1.5, range: 50 },
            { x: 420, y: 390, type: 'goomba', speed: 1.5, range: 20 },
            { x: 550, y: 330, type: 'koopa_green', speed: 1.5, range: 40 }
        ],
        coins: [
            { x: 195, y: 300, radius: 8 },
            { x: 225, y: 300, radius: 8 },
            { x: 465, y: 300, radius: 8 }
        ],
        flagpole: { x: 750, y: 300, height: 120 }, // GAME_HEIGHT - TILE_SIZE * 5 = 300
        water: [],
        springboards: [],
        firebars: [],
        thwomps: [],
        donutLifts: [],
        axe: null,
        pSwitches: []
    },
    // Level 1-2: Underground Tunnel (Secrets Edition)
    {
        playerStart: { x: 50, y: 390 },
        platforms: [
            { x: 0, y: 420, width: 800, height: 30, color: '#A0522D' }, // Ground
            { x: 0, y: 0, width: 30, height: 390, color: '#A0522D' }, // Left wall
            { x: 770, y: 0, width: 30, height: 390, color: '#A0522D' }, // Right wall
            { x: 0, y: 0, width: 800, height: 30, color: '#A0522D' }, // Ceiling
            { x: 60, y: 360, width: 90, height: 30, color: '#A0522D' }, // Platform after entrance pipe
            { x: 180, y: 300, width: 90, height: 30, color: '#A0522D' },
            { x: 360, y: 240, width: 60, height: 30, color: '#A0522D' },
            { x: 480, y: 390, width: 30, height: 30, color: '#A0522D' }, // Small platform over water
            { x: 600, y: 330, width: 60, height: 30, color: '#A0522D' }, // Floating platform
            { x: 700, y: 390, width: 60, height: 30, color: '#A0522D' } // Platform near exit
        ],
        blocks: [
            { x: 50, y: 390, type: 'pipe', content: 'warp_1-2_underground' }, // Entrance pipe (visual only, actual warp handled in game.js)
            { x: 120, y: 270, type: 'question', content: 'coin' },
            { x: 240, y: 210, type: 'brick' },
            { x: 240, y: 180, type: 'hidden', content: 'coin' }, // Hidden coin block
            { x: 300, y: 330, type: 'question', content: 'coin' },
            { x: 700, y: 300, type: 'pipe', content: 'warp_1-3_start' }, // Exit pipe to Level 1-3

            // Narrow Passages (represented by tight spacing and a hidden block)
            { x: 150, y: 390, type: 'hidden', content: 'coin' }, // Hidden coin in narrow passage (just before fake wall)
            { x: 180, y: 390, type: 'brick', content: 'fake_wall' }, // Fake wall
            { x: 210, y: 390, type: 'brick', content: 'fake_wall' }, // Fake wall
            { x: 240, y: 390, type: 'brick', content: 'fake_wall' }, // Fake wall

            // Hidden Power-Up in water (will appear if Mario stays at bottom-left of water)
            { x: 450, y: 405, type: 'hidden', content: 'fireflower' }, // Hidden in water

            // Hidden block path to alternate exit
            { x: 600, y: 270, type: 'hidden', content: 'coin' },
            { x: 630, y: 270, type: 'hidden', content: 'coin' },
            { x: 660, y: 270, type: 'hidden', content: 'coin' },
            { x: 690, y: 270, type: 'pipe', content: 'warp_level_2_alt' } // Alternate exit to Level 1-3 (same as main for now)
        ],
        enemies: [
            { x: 100, y: 390, type: 'buzzy', speed: 1, range: 30 },
            { x: 200, y: 300, type: 'goomba', speed: 1, range: 20 },
            { x: 300, y: 390, type: 'buzzy', speed: 1, range: 40 },
            { x: 450, y: 405, type: 'cheep_cheep', speed: 1, range: 0 } // Cheep Cheep in water
        ],
        coins: [
            { x: 135, y: 240, radius: 8 },
            { x: 255, y: 150, radius: 8 },
            { x: 315, y: 300, radius: 8 }
        ],
        flagpole: null,
        water: [
            { x: 420, y: 390, width: 150, height: 60, color: 'rgba(0, 191, 255, 0.7)' } // Water section
        ],
        springboards: [],
        firebars: [],
        thwomps: [],
        donutLifts: [],
        axe: null,
        pSwitches: []
    },
    // Level 1-3: Koopa Hills (Secrets Edition)
    {
        playerStart: { x: 50, y: 390 },
        platforms: [
            { x: 0, y: 420, width: 800, height: 30, color: '#32CD32' }, // Ground
            { x: 100, y: 360, width: 60, height: 30, color: '#32CD32' }, // Hill
            { x: 250, y: 300, width: 60, height: 30, color: '#32CD32' }, // Higher hill
            { x: 400, y: 360, width: 90, height: 30, color: '#32CD32' }, // Longer hill
            { x: 550, y: 270, width: 30, height: 30, color: '#32CD32' }, // Small high platform
            { x: 650, y: 330, width: 60, height: 30, color: '#32CD32' }, // End hill
            { x: 300, y: 150, width: 90, height: 30, color: '#32CD32' } // High secret path (Cloud World)
        ],
        blocks: [
            { x: 180, y: 330, type: 'brick' },
            { x: 210, y: 330, type: 'question', content: 'fireflower' }, // Fire Flower
            { x: 450, y: 330, type: 'brick' },
            { x: 480, y: 330, type: 'question', content: 'coin' },
            { x: 580, y: 240, type: 'brick' }, // Brick near flagpole
            { x: 265, y: 270, type: 'hidden', content: 'superstar' }, // Starman at peak of steep hill
            { x: 330, y: 120, type: 'hidden', content: '1up' }, // Hidden 1-Up in cloud world
            { x: 360, y: 120, type: 'question', content: 'coin' }, // Coin in cloud world
            { x: 390, y: 120, type: 'question', content: 'fireflower' }, // Fire flower in cloud world

            // P-Switch Gauntlet (These blocks will turn into coins)
            { x: 240, y: 390, type: 'brick', content: 'p_switch_affected' },
            { x: 270, y: 390, type: 'brick', content: 'p_switch_affected' },
            { x: 300, y: 390, type: 'brick', content: 'p_switch_affected' }
        ],
        enemies: [
            { x: 150, y: 390, type: 'koopa_red', speed: 1.5, range: 0 }, // Red Koopa on ground
            { x: 300, y: 390, type: 'goomba', speed: 1.5, range: 30 },
            { x: 450, y: 330, type: 'hammer_bro', speed: 0, range: 0 }, // Stationary Hammer Bro
            { x: 700, y: 300, type: 'koopa_green', speed: 1.5, range: 40 }
        ],
        coins: [
            { x: 195, y: 300, radius: 8 },
            { x: 225, y: 300, radius: 8 },
            { x: 465, y: 300, radius: 8 },
            { x: 580, y: 210, radius: 8 } // Coin trail
        ],
        flagpole: { x: 750, y: 300, height: 120 },
        water: [],
        springboards: [
            { x: 350, y: 390 } // Springboard
        ],
        firebars: [],
        thwomps: [],
        donutLifts: [],
        axe: null,
        pSwitches: [
            { x: 210, y: 390 } // P-Switch
        ]
    },
    // Level 1-4: Bowser's Mini-Fortress (Secrets Edition)
    {
        playerStart: { x: 50, y: 390 },
        platforms: [
            { x: 0, y: 420, width: 800, height: 30, color: '#696969' }, // Ground
            { x: 0, y: 0, width: 800, height: 30, color: '#696969' }, // Ceiling
            { x: 90, y: 330, width: 60, height: 30, color: '#696969' },
            { x: 210, y: 270, width: 90, height: 30, color: '#696969' },
            { x: 300, y: 390, width: 60, height: 30, color: '#696969' }, // Platform for fake wall
            { x: 660, y: 390, width: 60, height: 30, color: '#696969' } // Platform before boss
        ],
        blocks: [
            { x: 150, y: 390, type: 'brick' }, // Breakable
            { x: 240, y: 240, type: 'question', content: '1up' }, // 1-Up after fire bar
            { x: 330, y: 390, type: 'brick', content: 'fake_wall' }, // Fake wall tunnel
            { x: 360, y: 390, type: 'brick', content: 'fake_wall' }, // Fake wall tunnel
            { x: 390, y: 390, type: 'brick', content: 'fake_wall' }, // Fake wall tunnel
            { x: 420, y: 390, type: 'brick', content: 'fake_wall' }, // Fake wall tunnel
            { x: 450, y: 390, type: 'brick', content: 'fake_wall' }, // Fake wall tunnel
            { x: 270, y: 210, type: 'hidden', content: 'superstar' }, // Hidden block above fire bar
            { x: 120, y: 300, type: 'hidden', content: '1up' }, // Safe spot secret (alcove near firebar)
            { x: 480, y: 390, type: 'brick', content: 'p_switch_affected' }, // P-Switch target
            { x: 510, y: 390, type: 'brick', content: 'p_switch_affected' }, // P-Switch target
            { x: 720, y: 360, type: 'pipe', content: 'warp_level_3_alt' }, // Hidden boss exit pipe
            { x: 570, y: 390, type: 'hidden', content: 'pipe_water_secret' } // Hidden water pipe entrance
        ],
        enemies: [
            { x: 60, y: 390, type: 'dry_bones', speed: 1, range: 0 },
            { x: 180, y: 390, type: 'dry_bones', speed: 1, range: 0 },
            { x: 270, y: 390, type: 'koopa_red', speed: 1.5, range: 0 },
            { x: 720, y: 390, type: 'mini_bowser', speed: 0, range: 0 } // Mini-Boss
        ],
        coins: [
            { x: 345, y: 360, radius: 8 }, // Coin in fake wall tunnel
            { x: 375, y: 360, radius: 8 },
            { x: 405, y: 360, radius: 8 }
        ],
        flagpole: null,
        water: [
            { x: 570, y: 390, width: 30, height: 60, color: 'rgba(0, 191, 255, 0.7)' } // Small water section for hidden pipe
        ],
        springboards: [],
        firebars: [
            { centerX: 120, centerY: 300, radius: 40, numBalls: 4, speed: 0.05 },
            { centerX: 240, centerY: 240, radius: 50, numBalls: 5, speed: -0.04 }
        ],
        thwomps: [
            { x: 540, y: 270, dropHeight: 90, dropSpeed: 3 }
        ],
        donutLifts: [
            { x: 600, y: 390 }
        ],
        axe: { x: 750, y: 390 }, // Axe to defeat mini-boss
        pSwitches: [
            { x: 450, y: 390 } // P-Switch for gauntlet
        ]
    }
];
