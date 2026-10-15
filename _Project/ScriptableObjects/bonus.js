// =========================================================
// Definições dos bônus: nome, duração e o que ligam no jogo.
// A lógica de ativar/expirar fica em Scripts/jogo/bonus.js.
// Semana 2: o sorteio dos bônus durante a partida entra nas
// próximas semanas. Para testar: ?debug e teclas 1, 2, 3.
// =========================================================
TTT.BONUS = {
  autocompletar: {
    nome: 'AUTO-COMPLETAR (TAB)',
    duracao: 8,
    ativar(jogo) { jogo.flags.autocompletar = true; },
    desativar(jogo) { jogo.flags.autocompletar = false; },
  },
  escudo: {
    nome: 'ESCUDO',
    duracao: 10,
    ativar(jogo) { jogo.flags.escudo = true; },
    desativar(jogo) { jogo.flags.escudo = false; },
  },
  semAcentos: {
    nome: 'SEM ACENTOS',
    duracao: 12,
    ativar(jogo) { jogo.flags.ignorarAcentos = true; },
    desativar(jogo) { jogo.flags.ignorarAcentos = false; },
  },
  // TODO bônus negativos (ex.: neblina, letras embaralhadas, palavras mais rápidas)
};
