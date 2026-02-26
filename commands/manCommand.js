const path = require("path");
const fs = require("fs");

/**
 * Displays manual pages and help information for commands
 * Retrieves documentation from the help directory for all available commands
 */

function readTextFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function getHelpDir() {
  return path.join(__dirname, "..", "help");
}

function getMainHelpPath() {
  return path.join(getHelpDir(), "man.txt");
}

function printMainHelp() {
  const helpPath = getMainHelpPath();
  const text = readTextFileSafe(helpPath);
  if (text) {
    console.log(text);
  } else {
    console.log("man: help file not found.");
  }
}

function printUsageLine() {
  const text = readTextFileSafe(getMainHelpPath());
  if (text) {
    const firstLine = text.split(/\r?\n/)[0] || "Usage: man [OPTION...] [SECTION] PAGE...";
    console.log(firstLine);
    return;
  }
  console.log("Usage: man [OPTION...] [SECTION] PAGE...");
}

function resolveHelpPagePath(pageName, options) {
  const helpDir = getHelpDir();
  const caseInsensitive = options.ignoreCase;
  if (!caseInsensitive) {
    return path.join(helpDir, `${pageName}.txt`);
  }
  try {
    const files = fs.readdirSync(helpDir);
    const lower = `${pageName.toLowerCase()}.txt`;
    const match = files.find((f) => f.toLowerCase() === lower);
    return match ? path.join(helpDir, match) : path.join(helpDir, `${pageName}.txt`);
  } catch {
    return path.join(helpDir, `${pageName}.txt`);
  }
}

function handleWhere(pages, options) {
  if (pages.length === 0) {
    printUsageLine();
    return;
  }
  for (const page of pages) {
    const p = resolveHelpPagePath(page, options);
    if (fs.existsSync(p)) {
      console.log(p);
    } else {
      console.log(`man: no manual entry for ${page}`);
    }
  }
}

function handleLocalFile(files) {
  if (files.length === 0) {
    printUsageLine();
    return;
  }
  for (const file of files) {
    const abs = path.resolve(file);
    const text = readTextFileSafe(abs);
    if (text) {
      console.log(text);
    } else {
      console.log(`man: cannot open ${file}`);
    }
  }
}

function showPages(pages, options) {
  if (pages.length === 0) {
    printMainHelp();
    return;
  }
  for (const page of pages) {
    const p = resolveHelpPagePath(page, options);
    const text = readTextFileSafe(p);
    if (text) {
      console.log(text);
    } else {
      console.log(`man: no manual entry for ${page}`);
    }
  }
}

const manCommand = (args) => {
  // Handle both string and array inputs
  let argv;
  if (Array.isArray(args)) {
    argv = args;
  } else if (typeof args === 'string') {
    // Split the string into an array, preserving quoted arguments
    argv = args.trim() === '' ? [] : args.trim().split(/\s+/);
  } else {
    argv = [];
  }
  
  const options = {
    ignoreCase: true, // default per man.txt says case-insensitive by default
  };

  if (argv.length === 0) {
    printMainHelp();
    return;
  }

  // Recognized simple flags
  if (argv.includes("--help") || argv.includes("-h") || argv.includes("-?")) {
    printMainHelp();
    return;
  }
  if (argv.includes("--usage")) {
    printUsageLine();
    return;
  }
  if (argv.includes("--version") || argv.includes("-V")) {
    console.log("man (CLI) 1.0.0");
    return;
  }

  // Case sensitivity
  if (argv.includes("--match-case") || argv.includes("-I")) {
    options.ignoreCase = false;
  }
  if (argv.includes("--ignore-case") || argv.includes("-i")) {
    options.ignoreCase = true;
  }

  // Mode: where
  const whereIdx = argv.findIndex((a) => ["-w", "--where", "--path", "--location"].includes(a));
  if (whereIdx !== -1) {
    const rest = argv.slice(whereIdx + 1).filter((a) => !a.startsWith("-"));
    handleWhere(rest, options);
    return;
  }

  // Mode: local-file
  const localIdx = argv.findIndex((a) => ["-l", "--local-file"].includes(a));
  if (localIdx !== -1) {
    const rest = argv.slice(localIdx + 1);
    handleLocalFile(rest);
    return;
  }

  // Default: interpret remaining non-option args as page names
  const pages = argv.filter((a) => !a.startsWith("-"));
  if (pages.length > 0) {
    showPages(pages, options);
    return;
  }

  // Fallback
  printMainHelp();
};

module.exports = manCommand;
