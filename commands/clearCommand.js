const readline = require("readline");

function clearCommand() {
    process.stdout.write("\x1B[2J\x1B[0f");
}
module.exports = clearCommand;