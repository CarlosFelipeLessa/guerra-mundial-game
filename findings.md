# Technical Findings - Asset Specifications & Canvas GIF Handling

## 1. Asset Inspection (`./gif/`)
- `parado.gif`: 640x360, RGBA transparent, BBox: (273, 86, 401, 278), frame duration 80ms
- `andando.gif`: 640x360, RGBA transparent
- `correndo.gif`: 640x360, RGBA transparent
- `pulo.gif`: 640x360, RGBA transparent
- `atirando.gif`: 640x360, RGBA transparent

## 2. Canvas & Animated GIF Gotcha
- Native `CanvasRenderingContext2D.drawImage(HTMLImageElement)` can freeze animated GIFs on frame 0 in Chromium/WebKit when offscreen or not actively invalidated in the DOM paint tree.
- Solution: Dual-layer architecture. An animated sprite overlay DOM element inside the game viewport guarantees 100% native framerate, zero desync, and hardware acceleration via `transform: translate3d(...)`, while the HTML5 Canvas handles background rendering, particles, floor grid, bullet trails, and debug hitboxes.
