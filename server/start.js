const http = require('http');
const { readFile } = require('fs');
const { join } = require('path');

const HOST = '127.0.0.1';
const PORT = 3000;
const INDEX_HTML = join(__dirname, '..', 'src', 'index.html');

const server = http.createServer((req, res) => {
    readFile(INDEX_HTML, (err, data) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error loading page');
            return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
    });
});

server.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}/`);
});