const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

/**
 * Searches for lines matching a pattern in files
 * Supports case-insensitive search, inverted matching, line numbers, and file names
 */

function grepCommand(args) {
  if (args.includes("--help")) {
    try {
      const helpText = fs.readFileSync(path.resolve("./help/grep.txt"), "utf-8");
      console.log(helpText);
    } catch {
      console.log("grep: help file not found.");
    }
    return;
  }

  const flags = args.filter((a) => a.startsWith("-"));
  const nonFlags = args.filter((a) => !a.startsWith("-"));
  const rawPattern = nonFlags[0];
  const pattern = (rawPattern && ((rawPattern.startsWith('"') && rawPattern.endsWith('"')) || (rawPattern.startsWith("'") && rawPattern.endsWith("'"))))
    ? rawPattern.slice(1, -1)
    : rawPattern;
  const files = nonFlags.slice(1);

  if (!pattern) {
    console.error("grep: missing search pattern");
    return;
  }

  if (files.length === 0) {
    console.error("grep: missing file operand");
    return;
  }

  // Default to case-insensitive matching
  const caseInsensitive = true;
  const invertMatch = flags.includes("-v");
  const showLineNumbers = flags.includes("-n");

  let regex;
  try {
    regex = new RegExp(pattern, caseInsensitive ? "i" : undefined);
  } catch (err) {
    console.error(`grep: invalid pattern '${pattern}': ${err.message}`);
    return;
  }

  // highlight regex to color all matches in blue
  let highlightRegex;
  try {
    highlightRegex = new RegExp(pattern, caseInsensitive ? "gi" : "g");
  } catch { 
    // if can't construct regex then make it non-highlight
    highlightRegex = null;
  }

  files.forEach((fileArg) => {
    const filePath = path.resolve(process.cwd(), fileArg);
    try {
      const data = fs.readFileSync(filePath, "utf-8");
      const lines = data.split("\n");
      lines.forEach((line, idx) => {
        const isMatch = regex.test(line);
        if ((isMatch && !invertMatch) || (!isMatch && invertMatch)) {
          const highlighted = highlightRegex ? line.replace(highlightRegex, (m) => chalk.blue(m)) : line;
          if (showLineNumbers) console.log(`${idx + 1}:${highlighted}`); else console.log(highlighted);
        }
      });
    } catch (err) {
      if (err.code === "ENOENT") {
        console.error(`grep: ${fileArg}: No such file or directory`);
      } else if (err.code === "EACCES") {
        console.error(`grep: ${fileArg}: Permission denied`);
      } else {
        console.error(`grep: ${fileArg}: ${err.message}`);
      }
    }
  });
}

module.exports = grepCommand;


