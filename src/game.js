/**
 * CYBER_STRIKE 2D // Game Controller & Core Engine Loop
 * Orchestrates Game Loop, Parallax Camera, Grid Scrolling, Particles, and HUD Metrics.
 */

import { Player } from './player.js';

export class Game {
  constructor() {
    // 1. Canvas Setup
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.width = 960;
    this.height = 540;

    // 2. DOM Entity Elements
    this.playerContainer = document.getElementById('player-container');
    this.playerSprite = document.getElementById('player-sprite');
    this.playerFallback = document.getElementById('player-fallback');

    // 3. HUD Metric Elements
    this.fpsEl = document.getElementById('metric-fps');
    this.dtEl = document.getElementById('metric-dt');
    this.stateEl = document.getElementById('metric-state');
    this.posEl = document.getElementById('metric-pos');

    // 4. Input Tracking
    this.input = {
      keys: {},
      autoWalk: false,
      autoRun: false
    };

    // 5. Camera & Parallax Tracking
    this.cameraX = 0;

    // 6. Particle Systems (Ambient Cyber Motes + Footstep Ground Dust)
    this.ambientParticles = [];
    this.dustParticles = [];
    this.initAmbientParticles(40);

    // 7. Initialize Player
    this.player = new Player({
      x: 350,
      y: 440,
      scale: 0.6
    });

    // 8. Toggles & Metrics
    this.showHitbox = true;
    this.lastTime = 0;
    this.frameCount = 0;
    this.fpsTimer = 0;
    this.currentFps = 60;

    // 9. Event Listeners & UI
    this.bindInputs();
    this.bindUI();

    // 10. Start Loop
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

  bindInputs() {
    window.addEventListener('keydown', (e) => {
      this.input.keys[e.code] = true;
      // Any physical key press cancels automated test walk
      this.input.autoWalk = false;
      this.input.autoRun = false;

      // Number keys 1-5
      if (e.code === 'Digit1') this.triggerStateAction('idle');
      if (e.code === 'Digit2') this.triggerStateAction('walk');
      if (e.code === 'Digit3') this.triggerStateAction('run');
      if (e.code === 'Digit4') this.triggerStateAction('jump');
      if (e.code === 'Digit5') this.triggerStateAction('shoot');

      // Shoot keys
      if (e.code === 'KeyF' || e.code === 'KeyX') {
        this.player.triggerShoot();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.input.keys[e.code] = false;
    });

    // Clear keys if window loses focus to avoid stuck movements
    window.addEventListener('blur', () => {
      this.input.keys = {};
      this.input.autoWalk = false;
      this.input.autoRun = false;
    });

    const viewport = document.getElementById('viewport-container');
    if (viewport) {
      viewport.addEventListener('mousedown', () => {
        this.player.triggerShoot();
      });
    }
  }

  triggerStateAction(stateKey) {
    if (stateKey === 'idle') {
      this.input.autoWalk = false;
      this.input.autoRun = false;
      this.player.vx = 0;
      this.player.setState('idle');
    } else if (stateKey === 'walk') {
      this.input.autoWalk = true;
      this.input.autoRun = false;
    } else if (stateKey === 'run') {
      this.input.autoWalk = true;
      this.input.autoRun = true;
    } else if (stateKey === 'jump') {
      if (this.player.isGrounded) {
        this.player.vy = this.player.jumpForce;
        this.player.isGrounded = false;
      }
    } else if (stateKey === 'shoot') {
      this.player.triggerShoot();
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

    const btnFlip = document.getElementById('btn-flip');
    if (btnFlip) {
      btnFlip.addEventListener('click', () => {
        this.player.facing = this.player.facing === 1 ? -1 : 1;
        btnFlip.querySelector('.status').textContent = this.player.facing === 1 ? 'RIGHT' : 'LEFT';
      });
    }
  }

  /**
   * Renders dynamic parallax background with synchronized scrolling ground grid
   */
  renderEnvironment() {
    const groundY = this.player.groundY;

    // 1. Sky Gradient
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, '#04070e');
    skyGrad.addColorStop(1, '#0c1424');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, this.width, groundY);

    // 2. Parallax Distant Cyber Skyline (moves slowly at 0.15x camera speed)
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

    // 6. SCROLLED PERSPECTIVE FLOOR GRID (moves 1:1 with cameraX for physical ground grip)
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
    this.ctx.lineWidth = 1;

    // Horizontal Depth Lines
    const gridRows = 7;
    for (let i = 1; i <= gridRows; i++) {
      const lineY = groundY + Math.pow(i / gridRows, 1.7) * (this.height - groundY);
      this.ctx.beginPath();
      this.ctx.moveTo(0, lineY);
      this.ctx.lineTo(this.width, lineY);
      this.ctx.stroke();
    }

    // Perspective Vertical Floor Lines (synchronized to camera scroll)
    const vX = this.width / 2;
    const vY = groundY - 140; // Vanishing point
    const cellWidth = 70;
    const scrollOffset = -(this.cameraX % cellWidth);

    for (let x = scrollOffset - cellWidth * 3; x <= this.width + cellWidth * 3; x += cellWidth) {
      this.ctx.beginPath();
      this.ctx.moveTo(vX, vY);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    this.ctx.restore();

    // 7. Render Footstep Dust Particles
    for (const p of this.dustParticles) {
      const screenX = p.x - this.cameraX;
      this.ctx.fillStyle = `${p.color}${p.alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(screenX, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    
    let dt = (timestamp - this.lastTime) / 1000;
    dt = Math.min(dt, 0.1);
    this.lastTime = timestamp;

    // FPS Counter
    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      this.currentFps = Math.round(this.frameCount / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    // 1. Update Player & Collect Footstep Particles
    const newDust = this.player.update(this.input, dt);
    if (newDust.length > 0) {
      this.dustParticles.push(...newDust);
    }

    // 2. Smooth Camera Follow (Keeps player comfortably framed)
    const targetCameraX = this.player.x - this.width * 0.4;
    this.cameraX += (targetCameraX - this.cameraX) * Math.min(1, 8 * dt);

    // 3. Update Ambient Effects
    this.updateAmbientParticles(dt);
    this.updateDustParticles(dt);

    // 4. Calculate Player Screen Coordinate
    const screenPlayerX = this.player.x - this.cameraX;

    // 5. Canvas Render
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.renderEnvironment();
    this.player.renderCanvas(this.ctx, screenPlayerX, this.showHitbox);

    // 6. DOM Animated Sprite Synchronization
    this.player.syncDOM(this.playerContainer, this.playerSprite, this.playerFallback, screenPlayerX);

    // 7. Update Terminal HUD
    if (this.fpsEl) this.fpsEl.textContent = this.currentFps;
    if (this.dtEl) this.dtEl.textContent = `${(dt * 1000).toFixed(1)}ms`;
    if (this.stateEl) this.stateEl.textContent = this.player.currentState.toUpperCase();
    if (this.posEl) this.posEl.textContent = `X: ${Math.round(this.player.x)} | SPD: ${Math.round(Math.abs(this.player.vx))}`;

    // Sync UI Button Highlights with Active Animation
    if (!this.input.autoWalk) {
      this.updateStateButtons(this.player.currentState);
    }

    requestAnimationFrame(this.loop.bind(this));
  }
}

// Auto-boot
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
