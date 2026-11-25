// Hearthside Kitchen — every tuning number, recipe and station of the game lives here,
// so the world, the renderer and the screenshot autopilot all read one source of truth.

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 800;
export const HUD_HEIGHT = 100;
export const SHIFT_SECONDS = 180;
export const PLAYER_SPEED = 270;
export const PLAYER_RADIUS = 22;
export const INTERACT_RANGE = 92;
export const MAX_ORDERS = 3;
export const ORDER_PATIENCE = 50;
export const FIRST_ORDER_AT = 2;
export const SPAWN_EVERY = 14;
export const SPAWN_EVERY_LATE = 10;
export const LATE_AFTER = 90;

// Every ingredient knows how it is prepared: chop, cook, or chop-then-cook.
// stage: raw -> chopped -> cooked (burnt when left on the stove too long).
export const INGREDIENTS = {
  tomato: { id: 'tomato', name: '番茄', short: '番茄', color: '#e5484d', dark: '#a92c30', chop: 2.0, cook: 0, icon: 'tomato' },
  noodle: { id: 'noodle', name: '面条', short: '面条', color: '#f5c542', dark: '#b98a1d', chop: 0, cook: 3.0, icon: 'noodle' },
  fish: { id: 'fish', name: '鱼', short: '鱼', color: '#7fb3d5', dark: '#3d6e8f', chop: 2.0, cook: 3.0, icon: 'fish' },
  rice: { id: 'rice', name: '米饭', short: '米饭', color: '#fdf6e3', dark: '#c9b98a', chop: 0, cook: 3.0, icon: 'rice' },
  egg: { id: 'egg', name: '鸡蛋', short: '鸡蛋', color: '#fff3b0', dark: '#d9a441', chop: 0, cook: 2.5, icon: 'egg' },
  greens: { id: 'greens', name: '青菜', short: '青菜', color: '#58b368', dark: '#2e7d32', chop: 1.5, cook: 0, icon: 'greens' },
};

export const INGREDIENT_ORDER = ['tomato', 'noodle', 'fish', 'rice', 'egg', 'greens'];

// A recipe is the set of (ingredient, prepared stage) a plate must hold to become the dish.
export const RECIPES = [
  {
    id: 'tomato-egg-noodle', name: '番茄鸡蛋面', reward: 30,
    needs: [{ kind: 'noodle', stage: 'cooked' }, { kind: 'tomato', stage: 'chopped' }, { kind: 'egg', stage: 'cooked' }],
  },
  {
    id: 'grilled-fish-rice', name: '香煎鱼饭', reward: 30,
    needs: [{ kind: 'fish', stage: 'cooked' }, { kind: 'rice', stage: 'cooked' }],
  },
  {
    id: 'garden-salad', name: '田园沙拉', reward: 20,
    needs: [{ kind: 'tomato', stage: 'chopped' }, { kind: 'greens', stage: 'chopped' }],
  },
  {
    id: 'seafood-fried-rice', name: '海鲜炒饭', reward: 40,
    needs: [{ kind: 'rice', stage: 'cooked' }, { kind: 'fish', stage: 'cooked' }, { kind: 'egg', stage: 'cooked' }],
  },
  {
    id: 'tomato-fish-soup', name: '番茄鱼汤', reward: 35,
    needs: [{ kind: 'fish', stage: 'cooked' }, { kind: 'tomato', stage: 'chopped' }, { kind: 'greens', stage: 'chopped' }],
  },
];

export function recipeById(id) {
  return RECIPES.find((recipe) => recipe.id === id) ?? null;
}

export function ingredientLabel(kind, stage) {
  const base = INGREDIENTS[kind];
  if (!base) return kind;
  if (stage === 'chopped') return `切好的${base.name}`;
  if (stage === 'cooked') return `煮好的${base.name}`;
  if (stage === 'burnt') return `烧糊的${base.name}`;
  return base.name;
}

// Kitchen floor plan. Counters are obstacles; each station has an anchor the chef
// stands near and an interact point the prompt points at.
export const STATIONS = {
  pantry: {
    kind: 'pantry',
    // One column down the left wall: the chef stands just right of each crate,
    // so the nearest crate is always the one in front of them.
    crates: INGREDIENT_ORDER.map((id, index) => ({
      kind: id,
      x: 28,
      y: 190 + index * 80,
      w: 84,
      h: 72,
    })),
  },
  board: { kind: 'board', x: 280, y: 652, w: 190, h: 88, anchorX: 375, anchorY: 640 },
  stove: {
    kind: 'stove',
    x: 500, y: 652, w: 240, h: 88,
    burners: [
      { x: 560, y: 696, anchorX: 560, anchorY: 640 },
      { x: 680, y: 696, anchorX: 680, anchorY: 640 },
    ],
  },
  plating: { kind: 'plating', x: 780, y: 652, w: 300, h: 88, anchorX: 930, anchorY: 640 },
  serving: { kind: 'serving', x: 980, y: 68, w: 284, h: 92, anchorX: 1132, anchorY: 190 },
  trash: { kind: 'trash', x: 1120, y: 652, w: 144, h: 88, anchorX: 1192, anchorY: 640 },
};

// Rectangles the chef cannot walk through (counters and the top wall shelf).
export const OBSTACLES = [
  { x: 280, y: 652, w: 190, h: 88 },
  { x: 500, y: 652, w: 240, h: 88 },
  { x: 780, y: 652, w: 300, h: 88 },
  { x: 1120, y: 652, w: 144, h: 88 },
  { x: 980, y: 68, w: 284, h: 92 },
  { x: 16, y: 180, w: 112, h: 490 },
];

export const WALK = { x0: 36, y0: 176, x1: 1244, y1: 788 };

export const RANKS = [
  { min: 220, rank: 'S', note: '米其林三星主厨！' },
  { min: 150, rank: 'A', note: '金牌主厨' },
  { min: 90, rank: 'B', note: '熟练厨师' },
  { min: 40, rank: 'C', note: '见习厨师' },
  { min: 0, rank: 'D', note: '厨房学徒' },
];
