const fs = require('fs');
const path = require('path');
const os = require('os');

function rmCommand(args) {
  const tokens = Array.isArray(args) ? args.slice() : String(args || '').trim().split(/\s+/);

  const options = {
    force: false,                  // -f, --force
    recursive: false,              // -r, -R, --recursive
    dir: false,                    // -d, --dir
    verbose: false,                // -v, --verbose
    interactive: 'never',          // 'never' | 'once' | 'always'
    oneFileSystem: false,          // --one-file-system
    preserveRoot: 'default',       // 'default' | 'no' | 'all'
    showHelp: false,               // --help
    showVersion: false             // --version
  };

  // Parse flags
  const files = [];
  let endOfOptions = false;
  for (const tok of tokens) {
    if (!tok) continue;
    if (endOfOptions) { files.push(tok); continue; }
    if (tok === '--') { endOfOptions = true; continue; }
    if (tok === '--help') { options.showHelp = true; continue; }
    if (tok === '--version') { options.showVersion = true; continue; }
    if (tok === '--force') { options.force = true; options.interactive = 'never'; continue; }
    if (tok === '--verbose') { options.verbose = true; continue; }
    if (tok === '--recursive') { options.recursive = true; continue; }
    if (tok === '--dir') { options.dir = true; continue; }
    if (tok === '--one-file-system') { options.oneFileSystem = true; continue; }
    if (tok === '--no-preserve-root') { options.preserveRoot = 'no'; continue; }
    if (tok === '--preserve-root') { options.preserveRoot = 'default'; continue; }
    if (tok.startsWith('--preserve-root=')) {
      const val = tok.split('=')[1];
      options.preserveRoot = val === 'all' ? 'all' : 'default';
      continue;
    }
    if (tok === '--interactive') { options.interactive = 'always'; continue; }
    if (tok.startsWith('--interactive=')) {
      const when = tok.split('=')[1];
      if (when === 'never' || when === 'once' || when === 'always') options.interactive = when;
      else options.interactive = 'always';
      continue;
    }
    if (tok.startsWith('--')) { files.push(tok); continue; }
    if (tok.startsWith('-') && tok.length > 1) {
      // short flags cluster
      for (let i = 1; i < tok.length; i++) {
        const c = tok[i];
        if (c === 'f') { options.force = true; options.interactive = 'never'; }
        else if (c === 'v') { options.verbose = true; }
        else if (c === 'r' || c === 'R') { options.recursive = true; }
        else if (c === 'd') { options.dir = true; }
        else if (c === 'i') { if (!options.force) options.interactive = 'always'; }
        else if (c === 'I') { if (!options.force) options.interactive = 'once'; }
        else { /* unknown short flag -> treat as operand */ files.push(tok); break; }
      }
      continue;
    }
    files.push(tok);
  }

  if (options.showHelp) {
    try {
      const helpText = require('fs').readFileSync(require('path').resolve(__dirname, '../help/rm.txt'), 'utf-8');
      console.log(helpText);
    } catch (err) {
      console.log('rm: help file not found.');
    }
    return;
  }
  if (options.showVersion) {
    console.log('rm (custom) 1.0.0');
    return;
  }

  if (files.length === 0) {
    console.error('rm: missing operand');
    return;
  }

  // Interactive once: if more than 3 files or any directory with recursive
  if (!options.force && options.interactive === 'once') {
    const many = files.length > 3;
    const anyRecursive = options.recursive;
    if (many || anyRecursive) {
      if (!promptYesNoSync('rm: remove files recursively or more than 3 files? ')) return;
    }
  }

  // Process each operand
  for (const operand of files) {
    const expandedOperand = expandTilde(String(operand));
    const targetPath = path.resolve(process.cwd(), expandedOperand);
    // Protect root unless --no-preserve-root
    const resolved = safeRealpath(targetPath) || targetPath;
    if (isRootPath(resolved)) {
      if (options.preserveRoot !== 'no') {
        console.error("rm: it is dangerous to operate recursively on '/'");
        console.error("rm: use --no-preserve-root to override this failsafe");
        continue;
      }
    }

    try {
      const rootDev = getDeviceId(resolved);
      removePath({
        p: targetPath,
        options,
        rootDev
      });
    } catch (err) {
      if (options.force && err && err.code === 'ENOENT') {
        // ignore
      } else {
        console.error(formatRmError(operand, err));
      }
    }
  }
}

