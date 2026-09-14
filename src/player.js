/**
 * CYBER_STRIKE 2D // Player Controller & Sprite Manager
 * Handles character state, movement physics, inertia, and dual-layer rendering.
 */

export const PLAYER_SPRITES = {
  idle: './gif/parado.gif',
  walk: './gif/andando.gif',
  run: './gif/correndo.gif',
  jump: './gif/pulo.gif',
  shoot: './gif/atirando.gif'
};

export class Player {
  /**
   * @param {Object} options
   * @param {number} options.x - World X position
   * @param {number} options.y - Ground Y position (anchor at feet)
   * @param {number} [options.scale=0.6] - Visual scale
   */
  constructor({ x = 400, y = 440, scale = 0.6 } = {}) {
    // World Position
    this.x = x;
    this.y = y;
    this.groundY = y;
    
    // Physical Velocity & Inertia
    this.vx = 0;
    this.vy = 0;
    
    // Calibrated Speeds for 1:1 Stride-to-Ground Synchronization
    // Stride duration in andando.gif is ~1.44s per cycle. 120px/s matches foot displacement perfectly.
    this.speedWalk = 130;
    this.speedRun = 250;
    this.acceleration = 1200; // Snappy ramp-up
    this.friction = 1600;     // Instant stop without sliding
    
    // Jump Physics
    this.jumpForce = -480;
    this.gravity = 1400;
    this.isGrounded = true;

    // Sprite Dimensions (Base GIF 640x360)
    this.originalWidth = 640;
    this.originalHeight = 360;
    this.scale = scale;
    this.facing = 1; // 1: Right, -1: Left

    // Hitbox
    this.hitboxWidth = 65;
    this.hitboxHeight = 110;

    // States: 'idle' | 'walk' | 'run' | 'jump' | 'shoot'
    this.currentState = 'idle';
    this.shootTimer = 0;
    this.isShooting = false;

    // Virtual Patrol/Auto-Walk Mode (for HUD test deck)
    this.autoMove = 0; // -1, 0, or 1

    // Asset Cache
    this.images = {};
    this.assetErrors = {};
    this.preloadAssets();
  }

  preloadAssets() {
    for (const [stateKey, url] of Object.entries(PLAYER_SPRITES)) {
      const img = new Image();
      img.src = url;
      img.onerror = () => {
        console.warn(`[Asset Warning] Falha ao carregar: ${url}`);
        this.assetErrors[stateKey] = true;
      };
      this.images[stateKey] = img;
    }
  }

  setState(newState) {
    if (this.currentState !== newState && PLAYER_SPRITES[newState]) {
      this.currentState = newState;
    }
  }

  triggerShoot() {
    this.isShooting = true;
    this.shootTimer = 0.45;
    this.setState('shoot');
  }

  /**
   * Update character physics, input, and state
   * @param {Object} input - { keys, autoWalk, autoRun }
   * @param {number} dt - Delta time in seconds
   * @returns {Array} Array of newly spawned footstep particles
   */
  update(input, dt) {
    const spawnedParticles = [];

    // 1. Read Movement Intent (Keyboard or Auto Test)
    let moveDir = 0;
    const keyLeft = input.keys['ArrowLeft'] || input.keys['KeyA'] || input.keys['a'] || input.keys['A'];
    const keyRight = input.keys['ArrowRight'] || input.keys['KeyD'] || input.keys['d'] || input.keys['D'];
    const keyRun = input.keys['ShiftLeft'] || input.keys['ShiftRight'] || input.autoRun;

    if (keyLeft) moveDir -= 1;
    if (keyRight) moveDir += 1;

    // If no key is pressed, check virtual test mode
    if (moveDir === 0 && input.autoWalk) {
      moveDir = this.facing;
    }

    // 2. Velocity Acceleration & Friction (Eliminates Ice-Skating)
    const targetSpeed = keyRun ? this.speedRun : this.speedWalk;
    const targetVx = moveDir * targetSpeed;

    if (moveDir !== 0) {
      // Accelerate towards target speed
      if (this.vx < targetVx) {
        this.vx = Math.min(this.vx + this.acceleration * dt, targetVx);
      } else if (this.vx > targetVx) {
        this.vx = Math.max(this.vx - this.acceleration * dt, targetVx);
      }
      this.facing = moveDir;
    } else {
      // Decelerate with strong friction to immediately stop
      if (this.vx > 0) {
        this.vx = Math.max(0, this.vx - this.friction * dt);
      } else if (this.vx < 0) {
        this.vx = Math.min(0, this.vx + this.friction * dt);
      }
    }

    // Apply displacement
    this.x += this.vx * dt;

    // 3. Jump Physics & Airborne State
    const keyJump = input.keys['Space'] || input.keys['KeyW'] || input.keys['ArrowUp'] || input.keys['w'] || input.keys['W'];
    if (keyJump && this.isGrounded) {
      this.vy = this.jumpForce;
      this.isGrounded = false;
    }

    if (!this.isGrounded) {
      this.vy += this.gravity * dt;
      this.y += this.vy * dt;

      if (this.y >= this.groundY) {
        this.y = this.groundY;
        this.vy = 0;
        this.isGrounded = true;
      }
    }

    // 4. Shooting Duration
    if (this.isShooting) {
      this.shootTimer -= dt;
      if (this.shootTimer <= 0) {
        this.isShooting = false;
      }
    }

    // 5. Crisp State Transition Logic
    const isMoving = Math.abs(this.vx) > 10;

    if (this.isShooting) {
      this.setState('shoot');
    } else if (!this.isGrounded) {
      this.setState('jump');
    } else if (isMoving) {
      this.setState(keyRun ? 'run' : 'walk');

      // Spawn Footstep Dust Particles when moving on ground
      if (Math.random() < (keyRun ? 0.35 : 0.18)) {
        spawnedParticles.push({
          x: this.x - this.facing * 18,
          y: this.groundY - 2,
          vx: -this.facing * (Math.random() * 30 + 10),
          vy: -Math.random() * 18 - 4,
          size: Math.random() * 2.5 + 1.5,
          alpha: 0.6,
          color: 'rgba(0, 240, 255, '
        });
      }
    } else {
      // INSTANT IDLE SNAP: as soon as movement stops, switch to parado.gif!
      this.setState('idle');
    }

    return spawnedParticles;
  }

