const readline = require("readline");
const os = require('os');
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// TODO: Uncomment the code below to pass the first stage
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
      const code = parseInt(answer.split(" ")[1]) || 0;
      process.exit(code);
    }

    // echo command
    else if (answer.substring(0, 4) == "echo") {
      console.log(answer.substring(5, answer.length));
      prompt();
    }

    // type command
    else if (cmd === "type") {
      if (arg == "type") {
        console.log(`${arg} is a shell builtin`);
        prompt();
      } else if (arg == "echo") {
        console.log("echo is a builtin command");
      } else if (arg == "exit") {
        console.log("echo is a builtin command");
      } else {
        const pathDirs = process.env.PATH.split(path.delimiter);
        let foundPath = null;
        for (const dir of pathDirs) {
          const filePath = path.join(dir, arg);
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            foundPath = filePath;
            break;
          }
        }
        if (foundPath) {
          console.log(`${arg} is ${foundPath}`);
        } else {
          console.log(`${arg}: not found`);
        }
      }
      prompt();
    }

    // cat command
    // else if (cmd == 'cat') {
    //     if (arg.includes("--help")) {
    //         const helpPath = path.join(__dirname, "help", "cat.txt");
    //         try {
    //             console.log(fs.readFileSync(helpPath, "utf8"));
    //         } catch {
    //             console.error("Help file not found at ./help/cat.txt");
    //         }
    //         prompt();
    //         return;
    //     }

    //     // No arguments → read from stdin
    //     if (arg.length === 0) {
    //             console.log("Enter text (Ctrl+D to end):");
    //             rl.on("line", (input) => {
    //             console.log(input);
    //         });
    //         rl.on("close", () => process.exit(0));
    //         return;
    //     }

    //     // Otherwise, read one or more files
    //     for (const fileArg of arg) {
    //         const filePath = path.resolve(process.cwd(), fileArg);

    //         try {
    //             const stat = fs.statSync(filePath);
    //         if (stat.isDirectory()) {
    //             console.error(`cat: ${fileArg}: Is a directory`);
    //             continue;
    //         }

    //         const content = fs.readFileSync(filePath, "utf8");
    //         process.stdout.write(content);
    //         if (arg.length > 1) process.stdout.write("\n");

    //         } catch (err) {
    //             if (err.code === "ENOENT") {
    //                 console.error(`cat: ${fileArg}: No such file or directory`);
    //             } else if (err.code === "EACCES") {
    //                 console.error(`cat: ${fileArg}: Permission denied`);
    //             } else {
    //                 console.error(`cat: ${fileArg}: ${err.message}`);
    //             }
    //         }
    //     }
    //     prompt();
    // }

    // ls command
    else if (cmd === "ls") {
      const { flags, positional } = parseArgs(parts.slice(1));
      const targetDir = positional[0] || process.cwd();

      const showAll = flags.has("-a");
      const longList = flags.has("-l");
      const showHelp = flags.has("--help");

      if (showHelp) {
        const helpPath = path.join(__dirname, "help", "ls.txt");
        try {
          console.log(fs.readFileSync(helpPath, "utf8"));
        } catch {
          console.error("Help file not found at ./help/ls.txt");
        }
        prompt();
        return;
      }

      try {
        const entries = fs.readdirSync(targetDir, { withFileTypes: true });
        const visibleEntries = entries.filter(
          (e) => showAll || !e.name.startsWith(".")
        );

        if (longList) {
          visibleEntries.forEach((entry) => {
            const fullPath = path.join(targetDir, entry.name);
            const stats = fs.statSync(fullPath);
            const type = entry.isDirectory() ? "d" : "-";
            const perms = (stats.mode & 0o777).toString(8).padStart(3, "0");
            const size = stats.size.toString().padStart(5, " ");
            const mtime = stats.mtime.toDateString().slice(4, 10);
            const name = entry.isDirectory()
              ? chalk.blue(entry.name + "/")
              : entry.name;
            console.log(
              `${type}${perms} 1 user group ${size} ${mtime}  ${name}`
            );
          });
        } else {
          console.log(
            visibleEntries
              .map((e) => (e.isDirectory() ? chalk.blue(e.name + "/") : e.name))
              .join("  ")
          );
        }
      } catch {
        console.error(
          `ls: cannot access '${targetDir}': No such file or directory`
        );
      }

      prompt();
    }

    // clear command
    else if (cmd == "clear" || cmd == "cls") {
      process.stdout.write("\x1B[2J\x1B[0f");
      prompt();
    }

    // pwd command
    else if (cmd == "pwd") {
      console.log(`${process.cwd()}`);
      prompt();
    }

    // cd command
    else if (cmd == "cd") {
      const arg = parts.slice(1).join(" ").trim();
      const targetRaw = arg || ""; // if no arguments passed with cd

      // Save oldPWD
      const oldpwd = process.env.OLDPWD || process.cwd();

      if (targetRaw === "-") {
        if (!process.env.OLDPWD) {
          console.error("cd: OLDPWD not set");
          prompt();
          return;
        }
        try {
          process.chdir(process.env.OLDPWD);
          // swap PWD and OLDPWD
          const newCwd = process.cwd();
          process.env.OLDPWD = oldpwd;
          process.env.PWD = newCwd;
          console.log(newCwd);
        } catch (err) {
          console.error(`cd: ${err.message}`);
        }
        prompt();
        return;
      }

      let target;
      if (!targetRaw) {
        target = process.env.HOME || process.env.USERPROFILE || process.cwd();
      } else {
        const expanded = expandHome(targetRaw);
        target = path.resolve(process.cwd(), expanded);
      }

      target = path.normalize(target);

      try {
        const stat = fs.statSync(target);
        if (!stat.isDirectory()) {
          console.error(`cd: ${targetRaw}: Not a directory`);
          prompt();
          return;
        }
        process.chdir(target);
        process.env.OLDPWD = oldpwd;
        process.env.PWD = process.cwd();
      } catch (err) {
        if (err.code === "ENOENT") {
          console.error(`cd: ${targetRaw}: No such file or directory`);
        } else if (err.code === "ENOTDIR") {
          console.error(`cd: ${targetRaw}: Not a directory`);
        } else if (err.code === "EACCES") {
          console.error(`cd: ${targetRaw}: Permission denied`);
        } else {
          console.error(`cd: ${err.message}`);
        }
      }

      prompt();
    }

    // if command not found
    else {
      console.log(`${answer}: command not found`);
      prompt();
    }
  });
};

prompt();
