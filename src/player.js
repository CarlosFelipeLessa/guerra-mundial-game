/**
 * CYBER_STRIKE 2D // Player Controller & Sprite Manager
 * Handles character state, movement physics, inertia, and dual-layer rendering.
 */

export const PLAYER_SPRITES = {
  idle: './gif/parado.gif',
  walk: './gif/andando.gif',
  run: './gif/correndo.gif',
  jump: './gif/pulo.gif',
  shoot: './gif/atirando.gif',
  shootDown: './gif/atirando para baixo.gif',
  shootRun: './gif/atirando correndo.gif'
};

// Duração precisa de cada animação de disparo (calculada pelos quadros a 80ms)
// Evita cancelamento prematuro para o estado 'parado'
export const SHOOT_DURATIONS = {
  shoot: 0.96,       // 12 quadros x 80ms = 0.96s
  shootDown: 0.88,   // 11 quadros x 80ms = 0.88s
  shootRun: 0.65     // Ciclo de corrida com disparo
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

    // States: 'idle' | 'walk' | 'run' | 'jump' | 'shoot' | 'shootDown' | 'shootRun'
    this.currentState = 'idle';
    this.shootTimer = 0;
    this.isShooting = false;
    this.shootType = null; // 'shoot' | 'shootDown' | 'shootRun' | null

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

  /**
   * Ativa o disparo garantindo que a animação dure o tempo total do GIF
   * @param {'shoot' | 'shootDown' | 'shootRun'} type
   */
  triggerShoot(type = 'shoot') {
    this.shootType = type;
    this.isShooting = true;
    this.shootTimer = SHOOT_DURATIONS[type] || 0.90;
    this.setState(type);
  }

  /**
   * Update character physics, input, and state
   * @param {Object} input - { keys, isMouseDown, autoWalk, autoRun }
   * @param {number} dt - Delta time in seconds
   * @returns {Array} Array of newly spawned footstep particles
   */
  update(input, dt) {
    const spawnedParticles = [];

    // 1. Read Movement Intent
    let moveDir = 0;
    const keyLeft = input.keys['ArrowLeft'] || input.keys['KeyA'] || input.keys['a'] || input.keys['A'];
    const keyRight = input.keys['ArrowRight'] || input.keys['KeyD'] || input.keys['d'] || input.keys['D'];
    const keyDown = input.keys['ArrowDown'] || input.keys['KeyS'] || input.keys['s'] || input.keys['S'];
    const keyRun = input.keys['ShiftLeft'] || input.keys['ShiftRight'] || input.autoRun;
    const keyShoot = input.keys['KeyF'] || input.keys['KeyX'] || input.keys['f'] || input.keys['F'] || input.keys['x'] || input.keys['X'] || input.isMouseDown;

    if (keyLeft) moveDir -= 1;
    if (keyRight) moveDir += 1;

    // Virtual test mode
    if (moveDir === 0 && input.autoWalk) {
      moveDir = this.facing;
    }

    // 2. Velocity Acceleration & Friction
    const targetSpeed = keyRun ? this.speedRun : this.speedWalk;
    const targetVx = moveDir * targetSpeed;

    if (moveDir !== 0) {
      if (this.vx < targetVx) {
        this.vx = Math.min(this.vx + this.acceleration * dt, targetVx);
      } else if (this.vx > targetVx) {
        this.vx = Math.max(this.vx - this.acceleration * dt, targetVx);
      }
      this.facing = moveDir;
    } else {
      if (this.vx > 0) {
        this.vx = Math.max(0, this.vx - this.friction * dt);
      } else if (this.vx < 0) {
        this.vx = Math.min(0, this.vx + this.friction * dt);
      }
    }

    // Apply displacement
    this.x += this.vx * dt;

    // 3. Jump Physics
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

    const isMoving = Math.abs(this.vx) > 10;

    // 4. Disparo Contínuo ou Disparo Único
    if (keyShoot) {
      // Se a tecla de disparo estiver sendo mantida pressionada
      if (keyDown) {
        this.triggerShoot('shootDown');
      } else if (isMoving) {
        this.triggerShoot('shootRun');
      } else {
        this.triggerShoot('shoot');
      }
    } else if (this.isShooting) {
      // Se soltou a tecla, decrementa o temporizador para concluir a animação completa
      this.shootTimer -= dt;
      if (this.shootTimer <= 0) {
        this.isShooting = false;
        this.shootType = null;
      }
    }

    // 5. Transição de Estado Estrita
    // REGRA DE OURO: Enquanto estiver atirando (isShooting = true), o estado 'parado' NUNCA cancela o tiro!
    if (this.isShooting && this.shootType) {
      this.setState(this.shootType);
    } else if (!this.isGrounded) {
      this.setState('jump');
    } else if (isMoving) {
      this.setState(keyRun ? 'run' : 'walk');

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
      // Só volta a ficar parado quando o tiro tiver terminado por completo!
      this.setState('idle');
    }

    return spawnedParticles;
  }

  syncDOM(containerEl, spriteImgEl, fallbackEl, screenX) {
    if (!containerEl || !spriteImgEl) return;

    const displayWidth = this.originalWidth * this.scale;
    const displayHeight = this.originalHeight * this.scale;

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

  renderCanvas(ctx, screenX, showDebug = false) {
    ctx.save();

    const heightAboveGround = Math.max(0, this.groundY - this.y);
    const shadowFactor = Math.max(0.3, 1 - heightAboveGround / 200);
    const shadowWidth = this.hitboxWidth * 1.1 * shadowFactor;
    const shadowHeight = 10 * shadowFactor;

    ctx.fillStyle = `rgba(0, 0, 0, ${0.5 * shadowFactor})`;
    ctx.beginPath();
    ctx.ellipse(screenX, this.groundY, shadowWidth / 2, shadowHeight / 2, 0, 0, Math.PI * 2);
    ctx.fill();

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

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(screenX, this.y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#00f0ff';
      ctx.font = '12px "VT323", monospace';
      ctx.fillText(`STATE: ${this.currentState.toUpperCase()} | TIMER: ${this.shootTimer.toFixed(2)}s`, boxLeft, boxTop - 8);
    }

    ctx.restore();
  }
}
