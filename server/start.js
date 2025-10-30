const http = require('http');
const { generateHackrfInfoJson } = require('./talkTo');

const HOST = '127.0.0.1';
const PORT = 3000;

function escapeXml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function toXmlTable(payload) {
    const rows = payload.lines.map((line) => (
        `    <row index="${line.index}">\n` +
        `      <key>${escapeXml(line.key)}</key>\n` +
        `      <value>${escapeXml(line.value)}</value>\n` +
        `    </row>`
    )).join('\n');

    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<hackrfInfo>',
        `  <generatedAt>${escapeXml(payload.generatedAt)}</generatedAt>`,
        `  <command>${escapeXml(payload.command)}</command>`,
        `  <lineCount>${payload.lineCount}</lineCount>`,
        '  <table>',
        rows,
        '  </table>',
        '</hackrfInfo>'
    ].join('\n');
}

const server = http.createServer(async (_req, res) => {
    try {
        const payload = await generateHackrfInfoJson();
        const xml = toXmlTable(payload);
        res.writeHead(200, { 'Content-Type': 'application/xml' });
        res.end(xml);
    } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Failed to retrieve HackRF info: ${err.message}`);
    }
});

server.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}/`);
});