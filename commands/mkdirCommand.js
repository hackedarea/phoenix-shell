const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Creates directories
 * Supports creating parent directories, setting permissions, and multiple directory creation
 */

function expandTilde(p) {
  if (!p || typeof p !== 'string') return p;
  if (p === '~') return os.homedir();
  if (p.startsWith('~/')) return path.join(os.homedir(), p.slice(2));
  return p;
}

function parseMode(modeStr) {
  if (!modeStr) return undefined;
  // Accept numeric like 777 or 0777
  const m = String(modeStr).trim();
  if (/^[0-7]{3,4}$/.test(m)) {
    return parseInt(m, 8);
  }
  // Symbolic modes are complex; ignore with message compatibility
  return undefined;
}

function printHelp() {
  const helpPath = path.resolve(__dirname, '../help/mkdir.txt');
  try {
    const txt = fs.readFileSync(helpPath, 'utf-8');
    console.log(txt);
  } catch {
    console.log('Usage: mkdir [OPTION]... DIRECTORY...');
  }
}

function mkdirCommand(argv) {
  const tokens = Array.isArray(argv) ? argv.slice() : String(argv || '').trim().split(/\s+/);

  const options = {
    mode: undefined,           // -m, --mode=MODE
    parents: false,            // -p, --parents
    verbose: false,            // -v, --verbose
    context: null,             // -Z, --context[=CTX]
    showHelp: false,           // --help
    showVersion: false         // --version
  };

  const dirs = [];
  let endOfOpts = false;
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (!tok) continue;
    if (endOfOpts) { dirs.push(tok); continue; }
    if (tok === '--') { endOfOpts = true; continue; }

    if (tok === '--help') { options.showHelp = true; continue; }
    if (tok === '--version') { options.showVersion = true; continue; }
    if (tok === '--parents') { options.parents = true; continue; }
    if (tok === '--verbose') { options.verbose = true; continue; }
    if (tok === '--mode') {
      // Mandatory argument
      const next = tokens[i + 1];
      if (next && !next.startsWith('-')) { options.mode = parseMode(next); i++; }
      else { console.error("mkdir: option '--mode' requires an argument"); return; }
      continue;
    }
    if (tok.startsWith('--mode=')) { options.mode = parseMode(tok.split('=')[1]); continue; }
    if (tok === '--context') {
      const next = tokens[i + 1];
      if (next && !next.startsWith('-')) { options.context = next; i++; }
      else { options.context = ''; }
      continue;
    }
    if (tok.startsWith('--context=')) { options.context = tok.split('=')[1] || ''; continue; }

    if (tok.startsWith('--')) {
      dirs.push(tok);
      continue;
    }

    if (tok.startsWith('-') && tok.length > 1) {
      // if -m has an attached value like -m755 - accept it
      let j = 1;
      while (j < tok.length) {
        const c = tok[j];
        if (c === 'p') { options.parents = true; j++; continue; }
        if (c === 'v') { options.verbose = true; j++; continue; }
        if (c === 'Z') { options.context = options.context ?? ''; j++; continue; }
        if (c === 'm') {
          const rest = tok.slice(j + 1);
          if (rest) { options.mode = parseMode(rest); j = tok.length; break; }
          const next = tokens[i + 1];
          if (next && !next.startsWith('-')) { options.mode = parseMode(next); i++; j = tok.length; break; }
          console.error("mkdir: option requires an argument -- 'm'");
          return;
        }
        // unknown short option -> treat entire token as operand
        dirs.push(tok);
        break;
      }
      continue;
    }

    dirs.push(tok);
  }

  if (options.showHelp) { printHelp(); return; }
  if (options.showVersion) { console.log('mkdir (custom) 1.0.0'); return; }

  if (dirs.length === 0) {
    console.error('mkdir: missing operand');
    return;
  }

  for (const d of dirs) {
    const expanded = expandTilde(String(d));
    const target = path.resolve(process.cwd(), expanded);
    try {
      const mkdirOpts = {};
      if (options.parents) mkdirOpts.recursive = true;
      if (options.mode != null) mkdirOpts.mode = options.mode;
      fs.mkdirSync(target, mkdirOpts);
      if (options.verbose) console.log(`mkdir: created directory '${target}'`);
    } catch (err) {
      if (err && err.code === 'EEXIST' && options.parents) {
        // ok when -p and already exists
        continue;
      }
      console.error(formatMkdirError(d, err));
    }
  }
}

function formatMkdirError(operand, err) {
  if (!err || !err.code) return `mkdir: cannot create directory '${operand}': ${String(err)}`;
  switch (err.code) {
    case 'EEXIST': return `mkdir: cannot create directory '${operand}': File exists`;
    case 'ENOENT': return `mkdir: cannot create directory '${operand}': No such file or directory`;
    case 'EACCES':
    case 'EPERM': return `mkdir: cannot create directory '${operand}': Permission denied`;
    default: return `mkdir: cannot create directory '${operand}': ${err.message || err.code}`;
  }
}

module.exports = mkdirCommand;