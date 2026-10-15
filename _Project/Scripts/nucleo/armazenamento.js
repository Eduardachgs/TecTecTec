// =========================================================
// Persistência local (recordes, preferências).
// Tudo envolto em try/catch: aba anônima ou storage bloqueado
// não pode quebrar o jogo.
// =========================================================
TTT.Armazenamento = (() => {
  const PREFIXO = 'tectectec:';

  function ler(chave, padrao) {
    try {
      const valor = localStorage.getItem(PREFIXO + chave);
      return valor === null ? padrao : JSON.parse(valor);
    } catch (e) {
      return padrao;
    }
  }

  function gravar(chave, valor) {
    try { localStorage.setItem(PREFIXO + chave, JSON.stringify(valor)); } catch (e) { /* sem storage */ }
  }

  function recorde(modo, dificuldade) {
    return ler(`recorde:${modo}:${dificuldade}`, 0);
  }

  // Retorna { recorde, novo } já considerando a pontuação informada
  function registrarPontuacao(modo, dificuldade, pontos) {
    const anterior = recorde(modo, dificuldade);
    if (pontos > anterior) {
      gravar(`recorde:${modo}:${dificuldade}`, pontos);
      return { recorde: pontos, novo: pontos > 0 };
    }
    return { recorde: anterior, novo: false };
  }

  function maiorRecorde() {
    let maior = 0;
    for (const modo of Object.keys(TTT.MODOS)) {
      for (const dif of Object.keys(TTT.DIFICULDADES)) {
        maior = Math.max(maior, recorde(modo, dif));
      }
    }
    return maior;
  }

  function apagarRecordes() {
    for (const modo of Object.keys(TTT.MODOS)) {
      for (const dif of Object.keys(TTT.DIFICULDADES)) {
        try { localStorage.removeItem(`${PREFIXO}recorde:${modo}:${dif}`); } catch (e) { /* sem storage */ }
      }
    }
  }

  return { ler, gravar, recorde, registrarPontuacao, maiorRecorde, apagarRecordes };
})();
