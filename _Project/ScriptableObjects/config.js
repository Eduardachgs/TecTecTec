// =========================================================
// Configurações globais do TecTecTec
// Todos os módulos penduram no namespace global TTT
// (scripts clássicos => o jogo abre direto do index.html, sem servidor).
// =========================================================
window.TTT = window.TTT || {};

TTT.LARGURA = 960;
TTT.ALTURA = 540;
TTT.FONTE = '"Press Start 2P", ui-monospace, monospace';

// ?debug na URL libera atalhos de teste (teclas 1, 2, 3 ativam bônus)
TTT.DEBUG = new URLSearchParams(location.search).has('debug');

// Paleta PICO-8 — base do visual 8 bits
TTT.CORES = {
  preto: '#000000',
  fundo: '#0f0f1b',
  azul: '#1d2b53',
  roxo: '#7e2553',
  verdeEscuro: '#008751',
  marrom: '#ab5236',
  marromEscuro: '#291814',
  cinzaEscuro: '#5f574f',
  cinza: '#c2c3c7',
  branco: '#fff1e8',
  vermelho: '#ff004d',
  laranja: '#ffa300',
  amarelo: '#ffec27',
  verde: '#00e436',
  azulClaro: '#29adff',
  rosa: '#ff77a8',
  pele: '#ffccaa',
};

TTT.VIDA_MAXIMA = 100;

TTT.MODOS = {
  sobrevivencia: { id: 'sobrevivencia', nome: 'SOBREVIVÊNCIA', temVida: true },
  zen:           { id: 'zen',           nome: 'ZEN',           temVida: false },
};

// velocidade:      px/s das palavras na onda 1
// aceleracao:      +% de velocidade por onda
// ritmo:           multiplica o intervalo entre palavras (menor = mais palavras)
// velProjetil:     multiplica a velocidade das letras disparadas
// ondaAtiradores:  a partir de qual onda surgem palavras atiradoras
// chanceAtirador:  multiplica a chance de uma palavra ser atiradora
TTT.DIFICULDADES = {
  facil: {
    id: 'facil', nome: 'FÁCIL',
    velocidade: 24, aceleracao: 0.05, ritmo: 1.2,
    atiradores: false, ondaAtiradores: 99, chanceAtirador: 0, velProjetil: 0.8,
    danoPalavra: 15, danoProjetil: 8, danoErro: 1,
  },
  normal: {
    id: 'normal', nome: 'NORMAL',
    velocidade: 32, aceleracao: 0.07, ritmo: 1,
    atiradores: true, ondaAtiradores: 2, chanceAtirador: 1, velProjetil: 1,
    danoPalavra: 20, danoProjetil: 10, danoErro: 2,
  },
  dificil: {
    id: 'dificil', nome: 'DIFÍCIL',
    velocidade: 58, aceleracao: 0.12, ritmo: 0.65,
    atiradores: true, ondaAtiradores: 1, chanceAtirador: 1.5, velProjetil: 1.4,
    danoPalavra: 25, danoProjetil: 15, danoErro: 4,
  },
};
