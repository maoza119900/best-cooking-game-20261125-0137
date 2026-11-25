// The kitchen's rules: orders, chopping, cooking, plating and serving.
// Nothing here draws or listens to keys; main.js feeds it input and render.js reads it.

import {
  INGREDIENTS, RECIPES, STATIONS, OBSTACLES, WALK,
  SHIFT_SECONDS, PLAYER_SPEED, PLAYER_RADIUS, INTERACT_RANGE,
  MAX_ORDERS, ORDER_PATIENCE, FIRST_ORDER_AT, SPAWN_EVERY, SPAWN_EVERY_LATE, LATE_AFTER,
} from './config.js';
import { makeRandom } from './random.js';

export const EVENT_NONE = 0;
export const EVENT_PICKUP = 1;
export const EVENT_CHOP_DONE = 2;
export const EVENT_COOK_DONE = 4;
export const EVENT_BURNT = 8;
export const EVENT_SERVED = 16;
export const EVENT_WRONG = 32;
export const EVENT_EXPIRED = 64;
export const EVENT_TRASH = 128;
export const EVENT_OVER = 256;

const OVERCOOK_LIMIT = 4;

export function makeItem(kind, stage = 'raw') {
  return { kind, stage, progress: 0 };
}

/** The recipe a plate's contents complete, or null while it is still mid-assembly. */
export function plateDish(contents) {
  for (const recipe of RECIPES) {
    if (recipe.needs.length !== contents.length) continue;
    const matches = recipe.needs.every((need) =>
      contents.some((item) => item.kind === need.kind && item.stage === need.stage));
    if (matches) return recipe;
  }
  return null;
}

function plateNeeds(plate) {
  const dish = plateDish(plate.contents);
  if (dish) return [];
  // The ingredients any open recipe still wants from this plate.
  const wanted = [];
  for (const recipe of RECIPES) {
    for (const need of recipe.needs) {
      if (plate.contents.some((item) => item.kind === need.kind && item.stage === need.stage)) continue;
      if (!wanted.some((w) => w.kind === need.kind && w.stage === need.stage)) wanted.push(need);
    }
  }
  return wanted;
}

export class World {
  constructor(seed = 1) {
    this.seed = seed;
    this.reset();
  }

  reset() {
    this.random = makeRandom(this.seed);
    this.recipeDeck = [];
    this.state = {
      time: 0,
      shiftLeft: SHIFT_SECONDS,
      coins: 0,
      combo: 0,
      bestCombo: 0,
      served: 0,
      servedWrong: 0,
      expired: 0,
      orders: [],
      nextOrderId: 1,
      spawnIn: FIRST_ORDER_AT,
      player: { x: 640, y: 420, hands: null },
      board: { item: null, progress: 0 },
      burners: [{ item: null, progress: 0, overcook: 0 }, { item: null, progress: 0, overcook: 0 }],
      plates: [{ contents: [] }, { contents: [] }],
      over: false,
    };
    return this.state;
  }

  spawnOrder() {
    const state = this.state;
    // Deal from a shuffled deck so the same recipe never repeats back to back.
    if (this.recipeDeck.length === 0) this.recipeDeck = this.random.shuffle(RECIPES);
    const recipe = this.recipeDeck.pop();
    state.orders.push({
      id: state.nextOrderId,
      recipe,
      patience: ORDER_PATIENCE,
      maxPatience: ORDER_PATIENCE,
    });
    state.nextOrderId += 1;
    state.spawnIn = state.time > LATE_AFTER ? SPAWN_EVERY_LATE : SPAWN_EVERY;
  }

