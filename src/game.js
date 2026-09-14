/**
 * CYBER_STRIKE 2D // Game Controller & Core Engine Loop
 * Orchestrates Game Loop, Parallax Camera, Grid Scrolling, Particles, and HUD Metrics.
 */

import { Player } from './player.js';
import { FireManEnemy } from './enemy.js';
import { ProjectileManager } from './projectile.js';

export class Game {
  constructor() {
    // 1. Canvas Setup
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.width = 960;
    this.height = 540;

    // Gerenciador de Projéteis
    this.projectileManager = new ProjectileManager();

    // 2. DOM Entity Elements
    this.playerContainer = document.getElementById('player-container');
    this.playerSprite = document.getElementById('player-sprite');
    this.playerFallback = document.getElementById('player-fallback');

    this.enemyContainer = document.getElementById('enemy-container');
    this.enemySprite = document.getElementById('enemy-sprite');
    this.enemyFallback = document.getElementById('enemy-fallback');

    // 3. HUD Metric Elements
    this.fpsEl = document.getElementById('metric-fps');
    this.dtEl = document.getElementById('metric-dt');
    this.stateEl = document.getElementById('metric-state');
    this.posEl = document.getElementById('metric-pos');
    this.enemyEl = document.getElementById('metric-enemy');

    // 4. Input Tracking (Instant Real-time)
    this.input = {
      keys: {},
      isMouseDown: false,
      autoWalk: false,
      autoRun: false
    };

    // 5. Camera & Parallax Tracking
    this.cameraX = 0;

    // 6. Particle Systems
    this.ambientParticles = [];
    this.dustParticles = [];
    this.fireParticles = [];
    this.initAmbientParticles(40);

    // 7. Initialize Entities
    this.player = new Player({
      x: 350,
      y: 440,
      scale: 0.6
    });

    this.enemy = new FireManEnemy({
      x: 850,
      y: 440,
      scale: 0.6,
      speed: 185
    });

    // 8. Plataformas Flutuantes Cyberpunk (Semi-Sólidas One-Way)
    this.platforms = [
      // Plataforma 1 (Baixa - Acesso Inicial): Y: 355 (85px acima do solo)
      { x: 160, y: 355, width: 220, height: 14, id: 'PLT-01' },
      // Plataforma 2 (Torre Sniper Central - Alta): Y: 260 (180px acima do solo)
      { x: 440, y: 260, width: 280, height: 14, id: 'SNIPER-TOWER' },
      // Plataforma 3 (Alta Observação Direita): Y: 180 (260px acima do solo)
      { x: 790, y: 180, width: 240, height: 14, id: 'VANTAGE-03' },
      // Plataforma 4 (Média Direita - Sobre o Inimigo): Y: 310 (130px acima do solo)
      { x: 1100, y: 310, width: 240, height: 14, id: 'PLT-04' }
    ];

    // 9. Toggles & Metrics
    this.showHitbox = true;
    this.showDebugGrid = true;
    this.mouseScreenX = null;
    this.mouseScreenY = null;
    this.lastClickData = null;
    this.lastShotData = null;
    this.lastTime = 0;
    this.frameCount = 0;
    this.fpsTimer = 0;
    this.currentFps = 60;

    // 10. Event Listeners & UI
    this.bindInputs();
    this.bindUI();

    // 11. Start Loop
    requestAnimationFrame(this.loop.bind(this));
  }

  initAmbientParticles(count) {
    for (let i = 0; i < count; i++) {
      this.ambientParticles.push({
        worldX: Math.random() * 3000 - 1500,
        y: Math.random() * (this.height - 130),
        size: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 15,
        speedY: -Math.random() * 20 - 5,
        alpha: Math.random() * 0.6 + 0.2
      });
    }
  }

  updateAmbientParticles(dt) {
    for (const p of this.ambientParticles) {
      p.worldX += p.speedX * dt;
      p.y += p.speedY * dt;

      if (p.y < 0) {
        p.y = this.height - 120;
        p.worldX = this.cameraX + Math.random() * this.width;
      }
    }
  }

