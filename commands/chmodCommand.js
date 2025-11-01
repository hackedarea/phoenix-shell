const fs = require('fs');
const path = require('path');
const os = require('os');

function expandTilde(p) {
  if (!p || typeof p !== 'string') return p;
  if (p === '~') return os.homedir();
  if (p.startsWith('~/')) return path.join(os.homedir(), p.slice(2));
  return p;
}

function printHelp() {
  const helpPath = path.resolve(__dirname, '../help/chmod.txt');
  try {
    const txt = fs.readFileSync(helpPath, 'utf-8');
    console.log(txt);
  } catch {
    console.log('Usage: chmod [OPTION]... MODE[,MODE]... FILE...');
  }
}

function parseOctalMode(modeStr) {
  if (!modeStr) return null;
  const m = String(modeStr).trim();
  // Accept octal like 755, 0644, 777
  if (/^[0-7]{3,4}$/.test(m)) {
    return parseInt(m, 8);
  }
  return null;
}

function getFileMode(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.mode & 0o777;
  } catch {
    return null;
  }
}

function applySymbolicMode(currentMode, modeStr) {
  // Parse symbolic mode like u+x, g-w, a+r, u=rwx, etc.
  // Simplified implementation supporting common patterns
  const pattern = /^([ugoa]*)([-+=])([rwxXst]*|[ugo]|\d+)$/;
  const match = modeStr.match(pattern);
  if (!match) return null;

  const [, who, op, perms] = match;
  let whoMask = 0;
  
  // Determine who: u (user), g (group), o (other), a (all)
  if (!who || who.includes('a')) {
    whoMask = 0o777;
  } else {
    if (who.includes('u')) whoMask |= 0o700;
    if (who.includes('g')) whoMask |= 0o070;
    if (who.includes('o')) whoMask |= 0o007;
  }

  let newBits = 0;
  if (op === '=' || op === '+') {
    if (perms.match(/^[0-7]+$/)) {
      newBits = parseInt(perms, 8);
    } else if (perms === 'u') {
      newBits = (currentMode >> 6) & 0o7;
      newBits = (newBits << 6) | (newBits << 3) | newBits;
    } else if (perms === 'g') {
      newBits = (currentMode >> 3) & 0o7;
      newBits = (newBits << 6) | (newBits << 3) | newBits;
    } else if (perms === 'o') {
      newBits = currentMode & 0o7;
      newBits = (newBits << 6) | (newBits << 3) | newBits;
    } else {
      // Parse rwx
      if (perms.includes('r')) newBits |= 0o444;
      if (perms.includes('w')) newBits |= 0o222;
      if (perms.includes('x')) newBits |= 0o111;
      if (perms.includes('X')) {
        // X: execute/search if file is a directory OR any execute permission is already set
        // Since we don't have file context here, check if current mode has execute bits
        if (currentMode & 0o111) {
          newBits |= 0o111;
        }
      }
      if (perms.includes('s')) {
        if (who.includes('u')) newBits |= 0o4000;
        if (who.includes('g')) newBits |= 0o2000;
      }
      if (perms.includes('t')) newBits |= 0o1000;
    }
  }

  let result = currentMode;
  if (op === '=') {
    result = (result & ~whoMask) | (newBits & whoMask);
  } else if (op === '+') {
    result = result | (newBits & whoMask);
  } else if (op === '-') {
    result = result & ~(newBits & whoMask);
  }

  return result;
}

function parseMode(modeStr, currentMode) {
  // Try octal first
  const octal = parseOctalMode(modeStr);
  if (octal !== null) return octal;

  // Try symbolic
  if (currentMode !== null) {
    return applySymbolicMode(currentMode, modeStr);
  }

  return null;
}

