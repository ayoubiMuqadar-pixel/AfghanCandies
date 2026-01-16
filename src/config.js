export const GRID_SIZE = 8;
export const TILE_TYPES = 6;

export const TILE_SIZE = 64;
export const TILE_GAP = 2;

export const VOICE_COUNT = { 1: 3, 2: 3, 3: 3, 4: 3, 5: 1, 6: 1 };

// ---- Tile / Character Names ----
export const TILE_NAMES = {
  1: "Najib",
  2: "Miragha",
  3: "Shaheen",
  4: "Mamad",
  5: "Gandagi",
  6: "Dard Darom",
};

// ---- Background Music ----
export const BGM_KEY = "bgm";
export const BGM_PATH = "assets/music/bgm.mp3";
export const BGM_VOL_MENU = 0.35;
export const BGM_VOL_GAME = 0.12;

// ---- 5 Levels ----
export const LEVELS = [
  { title: "Level 1", moves: 15, maxTypes: 4, goals: { 1: 10 } }, // Najib
  { title: "Level 2", moves: 15, maxTypes: 5, goals: { 2: 8, 3: 6 } }, // Miragha + Shaheen
  { title: "Level 3", moves: 15, maxTypes: 6, goals: { 4: 12 } }, // Mamad
  { title: "Level 4", moves: 15, maxTypes: 6, goals: { 5: 10, 1: 6 } }, // Gandagi + Najib
  { title: "Level 5", moves: 15, maxTypes: 6, goals: { 6: 15 } }, // Dard Darom
];

// ---- UI colors ----
export const UI = {
  panel: 0x17181c,
  panel2: 0x1d1f25,
  stroke: 0x2e313a,
  glow: 0x6ee7ff,
  gold: 0xffd166,
  text: 0xffffff,
  sub: 0xb9bcc7,
};