  updateDustParticles(dt) {
    for (let i = this.dustParticles.length - 1; i >= 0; i--) {
      const p = this.dustParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= dt * 1.6;
      p.size = Math.max(0.5, p.size - dt * 1.5);

      if (p.alpha <= 0) {
        this.dustParticles.splice(i, 1);
      }
    }
  }

  updateFireParticles(dt) {
    for (let i = this.fireParticles.length - 1; i >= 0; i--) {
      const p = this.fireParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= dt * p.decay;
      p.size = Math.max(0.2, p.size - dt * 1.5);

      if (p.alpha <= 0) {
        this.fireParticles.splice(i, 1);
      }
    }
  }

  bindInputs() {
    window.addEventListener('keydown', (e) => {
      this.input.keys[e.code] = true;
      this.input.autoWalk = false;
      this.input.autoRun = false;
      this.input.autoShoot = false;
      this.input.autoShootDown = false;

      // Number keys 1-7
      if (e.code === 'Digit1') this.triggerStateAction('idle');
      if (e.code === 'Digit2') this.triggerStateAction('walk');
      if (e.code === 'Digit3') this.triggerStateAction('run');
      if (e.code === 'Digit4') this.triggerStateAction('jump');
      if (e.code === 'Digit5') this.triggerStateAction('shoot');
      if (e.code === 'Digit6') this.triggerStateAction('shootDown');
      if (e.code === 'Digit7') this.triggerStateAction('shootRun');
      if (e.code === 'Digit8') this.triggerStateAction('shootDiagDown');
    });

    window.addEventListener('keyup', (e) => {
      this.input.keys[e.code] = false;
    });

    window.addEventListener('blur', () => {
      this.input.keys = {};
      this.input.isMouseDown = false;
      this.input.autoWalk = false;
      this.input.autoRun = false;
      this.input.autoShoot = false;
      this.input.autoShootDown = false;
      this.input.autoShootDiagDown = false;
    });

    const viewport = document.getElementById('viewport-container');
    if (viewport) {
      const getCanvasCoords = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.width / rect.width;
        const scaleY = this.height / rect.height;
        return {
          x: Math.max(0, Math.min(this.width, (e.clientX - rect.left) * scaleX)),
          y: Math.max(0, Math.min(this.height, (e.clientY - rect.top) * scaleY))
        };
      };

      viewport.addEventListener('mousemove', (e) => {
        const coords = getCanvasCoords(e);
        this.mouseScreenX = coords.x;
        this.mouseScreenY = coords.y;
      });

      viewport.addEventListener('mouseleave', () => {
        this.mouseScreenX = null;
        this.mouseScreenY = null;
      });

      viewport.addEventListener('mousedown', (e) => {
        const coords = getCanvasCoords(e);
        const relX = Math.round(coords.x - this.width / 2);
        const alt = Math.round(this.player.groundY - coords.y);
        this.lastClickData = {
          x: Math.round(coords.x),
          y: Math.round(coords.y),
          relX: relX,
          alt: alt,
          time: Date.now()
        };

        if (e.button === 0) {
          this.input.isMouseDown = true;
        }
      });
    }

