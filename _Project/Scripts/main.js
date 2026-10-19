// =========================================================
// main.js — liga telas, botões, teclado e o jogo.
// =========================================================
(() => {
  const $ = (id) => document.getElementById(id);

  let ultimaPartida = { modo: 'sobrevivencia', dif: 'normal' };
  let bloqueioTeclado = 0; // evita "Enter/Espaço" acidental ao cair nos resultados

  // ---------------- layout do teclado (ABNT2 / US) ----------------
  // Preferência salva; sem ela, pt-* começa em ABNT2 e o resto em US.
  const tecladoSalvo = TTT.Armazenamento.ler('teclado', null);
  let teclado = TTT.TECLADOS[tecladoSalvo]
    ? tecladoSalvo
    : (navigator.language || '').toLowerCase().startsWith('pt') ? 'abnt2' : 'us';

  // No Chrome dá para perguntar ao navegador qual tecla fica à direita do L:
  // "ç" = ABNT2. Só vale enquanto o jogador não escolheu manualmente.
  if (!tecladoSalvo && navigator.keyboard?.getLayoutMap) {
    navigator.keyboard.getLayoutMap()
      .then((mapa) => {
        if (TTT.Armazenamento.ler('teclado', null)) return;
        teclado = mapa.get('Semicolon') === 'ç' ? 'abnt2' : 'us';
        atualizarBotoesTeclado();
      })
      .catch(() => { /* bloqueado (iframe, permissão): fica a suposição pelo idioma */ });
  }

  function atualizarBotoesTeclado() {
    const t = TTT.TECLADOS[teclado];
    for (const btn of document.querySelectorAll('.js-teclado')) {
      btn.innerHTML = `TECLADO: ${t.nome}<small>${t.descricao}</small>`;
    }
  }

  const jogo = new TTT.Jogo($('jogo'), {
    aoAtualizarHud: atualizarHud,
    aoFim: (resultado) => TTT.Telas.ir('resultados', resultado),
  });

  if (TTT.DEBUG) TTT.jogoAtual = jogo; // acesso pelo console para testes

  // ---------------- HUD ----------------
  const cacheHud = {};
  function definir(id, valor) {
    if (cacheHud[id] === valor) return;
    cacheHud[id] = valor;
    $(id).textContent = valor;
  }

  function atualizarHud(h) {
    definir('hud-pontos', h.pontos);
    definir('hud-onda', h.onda);
    definir('hud-combo', h.combo);
    definir('hud-wpm', h.wpm);

    // chips de bônus (usos ativos), Rechaveado só quando muda
    const chaveChips = JSON.stringify(h.bonusChips);
    if (cacheHud.chips !== chaveChips) {
      cacheHud.chips = chaveChips;
      $('hud-bonus').innerHTML = h.bonusChips
        .map((c) => `<span class="bonus-chip ${c.id}">${c.texto}</span>`)
        .join('');
    }

    const pct = (h.vida / TTT.VIDA_MAXIMA) * 100;
    if (cacheHud.vida !== pct) {
      cacheHud.vida = pct;
      $('hud-vida').style.width = `${pct}%`;
      $('hud-vida').classList.toggle('baixa', pct <= 30);
    }
  }

  // ---------------- teclado virtual (celular / tablet) ----------------
  // Teclados virtuais quase não geram keydown útil (Android manda "Unidentified")
  // e ainda usam composição (IME). Por isso lemos o que chega no <input> invisível.
  const entrada = $('entrada-mobile');
  const SENTINELA = '  '; // sempre há algo para o Backspace apagar (senão ele não gera evento)
  const TOQUE = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  let composto = 0;       // quantos caracteres da composição atual já foram enviados ao jogo

  $('btn-teclado').hidden = !TOQUE;

  function restaurarEntrada() {
    entrada.value = SENTINELA;
    try { entrada.setSelectionRange(SENTINELA.length, SENTINELA.length); } catch (e) { /* ok */ }
  }

  // precisa rodar dentro de um toque/clique, senão o navegador não abre o teclado
  function abrirTeclado() {
    if (!TOQUE) return;
    composto = 0;
    restaurarEntrada();
    entrada.focus();
  }

  function enviarTexto(texto) {
    for (const ch of texto) if (ch !== ' ') jogo.teclar(ch);
  }

  entrada.addEventListener('compositionstart', () => { composto = 0; });
  entrada.addEventListener('compositionend', () => { composto = 0; restaurarEntrada(); });

  entrada.addEventListener('input', (e) => {
    const ativo = TTT.Telas.atual === 'jogo' && !jogo.pausado;
    const tipo = e.inputType || '';

    // Durante a composição o IME reenvia a palavra inteira ("m", "ma", "mac"...):
    // mandamos só o que é novo, e o que encolheu vira Backspace.
    if (e.isComposing || tipo === 'insertCompositionText') {
      const atual = e.data || '';
      if (ativo) {
        if (atual.length > composto) enviarTexto(atual.slice(composto));
        else for (let i = atual.length; i < composto; i++) jogo.apagar();
      }
      composto = atual.length;
      return;
    }

    if (ativo) {
      if (tipo.startsWith('delete')) jogo.apagar(tipo === 'deleteWordBackward');
      else if (e.data) enviarTexto(e.data);
      else if (entrada.value.length < SENTINELA.length) jogo.apagar(); // navegador sem inputType
    }
    restaurarEntrada();
  });

  // tocar na área do jogo (re)abre o teclado
  $('palco').addEventListener('click', () => {
    if (TTT.Telas.atual === 'jogo' && !jogo.pausado) abrirTeclado();
  });

  // ---------------- pausa ----------------
  function pausar() {
    if (!jogo.pausar()) return;
    $('overlay-pausa').hidden = false;
    $('overlay-pausa').querySelector('.btn').focus(); // tira o foco do input: fecha o teclado virtual
  }

  function despausar() {
    $('overlay-pausa').hidden = true;
    document.activeElement?.blur();
    jogo.continuar();
    abrirTeclado();
  }

  // ---------------- ações dos botões ----------------
  const acoes = {
    jogar(btn) {
      ultimaPartida = { modo: btn.dataset.modo, dif: btn.dataset.dif || 'normal' };
      TTT.Telas.ir('jogo', ultimaPartida);
    },
    'jogar-novamente'() { TTT.Telas.ir('jogo', ultimaPartida); },
    continuar() { despausar(); },
    pausar() { pausar(); },
    teclado() { abrirTeclado(); },
    encerrar() {
      $('overlay-pausa').hidden = true;
      jogo.encerrar('desistiu');
    },
    'sair-menu'() {
      $('overlay-pausa').hidden = true;
      TTT.Telas.ir('menu');
    },
    'alternar-som'() {
      TTT.Audio.ligado = !TTT.Audio.ligado;
      atualizarOpcoes();
    },
    'alternar-teclado'() {
      const ids = Object.keys(TTT.TECLADOS);
      teclado = ids[(ids.indexOf(teclado) + 1) % ids.length];
      TTT.Armazenamento.gravar('teclado', teclado);
      atualizarBotoesTeclado();
    },
    'apagar-recordes'(btn) {
      TTT.Armazenamento.apagarRecordes();
      btn.textContent = 'RECORDES APAGADOS';
    },
  };

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn || btn.disabled) return;
    TTT.Audio.garantir();
    if (btn.dataset.ir) {
      TTT.Audio.confirmar();
      TTT.Telas.ir(btn.dataset.ir);
    } else if (acoes[btn.dataset.acao]) {
      TTT.Audio.confirmar();
      acoes[btn.dataset.acao](btn);
    }
  });

  // ---------------- telas ----------------
  TTT.Telas.registrar('menu', {
    aoEntrar() {
      $('menu-recorde').textContent = TTT.Armazenamento.maiorRecorde();
      TTT.MenuMacaco.iniciar();
    },
    aoSair() { TTT.MenuMacaco.parar(); },
  });

  TTT.Telas.registrar('opcoes', {
    aoEntrar() {
      atualizarOpcoes();
      document.querySelector('[data-acao="apagar-recordes"]').textContent = 'APAGAR RECORDES';
    },
  });

  TTT.Telas.registrar('jogo', {
    semFocoAutomatico: true,
    aoEntrar(partida) {
      const modo = TTT.MODOS[partida.modo];
      const dif = TTT.DIFICULDADES[partida.dif];
      $('hud-modo').textContent = modo.temVida ? `${modo.nome} · ${dif.nome}` : modo.nome;
      $('hud-vida-box').hidden = !modo.temVida;
      $('overlay-pausa').hidden = true;
      jogo.iniciar(partida.modo, partida.dif, teclado);
      abrirTeclado(); // ainda dentro do clique em "JOGAR": o celular permite abrir o teclado
    },
    aoSair() { jogo.parar(); },
  });

  TTT.Telas.registrar('resultados', {
    semFocoAutomatico: true,
    aoEntrar: mostrarResultados,
  });

  function atualizarOpcoes() {
    $('btn-som').textContent = `SOM: ${TTT.Audio.ligado ? 'LIGADO' : 'DESLIGADO'}`;
  }

  function mostrarResultados(r) {
    const { recorde, novo } = TTT.Armazenamento.registrarPontuacao(r.modo, r.dificuldade, r.pontos);

    $('res-titulo').textContent = r.motivo === 'derrota' ? 'FIM DE JOGO' : 'PARTIDA ENCERRADA';
    const partes = r.modo === 'zen' ? [r.modoNome] : [r.modoNome, r.dificuldadeNome];
    $('res-sub').textContent = [...partes, `TECLADO ${r.tecladoNome}`].join(' · ');
    $('res-recorde').hidden = !novo;
    $('res-pontos').textContent = r.pontos;
    $('res-onda').textContent = r.onda;
    $('res-palavras').textContent = r.palavras;
    $('res-wpm').textContent = r.wpm;
    $('res-precisao').textContent = `${r.precisao}%`;
    $('res-combo').textContent = r.maiorCombo;
    $('res-tempo').textContent = TTT.Texto.formatarTempo(r.tempo);
    $('res-melhor').textContent = recorde;

    // O tema: quão improvável seria um macaco digitar isso por acaso?
    const texto = r.manuscrito.join(' ');
    if (texto) {
      $('res-texto').textContent = texto;
      const expoente = Math.floor(texto.length * Math.log10(27)); // 26 letras + espaço
      $('res-chance').textContent =
        `CHANCE DE UM MACACO DIGITAR ISSO AO ACASO: 1 EM 10^${expoente}`;
    } else {
      $('res-texto').textContent = '(PÁGINA EM BRANCO... O MACACO AINDA ESTÁ PENSANDO.)';
      $('res-chance').textContent = '';
    }

    bloqueioTeclado = performance.now() + 800;
    setTimeout(() => {
      if (TTT.Telas.atual === 'resultados') TTT.Telas.focarPrimeiroBotao('resultados');
    }, 800);
  }

  // ---------------- teclado ----------------
  document.addEventListener('keydown', (e) => {
    TTT.Audio.garantir();

    if (performance.now() < bloqueioTeclado) {
      e.preventDefault();
      return;
    }

    if (TTT.Telas.atual === 'jogo' && !jogo.pausado) {
      if (e.key === 'Escape') { e.preventDefault(); pausar(); return; }
      if (e.key === 'Tab') { e.preventDefault(); jogo.autocompletar(); return; }
      if (e.key === 'Shift') { jogo.desfocar(); return; } // troca de alvo mantendo o progresso
      if (e.key === ' ') { e.preventDefault(); jogo.usarEscudo(); return; } // libera a onda do escudo
      // com o campo do teclado virtual focado, letras e Backspace chegam pelo evento "input"
      if (e.target === entrada) return;
      if (e.key === 'Backspace') { e.preventDefault(); jogo.apagar(e.ctrlKey || e.altKey || e.metaKey); return; }
      if (TTT.DEBUG && ['1', '2', '3'].includes(e.key)) {
        TTT.Bonus.ativar(jogo, ['autocompletar', 'escudo', 'vida'][Number(e.key) - 1]);
        return;
      }
      if (e.ctrlKey || e.metaKey) return;
      // e.key === 'Dead' (acento morto) é ignorado; a letra acentuada vem no próximo evento
      if (e.key.length === 1) {
        e.preventDefault();
        jogo.teclar(e.key);
      }
      return;
    }

    navegarMenu(e);
  });

  function navegarMenu(e) {
    const escopo = TTT.Telas.atual === 'jogo'
      ? $('overlay-pausa')
      : document.querySelector('.tela.ativa');
    if (!escopo) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      if (TTT.Telas.atual === 'jogo') despausar();
      else if (TTT.Telas.voltar()) TTT.Audio.navegar();
      return;
    }

    const delta = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!delta) return;
    e.preventDefault();
    const botoes = [...escopo.querySelectorAll('.btn:not([disabled])')].filter((b) => b.offsetParent !== null);
    if (!botoes.length) return;
    const i = botoes.indexOf(document.activeElement);
    const proximo = i === -1 ? 0 : (i + delta + botoes.length) % botoes.length;
    botoes[proximo].focus();
    TTT.Audio.navegar();
  }

  // pausa automática ao trocar de aba/janela
  window.addEventListener('blur', () => {
    if (TTT.Telas.atual === 'jogo') pausar();
  });

  // ---------------- início ----------------
  atualizarBotoesTeclado();
  TTT.Telas.ir('menu');
})();
