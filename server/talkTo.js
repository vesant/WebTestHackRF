const fs = require('fs');
const fsp = fs.promises;
const { spawn } = require('child_process');
const { join } = require('path');
const os = require('os');

let tempFilePath = null;
let cleanupRegistered = false;

function getTempFilePath() {
    if (!tempFilePath) {
        tempFilePath = join(os.tmpdir(), `hackrf-info-${process.pid}-${Date.now()}.json`);
    }
    return tempFilePath;
}

function registerCleanup() {
    if (cleanupRegistered) return;
    cleanupRegistered = true;

    const cleanup = () => {
        if (!tempFilePath) return;
        try {
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
        } catch (err) {
            if (err.code !== 'ENOENT') {
                console.error(`Failed to remove temp HackRF file: ${err.message}`);
            }
        }
        tempFilePath = null;
    };

    process.once('exit', cleanup);
    ['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach((signal) => {
        process.once(signal, () => {
            cleanup();
            process.exit(0);
        });
    });
}

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
    const filePath = getTempFilePath();
    await fsp.writeFile(filePath, JSON.stringify(parsed, null, 2), 'utf8');
    registerCleanup();
    return { ...parsed, tempFilePath: filePath };
}

module.exports = { generateHackrfInfoJson };

if (require.main === module) {
    generateHackrfInfoJson()
        .then((data) => {
            console.log(`Saved HackRF info to ${data.tempFilePath}`);
            console.log(JSON.stringify(data, null, 2));
        })
        .catch((err) => {
            console.error('Failed to retrieve HackRF info:', err.message);
            process.exitCode = 1;
        });
}