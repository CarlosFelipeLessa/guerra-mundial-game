# Progress Log - 2D Shooter Milestone 1

## Movement Synchronization Fixed
- Identified root cause of "andando parado":
  1. Test buttons previously forced `currentState = 'walk'` with `vx = 0` via `manualLock`.
  2. Fixed boundary clamping at 900px caused character to walk in place against edge of screen.
  3. Static floor grid did not move relative to player footsteps.
  4. Speed (220px/s) was twice the natural stride of `andando.gif` (~130px/s), causing foot sliding.
- Overhauled `src/player.js`:
  - Added responsive acceleration and instant-stop friction (`friction: 1600`).
  - Calibrated walk speed to 130px/s and run to 250px/s.
  - Added instant idle snap to `parado.gif` as soon as velocity drops below 10px/s.
  - Added footstep dust particle generation.
- Overhauled `src/game.js`:
  - Implemented infinite camera tracking (`cameraX`).
  - Added parallax cyberpunk skyline.
  - Linked perspective floor grid lines to `cameraX` so the ground visibly rolls backwards under player footsteps.
  - Interactive test buttons now trigger animated walks/runs rather than locking the sprite in place.
