const fs = require("fs");
const path = require("path");

/**
 * Changes the current working directory
 * Supports navigating with absolute paths, relative paths, home directory (~), and previous directory (-)
 */

function expandHome(p) {
  if (!p) return p;
  if (p === "~") return process.env.HOME || process.env.USERPROFILE || p;
  if (p.startsWith("~/") || p.startsWith("~\\")) {
    const home = process.env.HOME || process.env.USERPROFILE;
    return home ? path.join(home, p.slice(2)) : p;
  }
  return p;
}

function cdCommand(targetRawInput) {
  const targetRaw = targetRawInput || "";

  const oldpwd = process.env.OLDPWD || process.cwd();

  if (targetRaw === "-") {
    if (!process.env.OLDPWD) {
      console.error("cd: OLDPWD not set");
      return;
    }
    try {
      process.chdir(process.env.OLDPWD);
      const newCwd = process.cwd();
      process.env.OLDPWD = oldpwd;
      process.env.PWD = newCwd;
      console.log(newCwd);
    } catch (err) {
      console.error(`cd: ${err.message}`);
    }
    return;
  }

  if (targetRaw === "--help") {
    try {
      const helpText = fs.readFileSync(path.resolve("./help/cd.txt"), "utf-8");
      console.log(helpText);
    } catch {
      console.log("cd: help file not found.");
    }
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
}

module.exports = cdCommand;
