/**
 * CYBER_STRIKE 2D // Enemy Engine: Homem de Fogo (Fire Man)
 * Chases the player in real-time with flame ember generation and responsive physics.
 */

export const ENEMY_SPRITE = './gif/homem de fogo.gif';

export class FireManEnemy {
  /**
   * @param {Object} options
   * @param {number} options.x - World X position
   * @param {number} options.y - Ground Y position (feet level)
   * @param {number} [options.scale=0.6] - Visual scale factor
   * @param {number} [options.speed=185] - Chasing velocity in px/s
   */
  constructor({ x = 850, y = 440, scale = 0.6, speed = 185 } = {}) {
    this.initialX = x;
    this.x = x;
    this.y = y;
    this.groundY = y;
    
    this.vx = 0;
    this.vy = 0;
    this.speed = speed;
    this.facing = -1; // -1: Left (towards player), 1: Right

    // Base GIF Dimensions (640x360)
    this.originalWidth = 640;
    this.originalHeight = 360;
    this.scale = scale;
    this.feetRatio = 0.788; // 284 / 360 feet contact

    // Hitbox dimensions
    this.hitboxWidth = 60;
    this.hitboxHeight = 105;

    // State & Health
    this.state = 'chasing'; // 'chasing' | 'attacking'
    this.health = 100;
    this.maxHealth = 100;
    this.isAlive = true;
    this.hitFlashTimer = 0;
    this.knockbackVx = 0;
    this.respawnTimer = 0;

    // Asset Preload
    this.img = new Image();
    this.img.src = ENEMY_SPRITE;
    this.assetError = false;
    this.img.onerror = () => {
      console.warn(`[Enemy Warning] Falha ao carregar: ${ENEMY_SPRITE}`);
      this.assetError = true;
    };
  }

  /**
   * Recebe dano do projétil com recuo e efeito de flash
   * @param {number} amount - Quantidade de dano
   * @param {number} knockbackDir - Direção do impacto (-1 ou 1)
   */
  takeDamage(amount, knockbackDir = 0) {
    if (!this.isAlive) return;

    this.health = Math.max(0, this.health - amount);
    this.hitFlashTimer = 0.16; // 160ms de brilho intenso
    this.knockbackVx = knockbackDir * 120;

    if (this.health <= 0) {
      this.isAlive = false;
      this.respawnTimer = 2.0; // Reaparece após 2 segundos
    }
  }

  /**
   * Reset position for easy testing
   * @param {number} [customX]
   */
  reset(customX) {
    this.x = customX !== undefined ? customX : this.initialX;
    this.y = this.groundY;
    this.vx = 0;
    this.vy = 0;
    this.knockbackVx = 0;
    this.health = this.maxHealth;
    this.isAlive = true;
    this.state = 'chasing';
  }

