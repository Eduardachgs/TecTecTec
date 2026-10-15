// =========================================================
// Sistema de bônus: ativa, conta o tempo e expira os bônus.
// As definições (nome, duração, efeito) ficam em
// _Project/ScriptableObjects/bonus.js
// =========================================================
TTT.Bonus = {
  ativar(jogo, id) {
    const def = TTT.BONUS[id];
    if (!def) return;
    const existente = jogo.bonusAtivos.find((b) => b.id === id);
    if (existente) {
      existente.restante = def.duracao;
    } else {
      jogo.bonusAtivos.push({ id, restante: def.duracao });
      def.ativar(jogo);
    }
    jogo.aviso = { texto: def.nome, tempo: 1.5 };
    TTT.Audio.bonus();
  },

  atualizar(jogo, dt) {
    for (const b of jogo.bonusAtivos) {
      b.restante -= dt;
      if (b.restante <= 0) TTT.BONUS[b.id].desativar(jogo);
    }
    jogo.bonusAtivos = jogo.bonusAtivos.filter((b) => b.restante > 0);
  },

  descrever(jogo) {
    return jogo.bonusAtivos
      .map((b) => `${TTT.BONUS[b.id].nome} ${Math.ceil(b.restante)}s`)
      .join('  ');
  },
};
