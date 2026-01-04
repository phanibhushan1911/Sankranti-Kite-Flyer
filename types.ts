export interface Point {
  x: number;
  y: number;
}

export enum GameState {
  START = 'START',
  TUTORIAL = 'TUTORIAL',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export enum TutorialStep {
  MOVEMENT = 0,
  ENEMIES = 1,
  LANTERNS = 2,
  WIND = 3,
}

export interface KiteEntity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  color: string;
  tailColor: string;
  angle: number;
  stringPath: Point[]; // The "Manja" trailing behind
  isCut: boolean;
  cutTimestamp?: number;
  speed: number;
  wobbleOffset: number; // For random movement
}

export interface LanternEntity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  wobbleOffset: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  opacity: number;
  scale: number;
  life: number;
}

export interface Cloud {
  x: number;
  y: number;
  scale: number;
  speed: number;
}

export interface WindZone {
  x: number;
  y: number;
  width: number;
  height: number;
  directionX: number;
  directionY: number;
  strength: number;
}