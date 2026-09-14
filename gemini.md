# Gemini Constitution - 2D Shooter Game Core

## 1. Project Mission & North Star
Build a modular, deterministic, high-performance 2D Shooter engine in Vanilla JavaScript and HTML5 Canvas with modern retro-cyber aesthetics, starting from a solid Milestone 1 foundation: player sprite rendering from the `./gif/` directory.

## 2. Architectural Pillars
- **Zero Heavy Frameworks:** Pure HTML5 semantic markup, CSS3 custom properties, and modular ES6 JavaScript.
- **Dual-Layer Rendering Model:**
  - Canvas Layer: World background, grid lines, particles, bullets, collision hitboxes.
  - Viewport DOM Sprite Layer: GPU-accelerated animated GIF playback (`image-rendering: pixelated`, `transform: translate3d`) avoiding Canvas GIF freezing bugs.
- **Deterministic Loop:** `requestAnimationFrame` with `deltaTime` normalization.
- **Graceful Fallbacks:** Visual neon placeholder bounding boxes when assets fail to load.

## 3. Directory Conventions
- Root: `index.html`, `style.css`
- Assets: `gif/` (holds `parado.gif`, `andando.gif`, `correndo.gif`, `pulo.gif`, `atirando.gif`)
- Engine: `src/` (`game.js`, `player.js`)
