// =========================================================
// Entidades do jogo
//  Alvo      -> palavra inimiga ou projétil (ambos são digitáveis)
//  Tiro      -> letra disparada pelo macaco a cada acerto
//  Particula -> efeito visual de explosão
// =========================================================
(() => {
  const C = TTT.CORES;
  const COR_BONUS = {
    autocompletar: C.rosa,
    escudo: C.azulClaro,
    vida: C.verde,
  };

  class Alvo {
    constructor({ texto, x, y, vel, tipo = 'palavra', atirador = false, bonus = null }) {
      this.texto = texto;
      this.x = x;
      this.y = y;
      this.vel = vel;
      this.tipo = tipo;          // 'palavra' | 'projetil'
      this.atirador = atirador;  // palavras atiradoras disparam projéteis
      this.bonus = bonus;        // id do bônus pago se completar sem erros (null = comum)
      this.digitado = 0;
      this.vivo = true;
      this.morrendo = false;     // completo, esperando o último tiro chegar
      this.recuo = 0;
      this.tempoTiro = 1.5 + Math.random() * 2;
      this.meiaLargura = 0;      // metade da largura do texto (o jogo mede ao criar)
    }

    get proximaLetra() { return this.texto[this.digitado]; }
    get completo() { return this.digitado >= this.texto.length; }
    get cor() {
      if (this.tipo === 'projetil') return C.vermelho;
      if (this.bonus) return COR_BONUS[this.bonus] || C.branco;
      return this.atirador ? C.vermelho : C.branco;
    }

    // cada letra acertada empurra o alvo um pouco para trás (feedback)
    empurrar() { this.recuo = Math.min(this.recuo + 30, 90); }

    // area = { largura, margem, topo }: limites da tela que o recuo não pode ultrapassar
    atualizar(dt, destinoX, destinoY, area) {
      if (this.morrendo) return;
      const dx = destinoX - this.x;
      const dy = destinoY - this.y;
      const dist = Math.hypot(dx, dy) || 1;
      const v = this.vel - this.recuo * 3;
      let x = this.x + (dx / dist) * v * dt;
      let y = this.y + (dy / dist) * v * dt;

      // Andando para trás (recuo), a palavra não sai da tela. Se ela ainda está
      // entrando (parte fora), o recuo só não a empurra mais para fora.
      if (v < 0 && area) {
        const xMin = area.margem + this.meiaLargura;
        const xMax = area.largura - area.margem - this.meiaLargura;
        x = Math.min(Math.max(x, Math.min(this.x, xMin)), Math.max(this.x, xMax));
        y = Math.max(y, Math.min(this.y, area.topo));
      }

      this.x = x;
      this.y = y;
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
