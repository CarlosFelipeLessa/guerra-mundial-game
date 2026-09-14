# Task Plan - 2D Shooter Milestone 1: Movement Synchronization Overhaul

## Phase 1: Environment & Asset Discovery
- [x] Inspect existing assets in `./gif/`
- [x] Determine sprite frame sizes, bounding boxes, and alpha transparency
- [x] Analyze frame timing (80ms/frame) and foot contact stride cadences

## Phase 2: Architecture & File Scaffolding
- [x] Create project governance files (`gemini.md`, `task_plan.md`, `findings.md`, `progress.md`)
- [x] Create `index.html` with cyber-arcade HUD, canvas, and sprite viewport
- [x] Create `style.css` with responsive layout, CRT scanlines, and design system tokens
- [x] Implement `src/player.js`
- [x] Implement `src/game.js`

## Phase 3: Movement Synchronization & Bug Fixes
- [x] Fix "Andando Parado" bug (removed state lock trap in test buttons)
- [x] Calibrate walking and running speeds (walk: 130px/s, run: 250px/s) to match GIF strides
- [x] Add horizontal parallax camera and dynamically scrolling perspective floor grid
- [x] Add footstep contact dust particles and dynamic shadow
- [x] Add window blur guard to eliminate stuck keys

## Phase 4: Enemy Implementation - Homem de Fogo
- [x] Inspect asset `gif/homem de fogo.gif` (dimensions, feet contact, default facing)
- [x] Create `src/enemy.js` (`FireManEnemy` class with target tracking AI, facing flip, feet grounding)
- [x] Integrate flame ember particle generator with convective updraft and glow
- [x] Integrate dual-layer rendering (Canvas shadow/hitbox + Viewport DOM Sprite)
- [x] Add HUD telemetry chip and spawn/reset button in `index.html`
- [x] Add styling and glow effects in `style.css`
- [x] Synchronize codebases across Desktop and Documents repositories

## Phase 5: Weapon Projectile System - disparo.gif
- [x] Inspect asset `gif/disparo.gif` (crop bounds, orientation, frame count)
- [x] Create `src/projectile.js` (`Projectile` & `ProjectileManager` with rotation and trail)
- [x] Implement muzzle flash and impact spark bursts
- [x] Add continuous auto-fire cadence and instant 1st frame shot in `src/player.js`
- [x] Add horizontal, running, and downward shooting angles
- [x] Add collision detection and damage system on `FireManEnemy` with hit flash and health bar
- [x] Synchronize codebases across Desktop and Documents repositories

## Phase 6: Diagonal Downward Shooting State
- [x] Inspect asset `gif/atirando em diagonal para baixo.gif` and calibrate muzzle to flame blast tip (angle: 22.5°, contact: 278, muzzle: dx=+104, dy=-46)
- [x] Add `shootDiagDown` in `PLAYER_SPRITES` and `src/player.js`
- [x] Map input combination (<kbd>S</kbd> + <kbd>A/D</kbd> + <kbd>F</kbd>) and button `8 DIAG. BAIXO`
- [x] Calculate diagonal velocity vectors (`vx = ±785 px/s`, `vy = 325 px/s`) with rotated projectile and ground/enemy collisions
- [x] Synchronize codebases across Desktop and Documents repositories

## Phase 7: Floating Platforms & High-Ground Shooting
- [x] Implement semi-solid one-way platform physics with edge-fall detection in `src/player.js`
- [x] Add drop-down action with <kbd>S</kbd> + <kbd>ESPAÇO</kbd>
- [x] Render cyberpunk floating energy platforms with hover emitters and glowing rails in `src/game.js`
- [x] Add button `TORRE SNIPER: SUBIR ▲` and command legend in `index.html`
- [x] Enable seamless projectile pass-through for high-ground snipes
- [x] Synchronize codebases across Desktop and Documents repositories

## Phase 8: Full-Screen Debug Grid & Shot Telemetry
- [x] Implement horizontal axis lines relative to center (X: 0 at 480px, ±distance markers every 60px)
- [x] Implement vertical axis lines (screen Y and altitude above ground every 40px, ground at Y: 440)
- [x] Add live cursor crosshair tracking with floating coordinate chip
- [x] Add click location marker with expanding pulse reticle
- [x] Add real-time shot telemetry displaying exact computed muzzle point (`muzzleX`, `muzzleY`), ballistic vector ray, and HUD tactical readout box
- [x] Add toggle button `DEBUG GRID: ON/OFF` in interactive cabinet rack
- [x] Synchronize codebases across Desktop and Documents repositories


