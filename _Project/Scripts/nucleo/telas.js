// =========================================================
// Gerenciador de telas (máquina de estados da navegação).
// Cada tela é um <section id="tela-XXX">; só uma fica .ativa.
// Módulos registram ganchos aoEntrar(dados) / aoSair().
// =========================================================
TTT.Telas = (() => {
  const ganchos = {};
  let atual = null;

  const elemento = (id) => document.getElementById(`tela-${id}`);

  function focarPrimeiroBotao(id) {
    const botao = elemento(id).querySelector('.btn:not([disabled])');
    if (botao && botao.offsetParent !== null) botao.focus();
  }

  return {
    get atual() { return atual; },

    registrar(id, gancho) { ganchos[id] = gancho; },

    ir(id, dados) {
      if (atual) {
        elemento(atual).classList.remove('ativa');
        ganchos[atual]?.aoSair?.();
      }
      atual = id;
      elemento(id).classList.add('ativa');
      if (document.activeElement) document.activeElement.blur();
      ganchos[id]?.aoEntrar?.(dados);
      if (!ganchos[id]?.semFocoAutomatico) focarPrimeiroBotao(id);
    },

    voltar() {
      const destino = atual && elemento(atual).dataset.voltar;
      if (destino) this.ir(destino);
      return Boolean(destino);
    },

    focarPrimeiroBotao,
  };
})();
