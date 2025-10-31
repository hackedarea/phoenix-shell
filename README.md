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

| Command               | Description                                                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bae <command>`       | My own Package Manager (kidding, using the system's default package manager, but named as `bae`), go through with help file `--help` or just type `bae` |
| `cat [flags] <file>`  | Prints file conten, supports `-n`, `-b`, `-E`, `-T`, `-s`, `-A`, supports multiple files and absolute/relative paths                                    |
| `cd [path]`           | Changes the current working directory, supports `..`, `-`, `~`, and absolute paths                                                                      |
| `clear`               | Clears the terminal screen (ANSI-based)                                                                                                                 |
| `echo <text>`         | Prints text to stdout                                                                                                                                   |
| `exit <exit code>`    | Exit the terminal (process will exit with the given code, default is 0)                                                                                 |
| `grep [flags] [path]` | Lists directory contents, supports `-n`, `-v`, and `--help`                                                                                             |
| `ifconfig [flags]`    | Show network interfaces, supports `-a`, and `--help`                                                                                                    |
| `ls [flags] [path]`   | Lists directory contents, supports `-a`, `-l`, combined flags (`-al`, `-la`), and `--help`                                                              |
| `man <command>`       | Prints the help file's content of the given command, like - "man ls", "man cat", etc.                                                                   |
| `mkdir <flag> [path]` | Create directory in any place, supported `-m`,`-p`,`-v`,`-Z`, and `--help`                                                                              |
| `pwd`                 | Know your Present Working Directory, supported `-L`,`-P`, and `--help`                                                                                  |
| `rm <flag> [path]`    | Remove the directory, files of any type, supported `f`,`i`,`I`,`-r`,`-d`,`-v`,`--` and `--help`, also support combined flags like `-rf`                 |
| `type <command>`      | Identifies whether a command is built-in or an external executable (searched via `$PATH`)                                                               |

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

- Own Package Manager (`bae`)
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
- Rebuild small portions of a _UNIX-like command ecosystem_ from scratch

---

## 🧪 Upcoming Features

- [ ] Add `touch`, `chmod`, etc. commands
- [ ] Implement piped commands (e.g., `cat file | grep text`)
- [ ] Add command history navigation
- [ ] Introduce shell variables (`x=5`, `$x`)
- [ ] Support asynchronous execution (`&`)
- [ ] Stores history of commands

---

## 💡 Usage

### Run in interactive mode:

```bash
git clone https://github.com/hackedarea/phoenix-terminal.git
npm i
node main.js
```
