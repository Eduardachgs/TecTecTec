// =========================================================
// Renderização da cena: o macaco na máquina de escrever.
// Os sprites (matrizes de pixel art) ficam em _Project/Sprites;
// aqui cada caractere vira um "pixel" de tamanho u no canvas.
// =========================================================
TTT.Sprites = (() => {
  const C = TTT.CORES;
  const MACACO = TTT.SPRITES.macaco;

  function desenharMatriz(ctx, matriz, x, y, u, paleta) {
    for (let l = 0; l < matriz.length; l++) {
      const linha = matriz[l];
      for (let c = 0; c < linha.length; c++) {
        const cor = paleta[linha[c]];
        if (!cor) continue;
        ctx.fillStyle = cor;
        ctx.fillRect(x + c * u, y + l * u, u, u);
      }
    }
  }

  function braco(ctx, x, y, u, levantado) {
    const comp = levantado ? 3 * u : 5 * u;
    ctx.fillStyle = C.marrom;
    ctx.fillRect(x, y, 2 * u, comp);
    ctx.fillStyle = C.pele;
    ctx.fillRect(x, y + comp, 2 * u, u);
  }

  // Layout da cena, de cima para baixo (em unidades u):
  //   macaco (14u) | rolo (2u) | corpo da máquina (10u) | papel saindo pela frente (5u)
  const ALTURA_PAPEL = 5;
  const ALTURA_MAQUINA = 10;
  const LARGURA_PAPEL = 28;

  function topoMaquina(base, u) {
    return base - (ALTURA_PAPEL + ALTURA_MAQUINA) * u;
  }

  // Pontos de referência da cena (usados pelo jogo para mirar/colidir)
  function geometria(cx, base, u) {
    const topo = topoMaquina(base, u);
    return {
      centro: { x: cx, y: topo - 10 * u },             // rosto do macaco
      disparo: { x: cx, y: topo },                      // de onde saem as letras
      papel: { x: cx, y: base - (ALTURA_PAPEL / 2) * u },
    };
  }

  // Papel embaixo do teclado com o texto datilografado: o que já foi digitado,
  // uma letra errada (em vermelho, temporária) e o cursor piscando
  function desenharPapel(ctx, cx, base, u, opc) {
    const esquerda = cx - (LARGURA_PAPEL / 2) * u;
    // começa 1u mais alto: essa faixa fica escondida sob a máquina (papel "saindo" dela)
    ctx.fillStyle = C.branco;
    ctx.fillRect(esquerda, base - (ALTURA_PAPEL + 1) * u, LARGURA_PAPEL * u, (ALTURA_PAPEL + 1) * u);

    const tamanho = opc.tamanhoFonte || Math.max(6, Math.round(u * 1.6));
    let x = esquerda + u;
    const y = base - (ALTURA_PAPEL / 2) * u;
    ctx.font = `${tamanho}px ${TTT.FONTE}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // se não couber, mostra só o final (como a folha correndo na máquina)
    const larguraLetra = ctx.measureText('m').width;
    const cabe = Math.floor((LARGURA_PAPEL * u - 2 * u) / larguraLetra) - 1 - (opc.erro ? 1 : 0);
    const texto = (opc.texto || '').slice(-cabe);

    ctx.fillStyle = C.preto;
    ctx.fillText(texto, x, y);
    x += ctx.measureText(texto).width;

    if (opc.erro) {
      ctx.fillStyle = C.vermelho;
      ctx.fillText(opc.erro, x, y);
      x += ctx.measureText(opc.erro).width;
    }
    if (opc.cursor) {
      ctx.fillStyle = C.preto;
      ctx.fillRect(Math.round(x + 1), Math.round(y + tamanho / 2), tamanho - 2, 2);
    }
  }

  // cx = centro horizontal, base = chão, u = tamanho do pixel
  // opc.fase alterna os braços (animação de digitar)
  // opc.texto / opc.erro / opc.cursor / opc.tamanhoFonte -> papel
  function desenharCena(ctx, cx, base, u, opc = {}) {
    const fase = opc.fase || 0;
    const topo = topoMaquina(base, u);
    const x0 = cx - 15 * u;

    desenharMatriz(ctx, MACACO.matriz, cx - 7 * u, topo - 16 * u, u, MACACO.paleta);
    desenharPapel(ctx, cx, base, u, opc);

    // rolo + botões laterais
    ctx.fillStyle = C.preto;
    ctx.fillRect(x0 - 2 * u, topo - 2 * u, 34 * u, 2 * u);
    ctx.fillStyle = C.cinza;
    ctx.fillRect(x0 - 4 * u, topo - 2 * u, 2 * u, 2 * u);
    ctx.fillRect(x0 + 32 * u, topo - 2 * u, 2 * u, 2 * u);

    // corpo da máquina
    ctx.fillStyle = C.cinzaEscuro;
    ctx.fillRect(x0, topo, 30 * u, 10 * u);
    ctx.fillStyle = C.cinza;
    ctx.fillRect(x0, topo, 30 * u, u);
    ctx.fillStyle = C.preto;
    ctx.fillRect(x0, topo + 9 * u, 30 * u, u);

    // teclas (3 fileiras)
    ctx.fillStyle = C.branco;
    for (let r = 0; r < 3; r++) {
      for (let k = 3 + r; k < 27 - r; k += 2) {
        ctx.fillRect(x0 + k * u, topo + (3 + r * 2) * u, u, u);
      }
    }

    braco(ctx, cx - 6 * u, topo - 3 * u, u, fase === 0);
    braco(ctx, cx + 4 * u, topo - 3 * u, u, fase === 1);
  }

  return { desenharCena, desenharMatriz, geometria };
})();
