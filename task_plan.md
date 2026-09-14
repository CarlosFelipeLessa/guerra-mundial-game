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