  step(dt, input) {
    const state = this.state;
    if (state.over) return EVENT_NONE;
    let events = EVENT_NONE;
    state.time += dt;
    state.shiftLeft = Math.max(0, SHIFT_SECONDS - state.time);
    if (state.shiftLeft <= 0) {
      state.over = true;
      return EVENT_OVER;
    }

    this.movePlayer(dt, input);
    if (input.interact) events |= this.interact(input.station ?? null);

    // Chopping finishes on the board.
    if (state.board.item && state.board.item.stage === 'raw') {
      const def = INGREDIENTS[state.board.item.kind];
      state.board.progress += dt;
      if (state.board.progress >= def.chop) {
        state.board.item.stage = 'chopped';
        state.board.item.progress = 0;
        state.board.progress = 0;
        events |= EVENT_CHOP_DONE;
      }
    }

    // Cooking finishes on each burner; food left too long burns.
    for (const burner of state.burners) {
      if (!burner.item) continue;
      const def = INGREDIENTS[burner.item.kind];
      if (burner.item.stage !== 'cooked' && burner.item.stage !== 'burnt') {
        burner.progress += dt;
        if (burner.progress >= def.cook) {
          burner.item.stage = 'cooked';
          burner.item.progress = 0;
          burner.progress = 0;
          burner.overcook = 0;
          events |= EVENT_COOK_DONE;
        }
      } else if (burner.item.stage === 'cooked') {
        burner.overcook += dt;
        if (burner.overcook >= OVERCOOK_LIMIT) {
          burner.item.stage = 'burnt';
          events |= EVENT_BURNT;
        }
      }
    }

    // Orders lose patience and expire.
    for (let i = state.orders.length - 1; i >= 0; i -= 1) {
      const order = state.orders[i];
      order.patience -= dt;
      if (order.patience <= 0) {
        state.orders.splice(i, 1);
        state.expired += 1;
        state.combo = 0;
        events |= EVENT_EXPIRED;
      }
    }

    state.spawnIn -= dt;
    if (state.spawnIn <= 0 && state.orders.length < MAX_ORDERS) this.spawnOrder();
    return events;
  }

  movePlayer(dt, input) {
    const player = this.state.player;
    let dx = input.dx ?? 0;
    let dy = input.dy ?? 0;
    if ((dx === 0 && dy === 0) && input.target) {
      const tx = input.target.x - player.x;
      const ty = input.target.y - player.y;
      const dist = Math.hypot(tx, ty);
      if (dist > 8) {
        dx = tx / dist;
        dy = ty / dist;
      }
    }
    const len = Math.hypot(dx, dy);
    if (len > 1) { dx /= len; dy /= len; }
    if (len === 0) return;
    player.x += dx * PLAYER_SPEED * dt;
    player.y += dy * PLAYER_SPEED * dt;
    player.x = Math.min(WALK.x1, Math.max(WALK.x0, player.x));
    player.y = Math.min(WALK.y1, Math.max(WALK.y0, player.y));
    // Push the chef out of every counter rectangle.
    for (const rect of OBSTACLES) {
      const cx = Math.min(rect.x + rect.w, Math.max(rect.x, player.x));
      const cy = Math.min(rect.y + rect.h, Math.max(rect.y, player.y));
      const ox = player.x - cx;
      const oy = player.y - cy;
      const distSq = ox * ox + oy * oy;
      if (distSq >= PLAYER_RADIUS * PLAYER_RADIUS) continue;
      if (distSq === 0) { player.y = rect.y + rect.h + PLAYER_RADIUS; continue; }
      const dist = Math.sqrt(distSq);
      player.x = cx + (ox / dist) * PLAYER_RADIUS;
      player.y = cy + (oy / dist) * PLAYER_RADIUS;
    }
  }