function chmodFile(filePath, mode, options) {
  const expanded = expandTilde(filePath);
  const targetPath = path.resolve(process.cwd(), expanded);
  
  // Check preserve-root
  if (options.recursive && options.preserveRoot) {
    const resolved = path.resolve(targetPath);
    if (resolved === '/' || resolved === path.parse(resolved).root) {
      console.error("chmod: it is dangerous to operate recursively on '/'");
      console.error("chmod: use --no-preserve-root to override this failsafe");
      return false;
    }
  }

  try {
    const oldMode = getFileMode(targetPath);
    if (oldMode === null) {
      if (!options.silent) {
        console.error(`chmod: cannot access '${filePath}': No such file or directory`);
      }
      return false;
    }

    fs.chmodSync(targetPath, mode);
    
    if (options.verbose) {
      console.log(`mode of '${filePath}' changed from ${oldMode.toString(8).padStart(4, '0')} to ${mode.toString(8).padStart(4, '0')}`);
    } else if (options.changes && oldMode !== mode) {
      console.log(`mode of '${filePath}' changed from ${oldMode.toString(8).padStart(4, '0')} to ${mode.toString(8).padStart(4, '0')}`);
    }

    // Handle recursive
    if (options.recursive) {
      try {
        const stats = fs.statSync(targetPath);
        if (stats.isDirectory() && !stats.isSymbolicLink()) {
          const entries = fs.readdirSync(targetPath);
          for (const entry of entries) {
            const childPath = path.join(targetPath, entry);
            try {
              chmodFile(childPath, mode, options);
            } catch (err) {
              // Ignore errors in recursive traversal if silent
              if (!options.silent) {
                console.error(`chmod: cannot access '${childPath}': ${err.message}`);
              }
            }
          }
        }
      } catch (err) {
        // Ignore errors in recursive traversal if silent
        if (!options.silent) {
          console.error(`chmod: cannot access '${targetPath}': ${err.message}`);
        }
      }
    }

    return true;
  } catch (err) {
    if (!options.silent) {
      console.error(`chmod: cannot change permissions of '${filePath}': ${err.message}`);
    }
    return false;
  }
}

