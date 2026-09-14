/**
 * CYBER_STRIKE 2D // Player Controller & Sprite Manager
 * Zero-Delay arcade responsiveness between movement, shooting, and idle states.
 */

export const PLAYER_SPRITES = {
  idle: './gif/parado.gif',
  walk: './gif/andando.gif',
  run: './gif/correndo.gif',
  jump: './gif/pulo.gif',
  shoot: './gif/atirando.gif',
  shootDown: './gif/atirando para baixo.gif',
  shootRun: './gif/atirando correndo.gif',
  shootDiagDown: './gif/atirando em diagonal para baixo.gif'
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
    
    // Instant Velocity
    this.vx = 0;
    this.vy = 0;
    
    // Speeds
    this.speedWalk = 130;
    this.speedRun = 250;
    
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

    // States: 'idle' | 'walk' | 'run' | 'jump' | 'shoot' | 'shootDown' | 'shootRun' | 'shootDiagDown'
    this.currentState = 'idle';
    this.isShooting = false;
    this.shootType = null; // 'shoot' | 'shootDown' | 'shootRun' | 'shootDiagDown' | null
    this.shootCooldown = 0;
    this.fireRate = 0.14; // ~7 disparos por segundo em auto-fire

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
   * Update character physics, input, and state with ZERO input delay
   * @param {Object} input - { keys, isMouseDown, autoWalk, autoRun }
   * @param {number} dt - Delta time in seconds
   * @returns {Object} Object containing spawned particles and shots
   */
  update(input, dt) {
    const spawnedParticles = [];

    // 1. Inputs em tempo real
    const keyLeft = input.keys['ArrowLeft'] || input.keys['KeyA'] || input.keys['a'] || input.keys['A'];
    const keyRight = input.keys['ArrowRight'] || input.keys['KeyD'] || input.keys['d'] || input.keys['D'];
    const keyDown = input.keys['ArrowDown'] || input.keys['KeyS'] || input.keys['s'] || input.keys['S'] || input.autoShootDown || input.autoShootDiagDown;
    const keyRun = input.keys['ShiftLeft'] || input.keys['ShiftRight'] || input.autoRun;
    const keyShoot = input.keys['KeyF'] || input.keys['KeyX'] || input.keys['f'] || input.keys['F'] || input.keys['x'] || input.keys['X'] || input.isMouseDown || input.autoShoot;

    const spawnedShots = [];

    // 2. DISPARO IMEDIATO / CANCELAMENTO INSTANTÂNEO (ZERO DELAY)
    if (keyShoot) {
      this.isShooting = true;
      if (keyDown && (keyLeft || keyRight || input.autoShootDiagDown)) {
        // Diagonal para baixo: S + A/D + F
        this.shootType = 'shootDiagDown';
      } else if (keyDown) {
        // Vertical para baixo: S + F
        this.shootType = 'shootDown';
      } else if (keyLeft || keyRight || input.autoWalk) {
        // Tiro correndo
        this.shootType = 'shootRun';
      } else {
        // Tiro parado horizontal
        this.shootType = 'shoot';
      }

      this.shootCooldown -= dt;
      if (this.shootCooldown <= 0) {
        let muzzleX = this.x;
        let muzzleY = this.y - 104.5;
        let bvx = 0;
        let bvy = 0;

        if (this.shootType === 'shootDown') {
          // Tiro vertical para baixo
          muzzleX = this.x + this.facing * 18;
          muzzleY = this.y - 12;
          bvx = 0;
          bvy = 850;
        } else if (this.shootType === 'shootDiagDown') {
          // Tiro em diagonal para baixo (~22.5 graus) alinhado com a ponta da chama do fuzil
          muzzleX = this.x + this.facing * 104;
          muzzleY = this.y - 46;
          const diagSpeed = 850;
          const diagAngle = 22.5 * (Math.PI / 180);
          bvx = this.facing * Math.cos(diagAngle) * diagSpeed;
          bvy = Math.sin(diagAngle) * diagSpeed;
        } else if (this.shootType === 'shootRun') {
          // Tiro correndo: corpo e fuzil inclinados
          muzzleX = this.x + this.facing * 82;
          muzzleY = this.y - 99;
          bvx = this.facing * 850;
          bvy = 0;
        } else {
          // Tiro parado ('shoot'): boca do silenciador do fuzil
          muzzleX = this.x + this.facing * 72;
          muzzleY = this.y - 104.5;
          bvx = this.facing * 850;
          bvy = 0;
        }

        spawnedShots.push({
          x: muzzleX,
          y: muzzleY,
          vx: bvx,
          vy: bvy,
          type: this.shootType
        });

        this.shootCooldown = this.fireRate;
      }
    } else {
      // SOLTOU O BOTÃO: ZERA NO MESMO FRAME!
      this.isShooting = false;
      this.shootType = null;
      this.shootCooldown = 0;
    }

    // 3. Movimentação Horizontal e Bloqueio ao Atirar para Baixo / Diagonal
    let moveDir = 0;
    const isStationaryShoot = this.isShooting && (this.shootType === 'shootDown' || this.shootType === 'shootDiagDown');

    if (isStationaryShoot) {
      // Posição firme de mira estática para baixo ou diagonal
      moveDir = 0;
      this.vx = 0;
      if (keyLeft) this.facing = -1;
      if (keyRight) this.facing = 1;
    } else {
      if (keyLeft) moveDir -= 1;
      if (keyRight) moveDir += 1;

      // Modo de teste automatizado
      if (moveDir === 0 && input.autoWalk) {
        moveDir = this.facing;
      }

      // Resposta instantânea de velocidade: sem delay de aceleração/desaceleração lenta
      if (moveDir !== 0) {
        this.facing = moveDir;
        const targetSpeed = keyRun ? this.speedRun : this.speedWalk;
        this.vx = moveDir * targetSpeed;
      } else {
        // Parada imediata ao soltar a tecla de movimento
        this.vx = 0;
      }
    }

    // Aplica deslocamento
    this.x += this.vx * dt;

    // 4. Salto e Gravidade
    const keyJump = input.keys['Space'] || input.keys['KeyW'] || input.keys['ArrowUp'] || input.keys['w'] || input.keys['W'];
    if (keyJump && this.isGrounded && !isShootingDown) {
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

    // 5. TRANSIÇÃO DE ESTADO IMEDIATA (ZERO DELAY)
    const isMoving = Math.abs(this.vx) > 0;

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
      // RETORNO INSTANTÂNEO PARA PARADO: sem nenhum delay ou temporizador residual!
      this.setState('idle');
    }

    return {
      particles: spawnedParticles,
      shots: spawnedShots
    };
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

      // Indicador do bocal da arma
      let debugMuzzleX = screenX + this.facing * 72;
      let debugMuzzleY = this.y - 104.5;
      if (this.shootType === 'shootDown') {
        debugMuzzleX = screenX + this.facing * 18;
        debugMuzzleY = this.y - 12;
      } else if (this.shootType === 'shootDiagDown') {
        debugMuzzleX = screenX + this.facing * 104;
        debugMuzzleY = this.y - 46;
      } else if (this.shootType === 'shootRun') {
        debugMuzzleX = screenX + this.facing * 82;
        debugMuzzleY = this.y - 99;
      }
      ctx.fillStyle = '#ffbb00';
      ctx.beginPath();
      ctx.arc(debugMuzzleX, debugMuzzleY, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#00f0ff';
      ctx.font = '12px "VT323", monospace';
      ctx.fillText(`STATE: ${this.currentState.toUpperCase()} | VX: ${Math.round(this.vx)}`, boxLeft, boxTop - 8);
    }

    ctx.restore();
  }
}
