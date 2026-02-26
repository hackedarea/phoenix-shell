const fs = require("fs");
const path = require("path");
const os = require("os");

/**
 * Copies files and/or directories
 * Supports recursive copying, preserving file attributes, and no-clobber options
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
        const helpPath = path.join(__dirname, "..", "help", "cp.txt");
        const txt = fs.readFileSync(helpPath, "utf8");
        console.log(txt);
    } catch {
        console.log(`Usage: cp [OPTION]... SOURCE... DEST
Copy SOURCE to DEST, or multiple SOURCE(s) to DIRECTORY.

Options:
  -r, --recursive        copy directories recursively
  -v, --verbose          explain what is being done
  -n, --no-clobber       do not overwrite existing files
  -p, --preserve         preserve mode, ownership, and timestamps
  --help                 display this help and exit
  --version              output version information and exit`);
    }
}

function copyFile(src, dest, options) {
    try {
        // -n: no-clobber
        if (options.noClobber && fs.existsSync(dest)) {
            if (options.verbose) console.log(`cp: not overwriting existing '${dest}'`);
            return;
        }

        fs.copyFileSync(src, dest);

        if (options.preserve) {
            const stats = fs.statSync(src);
            fs.chmodSync(dest, stats.mode);
            fs.utimesSync(dest, stats.atime, stats.mtime);
        }

        if (options.verbose) {
            console.log(`'${src}' -> '${dest}'`);
        }
    } catch (err) {
        console.error(`cp: cannot copy '${src}' to '${dest}': ${err.message}`);
    }
}

function copyDir(src, dest, options) {
    try {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        const entries = fs.readdirSync(src, { withFileTypes: true });
        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            if (entry.isDirectory()) {
                copyDir(srcPath, destPath, options);
            } else {
                copyFile(srcPath, destPath, options);
            }
        }
    } catch (err) {
        console.error(`cp: error copying directory '${src}': ${err.message}`);
    }
}

// cp command funct
const cpCommand = (args) => {
    const tokens = Array.isArray(args)
        ? args.slice()
        : String(args || "").trim().split(/\s+/);

    const options = {
        recursive: false, // -r, --recursive
        verbose: false,   // -v, --verbose
        noClobber: false, // -n, --no-clobber
        preserve: false,  // -p, --preserve
        showHelp: false,  // --help
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
            case "-r":
            case "--recursive":
                options.recursive = true;
                continue;
            case "-v":
            case "--verbose":
                options.verbose = true;
                continue;
            case "-n":
            case "--no-clobber":
                options.noClobber = true;
                continue;
            case "-p":
            case "--preserve":
                options.preserve = true;
                continue;
            case "--help":
                options.showHelp = true;
                continue;
            case "--version":
                options.showVersion = true;
                continue;
            default:
                if (tok.startsWith("-") && tok.length > 2) {
                    const flags = tok.slice(1).split("");
                    for (const f of flags) {
                        if (f === "r") options.recursive = true;
                        else if (f === "v") options.verbose = true;
                        else if (f === "n") options.noClobber = true;
                        else if (f === "p") options.preserve = true;
                        else console.error(`cp: invalid option -- '${f}'`);
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
        console.log("Phoenix Shell (cp) 1.0.0");
        return;
    }

    if (files.length < 2) {
        console.error("cp: missing destination file operand after sources");
        console.error("Try 'cp --help' for more information.");
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
        console.error(`cp: target '${files[files.length - 1]}' is not a directory`);
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

            if (stat.isDirectory()) {
                if (!options.recursive) {
                    console.error(`cp: -r not specified; omitting directory '${src}'`);
                    continue;
                }
                copyDir(src, destPath, options);
            } else {
                copyFile(src, destPath, options);
            }
        } catch {
            console.error(`cp: cannot stat '${src}': No such file or directory`);
        }
    }
};

module.exports = cpCommand;