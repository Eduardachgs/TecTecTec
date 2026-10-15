// =========================================================
// Efeitos sonoros (SFX) do jogo, sintetizados em 8 bits.
// Não há arquivos de áudio: cada efeito descreve seus tons.
// s.tom(frequência, duração, { tipo, vol, fim, atraso })
// s.ruido(duração, volume)
// Uso no código: TTT.Audio.tecla(), TTT.Audio.erro()...
// =========================================================
TTT.Audio.registrar({
  // "tec" da máquina de escrever
  tecla(s)     { s.tom(1300 + Math.random() * 300, 0.025, { vol: 0.03 }); s.ruido(0.02, 0.03); },
  apagar(s)    { s.tom(420, 0.05, { tipo: 'triangle', vol: 0.04, fim: 200 }); },
  erro(s)      { s.tom(110, 0.12, { tipo: 'sawtooth', vol: 0.05 }); },
  explosao(s)  { s.ruido(0.22, 0.07); s.tom(300, 0.18, { vol: 0.04, fim: 60 }); },
  dano(s)      { s.tom(200, 0.3, { vol: 0.06, fim: 40 }); s.ruido(0.15, 0.05); },
  disparo(s)   { s.tom(900, 0.12, { tipo: 'triangle', vol: 0.04, fim: 300 }); },
  escudo(s)    { s.tom(1500, 0.1, { tipo: 'triangle', vol: 0.04, fim: 2400 }); },
  navegar(s)   { s.tom(520, 0.04, { vol: 0.03 }); },
  confirmar(s) { s.tom(660, 0.06, { vol: 0.035 }); s.tom(990, 0.08, { vol: 0.035, atraso: 0.06 }); },
  onda(s)      { [523, 659, 784].forEach((f, i) => s.tom(f, 0.1, { vol: 0.04, atraso: i * 0.09 })); },
  bonus(s)     { [784, 988, 1175, 1568].forEach((f, i) => s.tom(f, 0.07, { vol: 0.035, atraso: i * 0.05 })); },
  derrota(s)   { [392, 330, 262, 196].forEach((f, i) => s.tom(f, 0.18, { vol: 0.05, atraso: i * 0.16 })); },
});
