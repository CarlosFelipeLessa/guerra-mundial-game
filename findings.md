# Technical Findings - Asset Specifications & Canvas GIF Handling

## 1. Asset Inspection (`./gif/`)
- `parado.gif`: 640x360, RGBA transparent, BBox: (273, 86, 401, 278), frame duration 80ms
- `andando.gif`: 640x360, RGBA transparent
- `correndo.gif`: 640x360, RGBA transparent
- `pulo.gif`: 640x360, RGBA transparent
- `atirando.gif`: 640x360, RGBA transparent
- `homem de fogo.gif`: 640x360, 25 quadros a 80ms, RGBA transparente, BBox: (200, 119, 373, 284), pés em Y: 284 (offset 0.788), orientação padrão: Direita (facing 1)
- `disparo.gif`: 640x360, RGBA transparente, BBox do projétil no centro: X:[311, 330] (largura: 20px), Y:[175, 184] (altura: 10px), ponta do projétil voltada para a esquerda no asset original
- `atirando em diagonal para baixo.gif`: 640x360, 2 quadros a 80ms, RGBA transparente, BBox: (279, 87, 484, 278), pés em Y: 278 (offset 0.77), ponta do fuzil e labareda do disparo com ângulo real de 22.5° para baixo, bocal/saída da ponta da chama em dx: +104px, dy: -46px (alinhamento exato com o fuzil e rastro de projétil)

## 2. Canvas & Animated GIF Gotcha
- Native `CanvasRenderingContext2D.drawImage(HTMLImageElement)` can freeze animated GIFs on frame 0 in Chromium/WebKit when offscreen or not actively invalidated in the DOM paint tree.
- Solution: Dual-layer architecture. An animated sprite overlay DOM element inside the game viewport guarantees 100% native framerate, zero desync, and hardware acceleration via `transform: translate3d(...)`, while the HTML5 Canvas handles background rendering, particles, floor grid, bullet trails, and debug hitboxes.

## 3. Floating Platforms & High Ground Ballistics
- Semi-solid (one-way pass-through) platform geometry:
  - `PLT-01`: X: 160, Y: 355, 220x14 px (85px acima do solo base Y: 440)
  - `SNIPER-TOWER`: X: 440, Y: 260, 280x14 px (180px acima do solo, alcance de disparo diagonal: ~545px)
  - `VANTAGE-03`: X: 790, Y: 180, 240x14 px (260px acima do solo)
  - `PLT-04`: X: 1100, Y: 310, 240x14 px (130px acima do solo, sobre a rota inimiga)
- Physics: JumpForce `-560`, Gravity `1450`. Aterrissagem com `vy >= 0 && prevY <= plat.y + 4 && newY >= plat.y`. Descer com comando <kbd>S</kbd> + <kbd>ESPAÇO</kbd>. Projéteis passam livremente pelas plataformas.
## 4. Full-Screen Debug Grid & Telemetry Overlay
- Eixo Horizontal (X):
  - Centro da tela em X = 480 (`width / 2`), marcado com linha ciano brilhante (`#00f0ff`) e rótulo `X: 0 [CENTRO]`.
  - Linhas tracejadas a cada 60px exibindo a distância relativa: esquerda (`-60`, `-120`, `-180`, etc.) e direita (`+60`, `+120`, `+180`, etc.).
- Eixo Vertical (Y):
  - Linhas horizontais a cada 40px exibindo a coordenada Y na tela e a altitude em relação ao piso (`ALT = 440 - Y`).
  - Linha do solo em Y: 440 destacada em âmbar incandescente (`#ffbb00`).
- Telemetria de Interação e Disparo:
  - Cursor em tempo real: crosshair pontilhado e chip flutuante com `X (relativo)` e `Y (altura)`.
  - Ponto de clique: retículo animado com expansão de onda exibindo `CLIQUE: X / Y`.
  - Ponto de disparo: retículo losango vermelho/ciano no bocal exato da arma (`screenX`, `screenY`), linha de trajetória balística e painel HUD exibindo coordenadas computadas e vetor `VX / VY`.