  /**
   * Hardware-accelerated DOM synchronization
   * @param {HTMLElement} containerEl 
   * @param {HTMLImageElement} spriteImgEl 
   * @param {HTMLElement} fallbackEl 
   * @param {number} screenX - Render X coordinate in screen/viewport space
   */
  syncDOM(containerEl, spriteImgEl, fallbackEl, screenX) {
    if (!containerEl || !spriteImgEl) return;

    const displayWidth = this.originalWidth * this.scale;
    const displayHeight = this.originalHeight * this.scale;

    // Anchor at feet (~77% of frame height)
    const feetOffsetY = displayHeight * 0.77;
    const left = screenX - displayWidth / 2;
    const top = this.y - feetOffsetY;

    containerEl.style.width = `${displayWidth}px`;
    containerEl.style.height = `${displayHeight}px`;
    containerEl.style.transform = `translate3d(${left}px, ${top}px, 0)`;

    const expectedSrc = PLAYER_SPRITES[this.currentState] || PLAYER_SPRITES.idle;
    if (spriteImgEl.dataset.currentSrc !== expectedSrc) {
      spriteImgEl.dataset.currentSrc = expectedSrc;
      spriteImgEl.src = expectedSrc;
    }

    // Horizontal direction
    spriteImgEl.style.transform = `scaleX(${this.facing})`;

    const hasError = this.assetErrors[this.currentState];
    if (hasError) {
      spriteImgEl.style.display = 'none';
      if (fallbackEl) fallbackEl.classList.remove('hidden');
    } else {
      spriteImgEl.style.display = 'block';
      if (fallbackEl) fallbackEl.classList.add('hidden');
    }
  }

  /**
   * Renders dynamic shadow and debug markers on canvas
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} screenX 
   * @param {boolean} showDebug 
   */
  renderCanvas(ctx, screenX, showDebug = false) {
    ctx.save();

    // 1. Dynamic Contact Shadow (scales down slightly when airborne)
    const heightAboveGround = Math.max(0, this.groundY - this.y);
    const shadowFactor = Math.max(0.3, 1 - heightAboveGround / 200);
    const shadowWidth = this.hitboxWidth * 1.1 * shadowFactor;
    const shadowHeight = 10 * shadowFactor;

    ctx.fillStyle = `rgba(0, 0, 0, ${0.5 * shadowFactor})`;
    ctx.beginPath();
    ctx.ellipse(screenX, this.groundY, shadowWidth / 2, shadowHeight / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Debug Hitbox
    if (showDebug) {
      const boxLeft = screenX - this.hitboxWidth / 2;
      const boxTop = this.y - this.hitboxHeight;

      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(boxLeft, boxTop, this.hitboxWidth, this.hitboxHeight);
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
      ctx.fillRect(boxLeft, boxTop, this.hitboxWidth, this.hitboxHeight);

      // Feet anchor point
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(screenX, this.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Status Label
      ctx.fillStyle = '#00f0ff';
      ctx.font = '12px "VT323", monospace';
      ctx.fillText(`STATE: ${this.currentState.toUpperCase()} | VX: ${Math.round(this.vx)}`, boxLeft, boxTop - 8);
    }

    ctx.restore();
  }
}
