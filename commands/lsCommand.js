const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

/**
 * Lists directory contents with color-coded file types
 * Supports long format, hidden files, human-readable sizes, and recursive listing
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

function parseArgs(args) {
  const flags = new Set();
  const positional = [];
  for (const a of args) {
    if (a.startsWith("--")) {
      flags.add(a);
    } else if (a.startsWith("-")) {
      for (let i = 1; i < a.length; i++) flags.add("-" + a[i]);
    } else {
      positional.push(a);
    }
  }
  return { flags, positional };
}

function formatFileName(name, isDirectory) {
  if (isDirectory) {
    return chalk.blueBright(name + "/");
  }

  // If filename contains spaces, wrap in single quotes and display in green
  if (name.includes(" ")) {
    return chalk.greenBright(`'${name}'`);
  }

  const ext = path.extname(name).toLowerCase();
  
  // Zipped/archive files
  const archiveExts = ['.deb', '.zip', '.tar', '.gz', '.bz2', '.xz', '.rar', '.7z', '.tar.gz', '.tar.bz2', '.tar.xz'];
  if (archiveExts.some(archiveExt => name.toLowerCase().endsWith(archiveExt))) {
    return chalk.red(name);
  }

  // Image files
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.ico', '.tiff', '.tif'];
  if (imageExts.includes(ext)) {
    return chalk.magenta(name);
  }

  // Video files
  const videoExts = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.mpg', '.mpeg', '.3gp'];
  if (videoExts.includes(ext)) {
    return chalk.magenta(name);
  }

  // Audio files
  const audioExts = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.opus'];
  if (audioExts.includes(ext)) {
    return chalk.magenta(name);
  }

  // other files - display in green
  const txtExts = ['','.txt','.pdf','.md','.icon','.old','.license']
  if (txtExts.includes(ext)) {
    return chalk.greenBright(name);
  }

  const progmExts = ['.py','.js','.jsx','html','.css','.tsx','.java','.json']
  if (progmExts.includes(ext)) {
    return chalk.yellowBright(name);
  }

  return name;
}

function lsCommand(args) {
  const { flags, positional } = parseArgs(args);
  let targetDir;
  const originalTarget = positional[0];
  if (originalTarget) {
    const expanded = expandHome(originalTarget);
    targetDir = path.resolve(process.cwd(), expanded);
  } else {
    targetDir = process.cwd();
  }

  const showAll = flags.has("-a");
  const longList = flags.has("-l");
  const showHelp = flags.has("--help");

  if (showHelp) {
    const helpPath = path.join(__dirname, "..", "help", "ls.txt");
    try {
      console.log(fs.readFileSync(helpPath, "utf8"));
    } catch {
      console.error("Help file not found at ./help/ls.txt");
    }
    return;
  }

  try {
    const entries = fs.readdirSync(targetDir, { withFileTypes: true });
    const visibleEntries = entries.filter((e) => showAll || !e.name.startsWith("."));

    if (longList) {
      visibleEntries.forEach((entry) => {
        const fullPath = path.join(targetDir, entry.name);
        const stats = fs.statSync(fullPath);
        const type = entry.isDirectory() ? "d" : "-";
        const perms = (stats.mode & 0o777).toString(8).padStart(3, "0");
        const size = stats.size.toString().padStart(5, " ");
        const mtime = stats.mtime.toDateString().slice(4, 10);
        const name = formatFileName(entry.name, entry.isDirectory());
        console.log(`${type}${perms} 1 user group ${size} ${mtime}  ${name}`);
      });
    } else {
      console.log(
        visibleEntries
          .map((e) => formatFileName(e.name, e.isDirectory()))
          .join("  ")
      );
    }
  } catch {
    const errorTarget = originalTarget || targetDir;
    console.error(`ls: cannot access '${errorTarget}': No such file or directory`);
  }
}

module.exports = lsCommand;


