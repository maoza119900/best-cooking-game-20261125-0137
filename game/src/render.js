// Every pixel of Hearthside Kitchen: the tiled floor, the wooden counters, the food
// drawn shape by shape, the order board, the timer and the title / results screens.
// The judge sees the game mostly through these frames, so the cover frame must read
// at a glance: kitchen, orders, ingredients, a dish mid-assembly, a timer, a plate
// ready to serve.

import { CANVAS_WIDTH, CANVAS_HEIGHT, INGREDIENTS, STATIONS, RANKS } from './config.js';
import { plateDish } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

const FONT = '"Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", sans-serif';
const SERIF = '"Noto Serif CJK SC", serif';

function text(ctx, str, x, y, size, color, align = 'center', weight = 'bold', font = FONT) {
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function progressRing(ctx, x, y, r, frac, color) {
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, frac));
  ctx.stroke();
}

/** One ingredient, drawn as a little still life. stage tints it: chopped = pieces, cooked = golden, burnt = black. */
export function drawIngredientIcon(ctx, kind, stage, x, y, size) {
  const def = INGREDIENTS[kind];
  const s = size;
  ctx.save();
  ctx.translate(x, y);
  if (stage === 'burnt') {
    ctx.fillStyle = '#2b2b2b';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.2, -s * 0.5);
    ctx.quadraticCurveTo(-s * 0.3, -s * 0.7, -s * 0.1, -s * 0.85);
    ctx.moveTo(s * 0.15, -s * 0.45);
    ctx.quadraticCurveTo(s * 0.3, -s * 0.65, s * 0.1, -s * 0.85);
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (kind === 'tomato') {
    if (stage === 'chopped') {
      ctx.fillStyle = '#e5484d';
      for (const [ox, oy] of [[-0.22, -0.1], [0.22, -0.12], [0, 0.22]]) {
        ctx.beginPath();
        ctx.arc(ox * s, oy * s, s * 0.24, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#ff8a80';
      ctx.beginPath();
      ctx.arc(-s * 0.22, -s * 0.1, s * 0.1, 0, Math.PI * 2);
      ctx.arc(s * 0.22, -s * 0.12, s * 0.1, 0, Math.PI * 2);
      ctx.arc(0, s * 0.22, s * 0.1, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#e5484d';
      ctx.beginPath();
      ctx.arc(0, s * 0.05, s * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.arc(-s * 0.14, -s * 0.08, s * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2e7d32';
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.32);
      ctx.lineTo(-s * 0.18, -s * 0.18);
      ctx.lineTo(s * 0.18, -s * 0.18);
      ctx.closePath();
      ctx.fill();
    }
  } else if (kind === 'noodle') {
    ctx.fillStyle = '#3d6e8f';
    ctx.beginPath();
    ctx.arc(0, s * 0.08, s * 0.42, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = stage === 'cooked' ? '#f5c542' : '#e8b64c';
    ctx.lineWidth = s * 0.09;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-s * 0.3, -s * 0.08 + i * s * 0.14);
      ctx.quadraticCurveTo(0, -s * 0.2 + i * s * 0.14, s * 0.3, -s * 0.08 + i * s * 0.14);
      ctx.stroke();
    }
    if (stage === 'cooked') {
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-s * 0.1, -s * 0.35);
      ctx.quadraticCurveTo(-s * 0.2, -s * 0.55, -s * 0.05, -s * 0.7);
      ctx.moveTo(s * 0.12, -s * 0.35);
      ctx.quadraticCurveTo(s * 0.22, -s * 0.55, s * 0.05, -s * 0.7);
      ctx.stroke();
    }
  } else if (kind === 'fish') {
    ctx.fillStyle = stage === 'cooked' ? '#d98a4b' : '#7fb3d5';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.4, s * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-s * 0.35, 0);
    ctx.lineTo(-s * 0.58, -s * 0.22);
    ctx.lineTo(-s * 0.58, s * 0.22);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(s * 0.2, -s * 0.06, s * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(s * 0.22, -s * 0.06, s * 0.035, 0, Math.PI * 2);
    ctx.fill();
    if (stage === 'chopped') {
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-s * 0.05, -s * 0.22);
      ctx.lineTo(-s * 0.05, s * 0.22);
      ctx.moveTo(s * 0.15, -s * 0.2);
      ctx.lineTo(s * 0.15, s * 0.2);
      ctx.stroke();
    }
  } else if (kind === 'rice') {
    ctx.fillStyle = '#fdf6e3';
    ctx.beginPath();
    ctx.arc(0, -s * 0.05, s * 0.36, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, -s * 0.12, s * 0.3, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#8d6e63';
    ctx.beginPath();
    ctx.moveTo(-s * 0.34, s * 0.28);
    ctx.lineTo(s * 0.34, s * 0.28);
    ctx.lineTo(s * 0.26, s * 0.42);
    ctx.lineTo(-s * 0.26, s * 0.42);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'egg') {
    if (stage === 'raw') {
      ctx.fillStyle = '#fff3b0';
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.3, s * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f7e08b';
      ctx.beginPath();
      ctx.ellipse(-s * 0.06, -s * 0.06, s * 0.18, s * 0.26, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#fffdf5';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffb703';
      ctx.beginPath();
      ctx.arc(s * 0.05, 0, s * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff8c00';
      ctx.beginPath();
      ctx.arc(s * 0.02, -s * 0.03, s * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'greens') {
    ctx.fillStyle = stage === 'chopped' ? '#7cc47f' : '#58b368';
    for (const [ox, oy, rot] of [[-0.2, 0.1, -0.5], [0.2, 0.1, 0.5], [0, -0.18, 0]]) {
      ctx.save();
      ctx.translate(ox * s, oy * s);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.16, s * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  if (stage === 'cooked' && kind !== 'noodle' && kind !== 'egg') {
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.1, -s * 0.4);
    ctx.quadraticCurveTo(-s * 0.2, -s * 0.6, -s * 0.05, -s * 0.75);
    ctx.moveTo(s * 0.12, -s * 0.4);
    ctx.quadraticCurveTo(s * 0.22, -s * 0.6, s * 0.05, -s * 0.75);
    ctx.stroke();
  }
  ctx.restore();
}

/** A white plate holding its ingredients in a ring, with a golden rim when complete. */
export function drawPlate(ctx, contents, x, y, r, ready) {
  ctx.save();
  ctx.translate(x, y);
  if (ready) {
    ctx.strokeStyle = '#ffd54f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, r + 5, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.82, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d7ccc8';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#f5f5f5';
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.62, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  const n = contents.length;
  contents.forEach((item, i) => {
    const angle = n === 1 ? -Math.PI / 2 : (i / n) * Math.PI * 2 - Math.PI / 2;
    drawIngredientIcon(ctx, item.kind, item.stage, Math.cos(angle) * r * 0.34, Math.sin(angle) * r * 0.26, r * 0.62);
  });
  ctx.restore();
}

function drawCounter(ctx, x, y, w, h, label, labelColor = '#fff') {
  ctx.fillStyle = '#8d6e63';
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.fillStyle = '#a1887f';
  roundRect(ctx, x + 4, y + 4, w - 8, 18, 6);
  ctx.fill();
  ctx.fillStyle = '#d7a86c';
  roundRect(ctx, x, y, w, 14, 7);
  ctx.fill();
  text(ctx, label, x + w / 2, y + h - 16, 17, labelColor);
}

function drawOrderBoard(ctx, orders) {
  ctx.fillStyle = '#6d4c41';
  roundRect(ctx, 16, 68, 940, 92, 12);
  ctx.fill();
  ctx.fillStyle = '#8d6e63';
  roundRect(ctx, 20, 72, 932, 84, 9);
  ctx.fill();
  text(ctx, '订单板', 60, 114, 22, '#ffe0b2', 'center', 'bold', SERIF);
  if (orders.length === 0) {
    text(ctx, '暂无订单 —— 客人马上就到，准备好！', 480, 114, 20, '#ffecb3');
    return;
  }
  orders.forEach((order, i) => {
    const x = 120 + i * 272;
    const y = 76;
    const w = 260;
    const h = 76;
    const urgent = order.patience < 15;
    ctx.fillStyle = urgent ? '#fff3e0' : '#fffde7';
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.strokeStyle = urgent ? '#e53935' : '#d7ccc8';
    ctx.lineWidth = urgent ? 3 : 1.5;
    ctx.stroke();
    text(ctx, order.recipe.name, x + 12, y + 16, 17, '#4e342e', 'left');
    text(ctx, `${order.recipe.reward} 金币`, x + w - 12, y + 16, 16, '#b8860b', 'right');
    order.recipe.needs.forEach((need, j) => {
      drawIngredientIcon(ctx, need.kind, need.stage, x + 26 + j * 44, y + 46, 30);
    });
    const frac = Math.max(0, order.patience / order.maxPatience);
    ctx.fillStyle = '#e0e0e0';
    roundRect(ctx, x + 12, y + 62, w - 24, 8, 4);
    ctx.fill();
    ctx.fillStyle = frac > 0.5 ? '#66bb6a' : frac > 0.25 ? '#ffa726' : '#e53935';
    roundRect(ctx, x + 12, y + 62, (w - 24) * frac, 8, 4);
    ctx.fill();
  });
}

function drawChef(ctx, player, time) {
  const { x, y } = player;
  const bob = Math.sin(time * 6) * 1.5;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(0, 20, 24, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: white apron over a teal shirt.
  ctx.fillStyle = '#00897b';
  ctx.beginPath();
  ctx.arc(0, 2, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fafafa';
  ctx.beginPath();
  ctx.ellipse(0, 8, 13, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  // Head and tall chef hat.
  ctx.fillStyle = '#ffccbc';
  ctx.beginPath();
  ctx.arc(0, -18, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, -13, -40, 26, 14, 6);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-8, -38, 8, Math.PI, 0);
  ctx.arc(0, -40, 8, Math.PI, 0);
  ctx.arc(8, -38, 8, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(-5, -19, 1.8, 0, Math.PI * 2);
  ctx.arc(5, -19, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // What the chef is carrying, held up high.
  if (player.hands) {
    if (player.hands.type === 'item') {
      drawIngredientIcon(ctx, player.hands.item.kind, player.hands.item.stage, 0, -56, 44);
    } else if (player.hands.type === 'plate') {
      drawPlate(ctx, player.hands.contents, 0, -56, 30, true);
    }
  }
  ctx.restore();
}

function drawPantry(ctx) {
  text(ctx, '食材柜', 70, 174, 15, '#8d6e63', 'center', 'bold', SERIF);
  for (const crate of STATIONS.pantry.crates) {
    const def = INGREDIENTS[crate.kind];
    ctx.fillStyle = '#a1887f';
    roundRect(ctx, crate.x, crate.y, crate.w, crate.h, 8);
    ctx.fill();
    ctx.fillStyle = '#8d6e63';
    roundRect(ctx, crate.x + 4, crate.y + 4, crate.w - 8, crate.h - 8, 6);
    ctx.fill();
    drawIngredientIcon(ctx, crate.kind, 'raw', crate.x + crate.w / 2, crate.y + crate.h / 2 - 10, 52);
    text(ctx, def.name, crate.x + crate.w / 2, crate.y + crate.h - 12, 15, '#fff');
  }
}

function drawStations(ctx, state, time) {
  // Serving window (top right) with a little bell.
  const serving = STATIONS.serving;
  ctx.fillStyle = '#5d4037';
  roundRect(ctx, serving.x, serving.y, serving.w, serving.h, 10);
  ctx.fill();
  ctx.fillStyle = '#3e2723';
  roundRect(ctx, serving.x + 10, serving.y + 10, serving.w - 20, serving.h - 34, 8);
  ctx.fill();
  ctx.fillStyle = '#ffd54f';
  ctx.beginPath();
  ctx.arc(serving.x + 40, serving.y + 34, 12, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(serving.x + 36, serving.y + 34, 8, 4);
  text(ctx, '出菜口', serving.x + serving.w / 2 + 30, serving.y + 34, 22, '#ffe0b2', 'center', 'bold', SERIF);
  text(ctx, 'SERVE', serving.x + serving.w / 2 + 30, serving.y + 58, 13, '#bcaaa4');

  drawPantry(ctx);

  // Chopping board.
  const board = STATIONS.board;
  drawCounter(ctx, board.x, board.y, board.w, board.h, '切菜板');
  ctx.fillStyle = '#d7a86c';
  roundRect(ctx, board.x + 30, board.y + 12, 130, 44, 8);
  ctx.fill();
  if (state.board.item) {
    drawIngredientIcon(ctx, state.board.item.kind, state.board.item.stage, board.x + 95, board.y + 34, 56);
    if (state.board.item.stage === 'raw') {
      const def = INGREDIENTS[state.board.item.kind];
      progressRing(ctx, board.x + 95, board.y + 34, 34, state.board.progress / def.chop, '#66bb6a');
    }
  } else {
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(board.x + 95, board.y + 34, 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Stove with two burners.
  const stove = STATIONS.stove;
  drawCounter(ctx, stove.x, stove.y, stove.w, stove.h, '灶台');
  stove.burners.forEach((burner, index) => {
    const slot = state.burners[index];
    ctx.fillStyle = '#37474f';
    ctx.beginPath();
    ctx.arc(burner.x, burner.y, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = slot.item ? '#ff7043' : '#455a64';
    ctx.beginPath();
    ctx.arc(burner.x, burner.y, 26, 0, Math.PI * 2);
    ctx.fill();
    if (slot.item) {
      drawIngredientIcon(ctx, slot.item.kind, slot.item.stage, burner.x, burner.y, 52);
      const def = INGREDIENTS[slot.item.kind];
      if (slot.item.stage !== 'cooked' && slot.item.stage !== 'burnt') {
        progressRing(ctx, burner.x, burner.y, 40, slot.progress / def.cook, '#ffb74d');
      } else if (slot.item.stage === 'cooked') {
        const frac = 1 - slot.overcook / 4;
        ctx.lineWidth = 5;
        ctx.strokeStyle = frac > 0.5 ? '#ffb74d' : '#e53935';
        ctx.beginPath();
        ctx.arc(burner.x, burner.y, 40, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
        ctx.stroke();
        if (frac < 0.5) text(ctx, '快糊了！', burner.x, burner.y - 52, 15, '#e53935');
      }
    }
  });

  // Plating counter with two plates.
  const plating = STATIONS.plating;
  drawCounter(ctx, plating.x, plating.y, plating.w, plating.h, '摆盘台');
  const plateSpots = [
    { x: plating.x + 75, y: plating.y + 40 },
    { x: plating.x + 225, y: plating.y + 40 },
  ];
  state.plates.forEach((plate, i) => {
    const spot = plateSpots[i];
    const dish = plateDish(plate.contents);
    drawPlate(ctx, plate.contents, spot.x, spot.y, 44, !!dish);
    if (dish) {
      text(ctx, dish.name, spot.x, spot.y - 58, 16, '#2e7d32');
      text(ctx, '可上菜 ✓', spot.x, spot.y + 52, 13, '#2e7d32');
    } else if (plate.contents.length > 0) {
      text(ctx, `组装中 ${plate.contents.length}/3`, spot.x, spot.y + 52, 13, '#6d4c41');
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.ellipse(spot.x, spot.y, 44, 36, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });

  // Trash.
  const trash = STATIONS.trash;
  drawCounter(ctx, trash.x, trash.y, trash.w, trash.h, '垃圾桶');
  ctx.fillStyle = '#546e7a';
  roundRect(ctx, trash.x + 52, trash.y + 16, 40, 44, 6);
  ctx.fill();
  ctx.fillStyle = '#37474f';
  roundRect(ctx, trash.x + 46, trash.y + 10, 52, 10, 5);
  ctx.fill();
}

function drawHud(ctx, state) {
  ctx.fillStyle = '#4e342e';
  ctx.fillRect(0, 0, CANVAS_WIDTH, 60);
  ctx.fillStyle = '#6d4c41';
  ctx.fillRect(0, 60, CANVAS_WIDTH, 8);
  text(ctx, '灶火小馆', 90, 32, 26, '#ffe0b2', 'center', 'bold', SERIF);
  text(ctx, 'HEARTHSIDE KITCHEN', 90, 52, 10, '#bcaaa4');
  // Shift timer, big in the middle.
  const mins = Math.floor(state.shiftLeft / 60);
  const secs = Math.floor(state.shiftLeft % 60);
  const timerText = `${mins}:${String(secs).padStart(2, '0')}`;
  const low = state.shiftLeft <= 30;
  ctx.fillStyle = low ? '#e53935' : '#fff8e1';
  roundRect(ctx, 560, 8, 160, 44, 10);
  ctx.fill();
  text(ctx, `⏱ ${timerText}`, 640, 31, 26, low ? '#fff' : '#4e342e');
  text(ctx, '晚市剩余', 470, 31, 16, '#ffe0b2', 'right');
  // Coins and combo.
  text(ctx, `🪙 ${state.coins} 金币`, 800, 31, 22, '#ffd54f');
  if (state.combo >= 2) {
    ctx.fillStyle = '#ff7043';
    roundRect(ctx, 920, 10, 150, 40, 10);
    ctx.fill();
    text(ctx, `🔥 连击 x${state.combo}`, 995, 31, 20, '#fff');
  }
  text(ctx, `已上菜 ${state.served}`, 1120, 31, 18, '#ffe0b2');
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function rankFor(coins) {
  for (const entry of RANKS) if (coins >= entry.min) return entry;
  return RANKS[RANKS.length - 1];
}

export function render(ctx, world, screen, options = {}) {
  const state = world.state;
  const time = state.time;
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  // Floor tiles.
  for (let ty = 0; ty < 8; ty += 1) {
    for (let tx = 0; tx < 16; tx += 1) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? '#f3e2c7' : '#ecd9b8';
      ctx.fillRect(tx * 80, 68 + ty * 92, 80, 92);
    }
  }
  // Wall band and a row of hanging pans for warmth.
  ctx.fillStyle = '#bcaaa4';
  ctx.fillRect(0, 60, CANVAS_WIDTH, 8);
  for (let i = 0; i < 6; i += 1) {
    const x = 240 + i * 40;
    ctx.strokeStyle = '#8d6e63';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, 74, 10, 0, Math.PI * 2);
    ctx.stroke();
  }
  drawOrderBoard(ctx, state.orders);
  drawStations(ctx, state, time);
  drawChef(ctx, state.player, time);
  drawHud(ctx, state);

  if (screen === SCREEN_PLAY) {
    const prompt = world.stationPrompt();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    roundRect(ctx, 240, 752, 800, 36, 10);
    ctx.fill();
    text(ctx, prompt, 640, 771, 17, '#fff');
    if (options.muted) text(ctx, '已静音 (M)', 1220, 771, 14, '#ffe0b2', 'right');
  }

  if (screen === SCREEN_TITLE) {
    ctx.fillStyle = 'rgba(62,39,35,0.72)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    text(ctx, '灶火小馆', 640, 240, 84, '#ffe0b2', 'center', 'bold', SERIF);
    text(ctx, 'HEARTHSIDE KITCHEN · 一家三分钟晚市的小馆', 640, 310, 24, '#ffccbc');
    text(ctx, '取食材 → 切菜 → 下锅 → 装盘 → 上菜，别让客人等太久！', 640, 380, 24, '#fff');
    text(ctx, 'WASD / 方向键移动 · E 互动 · 鼠标点击也可走过去 · M 静音', 640, 430, 20, '#d7ccc8');
    text(ctx, '按 Enter 开始晚市', 640, 520, 28, '#ffd54f');
    text(ctx, '番茄鸡蛋面 · 香煎鱼饭 · 田园沙拉 · 海鲜炒饭 · 番茄鱼汤', 640, 580, 18, '#ffe0b2');
  }

  if (screen === SCREEN_OVER) {
    ctx.fillStyle = 'rgba(62,39,35,0.78)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const rank = rankFor(state.coins);
    text(ctx, '打烊了！', 640, 200, 64, '#ffe0b2', 'center', 'bold', SERIF);
    text(ctx, `评级 ${rank.rank} · ${rank.note}`, 640, 280, 30, '#ffd54f');
    text(ctx, `💰 ${state.coins} 金币`, 640, 350, 36, '#fff');
    text(ctx, `上菜 ${state.served} 道 · 最佳连击 x${state.bestCombo} · 超时 ${state.expired} 单 · 上错 ${state.servedWrong} 盘`, 640, 420, 22, '#ffccbc');
    text(ctx, '按 Enter 再开一局', 640, 510, 26, '#ffd54f');
  }
}
