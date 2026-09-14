/**
 * CYBER_STRIKE 2D // Projectile Engine (Disparo da Arma)
 * Handles player shots using cropped 'disparo.gif', physics, trail effects, and impact collisions.
 */

export const BULLET_SPRITE_SRC = './gif/disparo.gif';

const bulletImg = typeof Image !== 'undefined' ? new Image() : { complete: false };
if (typeof Image !== 'undefined') {
  bulletImg.src = BULLET_SPRITE_SRC;
}

// Coordenadas de recorte exatas do projétil dentro do GIF 640x360
const CROP_X = 311;
const CROP_Y = 175;
const CROP_W = 20;
const CROP_H = 10;

export class Projectile {
  /**
   * @param {Object} options
   * @param {number} options.x - Posição X inicial no mundo
   * @param {number} options.y - Posição Y inicial no mundo
   * @param {number} options.vx - Velocidade X em px/s
   * @param {number} options.vy - Velocidade Y em px/s
   * @param {string} [options.type='normal'] - Tipo de disparo
   */
  constructor({ x, y, vx, vy, type = 'normal' }) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.type = type;

    // Dimensões do projétil na tela
    this.width = 30;
    this.height = 15;
    this.active = true;

    // Ângulo de trajetória (ponta do sprite original aponta para a esquerda, portanto offset de PI)
    this.angle = Math.atan2(this.vy, this.vx) + Math.PI;

    // Distância percorrida
    this.distanceTraveled = 0;
    this.maxDistance = 1400;
  }

  /**
   * Atualiza a posição do projétil
   * @param {number} dt - Delta time
   * @returns {Object|null} Partícula de rastro emitida
   */
  update(dt) {
    const stepX = this.vx * dt;
    const stepY = this.vy * dt;

    this.x += stepX;
    this.y += stepY;
    this.distanceTraveled += Math.hypot(stepX, stepY);

    if (this.distanceTraveled >= this.maxDistance) {
      this.active = false;
    }

    // Emite partícula de rastro de energia
    return {
      x: this.x - (this.vx * 0.015),
      y: this.y - (this.vy * 0.015),
      vx: (Math.random() - 0.5) * 20,
      vy: (Math.random() - 0.5) * 20,
      size: Math.random() * 2.5 + 1.5,
      alpha: 0.8,
      decay: 3.5,
      color: Math.random() < 0.5 ? 'rgba(255, 200, 30, ' : 'rgba(255, 120, 10, '
    };
  }

  /**
   * Renderiza o projétil recortado no Canvas
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} cameraX
   */
  render(ctx, cameraX) {
    const screenX = this.x - cameraX;

    ctx.save();
    ctx.translate(screenX, this.y);
    ctx.rotate(this.angle);

    // Brilho do disparo
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 12;

    if (bulletImg.complete && bulletImg.naturalWidth > 0) {
      ctx.drawImage(
        bulletImg,
        CROP_X, CROP_Y, CROP_W, CROP_H,
        -this.width / 2, -this.height / 2, this.width, this.height
      );
    } else {
      // Fallback visual caso a imagem ainda esteja carregando
      ctx.fillStyle = '#ffbb00';
      ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    }

    ctx.restore();
  }
}

export class ProjectileManager {
  constructor() {
    this.projectiles = [];
    this.trailParticles = [];
    this.impactSparks = [];
    this.muzzleFlashes = [];
  }

  /**
   * Dispara um novo projétil com muzzle flash
   */
  spawn({ x, y, vx, vy, type = 'normal' }) {
    const p = new Projectile({ x, y, vx, vy, type });
    this.projectiles.push(p);

    // Muzzle Flash na saída do cano
    this.muzzleFlashes.push({
      x,
      y,
      radius: 18,
      alpha: 1.0,
      decay: 14 // Dissipa em ~70ms
    });
  }