  /**
   * AI Update: target tracking and ember particle production
   * @param {Object} player - Player instance
   * @param {number} dt - Delta time
   * @returns {Array} Array of newly emitted flame ember particles
   */
  update(player, dt) {
    const fireParticles = [];

    // Se estiver abatido, aguarda temporizador de reaparecimento
    if (!this.isAlive) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.health = this.maxHealth;
        this.isAlive = true;
        const spawnDist = 550;
        this.reset(player.x + (player.facing * spawnDist));
      }
      return fireParticles;
    }

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }

    // Aplica desaceleração do recuo
    if (Math.abs(this.knockbackVx) > 5) {
      this.x += this.knockbackVx * dt;
      this.knockbackVx *= Math.max(0, 1 - 8 * dt);
    } else {
      this.knockbackVx = 0;
    }

    const dx = player.x - this.x;
    const distance = Math.abs(dx);
    const attackRange = 50;

    if (distance > attackRange) {
      this.state = 'chasing';
      this.facing = dx > 0 ? 1 : -1;
      this.vx = this.facing * this.speed;
    } else {
      // In range: maintain combat stance and match facing
      this.state = 'attacking';
      this.facing = dx >= 0 ? 1 : -1;
      this.vx = 0;
    }

    // Apply movement
    this.x += this.vx * dt;

    // Emissão contínua de brasas e labaredas de fogo
    const particleRate = this.state === 'chasing' ? 0.75 : 0.4;
    if (Math.random() < particleRate) {
      const colors = [
        'rgba(255, 60, 0, ',    // Vermelho fogo
        'rgba(255, 140, 0, ',   // Laranja brasa
        'rgba(255, 200, 30, ',  // Amarelo chama
        'rgba(255, 245, 150, '  // Núcleo branco incandescente
      ];

      // Ponto de emissão: torso e pés
      const emitFoot = Math.random() < 0.5;
      const spawnY = emitFoot 
        ? this.groundY - (Math.random() * 12 + 2)
        : this.groundY - (Math.random() * 60 + 20);

      const spawnX = this.x - this.facing * (Math.random() * 20 + 5);

      fireParticles.push({
        x: spawnX,
        y: spawnY,
        vx: -this.facing * (Math.random() * 40 + 15) + (Math.random() - 0.5) * 20,
        vy: -Math.random() * 45 - 20, // Chamas sobem
        size: Math.random() * 3.5 + 1.5,
        alpha: Math.random() * 0.5 + 0.5,
        decay: Math.random() * 1.8 + 1.2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    return fireParticles;
  }

  /**
   * Synchronize position with DOM Sprite Layer
   */
  syncDOM(containerEl, spriteImgEl, fallbackEl, screenX) {
    if (!containerEl || !spriteImgEl) return;

    if (!this.isAlive) {
      containerEl.style.display = 'none';
      return;
    }

    containerEl.style.display = 'flex';

    const displayWidth = this.originalWidth * this.scale;
    const displayHeight = this.originalHeight * this.scale;

    const feetOffsetY = displayHeight * this.feetRatio;
    const left = screenX - displayWidth / 2;
    const top = this.y - feetOffsetY;

    containerEl.style.width = `${displayWidth}px`;
    containerEl.style.height = `${displayHeight}px`;
    containerEl.style.transform = `translate3d(${left}px, ${top}px, 0)`;

    // Orientação correta: o GIF original corre para a direita (facing = 1)
    spriteImgEl.style.transform = `scaleX(${this.facing})`;

    // Efeito de flash de impacto ao ser atingido por projétil
    if (this.hitFlashTimer > 0) {
      spriteImgEl.style.filter = 'brightness(3.5) drop-shadow(0 0 20px #ffdd00)';
    } else {
      spriteImgEl.style.filter = 'drop-shadow(0 0 14px rgba(255, 80, 0, 0.45)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.7))';
    }

    if (this.assetError) {
      spriteImgEl.style.display = 'none';
      if (fallbackEl) fallbackEl.classList.remove('hidden');
    } else {
      spriteImgEl.style.display = 'block';
      if (fallbackEl) fallbackEl.classList.add('hidden');
    }
  }

  /**
   * Render shadow, health bar, and debug hitbox on Canvas
   */
  renderCanvas(ctx, screenX, showDebug = false) {
    if (!this.isAlive) return;

    ctx.save();

    // Sombra com aura incandescente de calor
    const shadowWidth = this.hitboxWidth * 1.2;
    const shadowHeight = 11;

    // Brilho quente do fogo no chão
    const fireGlow = ctx.createRadialGradient(screenX, this.groundY, 5, screenX, this.groundY, 40);
    fireGlow.addColorStop(0, 'rgba(255, 90, 0, 0.35)');
    fireGlow.addColorStop(0.6, 'rgba(255, 40, 0, 0.15)');
    fireGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = fireGlow;
    ctx.beginPath();
    ctx.arc(screenX, this.groundY, 40, 0, Math.PI * 2);
    ctx.fill();

    // Sombra escura central
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.ellipse(screenX, this.groundY, shadowWidth / 2, shadowHeight / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Barra de Vida Cyberpunk sobre o inimigo
    const barWidth = 56;
    const barHeight = 6;
    const barX = screenX - barWidth / 2;
    const barY = this.y - this.hitboxHeight - 16;
    const healthRatio = Math.max(0, this.health / this.maxHealth);

    ctx.fillStyle = 'rgba(10, 15, 25, 0.85)';
    ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
    ctx.strokeStyle = '#ff6600';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

    const barColor = healthRatio > 0.5 ? '#22c55e' : (healthRatio > 0.25 ? '#f59e0b' : '#ef4444');
    ctx.fillStyle = barColor;
    ctx.shadowColor = barColor;
    ctx.shadowBlur = 6;
    ctx.fillRect(barX, barY, barWidth * healthRatio, barHeight);
    ctx.shadowBlur = 0;

    if (showDebug) {
      const boxLeft = screenX - this.hitboxWidth / 2;
      const boxTop = this.y - this.hitboxHeight;

      // Caixa de colisão laranja incandescente
      ctx.strokeStyle = '#ff6600';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(boxLeft, boxTop, this.hitboxWidth, this.hitboxHeight);
      ctx.setLineDash([]);

      ctx.fillStyle = this.hitFlashTimer > 0 ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 102, 0, 0.12)';
      ctx.fillRect(boxLeft, boxTop, this.hitboxWidth, this.hitboxHeight);

      // Ponto de âncora dos pés
      ctx.fillStyle = '#ff3300';
      ctx.beginPath();
      ctx.arc(screenX, this.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Rótulo de debug
      ctx.fillStyle = '#ff9900';
      ctx.font = '12px "VT323", monospace';
      ctx.fillText(`ENEMY HP: ${this.health}/${this.maxHealth} [${this.state.toUpperCase()}]`, boxLeft - 10, barY - 6);
    }

    ctx.restore();
  }
}
