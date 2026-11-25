// Screenshot scenes: the same world rules, played forward by a small autopilot that
// walks the chef between stations and presses interact, so every screenshot is a real
// render of real play — never a posed mock-up. The board is topped up to three
// tickets at the end of staging so the frame shows a full service.

import { STATIONS, INGREDIENTS, RECIPES, ORDER_PATIENCE, SHIFT_SECONDS } from './config.js';
import { EVENT_OVER } from './world.js';
import { SCREEN_OVER as OVER, SCREEN_PLAY as PLAY, SCREEN_TITLE as TITLE } from './render.js';

const STEP = 1 / 60;

function crateSpot(kind) {
  const crate = STATIONS.pantry.crates.find((c) => c.kind === kind);
  // Stand just right of the shelf (its right edge is x=128), never inside it.
  return { x: 156, y: crate.y + crate.h / 2 };
}

function handsHas(world, kind, stage) {
  const hands = world.state.player.hands;
  return !!hands && hands.type === 'item' && hands.item.kind === kind && hands.item.stage === stage;
}

function plateHas(world, slot, kind, stage) {
  return world.state.plates[slot].contents.some((item) => item.kind === kind && item.stage === stage);
}

/** Walk to a point, press interact once in reach, and finish when `until` holds.
 *  `station` names the exact station to interact with (a pantry crate, which shares
 *  its approach point with the crate beside it). */
function goAndDo(target, until, station) {
  let pressed = false;
  return {
    run(world, input) {
      const player = world.state.player;
      const dist = Math.hypot(player.x - target.x, player.y - target.y);
      if (dist > 30) {
        input.target = target;
        return 'active';
      }
      if (!pressed) {
        input.interact = true;
        if (station) input.station = station;
        pressed = true;
      }
      return until(world) ? 'done' : 'active';
    },
  };
}

/** Stand still until `until` holds (a chop or a cook finishing). */
function waitFor(until) {
  return { run: (world) => (until(world) ? 'done' : 'active') };
}

function runTasks(world, tasks, maxSeconds) {
  let index = 0;
  let elapsed = 0;
  while (elapsed < maxSeconds && index < tasks.length) {
    const input = { dx: 0, dy: 0, interact: false, target: null };
    if (tasks[index].run(world, input) === 'done') {
      index += 1;
      continue;
    }
    world.step(STEP, input);
    elapsed += STEP;
  }
}

function fastForward(world, seconds) {
  for (let t = 0; t < seconds; t += STEP) {
    if (world.step(STEP, { dx: 0, dy: 0, interact: false, target: null }) & EVENT_OVER) break;
  }
}

function topUpOrders(world) {
  while (world.state.orders.length < 3) world.spawnOrder();
}

/** Make sure the board holds an order for this recipe, so the staged serve succeeds. */
function ensureOrder(world, recipeId) {
  const state = world.state;
  if (state.orders.some((order) => order.recipe.id === recipeId)) return;
  const recipe = RECIPES.find((r) => r.id === recipeId);
  state.orders.push({ id: state.nextOrderId, recipe, patience: ORDER_PATIENCE, maxPatience: ORDER_PATIENCE });
  state.nextOrderId += 1;
}

function takeAndChop(world, kind) {
  const def = INGREDIENTS[kind];
  return [
    goAndDo(crateSpot(kind), () => handsHas(world, kind, 'raw'), { kind: 'pantry', crateKind: kind }),
    goAndDo({ x: STATIONS.board.anchorX, y: STATIONS.board.anchorY }, () => world.state.board.item?.kind === kind),
    waitFor(() => world.state.board.item?.stage === 'chopped'),
    goAndDo({ x: STATIONS.board.anchorX, y: STATIONS.board.anchorY }, () => handsHas(world, kind, 'chopped')),
  ];
}

function takeAndCook(world, kind, burner) {
  const anchor = STATIONS.stove.burners[burner];
  const def = INGREDIENTS[kind];
  const tasks = [];
  if (def.chop > 0) {
    tasks.push(...takeAndChop(world, kind));
  } else {
    tasks.push(goAndDo(crateSpot(kind), () => handsHas(world, kind, 'raw'), { kind: 'pantry', crateKind: kind }));
  }
  tasks.push(goAndDo({ x: anchor.anchorX, y: anchor.anchorY }, () => world.state.burners[burner].item?.kind === kind));
  tasks.push(waitFor(() => world.state.burners[burner].item?.stage === 'cooked'));
  tasks.push(goAndDo({ x: anchor.anchorX, y: anchor.anchorY }, () => handsHas(world, kind, 'cooked')));
  return tasks;
}

function addToPlate(world, kind, stage, slot) {
  return goAndDo(
    { x: STATIONS.plating.anchorX, y: STATIONS.plating.anchorY },
    () => plateHas(world, slot, kind, stage),
  );
}

/** The cover: a salad finished and ready to serve, a noodle dish mid-assembly, an egg on the stove. */
function stagePlay(world) {
  world.reset();
  const tasks = [
    ...takeAndChop(world, 'tomato'),
    addToPlate(world, 'tomato', 'chopped', 0),
    ...takeAndChop(world, 'greens'),
    addToPlate(world, 'greens', 'chopped', 0),
    ...takeAndChop(world, 'tomato'),
    addToPlate(world, 'tomato', 'chopped', 1),
    ...takeAndCook(world, 'noodle', 0),
    addToPlate(world, 'noodle', 'cooked', 1),
    goAndDo(crateSpot('egg'), () => handsHas(world, 'egg', 'raw'), { kind: 'pantry', crateKind: 'egg' }),
    goAndDo(
      { x: STATIONS.stove.burners[1].anchorX, y: STATIONS.stove.burners[1].anchorY },
      () => world.state.burners[1].item?.kind === 'egg',
    ),
  ];
  runTasks(world, tasks, 240);
  topUpOrders(world);
  return { screen: PLAY, best: world.state.coins };
}

/** The rush: everything cooking at once, one pan about to burn, the clock nearly out. */
function stageRush(world) {
  stagePlay(world);
  fastForward(world, 120);
  topUpOrders(world);
  return { screen: PLAY, best: world.state.coins };
}

/** The results screen after a served dish and a full shift. */
function stageEnd(world) {
  world.reset();
  ensureOrder(world, 'garden-salad');
  const tasks = [
    ...takeAndChop(world, 'tomato'),
    addToPlate(world, 'tomato', 'chopped', 0),
    ...takeAndChop(world, 'greens'),
    addToPlate(world, 'greens', 'chopped', 0),
    { run: (w) => { ensureOrder(w, 'garden-salad'); return 'done'; } },
    goAndDo(
      { x: STATIONS.plating.anchorX, y: STATIONS.plating.anchorY },
      () => world.state.player.hands?.type === 'plate',
    ),
    goAndDo(
      { x: STATIONS.serving.anchorX, y: STATIONS.serving.anchorY },
      () => world.state.served > 0,
    ),
  ];
  runTasks(world, tasks, 240);
  fastForward(world, SHIFT_SECONDS);
  return { screen: OVER, best: world.state.coins };
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * Any other name is the title scene.
 */
export function stageShot(name, world) {
  world.reset();
  if (name === 'play') return stagePlay(world);
  if (name === 'rush') return stageRush(world);
  if (name === 'end') return stageEnd(world);
  fastForward(world, 5);
  return { screen: TITLE, best: 0 };
}
