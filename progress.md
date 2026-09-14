# Progress Log - 2D Shooter Milestone 1

## Linhas de Grade de Tela (Debug Grid) & Telemetria em Tempo Real
- Implementado sistema de visualização e calibração espacial em tela cheia (960x540):
  - **Eixo Horizontal (X)**: Linha central destacada em `X: 480` (`X: 0 [CENTRO]`), com divisões a cada 60px mostrando a distância para a esquerda (`-60`, `-120`, etc.) e direita (`+60`, `+120`, etc.).
  - **Eixo Vertical (Y)**: Linhas a cada 40px mostrando a coordenada exata `Y` e a altitude correspondente acima do solo (`ALT: 440 - Y`). Solo destacado em `Y: 440 [NÍVEL DO SOLO]`.
  - **Mira do Cursor em Tempo Real**: Linhas guias tipo crosshair e etiqueta flutuante dinâmica com `X (relativo ao centro)` e `Y (altura)`.
  - **Marcação de Clique**: Retículo de pulso registrando onde o usuário clicou com o mouse na tela.
  - **Telemetria de Disparo Computado**: Marcador losango vermelho no ponto exato onde o tiro é computado no bocal da arma (`muzzleX`, `muzzleY`), com vetor balístico de velocidade e painel HUD superior com coordenadas `X`, `Y`, `ALTURA` e velocidade `VX / VY`.
  - **Botão de Alternância**: Integrado botão `DEBUG GRID: ON/OFF` na interface para ativar/desativar a qualquer instante.

## Plataformas Flutuantes Cyberpunk & Tiros do Alto
- Implementado sistema de plataformas semi-sólidas (*one-way pass-through*):
  - 4 plataformas posicionadas estrategicamente: `PLT-01` (Y: 355, 85px), `SNIPER-TOWER` (Y: 260, 180px), `VANTAGE-03` (Y: 180, 260px) e `PLT-04` (Y: 310, 130px).
  - Física de aterrissagem pelo topo, travessia livre por baixo e detecção de queda de borda sem travamentos.
  - Comando de descida suave de plataformas com <kbd>S</kbd> + <kbd>ESPAÇO</kbd>.
  - Projéteis atravessam livremente as plataformas para atingir o solo ou inimigos abaixo.
  - Calibração de salto esportivo (`jumpForce: -560`, `gravity: 1450`) permitindo saltos em cadeia.
  - Renderização estilizada com vidro escurecido translúcido, trilho superior neon ciano (`#00f0ff`), listras diagonais, cantos em LED âmbar e propulsores anti-gravidade luminosos.
  - Sombra dinâmica do personagem projetada na superfície correta (plataforma ou solo).
  - Botão de teletransporte instantâneo para a Torre Sniper no HUD (`TORRE SNIPER: SUBIR ▲`).

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

## Novo Asset e Estado: Atirando em Diagonal para Baixo
- Integrado asset `gif/atirando em diagonal para baixo.gif` (2 quadros a 80ms, 640x360).
- Adicionado estado `shootDiagDown` em `src/player.js`:
  - Ativação via atalho <kbd>S</kbd> + <kbd>A/D</kbd> + <kbd>F</kbd> (ou clique com mouse) ou botão `8 DIAG. BAIXO`.
  - Posição firme de mira estática no solo com alinhamento de pés em Y: 278.
  - **Calibração de Saída da Ponta da Arma/Chama**:
    - Ajustado o bocal para `dx: +104px` e `dy: -46px` (anteriormente `64px / -56px`), posicionando o surgimento dos projéteis e o flash exatamente na ponta da labareda de fogo que sai do fuzil de precisão.
    - Vetor de trajetória e rotação de projétil calibrados para o ângulo contínuo de **22.5°** (`bvx = facing * 785 px/s`, `bvy = 325 px/s`), alinhado perfeitamente com a alma do cano e a labareda do sprite.
- Atualizado rack de botões com atalho `8 DIAG. BAIXO` e legenda de comandos em `index.html`.


## Sistema de Projétil da Arma (disparo.gif)
- Integrado asset `gif/disparo.gif` como projétil disparado pelo jogador.
- **Calibração do Bocal da Arma (Muzzle Alignment)**:
  - Analisado o ponto exato da boca do cano/silenciador do fuzil no GIF 640x360 em cada estado:
    - *Tiro Parado (`shoot`)*: ajustado para `dx: +80px`, `dy: -87px` (eliminando desvio de 19px que fazia o tiro sair na cintura).
    - *Tiro Correndo (`shootRun`)*: ajustado para `dx: +90px`, `dy: -82px` acompanhando a inclinação do corpo.
    - *Tiro para Baixo (`shootDown`)*: ajustado para `dx: +20px`, `dy: +10px` apontando diretamente para o piso.
  - Adicionado indicador do bocal (ponto amarelo no modo debug) para inspeção visual em tempo real.
- Criado módulo `src/projectile.js` (`Projectile` e `ProjectileManager`):
  - Recorte dinâmico da região central do projétil no Canvas com rotação por vetor de velocidade (`angle = Math.atan2(vy, vx) + Math.PI`).
  - Velocidade rápida de 850px/s com alcance calibrado.
  - Rastros de energia âmbar e faíscas de impacto no chão e no inimigo.
  - Muzzle flash na ponta do cano ao disparar.
- Atualizado `src/player.js` com auto-fire contínuo (~7 disparos/s) e disparo instantâneo no 1º frame.
- Atualizado `src/enemy.js` com detecção de dano, knockback, flash de impacto, barra de HP e ciclo de reaparecimento.


## Inimigo: Homem de Fogo (Fire Man)
- Adicionado e integrado asset `gif/homem de fogo.gif` (25 quadros a 80ms, 640x360).
- Criado módulo `src/enemy.js` com a classe `FireManEnemy`:
  - IA de perseguição dinâmica com cálculo de vetor de proximidade em relação ao jogador (`player.x`).
  - Orientação automática (`facing = 1` ou `-1` via `scaleX`).
  - Velocidade calibrada a 185px/s com transição para postura de ataque a curta distância (<50px).
  - Sistema de emissão de partículas de brasas e fogo com brilho e subida convectiva.
  - Sombra com gradiente de radiação de calor e hitbox debug no Canvas.
  - Sincronização DOM no `#entity-layer` com aceleração por hardware `translate3d`.
  - Botão de teste e respawn `INIMIGO: SPAWN / RESET` e chip de telemetria no HUD com status e distância em tempo real.


## Otimização e Recorte dos GIFs
- Recorte e ajuste dos assets `gif/atirando correndo.gif` e `gif/atirando para baixo.gif` para alinhamento e timing de animação.

## Novo Asset: Atirando para Baixo & Atirando Correndo
- Integrado `gif/atirando para baixo.gif` (36 quadros a 80ms, 640x360):
  - Ativação via `S` / `↓` + `F` / `Clique` (no chão ou em pleno ar).
  - Tecla de atalho `6` ou botão no rack de testes.
- Integrado `gif/atirando correndo.gif`:
  - Ativação dinâmica ao disparar enquanto se movimenta.
  - Tecla de atalho `7` ou botão no rack de testes.
