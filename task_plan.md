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
