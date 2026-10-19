// =========================================================
// Sistema de bônus: paga o que a palavra especial (colorida)
// completada sem erros trouxe. As definições ficam em
// _Project/ScriptableObjects/bonus.js
// =========================================================
TTT.Bonus = {
  ativar(jogo, id) {
    const def = TTT.BONUS[id];
    if (!def) return;

    if (def.instantaneo) {
      // bônus imediato (VIDA): aplica e comunica, sem persistir estado
      def.ativar(jogo);
      jogo.avisoBonus = { texto: `${def.nome} +${def.cura}`, tempo: 1.5, cor: TTT.CORES[def.cor] };
    } else {
      // bônus de usos (TAB/ESCUDO): cumulativo, sem timer
      def.ativar(jogo);
      jogo.avisoBonus = { texto: `${def.nome} +${def.usos}`, tempo: 1.5, cor: TTT.CORES[def.cor] };
    }
    TTT.Audio.bonus();
  },

  // chips para o HUD: { id, texto } — um por bônus com usos guardados
  chips(jogo) {
    const chips = [];
    if (jogo.usosTab > 0) {
      const d = TTT.BONUS.autocompletar;
      chips.push({ id: 'autocompletar', texto: `${d.etiqueta} ×${jogo.usosTab}` });
    }
    if (jogo.usosEscudo > 0) {
      const d = TTT.BONUS.escudo;
      chips.push({ id: 'escudo', texto: `${d.etiqueta} ×${jogo.usosEscudo}` });
    }
    return chips;
  },
};