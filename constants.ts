export const CANVAS_WIDTH = window.innerWidth;
export const CANVAS_HEIGHT = window.innerHeight;

export const PLAYER_SPEED_LERP = 0.08; // Smoothness of mouse follow
export const KITE_WIDTH = 40;
export const KITE_HEIGHT = 40;
export const STRING_LENGTH = 15; // Number of segments in the string

export const ENEMY_SPAWN_RATE = 1500; // ms
export const GRAVITY = 0.15; // For falling kites

export const LANTERN_SPAWN_RATE = 3500; // ms
export const LANTERN_WIDTH = 30;
export const LANTERN_HEIGHT = 45;

export const WIND_ZONE_COUNT = 3;
export const MAX_WIND_STRENGTH = 4;

export const KITE_COLORS = [
  '#FF5733', // Red-Orange
  '#FFC300', // Yellow
  '#DAF7A6', // Light Green
  '#C70039', // Crimson
  '#900C3F', // Purple
  '#33FF57', // Lime
  '#33C1FF', // Blue
  '#FF33F6', // Magenta
];

export const PLAYER_KITE_OPTIONS = [
  { color: '#FF0000', name: 'Classic Red' },
  { color: '#0000FF', name: 'Sky Blue' },
  { color: '#FFFF00', name: 'Sunny Yellow' },
  { color: '#008000', name: 'Emerald Green' },
  { color: '#800080', name: 'Royal Purple' },
  { color: '#FFA500', name: 'Sunset Orange' },
  { color: '#000000', name: 'Ninja Black' },
  { color: '#FF1493', name: 'Neon Pink' },
];

export const ROOFTOP_COLORS = [
  '#A0522D', // Sienna
  '#CD5C5C', // IndianRed
  '#8B4513', // SaddleBrown
  '#D2691E', // Chocolate
];

export const KAI_PO_CHE_TEXTS = [
  "Kai Po Che!",
  "Cut!",
  "Oooooh!",
  "Lapet!",
  "Gotcha!"
];

export const TUTORIAL_INSTRUCTIONS = [
  "Drag your finger or mouse to fly the Kite!",
  "Cut the Enemy String (White Line) with your String!",
  "Avoid the Sky Lanterns!",
  "Watch out! Wind Zones (White Streaks) push you!"
];

export const AUDIO_URLS = {
  // Reliable assets from CodeSkulptor/Google Storage
  BGM: 'https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg',
  CUT: 'https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3',
  SWOOSH: 'https://codeskulptor-demos.commondatastorage.googleapis.com/pang/arrow.mp3',
  WIND: 'https://commondatastorage.googleapis.com/codeskulptor-assets/sounddogs/thrust.mp3', 
};