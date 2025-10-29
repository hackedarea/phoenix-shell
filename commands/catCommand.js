const fs = require("fs");
const path = require("path");

function catCommand(args) {
  if (args.includes("--help")) {
    try {
      const helpText = fs.readFileSync(path.resolve("./help/cat.txt"), "utf-8");
      console.log(helpText);
    } catch {
      console.log("cat: help file not found.");
    }
    return;
  }

  // Options
  let numberAll = false; // -n
  let numberNonBlank = false; // -b (overrides -n)
  let showEnds = false; // -E (append $ at end of each line)
  let showTabs = false; // -T (display TAB characters as ^I)
  let squeezeBlank = false; // -s (suppress repeated empty output lines)
  let showAll = false; // -A (equivalent to -ET here)

  const operands = [];
  let parsingOptions = true;
  for (const arg of args) {
    if (parsingOptions) {
      if (arg === "--") {
        parsingOptions = false;
        continue;
      }
      if (arg === "-") {
        operands.push("-");
        continue;
      }
      if (arg.startsWith("--")) {
        // Only --help handled earlier; ignore unknown long options gracefully
        parsingOptions = false;
        operands.push(arg);
        continue;
      }
      if (arg.startsWith("-") && arg.length > 1) {
        for (const ch of arg.slice(1)) {
          if (ch === "n") numberAll = true;
          else if (ch === "b") numberNonBlank = true;
          else if (ch === "E") showEnds = true;
          else if (ch === "T") showTabs = true;
          else if (ch === "s") squeezeBlank = true;
          else if (ch === "A") showAll = true;
          else {
            // Unknown flag; ignore to keep behavior simple
          }
        }
        continue;
      }
      // Not an option
      parsingOptions = false;
    }
    operands.push(arg);
  }

  if (showAll) {
    showEnds = true;
    showTabs = true;
  }
  if (numberNonBlank) {
    numberAll = false;
  }

  if (operands.length === 0) {
    console.error("cat: missing file operand");
    return;
  }

  // Read stdin once if requested; reuse if '-' appears multiple times
  let stdinContent = null;
  const needsStdin = operands.some((o) => o === "-");
  if (needsStdin) {
    try {
      stdinContent = fs.readFileSync(0, "utf8");
    } catch (err) {
      console.error(`cat: -: ${err.message}`);
      stdinContent = "";
    }
  }

  // Helper: apply transforms to content according to flags
  function transformContent(raw) {
    let content = raw;

    // Show tabs
    if (showTabs) {
      content = content.replace(/\t/g, "^I");
    }

    // Split into lines while preserving knowledge of the trailing newline
    const endsWithNewline = content.endsWith("\n");
    const lines = content.split("\n");

    // Squeeze blank lines
    let processed = [];
    if (squeezeBlank) {
      let previousWasBlank = false;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isLast = i === lines.length - 1;
        const isBlank = line === "";
        if (isBlank) {
          if (!previousWasBlank) {
            processed.push(line);
          } else {
            // skip extra blank
          }
        } else {
          processed.push(line);
        }
        // Only treat as blank if it's not the final phantom line when no trailing newline
        if (!(isLast && !endsWithNewline)) {
          previousWasBlank = isBlank;
        }
      }
    } else {
      processed = lines.slice();
    }

    // Line numbering
    let lineNumber = 1;
    for (let i = 0; i < processed.length; i++) {
      const isLast = i === processed.length - 1;
      const originalHadNewline = endsWithNewline || !isLast;
      let line = processed[i];

      const isBlank = line === "" && originalHadNewline; // treat only true blank lines
      if (numberNonBlank ? !isBlank : numberAll) {
        const prefix = String(lineNumber).padStart(6, " ") + "\t";
        line = prefix + line;
        processed[i] = line;
        lineNumber += 1;
      }
    }

    // Show ends
    if (showEnds) {
      for (let i = 0; i < processed.length; i++) {
        const isLast = i === processed.length - 1;
        const originalHadNewline = endsWithNewline || !isLast;
        if (originalHadNewline) {
          processed[i] = processed[i] + "$";
        }
      }
    }

    // Re-join preserving original trailing newline behavior
    let out = processed.join("\n");
    if (endsWithNewline) {
      out += "\n";
    }
    return out;
  }

  operands.forEach((operand, index) => {
    let content = "";
    if (operand === "-") {
      content = stdinContent ?? "";
      process.stdout.write(transformContent(content));
      return;
    }

    const filePath = path.resolve(process.cwd(), operand);
    try {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        console.error(`cat: ${operand}: Is a directory`);
        return;
      }
      content = fs.readFileSync(filePath, "utf8");
      process.stdout.write(transformContent(content));
    } catch (err) {
      if (err.code === "ENOENT") {
        console.error(`cat: ${operand}: No such file or directory`);
      } else if (err.code === "EACCES") {
        console.error(`cat: ${operand}: Permission denied`);
      } else {
        console.error(`cat: ${operand}: ${err.message}`);
      }
    }
  });
}

module.exports = catCommand;


