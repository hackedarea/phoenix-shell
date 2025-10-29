const fs = require("fs");
const path = require("path");

function typeCommand(args) {
  const names = Array.isArray(args) ? args : [args].filter(Boolean);
  if (names.length === 0) {
    console.log("type: missing operand");
    return;
  }

  if (names.length === 1 && names[0] === "--help") {
    try {
      const helpText = fs.readFileSync(path.resolve("./help/type.txt"), "utf-8");
      console.log(helpText);
    } catch {
      console.log("type: help file not found.");
    }
    return;
  }

  for (const name of names) {
    if (name === "type") {
      console.log(`${name} is a shell builtin`);
      continue;
    }
    if (name === "echo") {
      console.log("echo is a builtin command");
      continue;
    }
    if (name === "exit") {
      console.log("exit is a builtin command");
      continue;
    }

    const pathDirs = (process.env.PATH || "").split(path.delimiter);
    let foundPath = null;
    for (const dir of pathDirs) {
      const filePath = path.join(dir, name);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        foundPath = filePath;
        break;
      }
    }
    if (foundPath) {
      console.log(`${name} is ${foundPath}`);
    } else {
      console.log(`${name}: not found`);
    }
  }
}

module.exports = typeCommand;
