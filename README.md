# 🐚 Phoenix Shell — Custom Node.js CLI Terminal

**Phoenix Shell** is a lightweight, interactive command-line shell built entirely in **Node.js**.  
It aims to mimic the behavior of common UNIX shells like **bash** or **zsh**, while exploring how real shells parse, interpret, and execute commands internally.

---

## 🚀 Features Implemented

### ✅ Core Shell Functionality
- Interactive prompt (`$`)
- Command parsing (supports multiple args, flags, and quoted strings)
- Error handling for unknown commands
- Built-in environment variable usage (`$PATH`, `$HOME`, etc.)

### ✅ Built-in Commands
| Command | Description |
|----------|-------------|
| `cat [flags] <file>` | Prints file conten, supports `-n`, `-b`, `-E`, `-T`, `-s`, `-A`, supports multiple files and absolute/relative paths |
| `cd [path]` | Changes the current working directory, supports `..`, `-`, `~`, and absolute paths |
| `clear` | Clears the terminal screen (ANSI-based) |
| `echo <text>` | Prints text to stdout |
| `exit <exit code>` | Exit the terminal (process will exit with the given code, default is 0) |
| `grep [flags] [path]` | Lists directory contents, supports `-n`, `-v`, and `--help` |
| `ifconfig [flags]` | Show network interfaces, supports `-a`, and `--help` |
| `ls [flags] [path]` | Lists directory contents, supports `-a`, `-l`, combined flags (`-al`, `-la`), and `--help` |
| `pwd` | Know your Present Working Directory, supported `-L`,`-P`, and `--help` |
| `type <command>` | Identifies whether a command is built-in or an external executable (searched via `$PATH`) |

---

## ⚙️ Technical Overview

- **Language:** Node.js (JavaScript)
- **Core Modules Used:**
  - `fs` → File system access
  - `path` → Cross-platform path handling
  - `readline` → Interactive input
  - `process` → Environment and working directory handling

### 🧩 Path Resolution
The shell includes a smart path resolver:
- Handles relative (`./`, `../`)
- Expands tilde (`~`)
- Resolves absolute paths (`/usr/bin`, `/help/file.txt`)
- Normalizes redundant segments

### 🧩 Command Parser
Robust parser that:
- Splits arguments safely (supports `"quoted strings"` and multiple spaces)
- Distinguishes between flags, arguments, and paths
- Ensures cross-platform compatibility using `path.delimiter` and `path.join`

---

## 🧠 Learning Goals

This project is designed to:
- Understand **how real shells interpret and execute commands**
- Explore **system-level file operations** in Node.js
- Learn **I/O handling**, **process management**, and **environment variables**
- Rebuild small portions of a *UNIX-like command ecosystem* from scratch

---

## 🧩 Project Structure

.
├── main.js # Core shell entry point
├── commands/ # (optional) Directory for modular commands
│ ├── lsCommand.js
│ ├── cdCommand.js
│ ├── catCommand.js
│ └── ...
├── help/ # Help files for built-in commands
│ ├── ls.txt
│ ├── cd.txt
│ ├── cat.txt
│ └── ...
└── README.md

---

## 🧪 Upcoming Features
- [ ] Add `touch`, `rm`, `mkdir`, and `chmod` commands  
- [ ] Implement piped commands (e.g., `cat file | grep text`)  
- [ ] Add command history navigation
- [ ] Introduce shell variables (`x=5`, `$x`)
- [ ] Support asynchronous execution (`&`)

---

## 💡 Usage

### Run in interactive mode:
```bash
git clone https://github.com/hackedarea/phoenix-terminal.git
npm i
node main.js
