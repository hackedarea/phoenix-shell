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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

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
      const parts = answer.trim().match(/(?:[^\s"']+|["'][^"']*["'])+/g) || [];
      const cmd = parts[0];
      const arg = parts.slice(1);

      // exit command
      if (answer.startsWith("exit")) {
        exitCommand(answer);
      }

      // echo command
      else if (answer.substring(0, 4) == "echo") {
        echoCommand(answer);
        prompt();
      }

      // type command
      else if (cmd === "type") {
        typeCommand(arg);
        prompt();
      }

      // cat command
      else if (cmd == 'cat') {
        catCommand(arg);
        prompt();
      }

      // ls command
      else if (cmd === "ls") {
        lsCommand(parts.slice(1));
        prompt();
      }

      // clear command
      else if (cmd == "clear" || cmd == "cls") {
        clearCommand();
        prompt();
      }

      // pwd command
      else if (cmd == "pwd") {
        pwdCommand(arg);
        prompt();
      }

      // cd command
      else if (cmd == "cd") {
        const arg = parts.slice(1).join(" ").trim();
        cdCommand(arg);
        prompt();
      }

      // grep command
      else if (cmd == "grep") {
        grepCommand(arg);
        prompt();
      }

      // ifconfig command
      else if (cmd == 'ifconfig') {
        ifconfigCommand(arg);
        prompt();
      }

      // rm command
      else if (cmd == 'rm') {
        rmCommand(arg);
        prompt();
      }

      else if (cmd == 'mkdir') {
        mkdirCommand(arg);
        prompt();
      }

      // bae system package manager wrapper
      else if (cmd === 'bae') {
        baeCommand(arg);
        prompt();
      }

      // man Command
      else if (cmd === 'man') {
        const inp = parts.slice(1).join(" ").trim();
        manCommand(inp);
        prompt();
      }

      // chmod Command
      else if (cmd === 'chmod') {
        const argument = parts.slice(1).join(" ").trim();
        chmodCommand(argument)
        prompt();
      }

      // touch command
      else if (cmd === 'touch') {
        touchCommand(arg);
        prompt();
      }
        
      // cp command
      else if (cmd === 'cp') {
        cpCommand(arg);
        prompt();
      }

      // if command not found
      else {
        console.log(`${answer}: command not found`);
        prompt();
      }
    }
  );
};

prompt();
