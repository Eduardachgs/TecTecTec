// Servidor estático mínimo para desenvolvimento (sem dependências).
// Uso: node servidor.js  ->  http://localhost:8080
// (O jogo também abre direto pelo index.html; o servidor é só conveniência.)
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORTA = Number(process.env.PORT) || 8080;
const RAIZ = __dirname;
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
};

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const arquivo = path.join(RAIZ, url === '/' ? 'index.html' : url);
  if (!arquivo.startsWith(RAIZ)) {
    res.writeHead(403).end();
    return;
  }
  fs.readFile(arquivo, (erro, dados) => {
    if (erro) {
      res.writeHead(404).end('404');
      return;
    }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(dados);
  });
}).listen(PORTA, () => console.log(`TecTecTec rodando em http://localhost:${PORTA}`));
