# Performance notes — 1.6

## Measured, with limits

Synthetic Node test in the same workspace, five batches of 1,800 fixed simulation steps. Each batch starts with 170 high-HP enemies, disables normal spawns and autofire, and injects 40 projectiles every 15 ticks. Movement follows a deterministic curve. The script is `scripts/benchmark.mjs`; pass an absolute project directory to compare another source version.

| Source | Median simulation time per tick |
| --- | ---: |
| 1.5 baseline | 0.575 ms |
| 1.6 implementation | 0.328 ms |

This is about 43% less simulation time in this particular run. Both runs use the same inputs but the new collision rules can change trajectories and projectile survival, so this is a scenario comparison, not an isolated algorithm benchmark. Node scheduling, JIT and shared-host load affect timings. This excludes browser rendering, GPU work, localStorage and real mobile touch/audio. It is not an FPS claim.

A separate native Canvas execution check exercised 18 combinations: 360×780, 844×390 and 1440×900; all three environments; normal and reduced quality. Rendering completed without exceptions and did not mutate the saved world. This is a Canvas API execution check, not browser layout or visual QA.

## Bounded work

- Enemy collision candidates use 96-unit buckets rebuilt once per fixed tick; projectile checks use exact earliest impact time.
- Existing enemy cap is preserved. Physics substeps are at most 8 world units under the fixed simulation step.
- Terrain geometry cache: at most 192 tiles. Static scenery sprites: at most 24 canvases of 300×220, approximately 6.3 MB of raw pixels before runtime overhead. Light sprites: at most 16 canvases of 128×128.
- Normal particle budget: 240; low-quality budget: 90. Gameplay RNG is separate from decorative particles so quality changes do not change drops or upgrade offers.
- Dynamic lights: one player light and at most four explosion lights. No per-enemy shadow blur. Offscreen bodies and pickups are culled; telegraphs that may cross the screen remain visible.
- Normal DPR cap: 2 desktop, 1.5 touch. After sustained frame time over 25 ms for two seconds, DPR becomes 1 and decorative effects reduce. Recovery requires ten seconds below 19 ms. Both changes affect graphics only.
- Noise buffers are reused; Web Audio caps active sources at 12 and throttles repetitive cues.
- Save snapshots retain the full live run. Periodic writes are scheduled with requestIdleCallback when available; lifecycle writes remain synchronous. A heavily loaded device can still stall briefly during a storage write.

## Device follow-up

Real phone testing remains necessary for Safari/Chrome GPU behavior, touch response, orientation/safe-area layout, listening levels, offline installation and long-run thermal performance. Enemy obstacle avoidance is local steering rather than full pathfinding. Environment transitions preserve the obstacle footprints and enemy combat stats.
