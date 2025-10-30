const { spawn } = require('child_process');
const { promises: fs } = require('fs');
const { join } = require('path');

const DATA_DIR = join(__dirname, '..', 'data');
const OUTPUT_FILE = join(DATA_DIR, 'hackrf-info.json');

function runHackrfInfo() {
    return new Promise((resolve, reject) => {
        const proc = spawn('hackrf_info');
        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (chunk) => stdout += chunk.toString());
        proc.stderr.on('data', (chunk) => stderr += chunk.toString());
        proc.on('error', reject);
        proc.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error(stderr || `hackrf_info exited with code ${code}`));
            }
            resolve(stdout);
        });
    });
}

function parseOutput(raw) {
    const lines = raw
        .split(/\r?\n/)
        .map((line) => line.trimEnd())
        .filter((line) => line.trim().length > 0)
        .map((line, index) => {
            const colon = line.indexOf(':');
            if (colon !== -1) {
                return {
                    index: index + 1,
                    key: line.slice(0, colon).trim(),
                    value: line.slice(colon + 1).trim()
                };
            }
            return {
                index: index + 1,
                key: `message_${index + 1}`,
                value: line.trim()
            };
        });

    return {
        command: 'hackrf_info',
        generatedAt: new Date().toISOString(),
        lineCount: lines.length,
        lines
    };
}

async function generateHackrfInfoJson() {
    const raw = await runHackrfInfo();
    const parsed = parseOutput(raw);
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(parsed, null, 2), 'utf8');
    return parsed;
}

module.exports = { generateHackrfInfoJson, OUTPUT_FILE };

if (require.main === module) {
    generateHackrfInfoJson()
        .then((data) => {
            console.log(`Saved HackRF info to ${OUTPUT_FILE}`);
            console.log(JSON.stringify(data, null, 2));
        })
        .catch((err) => {
            console.error('Failed to retrieve HackRF info:', err.message);
            process.exitCode = 1;
        });
}