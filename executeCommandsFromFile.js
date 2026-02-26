const fs = require("fs");

/**
 * - execute commands from file before processing user input
 * - like .bashrc or .zshrc does
 * - accepts an executor function to run commands in the phoenix shell context
 */
async function executeCommandsFromFile(filePath, executor) {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    const commands = data.split('\n').filter(command => command.trim() !== '' && !command.startsWith('#'));

    if (commands.length === 0) return;

    for (const command of commands) {
      const trimmedCommand = command.trim();
      if (trimmedCommand === '') continue;

      console.log(`\n--> Executing: ${trimmedCommand}`);
      
      // If executor function provided, use it; otherwise skip (for backward compatibility)
      if (executor && typeof executor === 'function') {
        await executor(trimmedCommand);
      }
    }

  } catch (err) {
    console.error('An error occurred:', err.message || err);
  }
}
exports.executeCommandsFromFile = executeCommandsFromFile;
