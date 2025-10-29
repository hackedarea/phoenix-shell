const chalk = require('chalk');

function exitCommand(answer) {
    const code = parseInt(answer.split(" ")[1]) || 0;
    const exit_log = chalk.redBright("Exiting the terminal...");
    console.log(`${exit_log}`);
    process.exit(code);
}

module.exports = exitCommand;