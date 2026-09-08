# Endless_2D

An endless, top-down neon survival game. Move your pilot through an infinite arena while auto-targeting pulse weapons fend off geometric drones.

## Play

- **WASD / arrow keys:** move. On touchscreens, drag anywhere on the arena for a floating analog joystick.
- **P / Escape / pause button:** pause or resume. Switching tabs automatically pauses.
- **Sound button:** opt in to synthesized sound effects.
- Collect violet energy to level up, then choose one of three abilities. Green pickups restore shield integrity.
- Survive increasingly difficult waves; score is enemy value multiplied by wave number. The personal best is saved on this browser only.

## Run locally

No dependencies or build step. Serve the repository over HTTP (ES modules cannot be opened reliably with `file://`):

```sh
python3 -m http.server 8080
```

Then open http://localhost:8080. With Node 22+, run `npm test` for simulation tests. `npm start` is a convenience alias for the Python server.

## GitHub Pages

One-time setup: **Settings → Pages → Build and deployment → Source → GitHub Actions**.
Then open **Actions → Test and deploy game → Run workflow** (or push a commit to main). Successful runs test and publish only `index.html`, `style.css`, and `src/`.

Expected URL after a successful deployment: https://amirdoosti377.github.io/Endless_2D.github.io/

Official setup guide: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Architecture

| Module | Responsibility |
| --- | --- |
| `src/config.js` | Game balance, enemy archetypes, resource limits |
| `src/world.js` | DOM-free simulation, spawning, targeting, damage, loot, progression; injectable RNG |
| `src/math.js` | Normalized movement and swept projectile collision |
| `src/renderer.js` | Canvas rendering, camera, world grid, glow, particles, damage feedback |
| `src/input.js` | Keyboard and pointer input with a normalized movement vector |
| `src/audio.js` | Optional Web Audio synthesis; independent of game rules |
| `src/main.js` | Application states, fixed-step loop, UI, local score storage |
| `tests/world.test.js` | Combat, movement, progression, reset, and long-run bounds |

The renderer reads world state; gameplay does not depend on canvas or the DOM. The world emits events consumed by UI/audio. The simulation runs at 60 fixed steps per second, caps accumulated frame time, bounds entities, and expires offscreen objects. Canvas uses a maximum 2× pixel ratio. Reduced-motion preference disables camera shake and damage-screen flashes.

### Extending

Add enemy stats in `ENEMIES` and update the selection in `World.spawn`. Add distinct behaviors in the enemy update stage. Extend the weapon targeting/projectile stage for new weapons; move it into a dedicated system module as the catalogue grows. Add progression events for upgrade UI. Replace `Renderer` without rewriting simulation if moving to WebGL later.

This version uses Canvas 2D, HTML, CSS and native JavaScript modules. No Three.js, WebGPU, external assets, CDN, telemetry, backend, or server leaderboard. Saves are device-local and not cheat-resistant. Browser visual/device QA has not yet been performed; automated tests exercise the simulation.

## Version 1.1

Six enemy archetypes: scout, runner, tank, weaving drone, charging drone, and ranged gunner. Chargers lock their direction during a 0.8-second warning; gunners aim for 0.85 seconds before firing a dodgeable projectile. Waves now advance every 22 seconds with modestly denser spawns. From wave three, amber energy zones warn for 1.8 seconds before activating.

Rendering interpolates fixed-step positions, eases the camera and pilot rotation, and adds parallax dust, rotating beacons, trails, and expanding impact rings. Gameplay and attack timers freeze on pause. Reduced-motion mode suppresses decorative motion and transitions while preserving readable attack warnings.

`src/behaviors.js` owns enemy movement and attack strategies. `src/environment.js` owns decorative layers and visual warnings; hazard rules remain in `World`.

## Version 1.2 — Run-based abilities and Sentinel fights

Every level grants exactly one selection from three distinct ability offers. The simulation pauses until all pending selections are resolved. Choose using mouse, touch, or keys 1/2/3. Multiple levels gained together queue multiple choices. Abilities stack for the current run only; restart clears them. No permanent combat upgrades. The personal best remains browser-local.

Eight abilities: projectile damage, firing rate, multishot, maximum shield, armor, movement speed, energy attraction, and regeneration. Capped abilities disappear from offers. Automatic weapon scaling has been removed: your choices define the build.

The first Sentinel arrives at 90 seconds, with a two-second arrival warning. It alternates radial projectiles and a telegraphed directional dash. Below half health it attacks more frequently. Defeating it clears hostile projectiles and drops 22 energy; the next, stronger Sentinel arrives 100 seconds later. Only one boss can be alive. Elite enemies start in wave 5 with doubled health and increased contact damage, marked by an extra ring.

Extension points: `abilities.js` contains ability definitions, eligibility and effects; `boss.js` contains boss scheduling entry and attack behavior. `World` owns the pending selection queue, run stats and damage calculations; UI renders the offers without changing simulation rules.

This release has automated simulation tests, but has not received browser visual QA or a human difficulty-balancing playtest.