const chmodCommand = (args) => {
  const tokens = Array.isArray(args) ? args.slice() : String(args || '').trim().split(/\s+/);

  const options = {
    changes: false,              // -c, --changes
    silent: false,               // -f, --silent, --quiet
    verbose: false,              // -v, --verbose
    preserveRoot: true,          // --preserve-root (default true)
    recursive: false,            // -R, --recursive
    reference: null,             // --reference=RFILE
    showHelp: false,             // --help
    showVersion: false           // --version
  };

  const files = [];
  const modes = [];
  let endOfOpts = false;
  let foundReference = false;
  let foundMode = false;

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (!tok) continue;
    if (endOfOpts) {
      if (!foundMode && modes.length === 0) {
        modes.push(tok);
      } else {
        files.push(tok);
      }
      continue;
    }
    if (tok === '--') {
      endOfOpts = true;
      continue;
    }

    // Long options
    if (tok === '--help') {
      options.showHelp = true;
      continue;
    }
    if (tok === '--version') {
      options.showVersion = true;
      continue;
    }
    if (tok === '--changes') {
      options.changes = true;
      continue;
    }
    if (tok === '--silent' || tok === '--quiet') {
      options.silent = true;
      continue;
    }
    if (tok === '--verbose') {
      options.verbose = true;
      continue;
    }
    if (tok === '--no-preserve-root') {
      options.preserveRoot = false;
      continue;
    }
    if (tok === '--preserve-root') {
      options.preserveRoot = true;
      continue;
    }
    if (tok === '--recursive') {
      options.recursive = true;
      continue;
    }
    if (tok.startsWith('--reference=')) {
      options.reference = tok.split('=')[1];
      foundReference = true;
      continue;
    }
    if (tok === '--reference') {
      const next = tokens[i + 1];
      if (next && !next.startsWith('-')) {
        options.reference = next;
        foundReference = true;
        i++;
      } else {
        console.error("chmod: option '--reference' requires an argument");
        return;
      }
      continue;
    }

    // Short options
    if (tok.startsWith('-') && tok.length > 1 && tok !== '-') {
      for (let j = 1; j < tok.length; j++) {
        const c = tok[j];
        if (c === 'c') options.changes = true;
        else if (c === 'f') options.silent = true;
        else if (c === 'v') options.verbose = true;
        else if (c === 'R') options.recursive = true;
        else {
          // Unknown short option - might be part of mode or operand
          // If it looks like octal mode, treat as mode
          if (/^[0-7]+$/.test(tok.slice(j))) {
            modes.push(tok.slice(j));
            break;
          }
          // Otherwise treat as operand
          files.push(tok);
          break;
        }
      }
      continue;
    }

    // Non-option argument
    if (foundReference) {
      files.push(tok);
      continue;
    }

    // If it looks like a mode (octal or starts with u/g/o/a and has =/+/-, or is just =/+/with digits)
    if (!foundMode && (
      /^[0-7]{3,4}$/.test(tok) ||
      /^[ugoa]*[-+=]/.test(tok) ||
      /^[-+=][0-7]+$/.test(tok) ||
      /^[0-9]+$/.test(tok) // decimal that might be octal
    )) {
      modes.push(tok);
      foundMode = true;
      continue;
    }

    // Otherwise it's a file
    files.push(tok);
  }

  if (options.showHelp) {
    printHelp();
    return;
  }
  if (options.showVersion) {
    console.log('chmod (custom) 1.0.0');
    return;
  }

  if (files.length === 0) {
    console.error('chmod: missing operand');
    console.error("Try 'chmod --help' for more information.");
    return;
  }

  // Handle --reference
  if (options.reference) {
    const refPath = path.resolve(process.cwd(), expandTilde(options.reference));
    const targetMode = getFileMode(refPath);
    if (targetMode === null) {
      console.error(`chmod: cannot access '${options.reference}': No such file or directory`);
      return;
    }
    // Apply reference mode to all files
    for (const file of files) {
      chmodFile(file, targetMode, options);
    }
    return;
  }

  if (modes.length === 0) {
    // Check if first file argument looks like it might be an invalid mode
    if (files.length > 0) {
      const firstArg = files[0];
      // Check if it looks like a permission mode attempt (contains r/w/x or patterns with dashes)
      // but is missing the required operator (+/-/=)
      const looksLikeMode = /^[rwxRWX-]+$/.test(firstArg) && 
                           !/^[ugoa]*[-+=]/.test(firstArg) && // doesn't have valid operator
                           !/^[0-7]+$/.test(firstArg); // and isn't octal
      
      if (looksLikeMode) {
        console.error(`chmod: invalid mode: '${firstArg}'`);
        console.error('Modes must include an operator: + (add), - (remove), or = (set)');
        console.error('Examples: chmod +x file, chmod u+x file, chmod 755 file');
        return;
      }
    }
    console.error('chmod: missing operand after mode');
    console.error("Try 'chmod --help' for more information.");
    return;
  }

  // Parse mode(s) - handle comma-separated modes
  const modeStrings = [];
  for (const m of modes) {
    modeStrings.push(...m.split(','));
  }

  // Check if first mode is octal (can be applied to all files the same way)
  const firstMode = modeStrings[0];
  const isOctalMode = parseOctalMode(firstMode) !== null;
  
  if (isOctalMode) {
    // Octal mode: apply same mode to all files
    let targetMode = parseOctalMode(firstMode);
    
    // Apply remaining modes sequentially (though unlikely for octal)
    for (let i = 1; i < modeStrings.length; i++) {
      const newMode = parseOctalMode(modeStrings[i]);
      if (newMode !== null) {
        targetMode = newMode;
      }
    }

    // Apply to all files
    for (const file of files) {
      chmodFile(file, targetMode, options);
    }
  } else {
    // Symbolic mode: need to apply per-file since each file may have different current mode
    // Validate mode strings first
    for (const modeStr of modeStrings) {
      if (!/^[ugoa]*[-+=]/.test(modeStr) && !/^[-+=][0-7]+$/.test(modeStr)) {
        // Try decimal conversion
        const dec = parseInt(modeStr, 10);
        if (isNaN(dec) || dec.toString(8).length > 4) {
          console.error(`chmod: invalid mode: '${modeStr}'`);
          return;
        }
      }
    }

    // Apply symbolic modes to each file individually
    for (const file of files) {
      const filePath = path.resolve(process.cwd(), expandTilde(file));
      let currentMode = getFileMode(filePath);
      
      if (currentMode === null) {
        if (!options.silent) {
          console.error(`chmod: cannot access '${file}': No such file or directory`);
        }
        continue;
      }

      // Apply each mode string sequentially
      let targetMode = currentMode;
      for (const modeStr of modeStrings) {
        // Try symbolic first
        const symMode = applySymbolicMode(targetMode, modeStr);
        if (symMode !== null) {
          targetMode = symMode;
        } else {
          // Try octal
          const octMode = parseOctalMode(modeStr);
          if (octMode !== null) {
            targetMode = octMode;
          } else {
            // Try decimal
            const dec = parseInt(modeStr, 10);
            if (!isNaN(dec)) {
              targetMode = parseInt(dec.toString(8), 8);
            } else {
              console.error(`chmod: invalid mode: '${modeStr}'`);
              continue;
            }
          }
        }
      }

      chmodFile(file, targetMode, options);
    }
  }
};

module.exports = chmodCommand;