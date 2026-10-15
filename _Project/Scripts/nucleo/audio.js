// =========================================================
// Sintetizador 8 bits com WebAudio (tons e ruído, sem arquivos).
// O AudioContext só pode nascer após um gesto do usuário,
// por isso main.js chama garantir() em cliques/teclas.
// =========================================================
TTT.Audio = (() => {
  let ctx = null;
  let ligado = TTT.Armazenamento.ler('som', true);

  function garantir() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  function tom(freq, dur, { tipo = 'square', vol = 0.04, fim = null, atraso = 0 } = {}) {
    if (!ligado || !ctx) return;
    const t = ctx.currentTime + atraso;
    const osc = ctx.createOscillator();
    const ganho = ctx.createGain();
    osc.type = tipo;
    osc.frequency.setValueAtTime(freq, t);
    if (fim) osc.frequency.exponentialRampToValueAtTime(fim, t + dur);
    ganho.gain.setValueAtTime(vol, t);
    ganho.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(ganho).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function ruido(dur, vol = 0.06) {
    if (!ligado || !ctx) return;
    const n = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, n, ctx.sampleRate);
    const dados = buffer.getChannelData(0);
    for (let i = 0; i < n; i++) dados[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const fonte = ctx.createBufferSource();
    const ganho = ctx.createGain();
    fonte.buffer = buffer;
    ganho.gain.value = vol;
    fonte.connect(ganho).connect(ctx.destination);
    fonte.start();
  }

  const sintetizador = { tom, ruido };

  const api = {
    garantir,
    get ligado() { return ligado; },
    set ligado(valor) { ligado = valor; TTT.Armazenamento.gravar('som', valor); },

    // Cada efeito registrado vira um método: registrar({ tecla(s) {...} }) -> TTT.Audio.tecla()
    // Os efeitos do jogo ficam em _Project/Audio/efeitos.js
    registrar(efeitos) {
      for (const [nome, tocar] of Object.entries(efeitos)) api[nome] = () => tocar(sintetizador);
    },
  };
  return api;
})();