function removePath(ctx) {
  const { p, options, rootDev } = ctx;
  let st;
  try {
    st = fs.lstatSync(p);
  } catch (err) {
    if (options.force && err && err.code === 'ENOENT') return;
    throw err;
  }

  // Files and symlinks
  if (!st.isDirectory() || st.isSymbolicLink()) {
    if (shouldPromptEach(options)) {
      const q = `rm: remove ${(st.isDirectory() ? 'directory' : 'file')} '${p}'? `;
      if (!promptYesNoSync(q)) return;
    }
    try {
      fs.unlinkSync(p);
      if (options.verbose) console.log(`removed '${p}'`);
    } catch (err) {
      if (options.force && err && (err.code === 'ENOENT' || err.code === 'EPERM')) return;
      throw err;
    }
    return;
  }

  // Directory
  if (!options.recursive && !options.dir) {
    const e = new Error('is a directory');
    e.code = 'EISDIR';
    throw e;
  }

  if (options.dir && !options.recursive) {
    // remove empty directory
    try {
      if (shouldPromptEach(options)) {
        const q = `rm: remove directory '${p}'? `;
        if (!promptYesNoSync(q)) return;
      }
      fs.rmdirSync(p);
      if (options.verbose) console.log(`removed directory '${p}'`);
      return;
    } catch (err) {
      if (options.force && err && err.code === 'ENOENT') return;
      throw err;
    }
  }

  // Recursive directory removal
  const entries = safeReadDir(p, options);
  for (const entry of entries) {
    const child = path.join(p, entry);
    let stChild;
    try { stChild = fs.lstatSync(child); } catch (e) { if (options.force) continue; else throw e; }
    if (options.oneFileSystem) {
      const dev = getDeviceId(child, stChild);
      if (dev != null && rootDev != null && dev !== rootDev && !stChild.isSymbolicLink()) {
        // skip different filesystem when not a symlink
        continue;
      }
    }
    removePath({ p: child, options, rootDev });
  }

  // Now remove the directory itself
  if (shouldPromptEach(options)) {
    const q = `rm: remove directory '${p}'? `;
    if (!promptYesNoSync(q)) return;
  }
  try {
    fs.rmdirSync(p);
    if (options.verbose) console.log(`removed directory '${p}'`);
  } catch (err) {
    if (options.force && err && err.code === 'ENOENT') return;
    throw err;
  }
}

function shouldPromptEach(options) {
  if (options.force) return false;
  return options.interactive === 'always';
}

function safeReadDir(p, options) {
  try {
    return fs.readdirSync(p);
  } catch (err) {
    if (options.force && err && err.code === 'ENOENT') return [];
    throw err;
  }
}

function getDeviceId(p, st) {
  try {
    const s = st || fs.statSync(p);
    return s.dev;
  } catch {
    return null;
  }
}

function isRootPath(p) {
  return path.resolve(p) === path.parse(p).root && path.parse(p).root === '/';
}

function safeRealpath(p) {
  try { return fs.realpathSync(p); } catch { return null; }
}

function expandTilde(p) {
  if (!p || typeof p !== 'string') return p;
  if (p === '~') return os.homedir();
  if (p.startsWith('~/')) return path.join(os.homedir(), p.slice(2));
  return p;
}

function promptYesNoSync(question) {
  try {
    fs.writeSync(1, question);
  } catch {}
  const buf = Buffer.alloc(1024);
  let bytes = 0;
  try {
    bytes = fs.readSync(0, buf, 0, 1024, null);
  } catch {
    return false;
  }
  const ans = buf.slice(0, bytes).toString().trim().toLowerCase();
  return ans === 'y' || ans === 'yes';
}

function formatRmError(operand, err) {
  if (!err || !err.code) return `rm: cannot remove '${operand}': ${String(err)}`;
  switch (err.code) {
    case 'ENOENT': return `rm: cannot remove '${operand}': No such file or directory`;
    case 'EISDIR': return `rm: cannot remove '${operand}': Is a directory`;
    case 'ENOTEMPTY': return `rm: cannot remove '${operand}': Directory not empty`;
    case 'EACCES':
    case 'EPERM': return `rm: cannot remove '${operand}': Permission denied`;
    default: return `rm: cannot remove '${operand}': ${err.message || err.code}`;
  }
}

module.exports = rmCommand;