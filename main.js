const readline = require("readline");
const os = require("os");
const fs = require("fs");
const path = require("path");
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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// The whole logic code begins from here
const prompt = () => {
    // `${green}┌─[${cyan}${username}@${hostname}${green}]─[${yellow}${cwd}${green}]\n` +
    // `└──╼ ${reset}$ `
  rl.question(`┌─[phoenix@PHOENIX]-[${process.cwd().replace(os.homedir(), "~")}]\n` + `└──╼ $ `, (answer) => {
    const parts = answer.trim().match(/(?:[^\s"']+|["'][^"']*["'])+/g) || [];
    const cmd = parts[0];
    const arg = parts.slice(1);

    function parseArgs(args) {
      const flags = new Set();
      const positional = [];

      for (const arg of args) {
        if (arg.startsWith("--")) {
          flags.add(arg);
        } else if (arg.startsWith("-")) {
          for (let i = 1; i < arg.length; i++) {
            flags.add("-" + arg[i]);
          }
        } else {
          positional.push(arg);
        }
      }

      return { flags, positional };
    }

    function expandHome(p) {
      if (!p) return p;
      if (p === "~") return process.env.HOME || process.env.USERPROFILE || p;
      if (p.startsWith("~/") || p.startsWith("~\\")) {
        const home = process.env.HOME || process.env.USERPROFILE;
        return home ? path.join(home, p.slice(2)) : p;
      }
      return p;
    }

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

      // if command not found
      else {
        console.log(`${answer}: command not found`);
        prompt();
      }
    }
  );
};

prompt();
