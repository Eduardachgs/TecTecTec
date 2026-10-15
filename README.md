# TecTecTec — O Macaco Infinito

Jogo de digitação web inspirado no [ZType](https://zty.pe/), com visual 8 bits.
Tema: o **Teorema do Macaco Infinito**. Um macaco digitando ao acaso por tempo infinito
acaba escrevendo qualquer texto. Aqui o macaco é você, e ele não tem tempo infinito.

## Como rodar

Sem build e sem dependências. Duas opções:

1. Abrir o `index.html` direto no navegador; ou
2. Rodar o servidor local (Node) e acessar http://localhost:8080:

```bash
node servidor.js
```

Para usar os atalhos de teste (teclas 1, 2 e 3 ativam os bônus), acesse `?debug`.

## Estrutura

Segue a organização usual de projetos de jogos (estilo Unity/Godot): tudo o que é do jogo
fica em `_Project/`, separado por tipo de asset. Como é um jogo web sem engine, os "assets"
também são código: a pixel art é uma matriz de caracteres e os sons são sintetizados.
A regra é: **pastas de assets descrevem o jogo; `Scripts/` executa.**

```
index.html                  ponto de entrada: todas as telas (<section class="tela">)
servidor.js                 servidor estático de desenvolvimento
_Project/
  Animations/               (vazia) animações em arquivo, se surgirem
  Audio/
    efeitos.js              efeitos sonoros 8 bits (tons e ruído)
  Fonts/
    PressStart2P-Regular.ttf  fonte pixel (local, funciona sem internet)
    OFL.txt                 licença da fonte (SIL Open Font License)
  Materials/                (vazia) shaders/efeitos de tela, se surgirem
  Prefabs/
    entidades.js            objetos do jogo: Alvo (palavra/projétil), Tiro, Particula
  ScriptableObjects/
    config.js               cores, modos, dificuldades e constantes
    palavras.js             banco de palavras por tamanho
    bonus.js                definições dos bônus (nome, duração, efeito)
  Scripts/
    main.js                 liga telas, botões, teclado (físico e virtual) e o jogo
    nucleo/                 serviços genéricos
      telas.js              gerenciador de telas (navegação)
      audio.js              sintetizador WebAudio
      armazenamento.js      recordes e preferências (localStorage)
      texto.js              utilitários (normalizar acentos, formatar tempo)
    jogo/
      jogo.js               loop, ondas, digitação, pontuação e render
      sprites.js            desenha a cena (macaco, máquina, papel)
      bonus.js              ativa, conta o tempo e expira bônus
    ui/
      menu-macaco.js        animação do macaco no menu
  Sprites/
    macaco.js               pixel art do macaco (matriz + paleta)
  UI/
    style.css               visual 8 bits das telas (paleta PICO-8)
Addons/                     (vazia) código de terceiros, se algum for adicionado
Docs/
  fluxo-telas.md            fluxo de navegação, wireframes e regras
  Apresentacoes/            slides das entregas semanais
```

Pastas vazias levam um `.gitkeep` para existirem no Git.

## Arquitetura do código

Padrões clássicos de programação de jogos (*Game Programming Patterns*, Robert Nystrom):

- **Game Loop**: `jogo.js` separa `_atualizar(dt)` (lógica) de `_desenhar()` (render) a cada quadro.
- **Máquina de estados**: telas (menu → modo → jogo → resultados) e partida
  (contagem → jogando ⇄ pausado → derrota → fim).
- **Entidades/Prefabs**: `Alvo`, `Tiro` e `Particula` com `atualizar(dt)` próprio.
- **Orientação a dados**: dificuldades, palavras e bônus são tabelas em `ScriptableObjects/`.
- **Eventos**: o jogo avisa a interface (`aoAtualizarHud`, `aoFim`) sem conhecer o HTML.

## Cronograma

- [x] **Semana 1**: planejamento e design (regras, pontuação, métricas, tecnologias)
- [x] **Semana 2**: protótipo das telas, fluxo de navegação, menu, tela de jogo e resultados
- [ ] Próximas semanas: sorteio de bônus durante a partida (inclusive negativos), textos personalizados, polimento de sons e efeitos
