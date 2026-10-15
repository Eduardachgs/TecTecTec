// =========================================================
// Sprite: o macaco (pixel art em matriz de caracteres).
// Cada caractere é um pixel; a paleta diz a cor de cada letra
// e "." é transparente. Desenhado por Scripts/jogo/sprites.js.
// =========================================================
TTT.SPRITES = TTT.SPRITES || {};

TTT.SPRITES.macaco = {
  matriz: [
    '....BBBBBB....',
    '...BbbbbbbB...',
    '..BbbbbbbbbB..',
    '.BBbffbbffbBB.',
    'BffbffffffbffB',
    'BffbfkffkfbffB',
    '.BBbffffffbBB.',
    '...bffkkffb...',
    '...bffmmffb...',
    '....bffffb....',
    '..BbbbbbbbbB..',
    '.BbbbffffbbbB.',
    '.BbbffffffbbB.',
    'BbbbffffffbbbB',
  ],
  paleta: {
    B: TTT.CORES.marromEscuro, // contorno
    b: TTT.CORES.marrom,       // pelo
    f: TTT.CORES.pele,         // rosto e barriga
    k: TTT.CORES.preto,        // olhos e narinas
    m: TTT.CORES.roxo,         // boca
  },
};
