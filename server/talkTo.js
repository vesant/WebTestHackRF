const { spawn } = require('child_process');

function runHackrfInfo() {
    const proc = spawn('hackrf_info');

    proc.stdout.on('data', (chunk) => process.stdout.write(chunk));
    proc.stderr.on('data', (chunk) => process.stderr.write(chunk));
    proc.on('close', (code) => console.log(`hackrf_info exited with ${code}`));
}

runHackrfInfo();