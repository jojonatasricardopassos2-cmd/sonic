
export const GRAVITY = 0.6;
export const UNDERWATER_GRAVITY = 0.3;
export const MAX_SPEED = 14;
export const MAX_FALL_SPEED = 18;
export const UNDERWATER_MAX_FALL = 8;
export const ACCELERATION = 0.8;
export const FRICTION = 0.8;
export const WATER_FRICTION = 0.95;
export const JUMP_FORCE = -13;
export const UNDERWATER_JUMP_FORCE = -9;
export const SPRING_FORCE = -22;
export const DASH_PAD_SPEED = 22;
export const ENEMY_SPEED = 2;

export const TILE_SIZE = 40;
export const VIEWPORT_WIDTH = 800;
export const VIEWPORT_HEIGHT = 450;

// Level Layout Constants
export const SECTION_1_END = 6000; 
export const DARK_SECTION_END = 10000;
export const LEVEL_END = 18000;

export const BOSS_MAX_HP = 100;
export const SPACE_BOSS_HP = 300;
export const BOSS_DAMAGE_PER_HIT = 20;
export const BOSS_HOVER_HEIGHT = 4 * TILE_SIZE;
export const BOSS_GROUND_HEIGHT = 12 * TILE_SIZE;
export const BOSS_VULNERABLE_TIME = 300;
export const BOSS_ATTACK_TIME = 400;

export const OXYGEN_MAX = 1200; // 20 seconds @ 60fps
export const FLY_DURATION = 360; // 6 seconds
export const CHAOS_DURATION = 300; // 5 seconds
export const MOD_LOAD_TIME = 600; // 10 seconds simulation

export const COLORS = {
  sky: '#3b82f6',
  caveBg: '#1e1b4b',
  sand: '#fcd34d',
  grass: '#22c55e',
  rock: '#57534e',
  wood: '#991b1b',
  water: '#2563eb',
  waterSurface: '#60a5fa',
  checkpoint: '#3b82f6',
  checkpointActive: '#ef4444',
  boss: '#dc2626',
  projectile: '#ef4444',
  spike: '#cbd5e1',
  bubble: '#e0f2fe',
  missile: '#f97316',
  
  // Characters
  sonic: '#2563eb',
  tails: '#f59e0b',
  shadow: '#000000',
  super: '#fef08a'
};

export const SPRITE_CONFIG = {
  sheetWidth: 288,
  sheetHeight: 240,
  frameWidth: 48,
  frameHeight: 48,
  scale: 1.5,
};

export const ANIMATIONS: Record<string, { frames: number[][], speed: number }> = {
  IDLE: { frames: [[0, 0], [1, 0], [2, 0]], speed: 12 },
  WALK: { frames: [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1]], speed: 5 },
  RUN:  { frames: [[0, 2], [1, 2], [2, 2], [3, 2]], speed: 3 },
  JUMP: { frames: [[0, 3], [1, 3], [2, 3], [3, 3]], speed: 2 },
  ROLL: { frames: [[0, 3], [1, 3], [2, 3], [3, 3]], speed: 2 },
  FALL: { frames: [[2, 1]], speed: 10 }, 
  SKID: { frames: [[0, 4]], speed: 10 },
  HURT: { frames: [[1, 4]], speed: 10 },
  VICTORY: { frames: [[0, 0], [1, 0]], speed: 15 },
  FLY: { frames: [[0, 3], [1, 3]], speed: 4 }, // Re-use Jump frames logically or placeholder
  CHAOS: { frames: [[0, 2], [1, 2]], speed: 1 } // Super fast run
};
