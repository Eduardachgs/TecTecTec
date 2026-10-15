// =========================================================
// Jogo — loop principal, ondas, digitação, pontuação e render.
//
// Estados: 'contagem' -> 'jogando' <-> 'pausado'
//                         'jogando' -> 'derrota' -> 'fim'
//                         (qualquer) -> 'fim' via encerrar()
// =========================================================
(() => {
  const { LARGURA, ALTURA, CORES, FONTE } = TTT;

  const ESCALA = 5;                         // tamanho do pixel do macaco
  const BASE = ALTURA - 6;                  // chão
  const GEO = TTT.Sprites.geometria(LARGURA / 2, BASE, ESCALA);
  const JOGADOR = GEO.centro;               // ponto que as palavras perseguem
  const RAIO_COLISAO = 46;
  const TAMANHO_PALAVRA_MIN = 16;  // px no canvas (desktop)
  const TAMANHO_PALAVRA_MAX = 32;
  const TAMANHO_NA_TELA = 11;      // px reais desejados na tela, mesmo com o canvas encolhido

  class Jogo {
    // eventos: { aoAtualizarHud(hud), aoFim(resultado) }
    constructor(canvas, eventos) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.eventos = eventos;
      this.raf = null;
      this.estado = 'parado';
      this._quadro = this._quadro.bind(this);
      this.estrelas = Array.from({ length: 70 }, () => ({
        x: Math.random() * LARGURA,
        y: Math.random() * ALTURA,
        v: 6 + Math.random() * 20,
        t: Math.random() < 0.2 ? 4 : 2,
      }));
    }

    // ---------------- ciclo de vida ----------------
    iniciar(modoId, difId) {
      this.modo = TTT.MODOS[modoId];
      this.dif = TTT.DIFICULDADES[difId] || TTT.DIFICULDADES.normal;

      this.alvos = [];
      this.tiros = [];
      this.particulas = [];
      this.alvo = null;
      this.vida = TTT.VIDA_MAXIMA;
      this.onda = 0;
      this.filaOnda = 0;
      this.timerSpawn = 0;
      this.stats = { pontos: 0, acertos: 0, erros: 0, palavras: 0, perdidas: 0, combo: 0, maiorCombo: 0, tempo: 0 };
      this.manuscrito = [];
      this.flags = { ignorarAcentos: false, autocompletar: false, escudo: false };
      this.bonusAtivos = [];
      this.tremor = 0;
      this.flashErro = 0;
      this.erroPapel = null;
      this.aviso = null;
      this.bracoFase = 0;

      // Em tela pequena (celular) o canvas encolhe; aumentamos a fonte para continuar legível
      const escalaTela = (this.canvas.clientWidth || LARGURA) / LARGURA;
      this.tamPalavra = Math.round(Math.min(TAMANHO_PALAVRA_MAX,
        Math.max(TAMANHO_PALAVRA_MIN, TAMANHO_NA_TELA / escalaTela)));

      this.estado = 'contagem';
      this.contagem = 3;

      this.parar();
      this.ultimoT = performance.now();
      this.raf = requestAnimationFrame(this._quadro);
    }

    parar() {
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = null;
    }

    get pausado() { return this.estado === 'pausado'; }

    pausar() {
      if (this.estado !== 'jogando' && this.estado !== 'contagem') return false;
      this.estadoAntesPausa = this.estado;
      this.estado = 'pausado';
      return true;
    }

    continuar() {
      if (this.estado !== 'pausado') return;
      this.estado = this.estadoAntesPausa;
      this.ultimoT = performance.now();
    }

    encerrar(motivo = 'desistiu') {
      if (this.estado === 'fim' || this.estado === 'parado') return;
      this.estado = 'fim';
      this.parar();
      this.eventos.aoFim(this.resultado(motivo));
    }

    // ---------------- entrada ----------------
    teclar(tecla) {
      if (this.estado !== 'jogando') return;
      const ch = tecla.toLowerCase();

      let alvo = this.alvo && this.alvo.vivo && !this.alvo.morrendo ? this.alvo : null;
      if (!alvo) {
        alvo = this._escolherAlvo(ch);
        if (!alvo) return this._errar(ch);
        this.alvo = alvo;
      }
      if (!this._confere(alvo.proximaLetra, ch)) return this._errar(ch);
      this._acertar(alvo);
    }

    // Backspace: apaga a última letra; com tudo=true (Ctrl+Backspace) apaga a palavra.
    // Quando não sobra nada digitado, o alvo é liberado e dá para mirar em outro.
    apagar(tudo = false) {
      if (this.estado !== 'jogando') return;
      this.erroPapel = null;
      const alvo = this.alvo;
      if (!alvo || !alvo.vivo || alvo.morrendo) return;
      alvo.digitado = tudo ? 0 : Math.max(0, alvo.digitado - 1);
      if (alvo.digitado === 0) this.alvo = null;
      this.bracoFase ^= 1;
      TTT.Audio.apagar();
    }

    // O que aparece no papel da máquina: o trecho já digitado da palavra em foco
    _textoPapel() {
      const alvo = this.alvo && this.alvo.vivo ? this.alvo : null;
      return alvo ? alvo.texto.slice(0, alvo.digitado) : '';
    }

    // Bônus "auto-completar": TAB termina a palavra em foco
    autocompletar() {
      if (this.estado !== 'jogando' || !this.flags.autocompletar) return false;
      const alvo = this.alvo;
      if (!alvo || !alvo.vivo || alvo.morrendo) return false;
      while (!alvo.completo) this._acertar(alvo);
      return true;
    }

    _confere(esperado, digitado) {
      if (this.flags.ignorarAcentos) {
        return TTT.Texto.normalizar(esperado) === TTT.Texto.normalizar(digitado);
      }
      return esperado === digitado;
    }

    // Prioridade: projéteis (perigo imediato) e depois quem está mais perto
    _escolherAlvo(ch) {
      let melhor = null;
      let melhorPrioridade = -Infinity;
      for (const a of this.alvos) {
        if (!a.vivo || a.morrendo || a.digitado > 0) continue;
        if (!this._confere(a.texto[0], ch)) continue;
        const prioridade = (a.tipo === 'projetil' ? 10000 : 0) + a.y;
        if (prioridade > melhorPrioridade) {
          melhor = a;
          melhorPrioridade = prioridade;
        }
      }
      return melhor;
    }

    _acertar(alvo) {
      alvo.digitado++;
      this.stats.acertos++;
      this.bracoFase ^= 1;
      const final = alvo.completo;
      this.tiros.push(new TTT.Tiro(GEO.disparo.x, GEO.disparo.y, alvo, alvo.texto[alvo.digitado - 1], final));
      alvo.empurrar();
      TTT.Audio.tecla();
      if (final) this._completar(alvo);
    }

    _completar(alvo) {
      alvo.morrendo = true;
      this.alvo = null;

      const s = this.stats;
      s.combo++;
      s.maiorCombo = Math.max(s.maiorCombo, s.combo);
      const base = alvo.texto.length * 10 * (alvo.tipo === 'projetil' ? 0.5 : 1);
      s.pontos += Math.round(base * (1 + Math.min(s.combo, 50) * 0.1));

      if (alvo.tipo === 'palavra') {
        s.palavras++;
        this.manuscrito.push(alvo.texto);
      }
    }

    _errar(ch) {
      this.erroPapel = { ch, tempo: 0.3 };
      this.stats.erros++;
      this.stats.combo = 0;
      this.tremor = 0.12;
      this.flashErro = 0.15;
      TTT.Audio.erro();
      if (this.modo.temVida) {
        this.vida -= this.dif.danoErro;
        this._verificarDerrota();
      }
    }

    // ---------------- ondas e spawn ----------------
    _novaOnda() {
      this.onda++;
      this.filaOnda = 4 + this.onda * 2;
      this.timerSpawn = 1;
      this.aviso = { texto: `ONDA ${this.onda}`, tempo: 2 };
      TTT.Audio.onda();
    }

    _intervaloSpawn() {
      return Math.max(0.55, 2.4 - this.onda * 0.15) * (0.7 + Math.random() * 0.6);
    }

    _velocidade() {
      return this.dif.velocidade * (1 + this.dif.aceleracao * (this.onda - 1));
    }

    _sortearPalavra() {
      const r = Math.random();
      const pLonga = Math.min(0.35, Math.max(0, (this.onda - 3) * 0.07));
      const pMedia = Math.min(0.55, 0.15 + this.onda * 0.08);
      const lista = r < pLonga ? TTT.PALAVRAS.longas
        : r < pLonga + pMedia ? TTT.PALAVRAS.medias
        : TTT.PALAVRAS.curtas;

      // evita duas palavras na tela começando com a mesma letra (como no ZType)
      const iniciais = new Set(
        this.alvos.filter((a) => a.vivo && !a.morrendo).map((a) => TTT.Texto.normalizar(a.texto[0]))
      );
      let palavra = TTT.Texto.sortear(lista);
      for (let i = 0; i < 12 && iniciais.has(TTT.Texto.normalizar(palavra[0])); i++) {
        palavra = TTT.Texto.sortear(lista);
      }
      return palavra;
    }

    _criarPalavra() {
      const texto = this._sortearPalavra();
      this.ctx.font = `${this.tamPalavra}px ${FONTE}`;
      const meia = this.ctx.measureText(texto).width / 2;
      // sorteia algumas posições e fica com a mais longe das palavras recém-nascidas
      const vizinhas = this.alvos.filter((a) => a.y < 90);
      let x = 0;
      let melhorDist = -1;
      for (let i = 0; i < 8; i++) {
        const cand = 40 + meia + Math.random() * (LARGURA - 80 - meia * 2);
        const dist = Math.min(Infinity, ...vizinhas.map((a) => Math.abs(a.x - cand)));
        if (dist > melhorDist) { x = cand; melhorDist = dist; }
      }
      const atirador = this.dif.atiradores && this.onda >= 2
        && Math.random() < Math.min(0.45, 0.12 + this.onda * 0.04);
      this.alvos.push(new TTT.Alvo({
        texto,
        x,
        y: -16,
        vel: this._velocidade() * (0.85 + Math.random() * 0.3),
        atirador,
      }));
    }

    _dispararProjetil(origem) {
      const tamanho = this.onda >= 5 && Math.random() < 0.4 ? 2 : 1;
      let texto = '';
      for (let i = 0; i < tamanho; i++) texto += TTT.Texto.sortear(TTT.LETRAS_PROJETIL);
      this.alvos.push(new TTT.Alvo({
        texto,
        x: origem.x,
        y: origem.y + 16,
        vel: 70 + this.onda * 6,
        tipo: 'projetil',
      }));
      TTT.Audio.disparo();
    }

    // ---------------- dano / derrota ----------------
    _atingiuJogador(alvo) {
      alvo.vivo = false;
      if (this.alvo === alvo) this.alvo = null;
      this.stats.combo = 0;
      this._explodir(alvo.x, alvo.y, CORES.vermelho, 14);

      if (alvo.tipo === 'projetil' && this.flags.escudo) {
        TTT.Audio.escudo();
        return;
      }
      this.stats.perdidas++;
      this.tremor = 0.3;
      TTT.Audio.dano();
      if (!this.modo.temVida) return;

      this.vida -= alvo.tipo === 'projetil' ? this.dif.danoProjetil : this.dif.danoPalavra;
      this._verificarDerrota();
    }

    _verificarDerrota() {
      if (this.vida > 0 || this.estado !== 'jogando') return;
      this.vida = 0;
      this.estado = 'derrota';
      this.timerDerrota = 1.8;
      this.aviso = { texto: 'FIM DE JOGO', tempo: 99 };
      this._explodir(JOGADOR.x, JOGADOR.y, CORES.marrom, 40);
      TTT.Audio.derrota();
    }

    _explodir(x, y, cor, qtd) {
      for (let i = 0; i < qtd; i++) this.particulas.push(new TTT.Particula(x, y, cor));
    }

    // ---------------- loop ----------------
    _quadro(t) {
      const dt = Math.min(0.05, (t - this.ultimoT) / 1000);
      this.ultimoT = t;
      this._atualizar(dt);
      this._desenhar();
      if (this.estado !== 'parado') this.eventos.aoAtualizarHud(this.hud());
      if (this.estado !== 'fim') this.raf = requestAnimationFrame(this._quadro);
    }

    _atualizar(dt) {
      if (this.estado === 'pausado' || this.estado === 'fim') return;

      for (const e of this.estrelas) {
        e.y += e.v * dt;
        if (e.y > ALTURA) { e.y = 0; e.x = Math.random() * LARGURA; }
      }
      for (const p of this.particulas) p.atualizar(dt);
      this.particulas = this.particulas.filter((p) => p.vida > 0);
      this.tremor = Math.max(0, this.tremor - dt);
      this.flashErro = Math.max(0, this.flashErro - dt);
      if (this.aviso && (this.aviso.tempo -= dt) <= 0) this.aviso = null;
      if (this.erroPapel && (this.erroPapel.tempo -= dt) <= 0) this.erroPapel = null;

      if (this.estado === 'contagem') {
        this.contagem -= dt;
        if (this.contagem <= 0) {
          this.estado = 'jogando';
          this._novaOnda();
        }
        return;
      }

      if (this.estado === 'derrota') {
        this.timerDerrota -= dt;
        if (this.timerDerrota <= 0) this.encerrar('derrota');
        return;
      }

      // ---- jogando ----
      this.stats.tempo += dt;

      if (this.filaOnda > 0) {
        this.timerSpawn -= dt;
        if (this.timerSpawn <= 0) {
          this._criarPalavra();
          this.filaOnda--;
          this.timerSpawn = this._intervaloSpawn();
        }
      } else if (this.alvos.length === 0) {
        this._novaOnda();
      }

      for (const a of this.alvos) {
        if (!a.vivo) continue;
        a.atualizar(dt, JOGADOR.x, JOGADOR.y);
        if (a.morrendo) continue;

        if (a.atirador) {
          a.tempoTiro -= dt;
          if (a.tempoTiro <= 0 && a.y > 30 && a.y < JOGADOR.y - 160) {
            this._dispararProjetil(a);
            a.tempoTiro = 2.5 + Math.random() * 2.5;
          }
        }
        if (Math.hypot(a.x - JOGADOR.x, a.y - JOGADOR.y) < RAIO_COLISAO) this._atingiuJogador(a);
        if (this.estado !== 'jogando') return;
      }

      for (const tiro of this.tiros) {
        if (!tiro.atualizar(dt)) continue;
        if (tiro.final) {
          tiro.alvo.vivo = false;
          this._explodir(tiro.alvo.x, tiro.alvo.y, tiro.alvo.cor, 18);
          TTT.Audio.explosao();
        } else {
          this._explodir(tiro.x, tiro.y, CORES.amarelo, 2);
        }
      }
      this.tiros = this.tiros.filter((tiro) => tiro.vivo);
      this.alvos = this.alvos.filter((a) => a.vivo);

      TTT.Bonus.atualizar(this, dt);
    }

    // ---------------- render ----------------
    _desenhar() {
      const c = this.ctx;
      c.save();
      c.fillStyle = CORES.fundo;
      c.fillRect(0, 0, LARGURA, ALTURA);

      if (this.tremor > 0) c.translate(Math.round(Math.random() * 8 - 4), Math.round(Math.random() * 8 - 4));

      for (const e of this.estrelas) {
        c.fillStyle = e.t > 2 ? CORES.cinzaEscuro : CORES.azul;
        c.fillRect(Math.round(e.x), Math.round(e.y), e.t, e.t);
      }

      c.fillStyle = CORES.azul;
      c.fillRect(0, BASE, LARGURA, ALTURA - BASE);

      // alvo em foco por último, para ficar por cima
      for (const a of this.alvos) if (a !== this.alvo) this._desenharAlvo(c, a);
      if (this.alvo) this._desenharAlvo(c, this.alvo);

      c.font = `12px ${FONTE}`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = CORES.amarelo;
      for (const tiro of this.tiros) c.fillText(tiro.letra, tiro.x, tiro.y);

      if (this.estado !== 'derrota' && this.estado !== 'fim') {
        TTT.Sprites.desenharCena(c, LARGURA / 2, BASE, ESCALA, {
          fase: this.bracoFase,
          texto: this._textoPapel(),
          erro: this.erroPapel ? this.erroPapel.ch : '',
          cursor: this.estado === 'pausado' || Math.floor(performance.now() / 400) % 2 === 0,
          tamanhoFonte: 12,
        });
      }

      if (this.flags.escudo) {
        c.strokeStyle = CORES.azulClaro;
        c.lineWidth = 4;
        c.setLineDash([8, 6]);
        c.beginPath();
        c.arc(JOGADOR.x, JOGADOR.y + 30, 80, Math.PI, Math.PI * 2);
        c.stroke();
        c.setLineDash([]);
      }

      for (const p of this.particulas) {
        c.fillStyle = p.cor;
        c.fillRect(Math.round(p.x / 2) * 2, Math.round(p.y / 2) * 2, p.tam, p.tam);
      }
      c.restore();

      if (this.flashErro > 0) {
        c.strokeStyle = CORES.vermelho;
        c.lineWidth = 8;
        c.strokeRect(4, 4, LARGURA - 8, ALTURA - 8);
      }

      if (this.estado === 'contagem') {
        this._textoCentral(String(Math.ceil(this.contagem)), 72, CORES.amarelo);
      } else if (this.aviso) {
        this._textoCentral(this.aviso.texto, 32, this.estado === 'derrota' ? CORES.vermelho : CORES.amarelo);
      }

      if (this.estado === 'pausado') {
        c.fillStyle = 'rgba(15, 15, 27, 0.5)';
        c.fillRect(0, 0, LARGURA, ALTURA);
      }
    }

    _desenharAlvo(c, a) {
      const emFoco = a === this.alvo;
      const feito = a.texto.slice(0, a.digitado);
      const resto = a.texto.slice(a.digitado);

      c.font = `${this.tamPalavra}px ${FONTE}`;
      c.textAlign = 'left';
      c.textBaseline = 'middle';
      const larg = c.measureText(a.texto).width;
      const x = Math.round(a.x - larg / 2);
      const y = Math.round(a.y);
      const meiaAltura = Math.round(this.tamPalavra / 2) + 5;

      c.fillStyle = 'rgba(15, 15, 27, 0.85)';
      c.fillRect(x - 6, y - meiaAltura, larg + 12, meiaAltura * 2);
      if (emFoco || a.tipo === 'projetil') {
        c.strokeStyle = emFoco ? CORES.amarelo : CORES.vermelho;
        c.lineWidth = 2;
        c.strokeRect(x - 7, y - meiaAltura - 1, larg + 14, meiaAltura * 2 + 2);
      }
      if (a.atirador) {
        c.fillStyle = CORES.vermelho;
        c.fillRect(Math.round(a.x) - 3, y - meiaAltura - 11, 6, 6);
      }

      c.fillStyle = CORES.laranja;
      c.fillText(feito, x, y + 1);
      c.fillStyle = a.cor;
      c.fillText(resto, x + c.measureText(feito).width, y + 1);
    }

    _textoCentral(texto, tamanho, cor) {
      const c = this.ctx;
      c.font = `${tamanho}px ${FONTE}`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = CORES.roxo;
      c.fillText(texto, LARGURA / 2 + 4, ALTURA / 2 - 60 + 4);
      c.fillStyle = cor;
      c.fillText(texto, LARGURA / 2, ALTURA / 2 - 60);
    }

    // ---------------- dados p/ interface ----------------
    hud() {
      const s = this.stats;
      return {
        pontos: s.pontos,
        onda: Math.max(1, this.onda),
        combo: s.combo,
        wpm: this._wpm(),
        vida: Math.max(0, this.vida),
        bonus: TTT.Bonus.descrever(this),
      };
    }

    _wpm() {
      // padrão de mercado: 5 caracteres = 1 palavra; ignora os primeiros segundos
      const minutos = Math.max(this.stats.tempo, 5) / 60;
      return Math.round(this.stats.acertos / 5 / minutos);
    }

    resultado(motivo) {
      const s = this.stats;
      const total = s.acertos + s.erros;
      return {
        motivo,
        modo: this.modo.id,
        modoNome: this.modo.nome,
        dificuldade: this.dif.id,
        dificuldadeNome: this.dif.nome,
        pontos: s.pontos,
        onda: Math.max(1, this.onda),
        palavras: s.palavras,
        acertos: s.acertos,
        erros: s.erros,
        precisao: total ? Math.round((s.acertos / total) * 100) : 100,
        wpm: this._wpm(),
        maiorCombo: s.maiorCombo,
        tempo: s.tempo,
        manuscrito: this.manuscrito.slice(),
      };
    }
  }

  TTT.Jogo = Jogo;
})();
