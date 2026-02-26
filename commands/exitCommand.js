const chalk = require('chalk');

/**
 * Exits the shell with an optional exit code
 * Terminates the current shell session and returns the specified exit status to parent process
 */

function exitCommand(answer) {
    const code = parseInt(answer.split(" ")[1]) || 0;
    const exit_log = chalk.redBright("Exiting the terminal...");
    console.log(`${exit_log}`);
    process.exit(code);
}

module.exports = exitCommand;