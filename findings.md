# Technical Findings - Asset Specifications & Canvas GIF Handling

## 1. Asset Inspection (`./gif/`)
- `parado.gif`: 640x360, RGBA transparent, BBox: (273, 86, 401, 278), frame duration 80ms
- `andando.gif`: 640x360, RGBA transparent
- `correndo.gif`: 640x360, RGBA transparent
- `pulo.gif`: 640x360, RGBA transparent
- `atirando.gif`: 640x360, RGBA transparent
- `homem de fogo.gif`: 640x360, 25 quadros a 80ms, RGBA transparente, BBox: (200, 119, 373, 284), pés em Y: 284 (offset 0.788), orientação padrão: Direita (facing 1)
- `disparo.gif`: 640x360, RGBA transparente, BBox do projétil no centro: X:[311, 330] (largura: 20px), Y:[175, 184] (altura: 10px), ponta do projétil voltada para a esquerda no asset original

## 2. Canvas & Animated GIF Gotcha
- Native `CanvasRenderingContext2D.drawImage(HTMLImageElement)` can freeze animated GIFs on frame 0 in Chromium/WebKit when offscreen or not actively invalidated in the DOM paint tree.
- Solution: Dual-layer architecture. An animated sprite overlay DOM element inside the game viewport guarantees 100% native framerate, zero desync, and hardware acceleration via `transform: translate3d(...)`, while the HTML5 Canvas handles background rendering, particles, floor grid, bullet trails, and debug hitboxes.
