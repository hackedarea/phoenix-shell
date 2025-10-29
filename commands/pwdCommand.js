const fs = require("fs");
const path = require("path");

function pwdCommand(args) {
  const arr = Array.isArray(args) ? args : String(args || "").split(/\s+/).slice(1);

  if (arr.includes("--help")) {
    try {
      const helpText = fs.readFileSync(path.resolve("./help/pwd.txt"), "utf-8");
      console.log(helpText);
    } catch {
      console.log("pwd: help file not found.");
    }
    return;
  }

  const usePhysical = arr.includes("-P");
  const useLogical = arr.includes("-L") || !usePhysical; // default to logical when no -P

  const cwd = process.cwd();

  if (usePhysical) {
    try {
      const physicalPath = fs.realpathSync(cwd);
      console.log(physicalPath);
      return;
    } catch {
      // Fallback if realpath fails
      console.log(cwd);
      return;
    }
  }

  if (useLogical) {
    const envPwd = process.env.PWD;
    if (envPwd) {
      try {
        const realEnvPwd = fs.realpathSync(envPwd);
        const realCwd = fs.realpathSync(cwd);
        if (realEnvPwd === realCwd) {
          console.log(envPwd);
          return;
        }
      } catch {
        // Ignore and fallback to cwd
      }
    }
    console.log(cwd);
    return;
  }
}

module.exports = pwdCommand;


