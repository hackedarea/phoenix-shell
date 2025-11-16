const readline = require("readline");
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
const echoCommand = require("./commands/echoCommand");
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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// simple in-shell variables store (name -> string value)
const shellVars = {};

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
          // assignment processed, move to next command
          executeNextCommand();
          return;
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
          executeNextCommand();
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
          executeNextCommand();
        }

        // type command
        else if (cmd === "type") {
          typeCommand(arg);
          executeNextCommand();
        }

        // cat command
        else if (cmd == 'cat') {
          catCommand(arg);
          executeNextCommand();
        }

        // ls command
        else if (cmd === "ls") {
          lsCommand(parts.slice(1));
          executeNextCommand();
        }

        // clear command
        else if (cmd == "clear" || cmd == "cls") {
          clearCommand();
          executeNextCommand();
        }

        // pwd command
        else if (cmd == "pwd") {
          pwdCommand(arg);
          executeNextCommand();
        }

        // cd command
        else if (cmd == "cd") {
          const cdArg = parts.slice(1).join(" ").trim();
          cdCommand(cdArg);
          executeNextCommand();
        }

        // grep command
        else if (cmd == "grep") {
          grepCommand(arg);
          executeNextCommand();
        }

        // ifconfig command
        else if (cmd == 'ifconfig') {
          ifconfigCommand(arg);
          executeNextCommand();
        }

        // rm command
        else if (cmd == 'rm') {
          rmCommand(arg);
          executeNextCommand();
        }

        else if (cmd == 'mkdir') {
          mkdirCommand(arg);
          executeNextCommand();
        }

        // bae command (system package manager wrapper)
        else if (cmd === 'bae') {
          baeCommand(arg);
          executeNextCommand();
        }

        // man Command
        else if (cmd === 'man') {
          const inp = parts.slice(1).join(" ").trim();
          manCommand(inp);
          executeNextCommand();
        }

        // chmod Command
        else if (cmd === 'chmod') {
          const argument = parts.slice(1).join(" ").trim();
          chmodCommand(argument);
          executeNextCommand();
        }

        // touch command
        else if (cmd === 'touch') {
          touchCommand(arg);
          executeNextCommand();
        }

        // cp command
        else if (cmd === 'cp') {
          cpCommand(arg);
          executeNextCommand();
        }

        // mv command
        else if (cmd === 'mv') {
          mvCommand(arg);
          executeNextCommand();
        }

        // iwconfig command
        else if (cmd === 'iwconfig') {
          iwconfigCommand(arg);
          executeNextCommand();
        }

        // if command not found
        else {
          console.log(`${cmd || currentCommand}: command not found`);
          executeNextCommand();
        }
      };

      executeNextCommand();
    }
  );
};

prompt();