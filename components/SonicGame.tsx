
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, RotateCcw, Smartphone, Monitor, ChevronLeft, Star, Download, Trash2, Wind } from 'lucide-react';
import { 
  Entity, EntityType, PlayerState, Vector2, CameraState, AnimationState, BossState, CharacterType, GameMode, ModStatus
} from '../types';
import { 
  GRAVITY, MAX_SPEED, MAX_FALL_SPEED, ACCELERATION, FRICTION, JUMP_FORCE, 
  SPRING_FORCE, DASH_PAD_SPEED, TILE_SIZE, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, COLORS, 
  SECTION_1_END, DARK_SECTION_END, ANIMATIONS, SPRITE_CONFIG, BOSS_DAMAGE_PER_HIT, 
  BOSS_GROUND_HEIGHT, BOSS_VULNERABLE_TIME, BOSS_MAX_HP, UNDERWATER_GRAVITY, 
  UNDERWATER_JUMP_FORCE, WATER_FRICTION, OXYGEN_MAX, FLY_DURATION, CHAOS_DURATION, MOD_LOAD_TIME, SPACE_BOSS_HP
} from '../constants';
import { generateLevel } from './LevelGenerator';

const checkAABB = (r1: {pos: Vector2, size: Vector2}, r2: {pos: Vector2, size: Vector2}) => {
  if (!r1 || !r2) return false;
  return (
    r1.pos.x < r2.pos.x + r2.size.x &&
    r1.pos.x + r1.size.x > r2.pos.x &&
    r1.pos.y < r2.pos.y + r2.size.y &&
    r1.pos.y + r1.size.y > r2.pos.y
  );
};

const generateSpriteSheet = (): string => {
  const canvas = document.createElement('canvas');
  canvas.width = SPRITE_CONFIG.sheetWidth;
  canvas.height = SPRITE_CONFIG.sheetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = COLORS.sonic;
  ctx.fillRect(0,0, SPRITE_CONFIG.sheetWidth, SPRITE_CONFIG.sheetHeight);
  return canvas.toDataURL();
};

const drawSpriteFrame = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, animState: AnimationState, frameIndex: number, x: number, y: number, facingRight: boolean, character: CharacterType) => {
    // Basic sprite drawing logic
    // In a real implementation this would map animations correctly. 
    // Here we use the character type to change the tint or draw distinct placeholder circles
    ctx.save();
    ctx.translate(Math.floor(x), Math.floor(y));
    if (!facingRight) ctx.scale(-1, 1);
    
    // Draw Placeholder for specified character
    ctx.fillStyle = character === 'TAILS' ? COLORS.tails : character === 'SHADOW' ? COLORS.shadow : character === 'SUPER' ? COLORS.super : COLORS.sonic;
    ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI*2); ctx.fill();
    ctx.restore();
};

type GameState = 'MENU' | 'PLAYING' | 'GAMEOVER' | 'VICTORY';
type MenuSubState = 'MAIN' | 'OPTIONS' | 'ACT_SELECT' | 'MODS' | 'EXTRAS';

const MENU_OPTIONS = ['NORMAL GAME', 'ACT SELECT', 'TIME ATTACK', 'OPTIONS', 'EXTRAS', 'MODS'];
const ACTS = [1, 2, 3]; // 3 is Space Battle

const SonicGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const spriteSheetRef = useRef<HTMLImageElement | null>(null);
  const lastCheckpointRef = useRef<Vector2 | null>(null);
  
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [menuSubState, setMenuSubState] = useState<MenuSubState>('MAIN');
  const [uiState, setUiState] = useState<PlayerState | null>(null);
  const [bossHp, setBossHp] = useState(0);
  const [isMobileMode, setIsMobileMode] = useState(false);
  const [menuSelection, setMenuSelection] = useState(0);
  
  // Progression & Mods
  const [stars, setStars] = useState(0);
  const [modStatus, setModStatus] = useState<ModStatus>({ activeMod: null, isLoading: false, progress: 0 });
  const [selectedAct, setSelectedAct] = useState(1);
  const [gameMode, setGameMode] = useState<GameMode>('NORMAL');

  const player = useRef<PlayerState>({
    pos: { x: 100, y: 100 }, velocity: { x: 0, y: 0 },
    isGrounded: false, isJumping: false, isRolling: false, isLooping: false, loopCooldown: 0,
    facingRight: true, rings: 0, score: 0, time: 0, invincibleTimer: 0, loopProgress: 0,
    animState: AnimationState.IDLE, frameIndex: 0, frameTimer: 0, jumpCount: 0, jumpKeyDown: false,
    character: 'SONIC', oxygen: OXYGEN_MAX, isFlying: false, flyTimer: 0, isChaosControl: false, chaosTimer: 0
  });

  const levelEntities = useRef<Entity[]>([]);
  const nearbyEntitiesRef = useRef<Entity[]>([]);
  const camera = useRef<CameraState>({ x: 0, y: 0 });
  const keys = useRef<{ [key: string]: boolean }>({});
  const startTime = useRef<number>(0);
  const framesSinceLastUiUpdate = useRef<number>(0);

  useEffect(() => {
    const img = new Image();
    img.src = generateSpriteSheet();
    spriteSheetRef.current = img;
  }, []);

  const initGame = useCallback((act: number = 1, mode: GameMode = 'NORMAL', respawn: boolean = false) => {
    const isSpace = act === 3;
    const startPos = respawn && lastCheckpointRef.current ? { ...lastCheckpointRef.current } : { x: 100, y: isSpace ? 200 : 200 };
    
    player.current = {
      ...player.current,
      pos: startPos, velocity: { x: 0, y: 0 }, rings: respawn ? player.current.rings : (isSpace ? 50 : 0),
      time: respawn ? player.current.time : 0, score: respawn ? player.current.score : 0,
      character: isSpace ? 'SUPER' : (modStatus.activeMod || 'SONIC'),
      oxygen: OXYGEN_MAX, isFlying: false, isChaosControl: false,
    };
    
    levelEntities.current = generateLevel(act, isSpace);
    startTime.current = Date.now();
    setBossHp(isSpace ? SPACE_BOSS_HP : 0);
    setUiState({ ...player.current });
    
    // Immediate populate for render to prevent black screen on web
    nearbyEntitiesRef.current = levelEntities.current;
  }, [modStatus.activeMod]);

  // Mod Loading Logic
  useEffect(() => {
      let interval: number;
      if (modStatus.isLoading) {
          interval = setInterval(() => {
              setModStatus(prev => {
                  if (prev.progress >= 100) {
                      clearInterval(interval);
                      return { ...prev, isLoading: false, progress: 0, activeMod: prev.activeMod === 'SONIC' ? null : prev.activeMod }; // Commit mod change
                  }
                  return { ...prev, progress: prev.progress + 10 };
              });
          }, 1000); // 10s total load
      }
      return () => clearInterval(interval);
  }, [modStatus.isLoading]);

  const toggleMod = (char: CharacterType) => {
      if (modStatus.activeMod === char) {
          setModStatus({ ...modStatus, activeMod: null }); // Remove
      } else {
          if (modStatus.activeMod !== null) {
              // User must remove first
              return;
          }
          setModStatus({ ...modStatus, isLoading: true, activeMod: char, progress: 0 });
      }
  };

  const gameLoop = () => {
      if (gameState === 'PLAYING') {
          updatePhysics();
      }
      draw();
      requestRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
      requestRef.current = requestAnimationFrame(gameLoop);
      return () => cancelAnimationFrame(requestRef.current);
  }, [gameState]);

  const updatePhysics = () => {
      const p = player.current;
      const isSpace = selectedAct === 3;
      const isUnderwater = selectedAct === 2;
      
      p.time = Math.floor((Date.now() - startTime.current) / 1000);
      
      // Time Attack Limits
      if (gameMode === 'TIME_ATTACK') {
          const limit = selectedAct === 1 ? 120 : 180;
          if (p.time >= limit) setGameState('GAMEOVER');
      }

      // Oxygen
      if (isUnderwater) {
          p.oxygen--;
          if (p.oxygen <= 0) setGameState('GAMEOVER');
      }

      // Space Ring Drain
      if (isSpace && p.time % 1 === 0 && p.rings > 0) p.rings--;
      if (isSpace && p.rings <= 0) setGameState('GAMEOVER');

      // Chaos Control Timer
      if (p.isChaosControl) {
          p.chaosTimer--;
          if (p.chaosTimer <= 0) p.isChaosControl = false;
      }

      // Flying Timer
      if (p.isFlying) {
          p.flyTimer--;
          if (p.flyTimer <= 0) p.isFlying = false;
      }

      // --- MOVEMENT ---
      if (isSpace) {
          // 8-Way Flight
          const speed = 8;
          if (keys.current['ArrowUp']) p.pos.y -= speed;
          if (keys.current['ArrowDown']) p.pos.y += speed;
          if (keys.current['ArrowLeft']) p.pos.x -= speed;
          if (keys.current['ArrowRight']) p.pos.x += speed;
          
          // Limit bounds
          p.pos.y = Math.max(0, Math.min(VIEWPORT_HEIGHT - 40, p.pos.y));
          
          // Space Boss Logic
          const boss = levelEntities.current.find(e => e.type === EntityType.BOSS);
          if (boss) {
             if (boss.hp !== undefined) setBossHp(boss.hp);
             
             // Boss Missile Logic (Simulated)
             if (Math.random() < 0.05) {
                 levelEntities.current.push({
                     id: `mis_${Date.now()}`, type: EntityType.MISSILE,
                     pos: {x: boss.pos.x, y: boss.pos.y}, size: {x: 20, y:10},
                     velocity: {x: -10, y: 0}, active: true
                 });
             }
          }
      } else {
          // Platformer Physics
          const grav = isUnderwater ? UNDERWATER_GRAVITY : GRAVITY;
          const fric = isUnderwater ? WATER_FRICTION : FRICTION;
          
          if (!p.isFlying) p.velocity.y += grav;
          
          if (keys.current['ArrowRight']) {
              if (p.velocity.x < MAX_SPEED) p.velocity.x += ACCELERATION;
              p.facingRight = true;
          } else if (keys.current['ArrowLeft']) {
              if (p.velocity.x > -MAX_SPEED) p.velocity.x -= ACCELERATION;
              p.facingRight = false;
          } else {
              p.velocity.x *= fric;
          }

          // Abilities
          const jumpPressed = keys.current['Space'] || keys.current['ArrowUp'];
          if (jumpPressed && !p.jumpKeyDown) {
              if (p.isGrounded) {
                  p.velocity.y = isUnderwater ? UNDERWATER_JUMP_FORCE : JUMP_FORCE;
                  p.isGrounded = false;
                  p.jumpCount = 1;
              } else {
                  // Double Jump / Abilities
                  if (p.character === 'TAILS' && p.jumpCount === 1) {
                      p.isFlying = true;
                      p.flyTimer = FLY_DURATION;
                      p.jumpCount++;
                  } else if (p.character === 'SHADOW' && p.jumpCount < 4) {
                      p.jumpCount++;
                      p.velocity.y = JUMP_FORCE;
                      if (p.jumpCount === 4) {
                          p.isChaosControl = true;
                          p.chaosTimer = CHAOS_DURATION;
                      }
                  } else if (p.jumpCount < 2) { // Generic double jump
                      p.velocity.y = JUMP_FORCE;
                      p.jumpCount++;
                  }
              }
              p.jumpKeyDown = true;
          }
          if (!jumpPressed) p.jumpKeyDown = false;

          if (p.isFlying) {
              p.velocity.y = keys.current['ArrowUp'] ? -4 : 1; // Ascend/Descend
          }

          p.pos.x += p.velocity.x;
          p.pos.y += p.velocity.y;
          
          // Simplified Collision for Brevity (Same as original but accounts for underwater)
          const floorY = isUnderwater ? 600 : 400; // Act 2 is enclosed
          
          // Update Nearby Entities
          nearbyEntitiesRef.current = levelEntities.current.filter(ent => Math.abs(ent.pos.x - p.pos.x) < 1000);
          
          nearbyEntitiesRef.current.forEach(ent => {
             if (ent.type === EntityType.BLOCK && checkAABB({pos: p.pos, size: {x:40,y:40}}, ent)) {
                 if (p.velocity.y > 0) {
                     p.pos.y = ent.pos.y - 40;
                     p.isGrounded = true;
                     p.velocity.y = 0;
                     p.isFlying = false;
                     p.jumpCount = 0;
                 }
             }
             if (ent.type === EntityType.BUBBLE && checkAABB({pos:p.pos, size:{x:40,y:40}}, ent) && ent.active) {
                 p.oxygen = OXYGEN_MAX;
                 ent.active = false;
             }
             if (ent.type === EntityType.GOAL && checkAABB({pos:p.pos, size:{x:40,y:40}}, ent)) {
                 setStars(prev => prev + 1);
                 setGameState('VICTORY');
             }
          });
      }
      
      // Camera
      camera.current.x = p.pos.x - 400;
      camera.current.y = p.pos.y - 200;
  };

  const draw = () => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      
      ctx.fillStyle = selectedAct === 3 ? '#000' : (selectedAct === 2 ? '#1e3a8a' : COLORS.sky);
      ctx.fillRect(0,0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
      
      ctx.save();
      ctx.translate(-camera.current.x, -camera.current.y);
      
      // Draw Entities
      nearbyEntitiesRef.current.forEach(ent => {
          if (!ent.active) return;
          if (ent.type === EntityType.BLOCK) {
              ctx.fillStyle = ent.texture === 'metal' ? '#64748b' : COLORS.sand;
              ctx.fillRect(ent.pos.x, ent.pos.y, ent.size.x, ent.size.y);
          } else if (ent.type === EntityType.BUBBLE) {
              ctx.fillStyle = 'rgba(255,255,255,0.5)';
              ctx.beginPath(); ctx.arc(ent.pos.x+20, ent.pos.y+20, 15, 0, Math.PI*2); ctx.fill();
          } else if (ent.type === EntityType.BOSS) {
              ctx.fillStyle = COLORS.boss;
              ctx.fillRect(ent.pos.x, ent.pos.y, ent.size.x, ent.size.y);
          }
      });
      
      // Player
      const p = player.current;
      drawSpriteFrame(ctx, spriteSheetRef.current!, p.animState, 0, p.pos.x+20, p.pos.y+20, p.facingRight, p.character);

      ctx.restore();
  };

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
        keys.current[e.code] = true;
        if (gameState === 'MENU') {
            if (e.code === 'ArrowDown') setMenuSelection(s => (s + 1) % MENU_OPTIONS.length);
            if (e.code === 'ArrowUp') setMenuSelection(s => (s - 1 + MENU_OPTIONS.length) % MENU_OPTIONS.length);
            if (e.code === 'Enter') handleMenuSelect(menuSelection);
        }
    };
    const up = (e: KeyboardEvent) => keys.current[e.code] = false;
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); }
  }, [gameState, menuSelection]);

  const handleMenuSelect = (idx: number) => {
      if (menuSubState === 'MAIN') {
          if (idx === 0) { initGame(1, 'NORMAL'); setGameState('PLAYING'); }
          if (idx === 1) setMenuSubState('ACT_SELECT');
          if (idx === 2) { setGameMode('TIME_ATTACK'); initGame(selectedAct, 'TIME_ATTACK'); setGameState('PLAYING'); }
          if (idx === 3) setMenuSubState('OPTIONS');
          if (idx === 5) setMenuSubState('MODS');
      } else if (menuSubState === 'ACT_SELECT') {
          // Act selection logic...
      }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-zinc-900">
      <canvas ref={canvasRef} width={VIEWPORT_WIDTH} height={VIEWPORT_HEIGHT} className="rounded-lg shadow-2xl" style={{width: '100%', maxWidth: '800px'}} />
      
      {/* HUD */}
      {gameState === 'PLAYING' && (
          <div className="absolute top-4 left-4 font-mono font-bold text-yellow-400">
              <div>SCORE {player.current.score}</div>
              <div>TIME {player.current.time}</div>
              <div>RINGS {player.current.rings}</div>
              {selectedAct === 2 && <div className="text-blue-300">AIR {Math.floor(player.current.oxygen / 60)}</div>}
          </div>
      )}

      {/* MOBILE CONTROLS */}
      {isMobileMode && gameState === 'PLAYING' && (
          <>
            <div className="absolute bottom-10 left-10 grid grid-cols-3 gap-2 opacity-50">
                <button className="w-16 h-16 bg-gray-700 rounded" onTouchStart={()=>{keys.current['ArrowLeft']=true}} onTouchEnd={()=>{keys.current['ArrowLeft']=false}}>◀</button>
                <div/>
                <button className="w-16 h-16 bg-gray-700 rounded" onTouchStart={()=>{keys.current['ArrowRight']=true}} onTouchEnd={()=>{keys.current['ArrowRight']=false}}>▶</button>
                <div/>
                <button className="w-16 h-16 bg-gray-700 rounded" onTouchStart={()=>{keys.current['ArrowDown']=true}} onTouchEnd={()=>{keys.current['ArrowDown']=false}}>▼</button>
            </div>
            <div className="absolute bottom-10 right-10 opacity-50">
                <button className="w-20 h-20 bg-red-600 rounded-full" onTouchStart={()=>{keys.current['Space']=true}} onTouchEnd={()=>{keys.current['Space']=false}}>A</button>
            </div>
          </>
      )}

      {/* MENU UI */}
      {gameState === 'MENU' && (
          <div className="absolute inset-0 flex">
              <div className="w-1/2 bg-transparent"></div> {/* Game Preview Left */}
              <div className="w-1/2 bg-white skew-x-[-5deg] translate-x-10 border-l-8 border-black flex flex-col justify-center p-10">
                  {menuSubState === 'MAIN' && MENU_OPTIONS.map((opt, i) => (
                      <div key={opt} className={`text-3xl font-black italic cursor-pointer ${i === menuSelection ? 'text-yellow-500 translate-x-4' : 'text-gray-400'}`} onClick={()=>handleMenuSelect(i)}>
                          {opt}
                      </div>
                  ))}
                  {menuSubState === 'MODS' && (
                      <div className="flex flex-col gap-4">
                          <h2 className="text-4xl font-black">MODS</h2>
                          <div className={`p-4 border ${modStatus.activeMod === 'TAILS' ? 'border-green-500' : 'border-gray-300'}`} onClick={() => toggleMod('TAILS')}>
                              TAILS (VOAR)
                          </div>
                          <div className={`p-4 border ${modStatus.activeMod === 'SHADOW' ? 'border-green-500' : 'border-gray-300'}`} onClick={() => toggleMod('SHADOW')}>
                              SHADOW (CHAOS CONTROL)
                          </div>
                          {modStatus.isLoading && <div className="text-blue-500">CARREGANDO... {modStatus.progress}%</div>}
                          <button onClick={() => setMenuSubState('MAIN')}>VOLTAR</button>
                      </div>
                  )}
                  {menuSubState === 'OPTIONS' && (
                      <div>
                          <h2 className="text-4xl font-black">OPÇÕES</h2>
                          <div className="p-4 bg-gray-100 mt-4 cursor-pointer" onClick={() => setIsMobileMode(!isMobileMode)}>
                              {isMobileMode ? 'MÓVEL ATIVADO' : 'PC / TECLADO'}
                          </div>
                          <button className="mt-4" onClick={() => setMenuSubState('MAIN')}>VOLTAR</button>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default SonicGame;
