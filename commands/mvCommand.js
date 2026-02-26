const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Moves or renames files and directories
 * Supports interactive mode, force mode, no-clobber, and update options
 */

function expandHome(p) {
    if (!p) return p;
    if (p === "~") return os.homedir();
    if (p.startsWith("~/") || p.startsWith("~\\")) {
        return path.join(os.homedir(), p.slice(2));
    }
    return p;
}

function printHelp() {
    try {
        const helpPath = path.join(__dirname, "..", "help", "mv.txt");
        const txt = fs.readFileSync(helpPath, "utf8");
        console.log(txt);
    } catch {
        console.log(`Usage: mv [OPTION]... SOURCE... DESTINATION
Rename SOURCE to DEST, or move SOURCE(s) to DIRECTORY.

Options:
  -f, --force           do not prompt before overwriting
  -i, --interactive    prompt before overwrite
  -n, --no-clobber     do not overwrite an existing file
  -u, --update         move only when SOURCE is newer than DEST
  -v, --verbose        explain what is being done
  --help               display this help and exit
  --version            output version information and exit`);
    }
}

function moveFile(src, dest, options) {
    try {
        const srcStat = fs.statSync(src);
        let shouldMove = true;

        if (fs.existsSync(dest)) {
            const destStat = fs.statSync(dest);

            if (options.noClobber) {
                if (options.verbose) {
                    console.log(`mv: not overwriting '${dest}'`);
                }
                return;
            }

            if (options.update) {
                // Move only if source is newer
                if (srcStat.mtime <= destStat.mtime) {
                    if (options.verbose) {
                        console.log(`mv: '${dest}' is up to date`);
                    }
                    return;
                }
            }

            if (options.interactive && !options.force) {
                const rl = require('readline').createInterface({
                    input: process.stdin,
                    output: process.stdout
                });

                rl.question(`mv: overwrite '${dest}'? (y/n) `, answer => {
                    shouldMove = answer.toLowerCase() === 'y';
                    rl.close();
                    if (shouldMove) {
                        performMove();
                    }
                });
                return;
            }
        }

        performMove();

        function performMove() {
            fs.renameSync(src, dest);
            if (options.verbose) {
                console.log(`renamed '${src}' -> '${dest}'`);
            }
        }
    } catch (err) {
        if (err.code === 'EXDEV') {
            // Cross-device move - fallback to copy and delete
            try {
                fs.copyFileSync(src, dest);
                fs.unlinkSync(src);
                if (options.verbose) {
                    console.log(`moved '${src}' -> '${dest}'`);
                }
            } catch (copyErr) {
                console.error(`mv: cannot move '${src}' to '${dest}': ${copyErr.message}`);
            }
        } else {
            console.error(`mv: cannot move '${src}' to '${dest}': ${err.message}`);
        }
    }
}

const mvCommand = (args) => {
    const tokens = Array.isArray(args)
        ? args.slice()
        : String(args || "").trim().split(/\s+/);

    const options = {
        force: false,      // -f, --force
        interactive: false, // -i, --interactive
        noClobber: false,  // -n, --no-clobber
        update: false,     // -u, --update
        verbose: false,    // -v, --verbose
        showHelp: false,   // --help
        showVersion: false // --version
    };

    const files = [];
    let endOfOpts = false;

    for (let i = 0; i < tokens.length; i++) {
        const tok = tokens[i];
        if (!tok) continue;

        if (endOfOpts) {
            files.push(tok);
            continue;
        }

        if (tok === "--") {
            endOfOpts = true;
            continue;
        }

        switch (tok) {
            case "-f":
            case "--force":
                options.force = true;
                options.interactive = false;
                continue;
            case "-i":
            case "--interactive":
                options.interactive = true;
                options.force = false;
                continue;
            case "-n":
            case "--no-clobber":
                options.noClobber = true;
                continue;
            case "-u":
            case "--update":
                options.update = true;
                continue;
            case "-v":
            case "--verbose":
                options.verbose = true;
                continue;
            case "--help":
                options.showHelp = true;
                continue;
            case "--version":
                options.showVersion = true;
                continue;
            default:
                if (tok.startsWith("-") && tok.length > 1) {
                    const flags = tok.slice(1).split("");
                    for (const f of flags) {
                        if (f === "f") {
                            options.force = true;
                            options.interactive = false;
                        }
                        else if (f === "i") {
                            options.interactive = true;
                            options.force = false;
                        }
                        else if (f === "n") options.noClobber = true;
                        else if (f === "u") options.update = true;
                        else if (f === "v") options.verbose = true;
                        else console.error(`mv: invalid option -- '${f}'`);
                    }
                    continue;
                }
                files.push(tok);
        }
    }

    if (options.showHelp) {
        printHelp();
        return;
    }

    if (options.showVersion) {
        console.log("Phoenix Shell (mv) 1.0.3");
        return;
    }

    if (files.length < 2) {
        console.error("mv: missing destination file operand after sources");
        console.error("Try 'mv --help' for more information.");
        return;
    }

    const resolvedFiles = files.map(f =>
        path.resolve(process.cwd(), expandHome(f))
    );
    const sources = resolvedFiles.slice(0, -1);
    const dest = resolvedFiles[resolvedFiles.length - 1];

    // Multiple sources - destination must be directory
    let destStat;
    try {
        destStat = fs.statSync(dest);
    } catch (_) {
        destStat = null;
    }

    if (sources.length > 1 && (!destStat || !destStat.isDirectory())) {
        console.error(`mv: target '${files[files.length - 1]}' is not a directory`);
        return;
    }

    for (const src of sources) {
        try {
            const stat = fs.statSync(src);
            const baseName = path.basename(src);
            let destPath = dest;

            if (destStat && destStat.isDirectory()) {
                destPath = path.join(dest, baseName);
            }

            moveFile(src, destPath, options);
        } catch (err) {
            if (err.code === 'ENOENT') {
                console.error(`mv: cannot stat '${src}': No such file or directory`);
            } else {
                console.error(`mv: error accessing '${src}': ${err.message}`);
            }
        }
    }
};


module.exports = mvCommand;