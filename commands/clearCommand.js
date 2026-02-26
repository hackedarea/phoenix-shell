const readline = require("readline");

/**
 * Clears the terminal screen
 * Removes all visible text and moves the cursor to the top-left corner
 */

function clearCommand() {
    process.stdout.write("\x1B[2J\x1B[0f");
}
module.exports = clearCommand;