    window.addEventListener('mouseup', () => {
      this.input.isMouseDown = false;
    });
  }

  triggerStateAction(stateKey) {
    this.input.autoWalk = false;
    this.input.autoRun = false;
    this.input.autoShoot = false;
    this.input.autoShootDown = false;
    this.input.autoShootDiagDown = false;
    this.player.isShooting = false;
    this.player.shootType = null;
    this.player.vx = 0;

    if (stateKey === 'idle') {
      this.player.setState('idle');
    } else if (stateKey === 'walk') {
      this.input.autoWalk = true;
      this.player.setState('walk');
    } else if (stateKey === 'run') {
      this.input.autoWalk = true;
      this.input.autoRun = true;
      this.player.setState('run');
    } else if (stateKey === 'jump') {
      if (this.player.isGrounded) {
        this.player.vy = this.player.jumpForce;
        this.player.isGrounded = false;
      }
    } else if (stateKey === 'shoot') {
      this.input.autoShoot = true;
      this.player.isShooting = true;
      this.player.shootType = 'shoot';
      this.player.setState('shoot');
    } else if (stateKey === 'shootDown') {
      this.input.autoShoot = true;
      this.input.autoShootDown = true;
      this.player.isShooting = true;
      this.player.shootType = 'shootDown';
      this.player.setState('shootDown');
    } else if (stateKey === 'shootRun') {
      this.input.autoWalk = true;
      this.input.autoShoot = true;
      this.player.isShooting = true;
      this.player.shootType = 'shootRun';
      this.player.setState('shootRun');
    } else if (stateKey === 'shootDiagDown') {
      this.input.autoShoot = true;
      this.input.autoShootDiagDown = true;
      this.player.isShooting = true;
      this.player.shootType = 'shootDiagDown';
      this.player.setState('shootDiagDown');
    }

    this.updateStateButtons(stateKey);
  }

  updateStateButtons(activeState) {
    document.querySelectorAll('.btn-state').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.state === activeState);
    });
  }

  bindUI() {
    const stateButtons = document.querySelectorAll('.btn-state');
    stateButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.triggerStateAction(btn.dataset.state);
      });
    });

    const toggleCrt = document.getElementById('toggle-crt');
    const crtOverlay = document.getElementById('crt-overlay');
    if (toggleCrt && crtOverlay) {
      toggleCrt.addEventListener('click', () => {
        const isActive = toggleCrt.classList.toggle('active');
        crtOverlay.classList.toggle('disabled', !isActive);
        toggleCrt.querySelector('.status').textContent = isActive ? 'ON' : 'OFF';
        toggleCrt.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
    }

    const toggleHitbox = document.getElementById('toggle-hitbox');
    if (toggleHitbox) {
      toggleHitbox.addEventListener('click', () => {
        this.showHitbox = !this.showHitbox;
        toggleHitbox.classList.toggle('active', this.showHitbox);
        toggleHitbox.querySelector('.status').textContent = this.showHitbox ? 'ON' : 'OFF';
        toggleHitbox.setAttribute('aria-pressed', this.showHitbox ? 'true' : 'false');
      });
    }

    const toggleGrid = document.getElementById('toggle-grid');
    if (toggleGrid) {
      toggleGrid.addEventListener('click', () => {
        this.showDebugGrid = !this.showDebugGrid;
        toggleGrid.classList.toggle('active', this.showDebugGrid);
        toggleGrid.querySelector('.status').textContent = this.showDebugGrid ? 'ON' : 'OFF';
        toggleGrid.setAttribute('aria-pressed', this.showDebugGrid ? 'true' : 'false');
      });
    }

    const btnFlip = document.getElementById('btn-flip');
    if (btnFlip) {
      btnFlip.addEventListener('click', () => {
        this.player.facing = this.player.facing === 1 ? -1 : 1;
        btnFlip.querySelector('.status').textContent = this.player.facing === 1 ? 'RIGHT' : 'LEFT';
      });
    }

    const btnEnemyReset = document.getElementById('btn-enemy-reset');
    if (btnEnemyReset) {
      btnEnemyReset.addEventListener('click', () => {
        // Spawna o inimigo 500px na direção para onde o jogador está olhando
        const spawnDistance = 500;
        const targetX = this.player.x + (this.player.facing * spawnDistance);
        this.enemy.reset(targetX);
      });
    }

    const btnTeleportHigh = document.getElementById('btn-teleport-high');
    if (btnTeleportHigh) {
      btnTeleportHigh.addEventListener('click', () => {
        // Teleporta instantaneamente para o topo da Torre Sniper (Y: 260)
        this.player.x = 560;
        this.player.y = 260;
        this.player.vy = 0;
        this.player.isGrounded = true;
        this.player.currentPlatform = this.platforms.find(p => p.id === 'SNIPER-TOWER') || this.platforms[1];
        this.player.setState('idle');
      });
    }
  }

  renderEnvironment() {
    const groundY = this.player.groundY;

    // 1. Sky Gradient
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, '#04070e');
    skyGrad.addColorStop(1, '#0c1424');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, this.width, groundY);

    // 2. Parallax Distant Cyber Skyline
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(14, 25, 45, 0.45)';
    const skylineStep = 80;
    const skylineOffset = -(this.cameraX * 0.15) % skylineStep;
    for (let x = skylineOffset - skylineStep; x < this.width + skylineStep; x += skylineStep) {
      const bHeight = 40 + Math.sin(x * 0.05) * 25 + (x % 3) * 15;
      this.ctx.fillRect(x, groundY - bHeight, skylineStep - 8, bHeight);
    }
    this.ctx.restore();

    // 3. Ambient Floating Motes
    for (const p of this.ambientParticles) {
      const screenX = p.worldX - this.cameraX * 0.4;
      const wrappedX = ((screenX % this.width) + this.width) % this.width;
      this.ctx.fillStyle = `rgba(0, 240, 255, ${p.alpha})`;
      this.ctx.fillRect(wrappedX, p.y, p.size, p.size);
    }

    // 4. Cyber Floor Base
    const groundGrad = this.ctx.createLinearGradient(0, groundY, 0, this.height);
    groundGrad.addColorStop(0, '#090f1d');
    groundGrad.addColorStop(1, '#020408');
    this.ctx.fillStyle = groundGrad;
    this.ctx.fillRect(0, groundY, this.width, this.height - groundY);

    // 5. Laser Horizon Line
    this.ctx.save();
    this.ctx.strokeStyle = '#00f0ff';
    this.ctx.lineWidth = 2;
    this.ctx.shadowColor = '#00f0ff';
    this.ctx.shadowBlur = 12;
    this.ctx.beginPath();
    this.ctx.moveTo(0, groundY);
    this.ctx.lineTo(this.width, groundY);
    this.ctx.stroke();
    this.ctx.restore();

    // 6. Scrolled Perspective Floor Grid
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
    this.ctx.lineWidth = 1;

    const gridRows = 7;
    for (let i = 1; i <= gridRows; i++) {
      const lineY = groundY + Math.pow(i / gridRows, 1.7) * (this.height - groundY);
      this.ctx.beginPath();
      this.ctx.moveTo(0, lineY);
      this.ctx.lineTo(this.width, lineY);
      this.ctx.stroke();
    }

    const vX = this.width / 2;
    const vY = groundY - 140;
    const cellWidth = 70;
    const scrollOffset = -(this.cameraX % cellWidth);

    for (let x = scrollOffset - cellWidth * 3; x <= this.width + cellWidth * 3; x += cellWidth) {
      this.ctx.beginPath();
      this.ctx.moveTo(vX, vY);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    this.ctx.restore();

    // 7. Footstep Dust Particles
    for (const p of this.dustParticles) {
      const screenX = p.x - this.cameraX;
      this.ctx.fillStyle = `${p.color}${p.alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(screenX, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // 8. Fire Ember Particles (Chamas do Homem de Fogo)
    this.ctx.save();
    for (const p of this.fireParticles) {
      const screenX = p.x - this.cameraX;
      this.ctx.fillStyle = `${p.color}${p.alpha})`;
      this.ctx.shadowColor = '#ff6600';
      this.ctx.shadowBlur = 8;
      this.ctx.beginPath();
      this.ctx.arc(screenX, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  /**
   * Renderiza plataformas flutuantes estilo Cyberpunk Holográfico
   */
  renderPlatforms(ctx, cameraX) {
    ctx.save();
    for (const plat of this.platforms) {
      const screenX = plat.x - cameraX;
      // Descarte fora do campo de visão da câmera
      if (screenX + plat.width < -60 || screenX > this.width + 60) continue;

      const y = plat.y;
      const w = plat.width;
      const h = plat.height || 14;

      // 1. Emissores de Levitação / Anti-Gravidade (propulsão luminosa inferior)
      const emitterCount = Math.max(2, Math.floor(w / 70));
      for (let i = 0; i < emitterCount; i++) {
        const ex = screenX + (w / (emitterCount + 1)) * (i + 1);
        const ey = y + h;
        const thrusterGrad = ctx.createRadialGradient(ex, ey, 2, ex, ey + 18, 16);
        thrusterGrad.addColorStop(0, 'rgba(0, 240, 255, 0.5)');
        thrusterGrad.addColorStop(0.4, 'rgba(0, 150, 255, 0.25)');
        thrusterGrad.addColorStop(1, 'rgba(0, 50, 150, 0)');
        ctx.fillStyle = thrusterGrad;
        ctx.beginPath();
        ctx.arc(ex, ey + 8, 14, 0, Math.PI);
        ctx.fill();

        // Núcleo do emissor
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(ex - 3, ey - 1, 6, 3);
      }

      // 2. Corpo Principal da Plataforma (Vidro Cyber escurecido com translucidez)
      ctx.fillStyle = 'rgba(8, 18, 36, 0.9)';
      ctx.fillRect(screenX, y, w, h);

      // 3. Ranhuras de Aderência e Detalhes de Circuito em Diagonal
      ctx.save();
      ctx.beginPath();
      ctx.rect(screenX, y, w, h);
      ctx.clip();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
      ctx.lineWidth = 3;
      for (let sx = screenX - h; sx < screenX + w + h; sx += 18) {
        ctx.beginPath();
        ctx.moveTo(sx, y + h);
        ctx.lineTo(sx + h, y);
        ctx.stroke();
      }
      ctx.restore();

      // 4. Trilho Neon Superior (Superfície de Contato dos Pés)
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(screenX, y, w, 3);

      // 5. Suportes de Canto e Beacons em LED Âmbar
      ctx.fillStyle = '#ffbb00';
      ctx.fillRect(screenX, y, 4, h);
      ctx.fillRect(screenX + w - 4, y, 4, h);

      // 6. Placa Holográfica com ID da Plataforma
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
      ctx.font = '10px "VT323", monospace';
      ctx.fillText(`▲ ${plat.id} [ALT: ${Math.round(440 - plat.y)}M]`, screenX + 12, y + h - 3);
    }
    ctx.restore();
  }

  /**
   * Renderiza Linhas de Grade de Tela (Debug Grid) em tela inteira:
   * - Eixo Horizontal (X): distância para a esquerda (-) ou direita (+) a partir do centro da tela (X: 480).
   * - Eixo Vertical (Y): altura exata na tela e altitude do disparo em relação ao solo (Y: 440).
   * - Rastro e telemetria de clique e disparo em tempo real.
   */
  renderDebugGrid(ctx) {
    ctx.save();

    const cx = this.width / 2; // 480px (Centro horizontal da tela)
    const groundY = this.player.groundY; // 440px (Nível do solo)

    // 1. Linhas Verticais (Eixo X - Distância relativa ao centro)
    const stepX = 60; // Linhas a cada 60px
    for (let x = 0; x <= this.width; x += stepX) {
      const distFromCenter = x - cx;
      const isCenter = distFromCenter === 0;

      ctx.beginPath();
      if (isCenter) {
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
      } else {
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.14)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
      }
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();

      // Sub-ticks nas bordas
      ctx.setLineDash([]);
      ctx.strokeStyle = isCenter ? '#00f0ff' : 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x, 6);
      ctx.moveTo(x, this.height - 6); ctx.lineTo(x, this.height);
      ctx.stroke();

      // Rótulos do Eixo X (Distância a partir do centro)
      ctx.font = isCenter ? 'bold 11px "VT323", monospace' : '10px "VT323", monospace';
      ctx.fillStyle = isCenter ? '#00f0ff' : 'rgba(0, 240, 255, 0.65)';
      const labelX = isCenter ? 'X: 0 [CENTRO]' : (distFromCenter > 0 ? `+${distFromCenter}` : `${distFromCenter}`);
      ctx.fillText(labelX, x + 3, 14);
      ctx.fillText(labelX, x + 3, this.height - 4);
    }

    // 2. Linhas Horizontais (Eixo Y - Altura de tela e altitude do disparo)
    const stepY = 40; // Linhas a cada 40px
    for (let y = 40; y < this.height; y += stepY) {
      const isGround = y === groundY;

      ctx.beginPath();
      if (isGround) {
        ctx.strokeStyle = 'rgba(255, 187, 0, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 3]);
      } else {
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.14)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
      }
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();

      // Sub-ticks laterais
      ctx.setLineDash([]);
      ctx.strokeStyle = isGround ? '#ffbb00' : 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(6, y);
      ctx.moveTo(this.width - 6, y); ctx.lineTo(this.width, y);
      ctx.stroke();

      // Rótulos do Eixo Y (Altura do disparo / solo)
      const altAboveGround = groundY - y;
      const altStr = altAboveGround >= 0 ? `+${altAboveGround}` : `${altAboveGround}`;
      ctx.font = isGround ? 'bold 11px "VT323", monospace' : '10px "VT323", monospace';
      ctx.fillStyle = isGround ? '#ffbb00' : 'rgba(0, 240, 255, 0.65)';
      
      const labelY = isGround ? `Y: ${y} [NÍVEL DO SOLO]` : `Y: ${y} (ALT: ${altStr})`;
      ctx.fillText(labelY, 8, y - 3);
      ctx.fillText(`Y: ${y}`, this.width - 48, y - 3);
    }

    // 3. Mira do Cursor em Tempo Real (Crosshair ao mover o mouse)
    if (this.mouseScreenX !== null && this.mouseScreenY !== null) {
      const mx = this.mouseScreenX;
      const my = this.mouseScreenY;
      const relX = Math.round(mx - cx);
      const signRelX = relX >= 0 ? `+${relX}` : `${relX}`;
      const altY = Math.round(groundY - my);
      const signAltY = altY >= 0 ? `+${altY}` : `${altY}`;

      // Linhas guias do cursor
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(255, 187, 0, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(mx, 0); ctx.lineTo(mx, this.height);
      ctx.moveTo(0, my); ctx.lineTo(this.width, my);
      ctx.stroke();

      // Retículo do cursor
      ctx.setLineDash([]);
      ctx.strokeStyle = '#ffbb00';
      ctx.beginPath();
      ctx.arc(mx, my, 6, 0, Math.PI * 2);
      ctx.stroke();

      // Chip de coordenadas do cursor
      const badgeText = `CURSOR: X: ${signRelX}px | Y: ${Math.round(my)}px (ALT: ${signAltY}px)`;
      ctx.font = '12px "VT323", monospace';
      const textWidth = ctx.measureText(badgeText).width;
      const badgeX = Math.min(this.width - textWidth - 16, Math.max(10, mx + 12));
      const badgeY = Math.max(26, Math.min(this.height - 20, my - 12));

      ctx.fillStyle = 'rgba(6, 15, 30, 0.85)';
      ctx.strokeStyle = '#ffbb00';
      ctx.lineWidth = 1;
      ctx.fillRect(badgeX - 4, badgeY - 12, textWidth + 8, 16);
      ctx.strokeRect(badgeX - 4, badgeY - 12, textWidth + 8, 16);

      ctx.fillStyle = '#ffbb00';
      ctx.fillText(badgeText, badgeX, badgeY);
    }

    // 4. Marcação do Ponto de Clique (se ocorrido nos últimos 3 segundos)
    if (this.lastClickData && (Date.now() - this.lastClickData.time < 3000)) {
      const lc = this.lastClickData;
      const age = (Date.now() - lc.time) / 1000;
      const alpha = Math.max(0, 1 - age / 3);

      ctx.setLineDash([]);
      ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(lc.x, lc.y, 8 + age * 6, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = `rgba(0, 240, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(lc.x, lc.y, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '11px "VT323", monospace';
      const signX = lc.relX >= 0 ? `+${lc.relX}` : `${lc.relX}`;
      ctx.fillText(`CLIQUE: X: ${signX}px | Y: ${lc.y}px`, lc.x + 12, lc.y + 4);
    }

    // 5. Telemetria do Ponto Computado de Disparo (Último Tiro)
    if (this.lastShotData && (Date.now() - this.lastShotData.time < 4000)) {
      const ls = this.lastShotData;
      const age = (Date.now() - ls.time) / 1000;
      const alpha = Math.max(0, 1 - age / 4);

      // Losango na saída exata do cano/labareda
      ctx.save();
      ctx.setLineDash([]);
      ctx.strokeStyle = `rgba(255, 60, 60, ${alpha})`;
      ctx.fillStyle = `rgba(255, 60, 60, ${alpha * 0.4})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ls.screenX, ls.screenY - 7);
      ctx.lineTo(ls.screenX + 7, ls.screenY);
      ctx.lineTo(ls.screenX, ls.screenY + 7);
      ctx.lineTo(ls.screenX - 7, ls.screenY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Raio do vetor de velocidade do tiro
      if (ls.vx !== 0 || ls.vy !== 0) {
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = `rgba(255, 200, 0, ${alpha * 0.8})`;
        ctx.lineWidth = 1.5;
        const speed = Math.hypot(ls.vx, ls.vy);
        const rayLen = 140;
        const endRayX = ls.screenX + (ls.vx / speed) * rayLen;
        const endRayY = ls.screenY + (ls.vy / speed) * rayLen;
        ctx.beginPath();
        ctx.moveTo(ls.screenX, ls.screenY);
        ctx.lineTo(endRayX, endRayY);
        ctx.stroke();
      }
      ctx.restore();

      // Painel Tático no canto superior direito
      const panelW = 230;
      const panelH = 78;
      const panelX = this.width - panelW - 12;
      const panelY = 28;

      ctx.fillStyle = `rgba(6, 16, 32, ${0.9 * alpha})`;
      ctx.strokeStyle = `rgba(0, 240, 255, ${0.8 * alpha})`;
      ctx.lineWidth = 1.5;
      ctx.fillRect(panelX, panelY, panelW, panelH);
      ctx.strokeRect(panelX, panelY, panelW, panelH);

      // Cabeçalho do Painel
      ctx.fillStyle = `rgba(0, 240, 255, ${alpha})`;
      ctx.font = 'bold 12px "VT323", monospace';
      ctx.fillText(`► TELEMETRIA DISPARO: ${ls.type.toUpperCase()}`, panelX + 8, panelY + 16);

      // Coordenadas
      const signShotX = ls.relX >= 0 ? `+${ls.relX}` : `${ls.relX}`;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.font = '12px "VT323", monospace';
      ctx.fillText(`EIXO X: ${signShotX}px (DO CENTRO)`, panelX + 8, panelY + 34);
      ctx.fillText(`EIXO Y: ${ls.screenY}px | ALTURA SOLO: +${ls.alt}px`, panelX + 8, panelY + 50);

      ctx.fillStyle = `rgba(255, 187, 0, ${alpha})`;
      ctx.fillText(`VETOR: VX=${ls.vx}px/s | VY=${ls.vy}px/s`, panelX + 8, panelY + 66);
    }

    ctx.restore();
  }

  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    
    let dt = (timestamp - this.lastTime) / 1000;
    dt = Math.min(dt, 0.1);
    this.lastTime = timestamp;

    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      this.currentFps = Math.round(this.frameCount / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    // 1. Update Player & Enemy
    const playerResult = this.player.update(this.input, dt, this.platforms);
    const newDust = playerResult.particles || [];
    if (newDust.length > 0) {
      this.dustParticles.push(...newDust);
    }
    const newShots = playerResult.shots || [];
    if (newShots.length > 0) {
      for (const shot of newShots) {
        this.projectileManager.spawn(shot);
      }
      // Captura telemetria balística do último disparo para exibição no Debug Grid
      const s = newShots[newShots.length - 1];
      const shotScreenX = Math.round(s.x - this.cameraX);
      const shotScreenY = Math.round(s.y);
      this.lastShotData = {
        worldX: Math.round(s.x),
        worldY: Math.round(s.y),
        screenX: shotScreenX,
        screenY: shotScreenY,
        relX: Math.round(shotScreenX - (this.width / 2)),
        alt: Math.round(this.player.groundY - s.y),
        type: s.type,
        vx: Math.round(s.vx),
        vy: Math.round(s.vy),
        time: Date.now()
      };
    }

    const newFire = this.enemy.update(this.player, dt);
    if (newFire.length > 0) {
      this.fireParticles.push(...newFire);
    }

    // 2. Update Projectiles, Collisions & Impacts
    this.projectileManager.update(dt, this.player.groundY, this.cameraX, this.enemy);

    // 3. Smooth Camera Follow
    const targetCameraX = this.player.x - this.width * 0.4;
    this.cameraX += (targetCameraX - this.cameraX) * Math.min(1, 8 * dt);

    // 4. Update Ambient & Particle Systems
    this.updateAmbientParticles(dt);
    this.updateDustParticles(dt);
    this.updateFireParticles(dt);

    // 5. Calculate Entity Screen Coordinates
    const screenPlayerX = this.player.x - this.cameraX;
    const screenEnemyX = this.enemy.x - this.cameraX;

    // 6. Render Canvas Elements
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.renderEnvironment();
    this.renderPlatforms(this.ctx, this.cameraX);
    this.projectileManager.render(this.ctx, this.cameraX);
    this.enemy.renderCanvas(this.ctx, screenEnemyX, this.showHitbox);
    this.player.renderCanvas(this.ctx, screenPlayerX, this.showHitbox, this.platforms);

    // 7. Render Debug Grid (Linhas de Grade com Eixo X relativo e Eixo Y altura)
    if (this.showDebugGrid) {
      this.renderDebugGrid(this.ctx);
    }

    // 7. DOM Synchronization
    this.player.syncDOM(this.playerContainer, this.playerSprite, this.playerFallback, screenPlayerX);
    this.enemy.syncDOM(this.enemyContainer, this.enemySprite, this.enemyFallback, screenEnemyX);

    // 8. Update HUD Metrics
    if (this.fpsEl) this.fpsEl.textContent = this.currentFps;
    if (this.dtEl) this.dtEl.textContent = `${(dt * 1000).toFixed(1)}ms`;
    if (this.stateEl) this.stateEl.textContent = this.player.currentState.toUpperCase();
    if (this.posEl) this.posEl.textContent = `X: ${Math.round(this.player.x)} | SPD: ${Math.round(Math.abs(this.player.vx))}`;

    if (this.enemyEl) {
      const dist = Math.round(this.player.x - this.enemy.x);
      const side = dist > 0 ? '← ESQ' : 'DIR →';
      if (!this.enemy.isAlive) {
        this.enemyEl.textContent = `ABATIDO (RESPAWN ${Math.ceil(this.enemy.respawnTimer)}s)`;
      } else {
        this.enemyEl.textContent = `${this.enemy.state.toUpperCase()} [HP: ${this.enemy.health}] (${Math.abs(dist)}px ${side})`;
      }
    }

    if (!this.input.autoWalk) {
      this.updateStateButtons(this.player.currentState);
    }

    requestAnimationFrame(this.loop.bind(this));
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    new Game();
  });
}
