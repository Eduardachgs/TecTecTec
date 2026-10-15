// =========================================================
// Animação do menu: o macaco digitando aleatoriamente para
// sempre (o teorema em ação). Letras escapam do papel.
// =========================================================
TTT.MenuMacaco = (() => {
  const canvas = document.getElementById('menu-macaco');
  const ctx = canvas.getContext('2d');
  const ALFABETO = 'abcdefghijklmnopqrstuvwxyz    ';
  const CX = canvas.width / 2;
  const BASE = canvas.height - 4;
  const U = 4;
  const PAPEL_Y = TTT.Sprites.geometria(CX, BASE, U).disparo.y;

  let raf = null;
  let ultimo = 0;
  let acumulado = 0;
  let fase = 0;
  let texto = '';
  let letras = [];

  function quadro(t) {
    const dt = Math.min(0.05, (t - ultimo) / 1000);
    ultimo = t;
    acumulado += dt;

    if (acumulado > 0.16) {
      acumulado = 0;
      fase ^= 1;
      const ch = TTT.Texto.sortear(ALFABETO);
      texto = (texto + ch).slice(-12);
      if (ch !== ' ') {
        letras.push({ ch, x: CX + (Math.random() * 80 - 40), y: PAPEL_Y, vy: -30 - Math.random() * 30, vida: 1.6 });
      }
    }
    for (const l of letras) { l.y += l.vy * dt; l.vida -= dt; }
    letras = letras.filter((l) => l.vida > 0);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `8px ${TTT.FONTE}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const l of letras) {
      ctx.globalAlpha = Math.min(1, l.vida);
      ctx.fillStyle = TTT.CORES.amarelo;
      ctx.fillText(l.ch, Math.round(l.x), Math.round(l.y));
    }
    ctx.globalAlpha = 1;
    const cursor = Math.floor(t / 400) % 2 === 0;
    TTT.Sprites.desenharCena(ctx, CX, BASE, U, { fase, texto, cursor });

    raf = requestAnimationFrame(quadro);
  }

  return {
    iniciar() {
      if (raf) return;
      ultimo = performance.now();
      raf = requestAnimationFrame(quadro);
    },
    parar() {
      cancelAnimationFrame(raf);
      raf = null;
    },
  };
})();
