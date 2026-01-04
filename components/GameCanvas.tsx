import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameState, KiteEntity, Point, FloatingText, Cloud, WindZone, LanternEntity, TutorialStep } from '../types';
import { 
  KITE_WIDTH, 
  KITE_HEIGHT, 
  KITE_COLORS, 
  PLAYER_SPEED_LERP, 
  STRING_LENGTH, 
  ENEMY_SPAWN_RATE, 
  GRAVITY,
  ROOFTOP_COLORS,
  KAI_PO_CHE_TEXTS,
  WIND_ZONE_COUNT,
  MAX_WIND_STRENGTH,
  AUDIO_URLS,
  LANTERN_SPAWN_RATE,
  LANTERN_WIDTH,
  LANTERN_HEIGHT
} from '../constants';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  isMuted: boolean;
  playerColor: string;
  setTutorialStep: (step: TutorialStep) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  gameState, 
  setGameState, 
  score, 
  setScore, 
  isMuted, 
  playerColor,
  setTutorialStep 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const isMutedRef = useRef(isMuted); // Sync ref for loop
  
  // Audio Refs
  const cutAudioRef = useRef<HTMLAudioElement | null>(null);
  const swooshAudioRef = useRef<HTMLAudioElement | null>(null);
  const windAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastSwooshTime = useRef<number>(0);
  const wasInWind = useRef<boolean>(false);

  // Game State Refs
  const playerRef = useRef<KiteEntity>({
    id: 'player',
    x: window.innerWidth / 2,
    y: window.innerHeight - 200,
    vx: 0,
    vy: 0,
    width: KITE_WIDTH,
    height: KITE_HEIGHT,
    color: playerColor, 
    tailColor: '#FFFFFF',
    angle: 0,
    stringPath: [],
    isCut: false,
    speed: 0,
    wobbleOffset: 0
  });

  const enemiesRef = useRef<KiteEntity[]>([]);
  const lanternsRef = useRef<LanternEntity[]>([]);
  const textsRef = useRef<FloatingText[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const windZonesRef = useRef<WindZone[]>([]);
  const lastEnemySpawnTime = useRef<number>(0);
  const lastLanternSpawnTime = useRef<number>(0);
  const mousePos = useRef<Point>({ x: window.innerWidth / 2, y: window.innerHeight - 200 });
  const buildingsRef = useRef<Point[][]>([]);

  // Tutorial Refs
  const activeTutorialStepRef = useRef<TutorialStep>(TutorialStep.MOVEMENT);
  const tutorialStateRef = useRef({
      startDistance: 0,
      hasMoved: false,
      startTime: 0,
      spawnedEntity: false
  });

  // Sync refs
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { playerRef.current.color = playerColor; }, [playerColor]);

  // Initialize Static Elements & Audio
  useEffect(() => {
    // Init Audio
    windAudioRef.current = new Audio(AUDIO_URLS.WIND);
    windAudioRef.current.loop = true;
    windAudioRef.current.volume = 0.5;
    
    cutAudioRef.current = new Audio(AUDIO_URLS.CUT);
    cutAudioRef.current.volume = 0.8;
    
    swooshAudioRef.current = new Audio(AUDIO_URLS.SWOOSH);
    swooshAudioRef.current.volume = 0.4;

    for(let i=0; i<5; i++) {
      cloudsRef.current.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * (window.innerHeight / 2),
        scale: 0.5 + Math.random() * 0.5,
        speed: 0.2 + Math.random() * 0.3
      });
    }

    const zones: WindZone[] = [];
    for(let i=0; i<WIND_ZONE_COUNT; i++) {
        const width = 120 + Math.random() * 150; 
        const height = 100 + Math.random() * 100;
        const x = Math.random() * (window.innerWidth - width);
        const y = Math.random() * (window.innerHeight * 0.6);
        const dirX = (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * 0.5);
        const dirY = (Math.random() - 0.5) * 0.5; 
        zones.push({ x, y, width, height, directionX: dirX, directionY: dirY, strength: 2 + Math.random() * (MAX_WIND_STRENGTH - 2) });
    }
    windZonesRef.current = zones;

    const buildings: Point[][] = [];
    let curX = 0;
    while (curX < window.innerWidth) {
      const width = 50 + Math.random() * 100;
      const height = 50 + Math.random() * 150;
      const roofType = Math.random() > 0.5 ? 'flat' : 'pointed';
      const poly: Point[] = [];
      poly.push({ x: curX, y: window.innerHeight });
      poly.push({ x: curX, y: window.innerHeight - height });
      if (roofType === 'pointed') poly.push({ x: curX + width / 2, y: window.innerHeight - height - 30 });
      poly.push({ x: curX + width, y: window.innerHeight - height });
      poly.push({ x: curX + width, y: window.innerHeight });
      buildings.push(poly);
      curX += width - 5; 
    }
    buildingsRef.current = buildings;

    return () => {
        if(windAudioRef.current) windAudioRef.current.pause();
    };
  }, []);

  // Audio Mute Logic (Outside Loop)
  useEffect(() => {
    if (windAudioRef.current) {
        if (isMuted) {
            windAudioRef.current.pause();
        } else if (wasInWind.current && (gameState === GameState.PLAYING || gameState === GameState.TUTORIAL)) {
            windAudioRef.current.play().catch(e => console.log("Audio play failed", e));
        }
    }
  }, [isMuted, gameState]);

  // Input Listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      mousePos.current = { x: touch.clientX, y: touch.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // Helpers
  const playSfx = (type: 'cut' | 'swoosh') => {
    if (isMutedRef.current) return;
    if (type === 'cut' && cutAudioRef.current) {
        cutAudioRef.current.currentTime = 0;
        cutAudioRef.current.play().catch(() => {});
    } else if (type === 'swoosh' && swooshAudioRef.current) {
        const now = Date.now();
        if (now - lastSwooshTime.current > 500) { 
            swooshAudioRef.current.currentTime = 0;
            swooshAudioRef.current.play().catch(() => {});
            lastSwooshTime.current = now;
        }
    }
  };

  const checkIntersection = (p1: Point, p2: Point, p3: Point, p4: Point): boolean => {
    const det = (p2.x - p1.x) * (p4.y - p3.y) - (p4.x - p3.x) * (p2.y - p1.y);
    if (det === 0) return false;
    const lambda = ((p4.y - p3.y) * (p4.x - p1.x) + (p3.x - p4.x) * (p4.y - p1.y)) / det;
    const gamma = ((p1.y - p2.y) * (p4.x - p1.x) + (p2.x - p1.x) * (p4.y - p1.y)) / det;
    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
  };

  const applyWind = (entity: {x: number, y: number}, zones: WindZone[]): { dx: number, dy: number, turbulence: number, strength: number } => {
     let dx = 0;
     let dy = 0;
     let turbulence = 0.2;
     let strength = 0;
     for(const zone of zones) {
         if (entity.x >= zone.x && entity.x <= zone.x + zone.width && 
             entity.y >= zone.y && entity.y <= zone.y + zone.height) {
                 dx += zone.directionX * zone.strength;
                 dy += zone.directionY * zone.strength;
                 turbulence += 1.5 + (zone.strength * 0.3); 
                 strength += zone.strength;
         }
     }
     return { dx, dy, turbulence, strength };
  };

  // Drawing Functions
  const drawLantern = (ctx: CanvasRenderingContext2D, lantern: LanternEntity, timestamp: number) => {
      ctx.save();
      ctx.translate(lantern.x, lantern.y);
      const sway = Math.sin(timestamp * 0.002 + lantern.wobbleOffset) * 0.1;
      ctx.rotate(sway);
      const w = lantern.width;
      const h = lantern.height;
      const halfW = w / 2;
      const halfH = h / 2;
      const bottomW = w * 0.6; 
      const glowGradient = ctx.createRadialGradient(0, 0, 5, 0, 0, w * 1.5);
      glowGradient.addColorStop(0, 'rgba(255, 180, 60, 0.4)');
      glowGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(0, 0, w * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-bottomW / 2, halfH);
      ctx.bezierCurveTo(-halfW - 5, 0, -halfW, -halfH, 0, -halfH);
      ctx.bezierCurveTo(halfW, -halfH, halfW + 5, 0, bottomW / 2, halfH);
      ctx.closePath(); 
      const paperGradient = ctx.createLinearGradient(0, halfH, 0, -halfH);
      paperGradient.addColorStop(0, '#FFFFA0');       
      paperGradient.addColorStop(0.2, '#FFC800');     
      paperGradient.addColorStop(0.6, '#FF4500');     
      paperGradient.addColorStop(1, '#8B0000');       
      ctx.fillStyle = paperGradient;
      ctx.fill();
      ctx.strokeStyle = 'rgba(100, 20, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, halfH, bottomW / 2, 3, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; 
      ctx.fill();
      ctx.strokeStyle = 'rgba(50, 0, 0, 0.5)'; 
      ctx.lineWidth = 1.5;
      ctx.stroke();
      const flicker = 1 + Math.random() * 0.2;
      ctx.beginPath();
      ctx.arc(0, halfH - 5, 4 * flicker, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
  };

  const drawKite = (ctx: CanvasRenderingContext2D, kite: KiteEntity, timestamp: number) => {
    ctx.save();
    ctx.translate(kite.x, kite.y);
    const rotation = kite.vx * 0.1 + (kite.isCut ? kite.angle : 0);
    ctx.rotate(rotation);
    ctx.beginPath();
    ctx.moveTo(0, -kite.height / 2); 
    ctx.lineTo(kite.width / 2, 0);   
    ctx.lineTo(0, kite.height / 2);  
    ctx.lineTo(-kite.width / 2, 0);  
    ctx.closePath();
    ctx.fillStyle = kite.color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -kite.height/2);
    ctx.lineTo(0, kite.height/2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, kite.width/2, Math.PI, 0);
    ctx.stroke();
    const tailSegments = 8;
    const tailSegmentLen = 6;
    ctx.beginPath();
    ctx.moveTo(0, kite.height / 2);
    for(let i=1; i<=tailSegments; i++) {
        const y = (kite.height / 2) + (i * tailSegmentLen);
        const wave = Math.sin((timestamp * 0.015) - (i * 0.6)) * (i * 1.2);
        const drag = -kite.vx * (i * 0.4);
        const x = wave + drag;
        ctx.lineTo(x, y);
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 5; 
    ctx.strokeStyle = kite.color;
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.stroke();
    ctx.restore();
  };

  const drawString = (ctx: CanvasRenderingContext2D, kite: KiteEntity, isPlayer: boolean) => {
    if (kite.stringPath.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(kite.x, kite.y + kite.height/2); 
    for (let i = 0; i < kite.stringPath.length; i++) {
        const p = kite.stringPath[i];
        ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = isPlayer ? '#FFFFFF' : '#DDDDDD'; 
    ctx.lineWidth = isPlayer ? 2.5 : 1.5;
    ctx.stroke();
  };

  // Main Update Loop
  const update = (timestamp: number) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Common Drawing: Sky, Clouds, Buildings
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    cloudsRef.current.forEach(cloud => {
        cloud.x += cloud.speed;
        if(cloud.x > window.innerWidth + 100) cloud.x = -100;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, 30 * cloud.scale, 0, Math.PI * 2);
        ctx.arc(cloud.x + 20*cloud.scale, cloud.y - 10*cloud.scale, 35 * cloud.scale, 0, Math.PI * 2);
        ctx.arc(cloud.x + 40*cloud.scale, cloud.y, 30 * cloud.scale, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw wind zones only if Playing or Tutorial Wind Step
    const showWind = gameState === GameState.PLAYING || (gameState === GameState.TUTORIAL && activeTutorialStepRef.current === TutorialStep.WIND);
    if (showWind) {
        windZonesRef.current.forEach(zone => {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for(let i=0; i<5; i++) {
                const lineY = zone.y + (zone.height / 5) * i + 10;
                const speedFactor = timestamp * 0.05 * zone.strength;
                const lineXStart = zone.x + (speedFactor + i * 50) % zone.width;
                const lineLen = 30 + zone.strength * 5;
                if (lineXStart + lineLen < zone.x + zone.width) {
                     ctx.moveTo(lineXStart, lineY);
                     ctx.lineTo(lineXStart + lineLen, lineY + zone.directionY * 10);
                }
            }
            ctx.stroke();
        });
    }

    buildingsRef.current.forEach((poly, idx) => {
        ctx.fillStyle = ROOFTOP_COLORS[idx % ROOFTOP_COLORS.length];
        ctx.beginPath();
        ctx.moveTo(poly[0].x, poly[0].y);
        for(let i=1; i<poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        if(idx % 2 === 0) ctx.fillRect(poly[0].x + 10, poly[0].y - 40, 20, 20);
    });

    const player = playerRef.current;
    
    // Game Physics Logic
    if (gameState === GameState.PLAYING || gameState === GameState.TUTORIAL) {
      // Wind Physics
      const zones = (gameState === GameState.TUTORIAL && activeTutorialStepRef.current !== TutorialStep.WIND) ? [] : windZonesRef.current;
      const windEffect = applyWind(player, zones);

      // Audio: Wind
      if (!isMutedRef.current && windAudioRef.current) {
          if (windEffect.strength > 2 && !wasInWind.current) {
              wasInWind.current = true;
              windAudioRef.current.play().catch(() => {});
          } else if (windEffect.strength <= 2 && wasInWind.current) {
              wasInWind.current = false;
              windAudioRef.current.pause();
              windAudioRef.current.currentTime = 0;
          }
      }

      // Player Movement
      const targetX = mousePos.current.x;
      const targetY = mousePos.current.y;
      const dx = targetX - player.x;
      const dy = targetY - player.y;
      
      // Accumulate movement for tutorial
      if (gameState === GameState.TUTORIAL && activeTutorialStepRef.current === TutorialStep.MOVEMENT) {
          tutorialStateRef.current.startDistance += Math.abs(dx * PLAYER_SPEED_LERP) + Math.abs(dy * PLAYER_SPEED_LERP);
          if (tutorialStateRef.current.startDistance > 2000) {
              activeTutorialStepRef.current = TutorialStep.ENEMIES;
              setTutorialStep(TutorialStep.ENEMIES);
              tutorialStateRef.current.spawnedEntity = false;
          }
      }

      player.vx = (dx * PLAYER_SPEED_LERP) + (windEffect.dx * 0.05);
      player.vy = (dy * PLAYER_SPEED_LERP) + (windEffect.dy * 0.05); 
      if (Math.abs(player.vx) > 8 || Math.abs(player.vy) > 8) playSfx('swoosh');

      const timeSec = timestamp / 1000;
      const weaveX = Math.sin(timeSec * 5 + player.wobbleOffset) * windEffect.turbulence * 0.5;
      const weaveY = Math.cos(timeSec * 3 + player.wobbleOffset) * windEffect.turbulence * 0.5;

      player.x += player.vx + weaveX;
      player.y += player.vy + weaveY;

      player.stringPath.unshift({ x: player.x, y: player.y + player.height/2 });
      if (player.stringPath.length > STRING_LENGTH) player.stringPath.pop();

      for(let i=1; i<player.stringPath.length; i++) {
        player.stringPath[i].x += (player.stringPath[i-1].x - player.stringPath[i].x) * 0.5;
        player.stringPath[i].y += (player.stringPath[i-1].y - player.stringPath[i].y) * 0.5 + 2; 
        if (windEffect.turbulence > 0.6) {
            player.stringPath[i].x += (Math.random() - 0.5) * windEffect.turbulence * 3;
        }
      }

      // --- SPAWNING LOGIC ---
      if (gameState === GameState.PLAYING) {
        if (timestamp - lastEnemySpawnTime.current > ENEMY_SPAWN_RATE) {
            // Re-implementing spawnEnemy inside update to access local scope vars if needed
            const startSide = Math.random() > 0.5 ? 'left' : 'right';
            const startX = startSide === 'left' ? -50 : window.innerWidth + 50;
            const startY = Math.random() * (window.innerHeight * 0.6);
            const speed = 2 + Math.random() * 2;
            const vx = startSide === 'left' ? speed : -speed;
            const vy = (Math.random() - 0.5) * 1.5;

            enemiesRef.current.push({
            id: Math.random().toString(36).substr(2, 9),
            x: startX, y: startY, vx, vy,
            width: KITE_WIDTH, height: KITE_HEIGHT,
            color: KITE_COLORS[Math.floor(Math.random() * KITE_COLORS.length)],
            tailColor: '#FFF', angle: 0, stringPath: [], isCut: false, speed,
            wobbleOffset: Math.random() * 100
            });
            lastEnemySpawnTime.current = timestamp;
        }
        if (timestamp - lastLanternSpawnTime.current > LANTERN_SPAWN_RATE) {
             const startX = Math.random() * window.innerWidth;
             lanternsRef.current.push({
                id: Math.random().toString(36).substr(2, 9),
                x: startX, y: window.innerHeight + 50,
                width: LANTERN_WIDTH, height: LANTERN_HEIGHT,
                vx: (Math.random() - 0.5) * 0.5, vy: -0.8 - Math.random() * 0.5,
                wobbleOffset: Math.random() * 100
             });
             lastLanternSpawnTime.current = timestamp;
        }
      } else if (gameState === GameState.TUTORIAL) {
          // Tutorial Spawning
          if (activeTutorialStepRef.current === TutorialStep.ENEMIES) {
              if (enemiesRef.current.length === 0 && !tutorialStateRef.current.spawnedEntity) {
                  // Spawn dummy enemy
                  enemiesRef.current.push({
                      id: 'tut_enemy', x: window.innerWidth + 50, y: window.innerHeight * 0.3,
                      vx: -2, vy: 0, width: KITE_WIDTH, height: KITE_HEIGHT,
                      color: KITE_COLORS[1], tailColor: '#FFF', angle: 0, stringPath: [],
                      isCut: false, speed: 2, wobbleOffset: 0
                  });
                  tutorialStateRef.current.spawnedEntity = true;
              } else if (enemiesRef.current.length === 0 && tutorialStateRef.current.spawnedEntity) {
                  // Respawn if missed
                  tutorialStateRef.current.spawnedEntity = false;
              }
          } else if (activeTutorialStepRef.current === TutorialStep.LANTERNS) {
              if (lanternsRef.current.length === 0 && !tutorialStateRef.current.spawnedEntity) {
                  lanternsRef.current.push({
                      id: 'tut_lantern', x: window.innerWidth / 2, y: window.innerHeight + 50,
                      vx: 0, vy: -1.5, width: LANTERN_WIDTH, height: LANTERN_HEIGHT, wobbleOffset: 0
                  });
                  tutorialStateRef.current.spawnedEntity = true;
              }
          } else if (activeTutorialStepRef.current === TutorialStep.WIND) {
              if (tutorialStateRef.current.startTime === 0) tutorialStateRef.current.startTime = timestamp;
              if (timestamp - tutorialStateRef.current.startTime > 5000) {
                  setGameState(GameState.PLAYING);
              }
          }
      }

      // --- Update Enemies ---
      enemiesRef.current.forEach(enemy => {
        const enemyWind = applyWind(enemy, zones);
        
        if (enemy.isCut) {
          enemy.y += 2 + GRAVITY * 10;
          enemy.x += Math.sin(timestamp / 200 + enemy.wobbleOffset) * 2 + enemyWind.dx;
          enemy.angle += 0.05;
        } else {
          enemy.x += enemy.vx + enemyWind.dx;
          const bob = Math.sin(timestamp / 300 + enemy.wobbleOffset) * (2 + enemyWind.turbulence * 4);
          enemy.y += enemyWind.dy + bob;
          
          enemy.stringPath.unshift({ x: enemy.x, y: enemy.y + enemy.height/2 });
          if (enemy.stringPath.length > STRING_LENGTH) enemy.stringPath.pop();
          for(let i=1; i<enemy.stringPath.length; i++) {
            enemy.stringPath[i].x += (enemy.stringPath[i-1].x - enemy.stringPath[i].x) * 0.4;
            enemy.stringPath[i].y += (enemy.stringPath[i-1].y - enemy.stringPath[i].y) * 0.4 + 2;
            if (enemyWind.turbulence > 0.6) {
                 enemy.stringPath[i].x += (Math.random() - 0.5) * enemyWind.turbulence * 3;
            }
          }

          // Cut Logic
          let cutDetected = false;
          // Simple string check
          for (const p of enemy.stringPath) {
             const dist = Math.hypot(p.x - player.x, p.y - player.y);
             if (dist < KITE_WIDTH / 1.5) { cutDetected = true; break; }
          }
          // Intersection check
          if (!cutDetected && player.stringPath.length > 2 && enemy.stringPath.length > 2) {
             for (let i=0; i < Math.min(3, player.stringPath.length - 1); i++) {
                 const p1 = player.stringPath[i]; const p2 = player.stringPath[i+1];
                 for (let j=0; j < enemy.stringPath.length - 1; j++) {
                     const p3 = enemy.stringPath[j]; const p4 = enemy.stringPath[j+1];
                     if (checkIntersection(p1, p2, p3, p4)) { cutDetected = true; break; }
                 }
                 if (cutDetected) break;
             }
          }

          if (cutDetected) {
            enemy.isCut = true;
            playSfx('cut');
            setScore(s => s + 10);
            textsRef.current.push({
              id: Math.random().toString(), x: enemy.x, y: enemy.y,
              text: KAI_PO_CHE_TEXTS[Math.floor(Math.random() * KAI_PO_CHE_TEXTS.length)],
              opacity: 1, scale: 0.5, life: 60 
            });

            // Tutorial Logic: Enemy Cut
            if (gameState === GameState.TUTORIAL && activeTutorialStepRef.current === TutorialStep.ENEMIES) {
                setTimeout(() => {
                    activeTutorialStepRef.current = TutorialStep.LANTERNS;
                    setTutorialStep(TutorialStep.LANTERNS);
                    tutorialStateRef.current.spawnedEntity = false;
                    enemiesRef.current = []; // Clear
                }, 1000);
            }
          }
        }
      });

      // --- Update Lanterns ---
      lanternsRef.current.forEach(lantern => {
          const wind = applyWind(lantern, zones);
          lantern.x += lantern.vx + wind.dx;
          lantern.y += lantern.vy + wind.dy;

          // Collision
          let hit = false;
          const distToKite = Math.hypot(lantern.x - player.x, lantern.y - player.y);
          if (distToKite < (lantern.width + KITE_WIDTH) / 2) hit = true;
          if (!hit) {
              for (const p of player.stringPath) {
                  const distToString = Math.hypot(lantern.x - p.x, lantern.y - p.y);
                  if (distToString < lantern.width / 1.5) { hit = true; break; }
              }
          }

          if (hit) {
              if (gameState === GameState.PLAYING) {
                  setGameState(GameState.GAME_OVER);
              } else if (gameState === GameState.TUTORIAL) {
                  // In tutorial, just push player away slightly or visual feedback
                  player.vx += (player.x - lantern.x) * 0.5;
                  player.vy += (player.y - lantern.y) * 0.5;
              }
          }

          // Tutorial Logic: Lantern Pass
          if (gameState === GameState.TUTORIAL && activeTutorialStepRef.current === TutorialStep.LANTERNS) {
              if (lantern.y < -50) {
                  activeTutorialStepRef.current = TutorialStep.WIND;
                  setTutorialStep(TutorialStep.WIND);
                  tutorialStateRef.current.startTime = 0; // Reset timer for next step
                  lanternsRef.current = [];
              }
          }
      });

      // Cleanup
      enemiesRef.current = enemiesRef.current.filter(e => e.y < window.innerHeight + 100 && e.x > -100 && e.x < window.innerWidth + 100);
      lanternsRef.current = lanternsRef.current.filter(l => l.y > -100);

      // Draw Player
      drawString(ctx, player, true);
      drawKite(ctx, player, timestamp);
    } 
    
    // Draw Enemies & Lanterns & Text
    enemiesRef.current.forEach(enemy => { drawString(ctx, enemy, false); drawKite(ctx, enemy, timestamp); });
    lanternsRef.current.forEach(lantern => drawLantern(ctx, lantern, timestamp));
    textsRef.current.forEach(t => {
      ctx.save(); ctx.globalAlpha = t.opacity; ctx.translate(t.x, t.y); ctx.scale(t.scale, t.scale);
      ctx.font = 'bold 40px "Fredoka One"'; ctx.fillStyle = '#FFD700'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
      ctx.strokeText(t.text, 0, 0); ctx.fillText(t.text, 0, 0); ctx.restore();
      t.y -= 1; t.scale += 0.02; t.opacity -= 0.015; t.life--;
    });
    textsRef.current = textsRef.current.filter(t => t.life > 0);

    requestRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [gameState]); // Restart loop on state change

  useEffect(() => {
    if ((gameState === GameState.PLAYING && score === 0) || gameState === GameState.START || gameState === GameState.TUTORIAL) {
        playerRef.current.x = window.innerWidth / 2;
        playerRef.current.y = window.innerHeight - 200;
        playerRef.current.stringPath = [];
        enemiesRef.current = [];
        lanternsRef.current = [];
        textsRef.current = [];
        playerRef.current.color = playerColor;
        
        // Reset Tutorial Logic
        if (gameState === GameState.TUTORIAL) {
             activeTutorialStepRef.current = TutorialStep.MOVEMENT;
             tutorialStateRef.current = { startDistance: 0, hasMoved: false, startTime: 0, spawnedEntity: false };
        }
    }
  }, [gameState, score, playerColor]);

  return (
    <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} className="absolute top-0 left-0 w-full h-full block"/>
  );
};

export default GameCanvas;