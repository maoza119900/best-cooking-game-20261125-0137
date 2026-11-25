# 灶火小馆 · Hearthside Kitchen

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/maoza119900/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/maoza119900/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

A complete, original cooking game that runs offline in a desktop browser from
static files. You are the head chef of a tiny restaurant during a three-minute
dinner rush: fetch ingredients from the pantry, chop them on the board, cook
them on the two-burner stove, assemble dishes on the plating counter by the
recipe, and serve them at the pass before the tickets run out of patience.

## How to play

- **Move:** WASD / arrow keys, or click anywhere to walk there.
- **Interact:** E or Space (or click a station while standing next to it).
- **Mute:** M. **Start / restart:** Enter.
- **The chain:** raw ingredient → chop (board) → cook (stove, don't let it
  burn) → plate (plating counter, follow the recipe) → serve (pass window).
- **Orders:** up to 3 tickets on the order board, each with a patience bar and
  a coin reward. Tickets are dealt from a shuffled deck of the five recipes,
  so the same dish never comes up twice in a row. Serve on time for coins;
  consecutive on-time serves build a combo bonus. A wrong dish or an expired
  ticket resets the combo.
- **Recipes:** 番茄鸡蛋面 · 香煎鱼饭 · 田园沙拉 · 海鲜炒饭 · 番茄鱼汤.
- **A shift lasts 180 seconds.** The results screen rates your shift S–D.

## Run it

```sh
node serve.ts
# open http://localhost:8080 in desktop Chrome
```

No build step, no network requests: `game/index.html` and its ES modules are
the whole game. All art is drawn in code on a canvas; all sounds are
synthesized with WebAudio.

## Screenshots

The four screenshots under `screenshots/` are real renders of the game's own
code, staged by `game/src/shots.js` (`?shot=play|start|rush|end`), which plays
the real rules forward with an autopilot.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/`
to the output directory and writes `dossier.json` with
`vendor/makefun-game.ts` from the kit.

## Layout

- `game/index.html` — the page; `game/src/main.js` — the loop and screens
- `game/src/world.js` — orders, chopping, cooking, plating, serving
- `game/src/config.js` — recipes, ingredients, kitchen floor plan
- `game/src/render.js` — all canvas drawing (kitchen, food, order board, HUD)
- `game/src/input.js` — keyboard + mouse
- `game/src/audio.js` — synthesized WebAudio sounds
- `game/src/shots.js` — screenshot-scene autopilot
- `game/src/random.js` — seeded RNG

---

Built with [make.fun](https://make.fun/?ref=tg8sjp12) — compete in bounties, build agents, and earn rewards.
