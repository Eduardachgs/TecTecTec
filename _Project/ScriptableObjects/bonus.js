// =========================================================
// Definições dos bônus: nome, etiqueta e o que fazem no jogo.
// A lógica de ativar fica em Scripts/jogo/bonus.js.
// Bônus de usos chegam como palavra especial colorida: completá-la
// sem nenhum erro paga o bônus dela (cumulativo, sem timer).
// =========================================================
TTT.BONUS = {
  autocompletar: {
    nome: 'AUTO-COMPLETAR (TAB)',
    etiqueta: 'TAB',
    cor: 'rosa',
    usos: 3, // TAB termina a palavra em foco (exige 2+ letras digitadas)
    ativar(jogo) { jogo.usosTab += TTT.BONUS.autocompletar.usos; },
    desativar() { /* sem timer: acumula até o jogador usar */ },
  },
  escudo: {
    nome: 'ESCUDO',
    etiqueta: 'ESCUDO',
    cor: 'azulClaro',
    usos: 1, // ESPAÇO libera uma onda que empurra as palavras próximas
    ativar(jogo) { jogo.usosEscudo += TTT.BONUS.escudo.usos; },
    desativar() { /* sem timer: acumula até o jogador usar */ },
  },
  vida: {
    nome: 'VIDA',
    etiqueta: 'VIDA',
    cor: 'verde',
    instantaneo: true, // cura na hora, sem usos nem timer
    cura: TTT.CURA_VIDA,
    ativar(jogo) { jogo.vida = Math.min(TTT.VIDA_MAXIMA, jogo.vida + TTT.BONUS.vida.cura); },
    desativar() { /* não persiste: o efeito é imediato */ },
  },
  // TODO bônus negativos (ex.: neblina, letras embaralhadas, palavras mais rápidas)
};