  /**
   * Cria faíscas de impacto
   */
  spawnImpactSparks(x, y, count = 10, baseColor = 'rgba(255, 200, 50, ') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 160 + 60;
      this.impactSparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 1,
        alpha: 1.0,
        decay: Math.random() * 3.5 + 2.5,
        color: baseColor
      });
    }
  }

  /**
   * Atualiza projéteis, detecção de colisão e partículas
   */
  update(dt, groundY, cameraX, enemy) {
    // 1. Atualiza Projéteis
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const trail = p.update(dt);
      if (trail) {
        this.trailParticles.push(trail);
      }

      // Colisão com o Solo (principalmente tiro para baixo)
      if (p.y >= groundY - 5 && p.vy > 0) {
        p.active = false;
        this.spawnImpactSparks(p.x, groundY, 12, 'rgba(0, 240, 255, ');
      }

      // Colisão com o Inimigo (Homem de Fogo)
      if (enemy && enemy.isAlive) {
        const halfW = enemy.hitboxWidth / 2;
        const enemyLeft = enemy.x - halfW;
        const enemyRight = enemy.x + halfW;
        const enemyTop = enemy.y - enemy.hitboxHeight;
        const enemyBottom = enemy.y;

        if (p.x >= enemyLeft && p.x <= enemyRight && p.y >= enemyTop && p.y <= enemyBottom) {
          p.active = false;
          enemy.takeDamage(25, p.vx > 0 ? 1 : -1);
          this.spawnImpactSparks(p.x, p.y, 16, 'rgba(255, 140, 0, ');
        }
      }

      if (!p.active) {
        this.projectiles.splice(i, 1);
      }
    }

    // 2. Atualiza Rastros
    for (let i = this.trailParticles.length - 1; i >= 0; i--) {
      const t = this.trailParticles[i];
      t.x += t.vx * dt;
      t.y += t.vy * dt;
      t.alpha -= dt * t.decay;
      t.size = Math.max(0.2, t.size - dt * 1.5);
      if (t.alpha <= 0) {
        this.trailParticles.splice(i, 1);
      }
    }

    // 3. Atualiza Faíscas de Impacto
    for (let i = this.impactSparks.length - 1; i >= 0; i--) {
      const s = this.impactSparks[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 400 * dt; // Gravidade nas faíscas
      s.alpha -= dt * s.decay;
      s.size = Math.max(0.2, s.size - dt * 2);
      if (s.alpha <= 0) {
        this.impactSparks.splice(i, 1);
      }
    }

    // 4. Atualiza Muzzle Flash
    for (let i = this.muzzleFlashes.length - 1; i >= 0; i--) {
      const mf = this.muzzleFlashes[i];
      mf.alpha -= dt * mf.decay;
      if (mf.alpha <= 0) {
        this.muzzleFlashes.splice(i, 1);
      }
    }
  }

  /**
   * Renderiza todos os projéteis e efeitos visuais
   */
  render(ctx, cameraX) {
    // 1. Rastros de Energia
    ctx.save();
    for (const t of this.trailParticles) {
      const screenX = t.x - cameraX;
      ctx.fillStyle = `${t.color}${t.alpha})`;
      ctx.beginPath();
      ctx.arc(screenX, t.y, t.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 2. Faíscas de Impacto
    ctx.save();
    for (const s of this.impactSparks) {
      const screenX = s.x - cameraX;
      ctx.fillStyle = `${s.color}${s.alpha})`;
      ctx.shadowColor = '#ffbb00';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(screenX, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 3. Muzzle Flash na Saída do Cano
    ctx.save();
    for (const mf of this.muzzleFlashes) {
      const screenX = mf.x - cameraX;
      const grad = ctx.createRadialGradient(screenX, mf.y, 2, screenX, mf.y, mf.radius);
      grad.addColorStop(0, `rgba(255, 255, 220, ${mf.alpha})`);
      grad.addColorStop(0.5, `rgba(255, 170, 0, ${mf.alpha * 0.7})`);
      grad.addColorStop(1, 'rgba(255, 60, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(screenX, mf.y, mf.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 4. Projéteis
    for (const p of this.projectiles) {
      p.render(ctx, cameraX);
    }
  }
}
