
import { Entity, EntityType, BossState } from '../types';
import { SECTION_1_END, TILE_SIZE, BOSS_MAX_HP, SPACE_BOSS_HP } from '../constants';

let entityCounter = 0;
const uid = () => `ent_${entityCounter++}`;

export const generateLevel = (act: number = 1, isSpaceBattle: boolean = false): Entity[] => {
  const entities: Entity[] = [];

  // --- SPACE BATTLE (SUPER SONIC) ---
  if (isSpaceBattle) {
      // Void layout - No ground, just boss
      entities.push({
          id: uid(),
          type: EntityType.BOSS,
          pos: { x: 600, y: 200 },
          size: { x: 80, y: 80 },
          hp: SPACE_BOSS_HP,
          maxHp: SPACE_BOSS_HP,
          active: true,
          bossState: BossState.SPACE_IDLE,
          bossTimer: 100
      });
      return entities;
  }

  // --- STANDARD BLOCKS HELPERS ---
  const addBlock = (x: number, y: number, w: number, h: number, texture: 'sand' | 'rock' | 'wood' | 'metal' = 'sand') => {
    entities.push({
      id: uid(),
      type: EntityType.BLOCK,
      pos: { x: x * TILE_SIZE, y: y * TILE_SIZE },
      size: { x: w * TILE_SIZE, y: h * TILE_SIZE },
      texture,
      active: true,
    });
  };

  const addPlatform = (x: number, y: number, w: number, h: number, texture: 'sand' | 'rock' | 'wood' = 'sand') => {
    entities.push({
      id: uid(),
      type: EntityType.PLATFORM,
      pos: { x: x * TILE_SIZE, y: y * TILE_SIZE },
      size: { x: w * TILE_SIZE, y: h * TILE_SIZE },
      texture,
      active: true,
    });
  };

  const addRing = (x: number, y: number) => {
    entities.push({
      id: uid(),
      type: EntityType.RING,
      pos: { x: x * TILE_SIZE, y: y * TILE_SIZE },
      size: { x: TILE_SIZE / 2, y: TILE_SIZE / 2 }, 
      active: true,
    });
  };

  const addBubble = (x: number, y: number) => {
    entities.push({
        id: uid(),
        type: EntityType.BUBBLE,
        pos: { x: x * TILE_SIZE, y: y * TILE_SIZE },
        size: { x: TILE_SIZE, y: TILE_SIZE },
        active: true
    });
  };

  const addRingLine = (startX: number, startY: number, count: number) => {
    for (let i = 0; i < count; i++) {
        addRing(startX + i, startY);
    }
  };

  const addEnemy = (x: number, y: number) => {
    entities.push({
      id: uid(),
      type: EntityType.ENEMY,
      pos: { x: x * TILE_SIZE, y: y * TILE_SIZE },
      size: { x: TILE_SIZE, y: TILE_SIZE * 0.8 },
      velocity: { x: -1, y: 0 },
      active: true,
      patrolRange: 200,
      initialX: x * TILE_SIZE,
    });
  };

  const addSpring = (x: number, y: number) => {
    entities.push({
      id: uid(),
      type: EntityType.SPRING,
      pos: { x: x * TILE_SIZE, y: (y - 0.5) * TILE_SIZE },
      size: { x: TILE_SIZE, y: TILE_SIZE / 2 },
      active: true,
    });
  };
  
  const addDashPad = (x: number, y: number) => {
    entities.push({
      id: uid(),
      type: EntityType.DASH_PAD,
      pos: { x: x * TILE_SIZE, y: (y - 0.2) * TILE_SIZE },
      size: { x: TILE_SIZE, y: TILE_SIZE / 2 },
      active: true,
    });
  };

  const addLoop = (x: number, y: number) => {
    entities.push({
        id: uid(),
        type: EntityType.LOOP_TRIGGER,
        pos: {x: x * TILE_SIZE, y: y * TILE_SIZE},
        size: {x: TILE_SIZE * 4, y: TILE_SIZE * 4}, 
        active: true
    });
  }

  const addCheckpoint = (x: number, y: number) => {
    entities.push({
        id: uid(),
        type: EntityType.CHECKPOINT,
        pos: {x: x * TILE_SIZE, y: (y - 2) * TILE_SIZE}, 
        size: {x: TILE_SIZE, y: TILE_SIZE * 2},
        active: true,
        triggered: false
    });
  }

  const addSpike = (x: number, y: number, width: number = 1) => {
    entities.push({
        id: uid(),
        type: EntityType.SPIKE,
        pos: {x: x * TILE_SIZE, y: (y - 0.5) * TILE_SIZE},
        size: {x: width * TILE_SIZE, y: TILE_SIZE / 2},
        active: true
    });
  }

  // --- ACT 2: UNDERWATER ---
  if (act === 2) {
      // Ceiling and Floor to enclose the level
      addBlock(0, 0, 100, 2, 'rock'); // Ceiling
      addBlock(0, 15, 100, 5, 'rock'); // Base Floor

      // Start area
      addBubble(5, 12);
      addRingLine(8, 10, 3);
      
      // Obstacles
      addBlock(15, 10, 2, 5, 'metal');
      addBubble(14, 13);
      
      addBlock(25, 8, 2, 7, 'metal');
      addSpike(27, 14, 2);
      
      addEnemy(35, 13);
      addBubble(40, 10);

      // Deep section
      addBlock(50, 5, 20, 5, 'rock'); // Middle block
      addRingLine(50, 12, 5);
      
      addCheckpoint(60, 14); // Checkpoint underwater

      // Final rise
      addSpring(90, 14);
      addBlock(95, 8, 10, 2, 'metal');
      
      // Goal
      entities.push({
        id: 'act2_goal',
        type: EntityType.GOAL,
        pos: { x: 98 * TILE_SIZE, y: 6 * TILE_SIZE },
        size: { x: TILE_SIZE, y: TILE_SIZE * 2 },
        active: true
      });

      return entities;
  }

  // --- ACT 1: EMERALD BEACH (Standard) ---
  addBlock(0, 10, 30, 10, 'sand'); 
  addRingLine(5, 8, 5);
  addEnemy(20, 9);

  // Split Point (x=30)
  addDashPad(30, 9.5);
  addLoop(38, 6); // Ground at 10. Loop size 4. 10-4=6.
  addBlock(35, 10, 15, 2, 'sand'); 
  
  // LOWER PATH (Restored to Y=20 - Above water)
  const lowerY = 20;
  // Make lower path start earlier to catch the fall
  addBlock(25, lowerY, 110, 5, 'rock'); 
  
  // Upper Path Bridges
  addBlock(55, 12, 5, 2, 'wood'); 
  addRing(57, 10);
  addBlock(65, 10, 5, 2, 'wood');
  addEnemy(67, 9);
  addBlock(75, 8, 10, 2, 'sand'); 
  addRingLine(76, 6, 4);
  
  // Lower Path Entities (Adjusted for Y=20)
  addSpike(45, lowerY, 3);
  addEnemy(55, lowerY - 1);
  addSpike(65, lowerY, 2);
  addRingLine(60, lowerY - 2, 3);
  addSpike(75, lowerY, 4); 
  
  // CHECKPOINT 1 (BOTTOM)
  addBlock(80, lowerY - 1, 4, 1, 'wood');
  addCheckpoint(81, lowerY - 1);
  
  // Connector Spring Shaft
  addBlock(98, lowerY, 4, 2, 'wood');
  addSpring(100, lowerY); // Launches you up from Y=20
  
  // Platforms to climb up from y=20
  addPlatform(100, 10, 4, 1, 'wood');

  addRingLine(100, -2, 3); 

  // CHECKPOINT 2 (TOP)
  addBlock(105, 5, 20, 2, 'sand');
  addCheckpoint(110, 5); 
  
  addBlock(120, 18, 2, 2, 'wood');
  addBlock(122, 16, 2, 2, 'wood');
  addBlock(124, 14, 2, 2, 'wood');
  addSpring(126, 14); 
  
  addPlatform(125, 6, 2, 2, 'sand');
  addPlatform(127, 7, 2, 2, 'sand');
  addPlatform(129, 8, 2, 2, 'sand');
  
  addPlatform(130, 10, 30, 2, 'sand'); 
  addDashPad(135, 9.5);
  
  addRingLine(145, 8, 5);

  // SECTION 2: CAVE
  const caveStart = 160;
  
  addBlock(caveStart, 0, 100, 4, 'rock'); 
  addBlock(caveStart, 12, 10, 5, 'rock'); 
  
  addRingLine(caveStart + 2, 10, 3);
  addEnemy(caveStart + 8, 11);

  addBlock(caveStart + 15, 15, 8, 2, 'rock');
  addRing(caveStart + 18, 13);
  
  addBlock(caveStart + 28, 13, 6, 2, 'rock');
  addEnemy(caveStart + 30, 12);

  addBlock(caveStart + 35, 18, 20, 2, 'rock'); 
  addSpike(caveStart + 40, 18, 5); 
  
  addPlatform(caveStart + 50, 9, 3, 1, 'wood'); 
  addPlatform(caveStart + 55, 7, 3, 1, 'wood');
  addPlatform(caveStart + 60, 5, 3, 1, 'wood');
  addSpring(caveStart + 60, 5);
  
  addBlock(caveStart + 65, 3, 30, 3, 'rock');
  addRingLine(caveStart + 70, 1, 10);
  addEnemy(caveStart + 80, 2);
  addEnemy(caveStart + 85, 2);
  
  addDashPad(caveStart + 90, 2.5);

  // SECTION 3: BRIGHT ARENA & BOSS
  const arenaStart = caveStart + 100;

  addBlock(arenaStart - 5, 12, 10, 5, 'rock');
  addSpring(arenaStart, 12);

  addPlatform(arenaStart + 4, 10, 10, 1, 'wood');
  addRingLine(arenaStart + 6, 8, 3);

  addPlatform(arenaStart + 15, 9, 10, 1, 'wood');
  addEnemy(arenaStart + 19, 7);

  addPlatform(arenaStart + 26, 8, 10, 1, 'wood');
  addRingLine(arenaStart + 28, 6, 3);

  addPlatform(arenaStart + 37, 9, 10, 1, 'wood');

  const runUpX = arenaStart + 50;
  addBlock(runUpX, 10, 50, 10, 'rock'); 
  addDashPad(runUpX + 5, 9.5);
  addRingLine(runUpX + 15, 8, 5);
  
  addLoop(runUpX + 25, 6); 

  const bossArenaX = runUpX + 40;
  addBlock(bossArenaX, 12, 40, 5, 'sand');
  addCheckpoint(bossArenaX - 2, 12);
  
  entities.push({
    id: uid(),
    type: EntityType.BOSS,
    pos: { x: (bossArenaX + 15) * TILE_SIZE, y: 4 * TILE_SIZE },
    size: { x: TILE_SIZE * 2, y: TILE_SIZE * 2 },
    velocity: { x: 0, y: 0 },
    hp: BOSS_MAX_HP, 
    maxHp: BOSS_MAX_HP,
    active: true,
    bossState: BossState.HOVER,
    bossTimer: 300
  });

  return entities;
};