  /** The station the chef can reach right now, with its detail, or null.
   *  When `preferred` names a pantry crate, that crate is the answer (the shelf's
   *  crates share one approach point, so "nearest" alone cannot tell them apart). */
  nearestStation(preferred) {
    const player = this.state.player;
    if (preferred && preferred.kind === 'pantry') {
      const crate = STATIONS.pantry.crates.find((c) => c.kind === preferred.crateKind);
      if (crate) {
        const cx = Math.min(crate.x + crate.w, Math.max(crate.x, player.x));
        const cy = Math.min(crate.y + crate.h, Math.max(crate.y, player.y));
        const dist = Math.hypot(player.x - cx, player.y - cy);
        if (dist <= INTERACT_RANGE) return { kind: 'pantry', crateKind: crate.kind, dist };
      }
      return null;
    }
    let best = null;
    const consider = (station, x, y) => {
      const dist = Math.hypot(player.x - x, player.y - y);
      if (dist <= INTERACT_RANGE && (!best || dist < best.dist)) best = { ...station, dist };
    };
    for (const crate of STATIONS.pantry.crates) {
      // The shelf is an obstacle, so measure to the crate's nearest edge, not its centre.
      const cx = Math.min(crate.x + crate.w, Math.max(crate.x, player.x));
      const cy = Math.min(crate.y + crate.h, Math.max(crate.y, player.y));
      const dist = Math.hypot(player.x - cx, player.y - cy);
      if (dist <= INTERACT_RANGE && (!best || dist < best.dist)) {
        best = { kind: 'pantry', crateKind: crate.kind, dist, approachX: 156, approachY: crate.y + crate.h / 2 };
      }
    }
    consider({ kind: 'board' }, STATIONS.board.anchorX, STATIONS.board.anchorY);
    STATIONS.stove.burners.forEach((burner, index) => {
      consider({ kind: 'stove', burner: index }, burner.anchorX, burner.anchorY);
    });
    consider({ kind: 'plating' }, STATIONS.plating.anchorX, STATIONS.plating.anchorY);
    consider({ kind: 'serving' }, STATIONS.serving.anchorX, STATIONS.serving.anchorY);
    consider({ kind: 'trash' }, STATIONS.trash.anchorX, STATIONS.trash.anchorY);
    return best;
  }

  interact(stationOverride) {
    const state = this.state;
    const station = stationOverride ? this.nearestStation(stationOverride) : this.nearestStation();
    if (!station) return EVENT_NONE;
    const hands = state.player.hands;

    if (station.kind === 'pantry') {
      if (hands) return EVENT_NONE;
      state.player.hands = { type: 'item', item: makeItem(station.crateKind) };
      return EVENT_PICKUP;
    }

    if (station.kind === 'board') {
      const board = state.board;
      if (board.item && board.item.stage === 'chopped' && !hands) {
        state.player.hands = { type: 'item', item: board.item };
        state.board.item = null;
        state.board.progress = 0;
        return EVENT_PICKUP;
      }
      if (!board.item && hands && hands.type === 'item') {
        const def = INGREDIENTS[hands.item.kind];
        if (def.chop > 0 && hands.item.stage === 'raw') {
          state.board.item = hands.item;
          state.board.progress = 0;
          state.player.hands = null;
          return EVENT_PICKUP;
        }
      }
      return EVENT_NONE;
    }

    if (station.kind === 'stove') {
      const burner = state.burners[station.burner];
      if (burner.item && (burner.item.stage === 'cooked' || burner.item.stage === 'burnt') && !hands) {
        state.player.hands = { type: 'item', item: burner.item };
        burner.item = null;
        burner.progress = 0;
        burner.overcook = 0;
        return EVENT_PICKUP;
      }
      if (!burner.item && hands && hands.type === 'item') {
        const def = INGREDIENTS[hands.item.kind];
        const readyToCook = def.cook > 0 && (hands.item.stage === 'cooked' ? false
          : (def.chop > 0 ? hands.item.stage === 'chopped' : hands.item.stage === 'raw'));
        if (readyToCook) {
          burner.item = hands.item;
          burner.progress = 0;
          burner.overcook = 0;
          state.player.hands = null;
          return EVENT_PICKUP;
        }
      }
      return EVENT_NONE;
    }

    if (station.kind === 'plating') {
      if (hands && hands.type === 'item') {
        const item = hands.item;
        for (const plate of state.plates) {
          const dish = plateDish(plate.contents);
          if (dish) continue;
          if (plate.contents.length >= 3) continue;
          if (plate.contents.some((held) => held.kind === item.kind)) continue;
          if (!plateNeeds(plate).some((need) => need.kind === item.kind && need.stage === item.stage)) continue;
          plate.contents.push({ kind: item.kind, stage: item.stage });
          state.player.hands = null;
          return EVENT_PICKUP;
        }
        return EVENT_NONE;
      }
      if (!hands) {
        const readyIndex = state.plates.findIndex((plate) => plateDish(plate.contents));
        if (readyIndex !== -1) {
          const plate = state.plates[readyIndex];
          state.player.hands = { type: 'plate', contents: plate.contents, dish: plateDish(plate.contents), slot: readyIndex };
          plate.contents = [];
          return EVENT_PICKUP;
        }
        // No finished dish: clear the fullest plate instead of leaving a stuck one.
        let fullest = -1;
        for (let i = 0; i < state.plates.length; i += 1) {
          if (state.plates[i].contents.length > 0 && (fullest === -1 || state.plates[i].contents.length > state.plates[fullest].contents.length)) fullest = i;
        }
        if (fullest !== -1) {
          state.plates[fullest].contents = [];
          return EVENT_TRASH;
        }
      }
      return EVENT_NONE;
    }

    if (station.kind === 'serving') {
      if (hands && hands.type === 'plate' && hands.dish) {
        const orderIndex = state.orders.findIndex((order) => order.recipe.id === hands.dish.id);
        if (orderIndex !== -1) {
          const order = state.orders[orderIndex];
          const bonus = state.combo * 2;
          state.coins += order.recipe.reward + bonus;
          state.combo += 1;
          state.bestCombo = Math.max(state.bestCombo, state.combo);
          state.served += 1;
          state.orders.splice(orderIndex, 1);
          state.player.hands = null;
          return EVENT_SERVED;
        }
        state.combo = 0;
        state.servedWrong += 1;
        state.player.hands = null;
        return EVENT_WRONG;
      }
      return EVENT_NONE;
    }

    if (station.kind === 'trash') {
      if (hands && hands.type === 'item') {
        state.player.hands = null;
        return EVENT_TRASH;
      }
      if (hands && hands.type === 'plate') {
        state.player.hands = null;
        return EVENT_TRASH;
      }
      return EVENT_NONE;
    }
    return EVENT_NONE;
  }

