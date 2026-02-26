const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Creates empty files or updates file access/modification times
 * Creates files if they don't exist, or updates timestamps on existing files
 */

function expandTilde(p) {
  if (!p || typeof p !== 'string') return p;
  if (p === '~') return os.homedir();
  if (p.startsWith('~/')) return path.join(os.homedir(), p.slice(2));
  return p;
}

function printHelp() {
  try {
    const helpPath = path.join(__dirname, '..', 'help', 'touch.txt');
    const content = fs.readFileSync(helpPath, 'utf8');
    console.log(content);
  } catch (_) {
    console.log(`Usage: touch [OPTION]... FILE...
Update the access and modification times of each FILE to the current time.
A FILE argument that does not exist is created empty.

Options:
  -f, --force       ignore nonexistent files and arguments, never prompt
  -v, --verbose     explain what is being done
  --help            display this help and exit
  --version         output version information and exit`);
  }
}

function touchFile(filePath, options) {
  try {
    const now = new Date();

    // If file exists, just update timestamps
    if (fs.existsSync(filePath)) {
      fs.utimesSync(filePath, now, now);
      if (options.verbose) console.log(`touched '${filePath}'`);
      return;
    }

    // Otherwise, create it
    const fd = fs.openSync(filePath, 'w');
    fs.closeSync(fd);
    if (options.verbose) console.log(`created '${filePath}'`);
  } catch (err) {
    if (!options.force) {
      console.error(`touch: cannot touch '${filePath}': ${err.message}`);
    }
  }
}

const touchCommand = (args) => {
  const tokens = Array.isArray(args)
    ? args.slice()
    : String(args || '').trim().split(/\s+/);

  const options = {
    force: false,      // -f, --force
    verbose: false,    // -v, --verbose
    showHelp: false,   // --help
    showVersion: false // --version
  };

  const files = [];
  let endOfOptions = false;

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (!tok) continue;
    if (endOfOptions) {
      files.push(tok);
      continue;
    }
    if (tok === '--') {
      endOfOptions = true;
      continue;
    }

    // Handle flags
    if (tok === '-f' || tok === '--force') {
      options.force = true;
      continue;
    }
    if (tok === '-v' || tok === '--verbose') {
      options.verbose = true;
      continue;
    }
    if (tok === '--help') {
      options.showHelp = true;
      continue;
    }
    if (tok === '--version') {
      options.showVersion = true;
      continue;
    }

    // Otherwise treat as filename
    files.push(tok);
  }

  if (options.showHelp) {
    printHelp();
    return;
  }

  if (options.showVersion) {
    console.log('Phoenix Shell (touch) 1.0.0');
    return;
  }

  if (files.length === 0) {
    console.error('touch: missing operand');
    console.error("Try 'touch --help' for more information.");
    return;
  }

  for (const file of files) {
    const expanded = expandTilde(file);
    const target = path.resolve(process.cwd(), expanded);
    touchFile(target, options);
  }
};

module.exports = touchCommand;
