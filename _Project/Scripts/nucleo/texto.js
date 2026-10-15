// =========================================================
// Utilitários de texto
// =========================================================
TTT.Texto = {
  // "ação" -> "acao" (usado pelo bônus "Sem acentos")
  normalizar(texto) {
    return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  },

  sortear(lista) {
    return lista[Math.floor(Math.random() * lista.length)];
  },

  formatarTempo(segundos) {
    const s = Math.floor(segundos);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  },
};
