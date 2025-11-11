const fs = require('fs');
const path = require('path');
const os = require('os');

// History file stored in the phoenix-shell directory
const HISTORY_FILE = path.join(__dirname, '..', '.phoenix_history');

// Ensure history file exists
try {
    if (!fs.existsSync(HISTORY_FILE)) {
        fs.writeFileSync(HISTORY_FILE, '', { encoding: 'utf8' });
    }
} catch (err) {
    // If we can't create the file, fall back silently; show will handle read errors
}

function showHistory() {
    try {
        const data = fs.readFileSync(HISTORY_FILE, { encoding: 'utf8' });
        const lines = data.split(/\r?\n/).filter(Boolean);
        if (lines.length === 0) {
            console.log('No history available.');
            return;
        }
        lines.forEach((line, idx) => {
            console.log(`${idx + 1}  ${line}`);
        });
    } catch (err) {
        console.error('Could not read history:', err.message || err);
    }
}

function addHistory(command) {
    if (!command || typeof command !== 'string') return;
    const trimmed = command.trim();
    if (trimmed.length === 0) return;

    // Append command with newline
    try {
        fs.appendFileSync(HISTORY_FILE, trimmed + os.EOL, { encoding: 'utf8' });
    } catch (err) {
        // If append fails, ignore silently to avoid breaking shell
    }
}

function clearHistory() {
    try {
        fs.writeFileSync(HISTORY_FILE, '', { encoding: 'utf8' });
    } catch (err) {
        console.error('Could not clear history:', err.message || err);
    }
}

// Export primary function (show history) and attach helpers
module.exports = showHistory;
module.exports.add = addHistory;
module.exports.clear = clearHistory;