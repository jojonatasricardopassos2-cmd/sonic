
export enum EntityType {
  PLAYER = 'PLAYER',
  BLOCK = 'BLOCK', 
  PLATFORM = 'PLATFORM', 
  RING = 'RING',
  ENEMY = 'ENEMY', 
  SPRING = 'SPRING', 
  DASH_PAD = 'DASH_PAD', 
  LOOP_TRIGGER = 'LOOP_TRIGGER', 
  GOAL = 'GOAL',
  SPIKE = 'SPIKE',
  BRIDGE = 'BRIDGE', 
  CHECKPOINT = 'CHECKPOINT', 
  BOSS = 'BOSS', 
  PROJECTILE = 'PROJECTILE',
  BUBBLE = 'BUBBLE', // Act 2 Air Bubble
  MISSILE = 'MISSILE' // Space Boss Missile
}

export enum AnimationState {
  IDLE = 'IDLE',
  WALK = 'WALK',
  RUN = 'RUN',
  JUMP = 'JUMP',
  FALL = 'FALL',
  SKID = 'SKID',
  ROLL = 'ROLL',
  HURT = 'HURT',
  VICTORY = 'VICTORY',
  FLY = 'FLY', // Tails/Super
  CHAOS = 'CHAOS' // Shadow
}

export enum BossState {
  HOVER = 'HOVER',
  DESCEND = 'DESCEND',
  VULNERABLE = 'VULNERABLE',
  ASCEND = 'ASCEND',
  SPACE_IDLE = 'SPACE_IDLE',
  SPACE_ATTACK = 'SPACE_ATTACK',
  SPACE_HURT = 'SPACE_HURT'
}

export type CharacterType = 'SONIC' | 'TAILS' | 'SHADOW' | 'SUPER';
export type GameMode = 'NORMAL' | 'TIME_ATTACK';

export interface Vector2 {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  type: EntityType;
  pos: Vector2;
  size: Vector2;
  velocity?: Vector2;
  active: boolean;
  color?: string;
  texture?: 'sand' | 'rock' | 'wood' | 'grass' | 'metal';
  patrolRange?: number;
  initialX?: number;
  hp?: number;
  maxHp?: number;
  triggered?: boolean;
  lifespan?: number;
  pickupDelay?: number;
  
  bossState?: BossState;
  bossTimer?: number;
}

export interface PlayerState {
  pos: Vector2;
  velocity: Vector2;
  isGrounded: boolean;
  isJumping: boolean;
  isRolling: boolean;
  isLooping: boolean;
  loopCenter?: Vector2;
  loopCooldown: number;
  facingRight: boolean;
  rings: number;
  score: number;
  time: number;
  invincibleTimer: number;
  loopProgress: number;
  animState: AnimationState;
  frameIndex: number;
  frameTimer: number;
  checkpointPos?: Vector2;
  jumpCount: number;
  jumpKeyDown: boolean;

  // New States
  character: CharacterType;
  oxygen: number; // For underwater (Max 1200 frames = 20s)
  isFlying: boolean; // Tails
  flyTimer: number;
  isChaosControl: boolean; // Shadow
  chaosTimer: number;
}

export interface CameraState {
  x: number;
  y: number;
}

export interface ModStatus {
  activeMod: CharacterType | null;
  isLoading: boolean;
  progress: number;
}
