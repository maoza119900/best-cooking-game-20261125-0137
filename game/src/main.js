// Hearthside Kitchen — the loop: title, play, results. The chef walks, the tickets
// tick down, the pans sizzle, and the shift ends after three minutes.
// ?shot=start|play|rush|end stages a screenshot scene instead of live play.

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './config.js';
import { World, EVENT_CHOP_DONE, EVENT_COOK_DONE, EVENT_BURNT, EVENT_SERVED, EVENT_WRONG, EVENT_EXPIRED, EVENT_OVER } from './world.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';
import { render, SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER } from './render.js';
import { stageShot } from './shots.js';

const STEP = 1 / 60;

export function boot() {
  const canvas = document.getElementById('game');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d');
  const world = new World(20261125);
  const input = new Input(canvas);
  const sounds = new SoundBank();
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');

  let screen = SCREEN_TITLE;
  let muted = false;
  let lastTickSecond = -1;
  let lastOrderCount = 0;

  if (shot) {
    // Screenshot mode: the canvas fills the frame exactly, no page chrome.
    const wrap = document.getElementById('wrap');
    const note = wrap.querySelector('p');
    if (note) note.remove();
    wrap.style.padding = '0';
    canvas.style.maxWidth = '1280px';
    canvas.style.maxHeight = '800px';
    const staged = stageShot(shot, world);
    screen = staged.screen;
    render(ctx, world, screen, { muted });
    document.title = `灶火小馆 — ${shot}`;
    return { world, input, sounds };
  }

  let last = performance.now();
  let accumulator = 0;

  function frame(now) {
    const elapsed = Math.min(0.1, (now - last) / 1000);
    last = now;
    accumulator += elapsed;
    const flags = input.consume();
    const move = input.moveDirection();

    if (flags.mute) {
      muted = sounds.toggleMute();
    }

    if (screen === SCREEN_TITLE) {
      if (flags.confirm) {
        world.reset();
        screen = SCREEN_PLAY;
        sounds.pickup();
      }
    } else if (screen === SCREEN_PLAY) {
      // A click walks the chef there; a click on a station in reach interacts at once.
      let target = null;
      let clickInteract = false;
      if (flags.click) {
        const station = world.nearestStation();
        if (station) {
          const dx = flags.click.x - world.state.player.x;
          const dy = flags.click.y - world.state.player.y;
          if (Math.hypot(dx, dy) < 120) clickInteract = true;
        }
        if (!clickInteract) target = flags.click;
      }
      while (accumulator >= STEP) {
        const events = world.step(STEP, {
          dx: move.dx,
          dy: move.dy,
          interact: flags.interact || clickInteract,
          target,
        });
        flags.interact = false;
        clickInteract = false;
        accumulator -= STEP;
        if (events & EVENT_CHOP_DONE) sounds.chop();
        if (events & EVENT_COOK_DONE) sounds.plate();
        if (events & EVENT_BURNT) sounds.serveBad();
        if (events & EVENT_SERVED) sounds.serveGood();
        if (events & EVENT_WRONG) sounds.serveBad();
        if (events & EVENT_EXPIRED) sounds.expire();
        if (events & EVENT_OVER) {
          screen = SCREEN_OVER;
          sounds.serveGood();
        }
      }
      // A burner is cooking: keep the sizzle going; a low clock ticks.
      const cooking = world.state.burners.some((burner) => burner.item && burner.item.stage !== 'burnt');
      if (cooking) sounds.startSizzle();
      else sounds.stopSizzle();
      if (world.state.orders.length > lastOrderCount) sounds.ding();
      lastOrderCount = world.state.orders.length;
      const wholeSecond = Math.floor(world.state.shiftLeft);
      if (world.state.shiftLeft <= 10 && wholeSecond !== lastTickSecond) {
        lastTickSecond = wholeSecond;
        sounds.tick();
      }
    } else if (screen === SCREEN_OVER) {
      sounds.stopSizzle();
      if (flags.confirm) {
        world.reset();
        screen = SCREEN_PLAY;
        lastTickSecond = -1;
      }
    }

    render(ctx, world, screen, { muted });
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
  return { world, input, sounds };
}

boot();
