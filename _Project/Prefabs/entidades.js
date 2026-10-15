// =========================================================
// Entidades do jogo
//  Alvo      -> palavra inimiga ou projétil (ambos são digitáveis)
//  Tiro      -> letra disparada pelo macaco a cada acerto
//  Particula -> efeito visual de explosão
// =========================================================
(() => {
  const C = TTT.CORES;

  class Alvo {
    constructor({ texto, x, y, vel, tipo = 'palavra', atirador = false }) {
      this.texto = texto;
      this.x = x;
      this.y = y;
      this.vel = vel;
      this.tipo = tipo;          // 'palavra' | 'projetil'
      this.atirador = atirador;  // palavras atiradoras disparam projéteis
      this.digitado = 0;
      this.vivo = true;
      this.morrendo = false;     // completo, esperando o último tiro chegar
      this.recuo = 0;
      this.tempoTiro = 1.5 + Math.random() * 2;
    }

    get proximaLetra() { return this.texto[this.digitado]; }
    get completo() { return this.digitado >= this.texto.length; }
    get cor() {
      if (this.tipo === 'projetil') return C.vermelho;
      return this.atirador ? C.rosa : C.branco;
    }

    // cada letra acertada empurra o alvo um pouco para trás (feedback)
    empurrar() { this.recuo = Math.min(this.recuo + 30, 90); }

    atualizar(dt, destinoX, destinoY) {
      if (this.morrendo) return;
      const dx = destinoX - this.x;
      const dy = destinoY - this.y;
      const dist = Math.hypot(dx, dy) || 1;
      const v = this.vel - this.recuo * 3;
      this.x += (dx / dist) * v * dt;
      this.y += (dy / dist) * v * dt;
      this.recuo = Math.max(0, this.recuo - 120 * dt);
    }
  }

  class Tiro {
    constructor(x, y, alvo, letra, final) {
      this.x = x;
      this.y = y;
      this.alvo = alvo;
      this.letra = letra;
      this.final = final; // o tiro final é quem detona o alvo
      this.vivo = true;
    }

    // retorna true quando chega no alvo
    atualizar(dt) {
      const dx = this.alvo.x - this.x;
      const dy = this.alvo.y - this.y;
      const dist = Math.hypot(dx, dy);
      const passo = 1100 * dt;
      if (dist <= passo + 4) {
        this.vivo = false;
        return true;
      }
      this.x += (dx / dist) * passo;
      this.y += (dy / dist) * passo;
      return false;
    }
  }

  class Particula {
    constructor(x, y, cor) {
      const angulo = Math.random() * Math.PI * 2;
      const vel = 60 + Math.random() * 220;
      this.x = x;
      this.y = y;
      this.vx = Math.cos(angulo) * vel;
      this.vy = Math.sin(angulo) * vel;
      this.vida = 0.4 + Math.random() * 0.5;
      this.cor = cor;
      this.tam = Math.random() < 0.5 ? 4 : 6;
    }

    atualizar(dt) {
      this.vy += 300 * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vida -= dt;
    }
  }

  TTT.Alvo = Alvo;
  TTT.Tiro = Tiro;
  TTT.Particula = Particula;
})();
