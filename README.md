# 🐚 Phoenix Shell - Rise of the Node-Powered Terminal 🔥  
_A minimal yet mighty shell that blends UNIX wisdom with JavaScript flexibility._

![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![Platform](https://img.shields.io/badge/platform-cross--platform-blue)
![License](https://img.shields.io/badge/license-MIT-yellow)
![Status](https://img.shields.io/badge/status-active-success)

---

**Phoenix Shell** is a lightweight, interactive command-line shell built entirely in **Node.js**.  
It mimics the behavior of common UNIX shells like **bash** or **zsh**, while revealing how real shells parse, interpret, and execute commands internally.

---

## 🚀 Features Implemented

### ✅ Core Shell Functionality
- Interactive prompt (`$`)
- Command parsing (supports multiple args, flags, and quoted strings)
- Error handling for unknown commands
- Built-in environment variable usage (`$PATH`, `$HOME`, etc.)

---

### ✅ Built-in Commands

| Command | Description |
|----------|-------------|
| `bae <command>` | 💖 My own “package manager soulmate” (actually uses the system’s default package manager, but named `bae`). Explore it using `--help` or just type `bae`. |
| `cat [flags] <file>` | Prints file content, supports `-n`, `-b`, `-E`, `-T`, `-s`, `-A`. Handles multiple files and both absolute/relative paths. |
| `cd [path]` | Changes the current working directory, supports `..`, `-`, `~`, and absolute paths. |
| `chmod [flags] [mode] [file]` | Changes the permissions of files for root, group, and other users. Supports `-c`, `-f`, `-v`, `-R`, `--help`, and `--version`. Accepts all modes like `rwx`, `777`, `444`, `u/g/o +,-,=` etc. |
| `clear` | Clears the terminal screen (ANSI-based). |
| `cp` | Copy the content of the file, supported `-r`,`-v`,`-n`,`-p`,`--version` and `--help`. |
| `echo <text>` | Prints text to stdout. |
| `exit <exit code>` | Exits the terminal (defaults to code `0`). |
| `grep [flags] [path]` | Searches content with support for `-n`, `-v`, and `--help`. |
| `ifconfig [flags]` | Shows network interfaces, supports `-a` and `--help`. |
| `ls [flags] [path]` | Lists directory contents, supports `-a`, `-l`, combined flags (`-al`, `-la`), and `--help`. |
| `man <command>` | Prints the help file content of the given command (e.g., `man ls`, `man cat`). |
| `mkdir <flags> [path]` | Creates directories, supports `-m`, `-p`, `-v`, `-Z`, and `--help`. |
| `pwd` | Prints the current working directory. Supports `-L`, `-P`, and `--help`. |
| `rm <flags> [path]` | Removes files or directories. Supports `-f`, `-i`, `-I`, `-r`, `-d`, `-v`, `--`, and combined flags (`-rf`). |
| `touch <flags> [File]` | Generate a file with a default permission `u=7`,`g=5`,`o=5` (`755`) if it does not exist in the given path (if not given then generated in current directory). |
| `type <command>` | Identifies whether a command is built-in or external (searched via `$PATH`). |

---

## ⚙️ Technical Overview

- **Language:** Node.js (JavaScript)
- **Core Modules Used:**
  - `fs` → File system access  
  - `path` → Cross-platform path handling  
  - `readline` → Interactive input  
  - `process` → Environment and working directory management  

---

### 🧩 Path Resolution
Phoenix Shell comes with an intelligent path resolver that:
- Expands tilde (`~`)
- Handles relative (`./`, `../`)
- Resolves absolute paths (`/usr/bin`, `/help/file.txt`)
- Normalizes redundant segments
- Integrates a custom alias: `bae` (default package manager shortcut)

---

### 🧩 Command Parser
The internal parser ensures reliable cross-platform execution:
- Handles `"quoted strings"` and multi-space inputs
- Splits and resolves arguments, flags, and paths safely
- Uses `path.delimiter` and `path.join` for clean path management

---

## 🧠 Learning Goals
Phoenix Shell is built as a deep-dive project to:
- Understand **how real shells interpret and execute commands**
- Explore **system-level file operations** in Node.js
- Learn **I/O handling**, **process management**, and **environment variables**
- Recreate essential parts of a UNIX-like command ecosystem in pure JavaScript

---

## 🧪 Upcoming Features

- [ ] Add more built-in commands like `cp`, `mv`, `systemctl`, etc.
- [ ] Implement piped commands (`cat file | grep text`)
- [ ] Add command history navigation
- [ ] Introduce shell variables (`x=5`, `$x`)
- [ ] Support asynchronous execution (`&`)
- [ ] Store user command history persistently

---

## 💡 Usage

### Run in interactive mode:
```bash
git clone https://github.com/hackedarea/phoenix-terminal.git
cd phoenix-terminal
npm install
node main.js