  /** The one-line hint the HUD shows for the station in reach, or a general hint. */
  stationPrompt() {
    const state = this.state;
    const station = this.nearestStation();
    const hands = state.player.hands;
    if (!station) return 'WASD / 方向键移动 · 走到站点按 E 互动 · 点击站点也可走过去';
    if (station.kind === 'pantry') {
      return hands ? '手里已经有东西了' : `E：取${INGREDIENTS[station.crateKind].name}`;
    }
    if (station.kind === 'board') {
      if (state.board.item && state.board.item.stage === 'chopped') return 'E：取走切好的食材';
      if (state.board.item) return '正在切菜……稍等片刻';
      if (hands && hands.type === 'item' && INGREDIENTS[hands.item.kind].chop > 0 && hands.item.stage === 'raw') return 'E：把食材放到切菜板';
      return '切菜板：先拿需要切的食材来';
    }
    if (station.kind === 'stove') {
      const burner = state.burners[station.burner];
      if (burner.item && burner.item.stage === 'cooked') return 'E：取走煮好的食材';
      if (burner.item && burner.item.stage === 'burnt') return '烧糊了！E：取走扔掉';
      if (burner.item) return '正在煮……别让它烧糊';
      if (hands && hands.type === 'item') {
        const def = INGREDIENTS[hands.item.kind];
        const ok = def.cook > 0 && (def.chop > 0 ? hands.item.stage === 'chopped' : hands.item.stage === 'raw');
        return ok ? 'E：下锅' : '这食材不用下锅';
      }
      return '灶台：把要煮的食材放上来';
    }
    if (station.kind === 'plating') {
      if (hands && hands.type === 'item') return 'E：把食材装进盘子';
      if (hands && hands.type === 'plate') return '端着菜呢，去出菜口上菜';
      const ready = state.plates.some((plate) => plateDish(plate.contents));
      if (ready) return 'E：端起做好的菜';
      const anyFood = state.plates.some((plate) => plate.contents.length > 0);
      return anyFood ? 'E：倒掉这盘重做' : '摆盘台：按菜谱把食材装进盘子';
    }
    if (station.kind === 'serving') {
      if (hands && hands.type === 'plate' && hands.dish) return `E：上菜「${hands.dish.name}」`;
      if (hands && hands.type === 'plate') return '这盘还没做完，不能上菜';
      return '出菜口：端做好的菜来上菜';
    }
    if (station.kind === 'trash') return hands ? 'E：扔掉手里的东西' : '垃圾桶';
    return '';
  }
}
