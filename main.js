const readline = require("readline");
const path = require("path");
const os = require("os");
const chalk = require("chalk");

// require commands
const typeCommand = require('./commands/typeCommand');
const ifconfigCommand = require("./commands/ifconfigCommand");
const catCommand = require('./commands/catCommand');
const grepCommand = require('./commands/grepCommand');
const clearCommand = require("./commands/clearCommand");
const lsCommand = require("./commands/lsCommand");
const cdCommand = require("./commands/cdCommand");
const exitCommand = require("./commands/exitCommand");
const mvCommand = require("./commands/mvCommand");
const pwdCommand = require("./commands/pwdCommand");
const rmCommand = require('./commands/rmCommand');
const mkdirCommand = require('./commands/mkdirCommand');
const baeCommand = require('./commands/baeCommand');
const manCommand = require('./commands/manCommand');
const chmodCommand = require("./commands/chmodCommand");
const touchCommand = require("./commands/touchCommand");
const cpCommand = require("./commands/cpCommand");
const historyCommand = require("./commands/historyCommand");
const iwconfigCommand = require('./commands/iwconfigCommand');
const { executeCommandsFromFile } = require("./executeCommandsFromFile");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const commandFile = path.join(__dirname, './.pshrc');

// simple in-shell variables store (name -> string value)
const shellVars = {};

// Function to execute a single command (used by both interactive prompt and startup file)
const executeSingleCommand = (currentCommand) => {
  // NAME=VALUE (VALUE may be quoted also)
  const assignMatch = currentCommand.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (assignMatch) {
    const name = assignMatch[1];
    let value = assignMatch[2].trim();
    // strip surrounding matching quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    shellVars[name] = value;
    // assignment processed, return true to indicate success
    return true;
  }

  const parts = currentCommand.match(/(?:[^\s"']+|["'][^"']*["'])+/g) || [];

  // expand shell variables in each token. support $VAR and ${VAR}
  const expanded = parts.map(tok => tok.replace(/\$(?:\{([A-Za-z_][A-Za-z0-9_]*)\}|([A-Za-z_][A-Za-z0-9_]*))/g, (_, a, b) => {
    const n = a || b;
    return Object.prototype.hasOwnProperty.call(shellVars, n) ? shellVars[n] : '';
  }));

  const cmd = expanded[0];
  const arg = expanded.slice(1);

  // exit command
  if (currentCommand.startsWith("exit")) {
    exitCommand(currentCommand);
  }

  // history command
  else if (cmd == "history") {
    historyCommand();
  }

  // echo command
  else if (cmd === "echo") {
    // print expanded args; strip surrounding matching quotes for each token
    const out = arg.map(a => {
      if ((a.startsWith('"') && a.endsWith('"')) || (a.startsWith("'") && a.endsWith("'"))) {
        return a.slice(1, -1);
      }
      return a;
    }).join(' ');
    console.log(out);
  }

  // type command
  else if (cmd === "type") {
    typeCommand(arg);
  }

  // cat command
  else if (cmd == 'cat') {
    if (parts.includes('>')) {
      console.log("Output redirection with '>' is not supported in this shell.");
      return true;
    }
    catCommand(arg);
  }

  // ls command
  else if (cmd === "ls") {
    lsCommand(parts.slice(1));
  }

  // clear command
  else if (cmd == "clear" || cmd == "cls") {
    clearCommand();
  }

  // pwd command
  else if (cmd == "pwd") {
    pwdCommand(arg);
  }

  // cd command
  else if (cmd == "cd") {
    const cdArg = parts.slice(1).join(" ").trim();
    cdCommand(cdArg);
  }

  // grep command
  else if (cmd == "grep") {
    grepCommand(arg);
  }

  // ifconfig command
  else if (cmd == 'ifconfig') {
    ifconfigCommand(arg);
  }

  // rm command
  else if (cmd == 'rm') {
    rmCommand(arg);
  }

  else if (cmd == 'mkdir') {
    mkdirCommand(arg);
  }

  // bae command (system package manager wrapper)
  else if (cmd === 'bae') {
    baeCommand(arg);
  }

  // man Command
  else if (cmd === 'man') {
    const inp = parts.slice(1).join(" ").trim();
    manCommand(inp);
  }

  // chmod Command
  else if (cmd === 'chmod') {
    const argument = parts.slice(1).join(" ").trim();
    chmodCommand(argument);
  }

  // touch command
  else if (cmd === 'touch') {
    touchCommand(arg);
  }

  // cp command
  else if (cmd === 'cp') {
    cpCommand(arg);
  }

  // mv command
  else if (cmd === 'mv') {
    mvCommand(arg);
  }

  // iwconfig command
  else if (cmd === 'iwconfig') {
    iwconfigCommand(arg);
  }

  // if command not found
  else {
    console.log(`${cmd || currentCommand}: command not found`);
  }

  return true;
};

// The whole logic code begins from here
const prompt = () => {
  rl.question(
    chalk.yellow('┌─[') +
    chalk.cyan('phoenix') +
    chalk.redBright('@') +
    chalk.magenta('PHOENIX') +
    chalk.yellow(']-[') +
    chalk.green(process.cwd().replace(os.homedir(), "~")) +
    chalk.yellow(']\n') +
    chalk.yellow('└──╼ ') +
    chalk.blue('$ '),
    (answer) => {
      try {
        historyCommand.add(answer);
      } catch (err) {
        // ignore history errors to avoid breaking the shell
      }

      // Variable feature like "$x" or "${x}",
      const onlyVarRef = answer.trim().match(/^\$(?:\{([A-Za-z_][A-Za-z0-9_]*)\}|([A-Za-z_][A-Za-z0-9_]*))$/);
      if (onlyVarRef) {
        const varName = onlyVarRef[1] || onlyVarRef[2];
        const val = Object.prototype.hasOwnProperty.call(shellVars, varName) ? shellVars[varName] : '';
        console.log(val);
        prompt();
        return;
      }

      // Split by semicolon to handle multiple commands
      const commands = answer.split(';').map(cmd => cmd.trim()).filter(cmd => cmd.length > 0);
      // Execute commands 1 by 1
      let commandIndex = 0;

      const executeNextCommand = () => {
        if (commandIndex >= commands.length) {
          prompt();
          return;
        }

        const currentCommand = commands[commandIndex];
        commandIndex++;
        
        // Use the extracted executeSingleCommand function
        executeSingleCommand(currentCommand);
        executeNextCommand();
      };

      executeNextCommand();
    }
  );
};

// Execute commands from file once at startup, then start the prompt loop
(async () => {
  // Create executor function that runs phoenix shell commands
  const executeStartupCommand = async (commandStr) => {
    executeSingleCommand(commandStr);
  };
  
  await executeCommandsFromFile(commandFile, executeStartupCommand);
  prompt();
})();