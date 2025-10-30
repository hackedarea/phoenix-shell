const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

// Only keep necessary parts

function which(cmd) {
  const res = spawnSync("which", [cmd], { encoding: "utf8" });
  if (res.status === 0) return res.stdout.trim();
  return null;
}

function getSystemPM() {
  // Priority order by common Linux distros
  if (which("apt")) return { name: "apt", map: mapApt };
  if (which("apt-get")) return { name: "apt-get", map: mapAptGet };
  if (which("dnf")) return { name: "dnf", map: mapDnf };
  if (which("yum")) return { name: "yum", map: mapYum };
  if (which("pacman")) return { name: "pacman", map: mapPacman };
  if (which("zypper")) return { name: "zypper", map: mapZypper };
  if (which("apk")) return { name: "apk", map: mapApk };
  return null;
}

function run(cmd, args) {
  const res = spawnSync(cmd, args, {
    stdio: "inherit",
    env: process.env,
  });
  return res.status || 0;
}

function isRoot() {
  try {
    return typeof process.getuid === 'function' && process.getuid() === 0;
  } catch {
    return false;
  }
}

function runMaybeSudo(cmd, args, elevate) {
  if (elevate) {
    return run("sudo", [cmd, ...args]);
  }
  return run(cmd, args);
}

// Mappers for subcommands to package manager invocations
function mapApt(sub, pkgs) {
  switch (sub) {
    case "install": return ["apt", ["install", "-y", ...pkgs]];
    case "remove": return ["apt", ["remove", "-y", ...pkgs]];
    case "update": return ["apt", ["update"]];
    case "upgrade": return ["apt", ["upgrade", "-y"]];
    case "search": return ["apt", ["search", ...pkgs]];
    default: return null;
  }
}
function mapAptGet(sub, pkgs) {
  switch (sub) {
    case "install": return ["apt-get", ["install", "-y", ...pkgs]];
    case "remove": return ["apt-get", ["remove", "-y", ...pkgs]];
    case "update": return ["apt-get", ["update"]];
    case "upgrade": return ["apt-get", ["upgrade", "-y"]];
    case "search": return ["apt-cache", ["search", ...pkgs]];
    default: return null;
  }
}
function mapDnf(sub, pkgs) {
  switch (sub) {
    case "install": return ["dnf", ["install", "-y", ...pkgs]];
    case "remove": return ["dnf", ["remove", "-y", ...pkgs]];
    case "update":
    case "upgrade": return ["dnf", ["upgrade", "-y"]];
    case "search": return ["dnf", ["search", ...pkgs]];
    default: return null;
  }
}
function mapYum(sub, pkgs) {
  switch (sub) {
    case "install": return ["yum", ["install", "-y", ...pkgs]];
    case "remove": return ["yum", ["remove", "-y", ...pkgs]];
    case "update":
    case "upgrade": return ["yum", ["update", "-y"]];
    case "search": return ["yum", ["search", ...pkgs]];
    default: return null;
  }
}
function mapPacman(sub, pkgs) {
  switch (sub) {
    case "install": return ["pacman", ["-S", "--noconfirm", ...pkgs]];
    case "remove": return ["pacman", ["-R", "--noconfirm", ...pkgs]];
    case "update":
    case "upgrade": return ["pacman", ["-Syu", "--noconfirm"]];
    case "search": return ["pacman", ["-Ss", ...pkgs]];
    default: return null;
  }
}
function mapZypper(sub, pkgs) {
  switch (sub) {
    case "install": return ["zypper", ["--non-interactive", "install", ...pkgs]];
    case "remove": return ["zypper", ["--non-interactive", "remove", ...pkgs]];
    case "update":
    case "upgrade": return ["zypper", ["--non-interactive", "update"]];
    case "search": return ["zypper", ["search", ...pkgs]];
    default: return null;
  }
}
function mapApk(sub, pkgs) {
  switch (sub) {
    case "install": return ["apk", ["add", ...pkgs]];
    case "remove": return ["apk", ["del", ...pkgs]];
    case "update": return ["apk", ["update"]];
    case "upgrade": return ["apk", ["upgrade"]];
    case "search": return ["apk", ["search", ...pkgs]];
    default: return null;
  }
}

function printHelp() {
  const helpPath = path.join(__dirname, "..", "help", "bae.txt");
  try {
    console.log(fs.readFileSync(helpPath, "utf8"));
  } catch {
    console.log("Usage: bae <install|remove|update|upgrade|search|run> [args]\n       bae --sudo <subcmd> ... to elevate with sudo\nTry 'bae --help' for more info.");
  }
}

function baeRun(cmd, args) {
  let elevate = false;
  const sudoIdx = args.indexOf("--sudo");
  if (sudoIdx !== -1) {
    elevate = true;
    args = args.slice(0, sudoIdx).concat(args.slice(sudoIdx + 1));
  }
  const status = runMaybeSudo(cmd, args, elevate);
  if (status !== 0) {
    console.log(chalk.red(`Failed to run: ${cmd}`));
  }
}

function baeCommand(args) {
  const [sub, ...restInit] = args;
  if (!sub || sub === "--help" || sub === "-h") {
    printHelp();
    return;
  }

  if (sub === "run") {
    if (restInit.length === 0) {
      console.log("bae run <binary> [args...]");
      return;
    }
    const bin = restInit[0];
    const bargs = restInit.slice(1);
    baeRun(bin, bargs);
    return;
  }

  const pm = getSystemPM();
  if (!pm) {
    console.log(chalk.red("No supported system package manager found (apt/dnf/yum/pacman/zypper/apk)."));
    return;
  }

  let rest = restInit;
  let elevate = false;
  const sudoFlagIndex = rest.indexOf("--sudo");
  if (sudoFlagIndex !== -1) {
    elevate = true;
    rest = rest.slice(0, sudoFlagIndex).concat(rest.slice(sudoFlagIndex + 1));
  }
  if (!elevate && (process.env.BAE_SUDO === '1' || process.env.BAE_SUDO === 'true')) {
    elevate = true;
  }
  const privileged = ["install", "remove", "update", "upgrade"];
  if (!elevate && !isRoot() && privileged.includes(sub)) {
    elevate = true;
  }

  const pkgs = rest;
  const mapped = pm.map(sub, pkgs);
  if (!mapped) {
    printHelp();
    return;
  }
  const [cmd, cmdArgs] = mapped;
  const status = runMaybeSudo(cmd, cmdArgs, elevate);
  if (status !== 0) {
    console.log(chalk.red(`bae: ${sub} failed with status ${status}`));
  }
}

module.exports = baeCommand;
