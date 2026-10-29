# -*- coding: utf-8 -*-
"""Generate complete learning_curriculum.json from the user's attached Complete Linux Guide.
Faithfully preserves all 30 chapters, tables, commands, warnings, tips, exercises, and cheatsheets.
"""

import json
import os

CURRICULUM = {
    "plans": [
        {
            "id": 1,
            "title": "Part One: Linux Basics",
            "slug": "linux-basics",
            "difficulty": "beginner",
            "estimated_hours": 4,
            "is_published": True,
            "order": 1,
            "description": "Everything you need to open a terminal, find your way around and start getting real work done.",
            "lessons": [
                {
                    "id": 1,
                    "title": "Chapter 1: What Linux Is",
                    "slug": "ch1-what-linux-is",
                    "order": 1,
                    "is_published": True,
                    "description": "Understand what Linux is, how kernels, distros, and shells interact, and safe ways to try it.",
                    "content": """# 1. What Linux Is

Linux is a free, open-source operating system. It runs most of the internet's servers, every Android phone, many supercomputers, smart TVs, routers and a growing number of personal laptops. Learning it gives you a skill that works almost everywhere in computing.

---

### The pieces that make up a Linux system

* **Kernel** – the core of the system. It talks to your hardware (CPU, memory, disks, network) and shares those resources between programs. The kernel itself is called Linux.
* **Distribution (distro)** – the kernel bundled with software, a package manager, a desktop and default settings. Ubuntu, Debian, Fedora, Arch and Linux Mint are all distros.
* **Shell** – the program that reads the commands you type and runs them. The most common one is Bash. Others include Zsh and Fish.
* **Terminal** – the window where you type to the shell. Sometimes called the console or command line.
* **Desktop environment** – the graphical interface (GNOME, KDE Plasma, Xfce). Optional – servers usually have none.

---

### Common distributions

| Distro | Known for | Package tool |
| :--- | :--- | :--- |
| **Ubuntu** | Very popular, huge community, long-term support (LTS) releases every two years. | `apt` |
| **Debian** | Stable and conservative. Ubuntu is built on it. | `apt` |
| **Linux Mint** | Ubuntu-based, familiar desktop for people coming from Windows. | `apt` |
| **Fedora** | Newer software, sponsored by Red Hat. Good for developers. | `dnf` |
| **RHEL / Rocky / AlmaLinux** | Enterprise servers. Rocky and Alma are free RHEL-compatible builds. | `dnf` |
| **Arch Linux** | Rolling release, you build the system yourself. Excellent documentation (Arch Wiki). | `pacman` |
| **openSUSE** | Strong admin tools (YaST), Leap or Tumbleweed (rolling). | `zypper` |

> **Tip:** All distros share the same core commands. What you learn in this guide works on every one of them. The main difference is the package manager (covered in Chapters 8 and 17).

---

### Ways to try Linux safely

1. **Live USB** – boot from a USB stick without installing anything.
2. **Virtual machine** – run Linux inside VirtualBox or VMware on your current computer.
3. **WSL2** – on Windows 10/11, run `wsl --install` in PowerShell to get a real Linux shell inside Windows.
4. **Cloud server** – rent a small server and connect with SSH.
5. **Dual boot** – install it next to your existing system on the same disk.
6. **In-Browser Terminal** – use the interactive terminal right here in DistroPedia Linux Lab!
""",
                    "exercises": []
                },
                {
                    "id": 2,
                    "title": "Chapter 2: The Terminal and Shell",
                    "slug": "ch2-terminal-and-shell",
                    "order": 2,
                    "is_published": True,
                    "description": "How commands are built, case sensitivity, getting help, and keyboard shortcuts that save hours.",
                    "content": """# 2. The Terminal and Shell

Almost everything in Linux can be done by typing commands. It feels slow at first, but it quickly becomes faster and more powerful than clicking, and it is the only interface available on most servers.

---

### Opening a terminal

On most desktops press **Ctrl + Alt + T**, or search for “Terminal” in the application menu. You will see a prompt like this:

```bash
jaya@mylaptop:~$
```

* `jaya` – your username
* `mylaptop` – the computer's hostname
* `~` – the current directory (`~` means your home folder)
* `$` – you are a normal user. A `#` instead means you are root (the administrator).

---

### How a command is built

```bash
command  [options]  [arguments]

ls  -l  /etc
```

* **Command** – the program to run (`ls`).
* **Options** (also called flags or switches) – change how it behaves. Short form uses one dash (`-l`), long form uses two (`--long`). Short options can be combined: `-l -a -h` is the same as `-lah`.
* **Arguments** – what to act on (a file, folder, or text).

> **Note:** Linux is case-sensitive. `Notes.txt`, `notes.txt` and `NOTES.TXT` are three different files. Spaces separate words, so a file name with spaces must be quoted: `cat "my file.txt"`.

---

### Getting help

You do not have to memorise everything. Linux documents itself.

| Command | What it does | Example |
| :--- | :--- | :--- |
| `man ls` | Opens the manual page for a command. Press `q` to quit, `/word` to search, `n` for next match. | `man grep` |
| `ls --help` | Short summary of options (works with most commands). | `cp --help` |
| `info coreutils` | More detailed GNU documentation. | `info tar` |
| `apropos keyword` | Searches manual pages by keyword. Same as `man -k`. | `apropos partition` |
| `whatis ls` | One-line description of a command. | `whatis chmod` |
| `type cd` | Tells you whether a command is a program, alias or shell built-in. | `type ll` |

---

### Keyboard shortcuts that save hours

| Shortcut | What it does |
| :--- | :--- |
| **Tab** | Auto-completes file and command names. Press twice to list all possibilities. |
| **Up / Down arrows** | Scroll through previous commands. |
| **Ctrl + C** | Stop the running command. |
| **Ctrl + D** | End input / log out of the shell. |
| **Ctrl + L** | Clear the screen (same as `clear`). |
| **Ctrl + A / Ctrl + E** | Jump to start / end of the line. |
| **Ctrl + U / Ctrl + K** | Delete everything before / after the cursor. |
| **Ctrl + W** | Delete the previous word. |
| **Ctrl + R** | Search your command history. Type part of an old command. |
| **Ctrl + Z** | Pause the running command (resume with `fg`). |
| **!!** | Repeats the last command. `sudo !!` re-runs it as root. |
""",
                    "exercises": [
                        {
                            "id": 1,
                            "title": "Inspect Command Types",
                            "slug": "inspect-command-types",
                            "order": 1,
                            "instructions": "In the terminal on the right, use the `type` command to check whether `cd` and `ls` are built-ins or programs:\n\n```bash\ntype cd\ntype ls\n```",
                            "hint": "Run `type cd` in the terminal to inspect how the shell interprets the cd command.",
                            "points": 10,
                            "verification_rules": [
                                {
                                    "rule_type": "command_exit_zero",
                                    "target": "type cd",
                                    "feedback_on_failure": "Run `type cd` in the terminal"
                                }
                            ]
                        }
                    ]
                },
                {
                    "id": 3,
                    "title": "Chapter 3: The File System Layout",
                    "slug": "ch3-file-system-layout",
                    "order": 3,
                    "is_published": True,
                    "description": "Understand the single root tree, standard directories, and absolute vs relative paths.",
                    "content": """# 3. The File System Layout

Linux has one single tree that starts at `/` (called root). There are no drive letters like `C:` – extra disks and USB sticks are attached (“mounted”) somewhere inside the tree. Everything is a file: documents, folders, devices and even running-process information.

---

### Standard Directory Hierarchy

| Location | What is in it |
| :--- | :--- |
| `/` | The top of the tree. Everything lives below it. |
| `/home` | Personal folders for each user, e.g. `/home/jaya`. Your documents and settings live here. |
| `/root` | Home folder of the root (administrator) user. |
| `/etc` | System-wide configuration files (text files you can edit). |
| `/bin`, `/sbin`, `/usr/bin` | Programs and commands. `sbin` holds admin tools. |
| `/usr` | Installed software, libraries and documentation. |
| `/var` | Data that changes: logs (`/var/log`), mail, databases, web content. |
| `/tmp` | Temporary files. Often cleared on reboot. |
| `/dev` | Device files such as disks (`/dev/sda`) and special ones like `/dev/null`. |
| `/proc`, `/sys` | Virtual files that show live information about processes, kernel and hardware. |
| `/mnt`, `/media` | Where external disks and USB drives are usually mounted. |
| `/opt` | Optional third-party software. |
| `/boot` | Kernel and boot loader files. |

---

### Paths

* **Absolute path** – starts from `/`: `/home/jaya/Documents/notes.txt`. Works from anywhere.
* **Relative path** – starts from where you are now: `Documents/notes.txt`.
* `.` means the current directory, `..` means the parent directory.
* `~` means your home directory. `~/Downloads` is the same as `/home/jaya/Downloads`.
* `-` (with `cd`) jumps back to the previous directory.
* Files starting with a dot (like `.bashrc`) are hidden. Show them with `ls -a`.
""",
                    "exercises": [
                        {
                            "id": 2,
                            "title": "Explore Root Directories",
                            "slug": "explore-root-dirs",
                            "order": 1,
                            "instructions": "List the directories located at the root of the file system:\n\n```bash\nls -d /*\n```",
                            "hint": "Type `ls -d /*` to view the top-level directories under /",
                            "points": 10,
                            "verification_rules": [
                                {
                                    "rule_type": "command_exit_zero",
                                    "target": "ls /",
                                    "feedback_on_failure": "Inspect the root directory with ls /"
                                }
                            ]
                        }
                    ]
                },
                {
                    "id": 4,
                    "title": "Chapter 4: Moving Around",
                    "slug": "ch4-moving-around",
                    "order": 4,
                    "is_published": True,
                    "description": "Master navigation using pwd, ls, cd, and essential command options.",
                    "content": """# 4. Moving Around

Navigation is the foundation of working in the terminal. Learn these core navigation tools:

| Command | What it does | Example |
| :--- | :--- | :--- |
| `pwd` | Print the directory you are in. | `pwd` |
| `ls` | List files and folders. | `ls -lah /var/log` |
| `cd` | Change directory. | `cd ~/Documents` |
| `tree` | Show folders as a tree (may need installing). | `tree -L 2` |

---

### ls options you will use daily

| Command | Meaning |
| :--- | :--- |
| `ls -l` | Long format: permissions, owner, size, date. |
| `ls -a` | Include hidden files (starting with `.`). |
| `ls -h` | Human-readable sizes (K, M, G). Use with `-l`. |
| `ls -t` | Sort by modification time, newest first. |
| `ls -R` | Recurse into sub-folders. |
| `ls -d */` | List only directories. |

---

### cd shortcuts

```bash
cd              # go to your home directory
cd ~            # same thing
cd ..           # up one level
cd ../..        # up two levels
cd -            # back to where you just were
cd /            # the top of the file system
```
""",
                    "exercises": [
                        {
                            "id": 3,
                            "title": "Check Current Directory & Move to /tmp",
                            "slug": "nav-pwd-cd",
                            "order": 1,
                            "instructions": "Run `pwd` to check your current directory, then navigate to `/tmp` and verify with `pwd`:\n\n```bash\npwd\ncd /tmp\npwd\ncd ~\n```",
                            "hint": "Run `pwd` followed by `cd /tmp` and then `cd ~`.",
                            "points": 10,
                            "verification_rules": [
                                {
                                    "rule_type": "command_exit_zero",
                                    "target": "pwd",
                                    "feedback_on_failure": "Run `pwd` in the terminal"
                                }
                            ]
                        }
                    ]
                },
                {
                    "id": 5,
                    "title": "Chapter 5: Working with Files and Folders",
                    "slug": "ch5-working-with-files-and-folders",
                    "order": 5,
                    "is_published": True,
                    "description": "Creating, copying, moving, renaming, deleting, viewing files, and wildcards.",
                    "content": """# 5. Working with Files and Folders

### Creating

```bash
touch notes.txt              # create an empty file (or update its timestamp)
mkdir projects               # create a folder
mkdir -p projects/web/css    # create nested folders in one go
```

---

### Copying, moving and renaming

```bash
cp notes.txt backup.txt          # copy a file
cp -r projects projects-old      # copy a folder (-r = recursive)
mv notes.txt Documents/          # move a file
mv old.txt new.txt               # rename (moving to the same folder)
```

---

### Deleting

```bash
rm notes.txt          # delete a file
rm -r projects-old    # delete a folder and everything inside
rm -i file.txt        # ask before deleting
rmdir emptyfolder     # delete an EMPTY folder only
```

> **Warning:** Linux has no recycle bin on the command line. `rm` is permanent. Never run `rm -rf /` or `rm -rf *` unless you are absolutely sure where you are. Run `pwd` and `ls` first. Using `rm -i` or `rm -I` adds a safety prompt.

---

### Looking inside files

| Command | What it does | Example |
| :--- | :--- | :--- |
| `cat file` | Print the whole file. | `cat /etc/os-release` |
| `less file` | Scroll a long file. `q` quits, `/text` searches. | `less /var/log/syslog` |
| `head -n 5 file` | First 5 lines. | `head -n 5 data.csv` |
| `tail -n 5 file` | Last 5 lines. | `tail -n 20 app.log` |
| `tail -f file` | Follow a file as it grows (great for logs). Ctrl+C to stop. | `tail -f app.log` |
| `wc -l file` | Count lines (also `-w` words, `-c` bytes). | `wc -l notes.txt` |
| `file name` | Tells you what type of file it is. | `file photo.jpg` |
| `stat name` | Detailed information: size, permissions, timestamps. | `stat notes.txt` |

---

### Wildcards

The shell expands these patterns into matching file names before the command runs.

| Pattern | What it does | Example |
| :--- | :--- | :--- |
| `*` | Any number of characters. | `ls *.txt` |
| `?` | Exactly one character. | `ls file?.txt` |
| `[abc]` | One character from the set. | `ls file[123].txt` |
| `{a,b}` | Brace expansion – creates several words. | `touch report_{jan,feb,mar}.txt` |
""",
                    "exercises": [
                        {
                            "id": 4,
                            "title": "Create Directory & File",
                            "slug": "create-dir-and-file",
                            "order": 1,
                            "instructions": "Create a folder named `lab5` and create a file inside it named `task.txt` with the text `Linux Rocks!`:\n\n```bash\nmkdir -p ~/lab5\necho 'Linux Rocks!' > ~/lab5/task.txt\ncat ~/lab5/task.txt\n```",
                            "hint": "Use mkdir -p ~/lab5 and echo 'Linux Rocks!' > ~/lab5/task.txt",
                            "points": 10,
                            "verification_rules": [
                                {
                                    "rule_type": "file_exists",
                                    "target": "/root/lab5/task.txt",
                                    "feedback_on_failure": "File ~/lab5/task.txt was not found"
                                },
                                {
                                    "rule_type": "file_contains",
                                    "target": "/root/lab5/task.txt",
                                    "expected_value": "Linux Rocks!",
                                    "feedback_on_failure": "File must contain 'Linux Rocks!'"
                                }
                            ]
                        }
                    ]
                },
                {
                    "id": 6,
                    "title": "Chapter 6: Editing Text in the Terminal",
                    "slug": "ch6-editing-text-in-terminal",
                    "order": 6,
                    "is_published": True,
                    "description": "Learn nano and the essential vim survival kit used across servers.",
                    "content": """# 6. Editing Text in the Terminal

### nano – the easy editor

Run `nano filename`. The shortcuts are shown at the bottom of the screen (`^` means Ctrl).

* **Ctrl + O** then Enter – save
* **Ctrl + X** – exit
* **Ctrl + W** – search
* **Ctrl + K** / **Ctrl + U** – cut / paste a line

---

### vim – the editor you will meet on every server

Vim has modes. You start in **Normal mode**, where keys are commands, not text. The survival kit:

| Keys | What happens |
| :--- | :--- |
| `i` | Enter **Insert mode** so you can type text. |
| `Esc` | Go back to **Normal mode**. |
| `:w` | Save. |
| `:q` | Quit. |
| `:wq` or `ZZ` | Save and quit. |
| `:q!` | Quit and throw away changes. |
| `dd` | Delete (cut) the current line. |
| `yy` / `p` | Copy a line / paste it. |
| `u` | Undo. |
| `/word` | Search for “word”. `n` for the next match. |
| `gg` / `G` | Jump to the top / bottom of the file. |

> **Tip:** Stuck in vim? Press **Esc** a couple of times, then type `:q!` and press Enter to leave without saving.
""",
                    "exercises": []
                },
                {
                    "id": 7,
                    "title": "Chapter 7: Permissions and sudo",
                    "slug": "ch7-permissions-and-sudo",
                    "order": 7,
                    "is_published": True,
                    "description": "Understand multi-user permissions, chmod syntax, and superuser privileges with sudo.",
                    "content": """# 7. Permissions and sudo

Linux is a multi-user system, so every file has an owner and rules about who can read, write or run it. Look at them with `ls -l`:

```bash
$ ls -l script.sh
-rwxr-xr-- 1 jaya devs 482 Oct 29 10:15 script.sh
```

| Part | Meaning |
| :--- | :--- |
| `-` | File type: `-` file, `d` directory, `l` symbolic link. |
| `rwx` | Owner (user) permissions: read, write, execute. |
| `r-x` | Group permissions: read and execute, no write. |
| `r--` | Everyone else: read only. |
| `jaya devs` | Owner and group of the file. |

---

### Changing permissions with chmod

```bash
chmod +x script.sh        # make a file executable
chmod u+w notes.txt       # add write for the owner
chmod go-r secret.txt     # remove read from group and others
chmod 644 notes.txt       # rw-r--r-- (numbers, explained in Chapter 14)
chmod 755 script.sh       # rwxr-xr-x
```

* **Letters:** `u` = user (owner), `g` = group, `o` = others, `a` = all.
* **Operators:** `+` add, `-` remove, `=` set exactly.

---

### Running as administrator

The root user can do anything, so you normally work as a regular user and borrow root power only when needed with `sudo` (“superuser do”):

```bash
sudo apt update          # run one command as root
sudo -i                  # open a root shell (be careful, exit when done)
whoami                   # shows who you are right now
```

> **Warning:** Treat `sudo` with respect. A command run with it can delete or overwrite anything. Read the command twice before pressing Enter, especially if you copied it from a website.
""",
                    "exercises": [
                        {
                            "id": 5,
                            "title": "Make a Script Executable",
                            "slug": "make-script-executable",
                            "order": 1,
                            "instructions": "Create a simple script `myscript.sh` and make it executable with `chmod +x`:\n\n```bash\necho '#!/bin/sh' > ~/myscript.sh\necho 'echo Hello from script' >> ~/myscript.sh\nchmod +x ~/myscript.sh\nls -l ~/myscript.sh\n~/myscript.sh\n```",
                            "hint": "Run chmod +x ~/myscript.sh to add execution permission.",
                            "points": 10,
                            "verification_rules": [
                                {
                                    "rule_type": "file_exists",
                                    "target": "/root/myscript.sh",
                                    "feedback_on_failure": "File ~/myscript.sh not found"
                                },
                                {
                                    "rule_type": "command_exit_zero",
                                    "target": "test -x /root/myscript.sh",
                                    "feedback_on_failure": "File must have executable (+x) permissions"
                                }
                            ]
                        }
                    ]
                },
                {
                    "id": 8,
                    "title": "Chapter 8: Installing Software",
                    "slug": "ch8-installing-software",
                    "order": 8,
                    "is_published": True,
                    "description": "How package managers work across distro families, and the everyday apt workflow.",
                    "content": """# 8. Installing Software

Instead of downloading installers from websites, Linux uses a package manager that fetches software from trusted repositories and keeps it updated. Which one you use depends on your distro.

---

### Package managers by distro family

| Distro family | Refresh package list | Install a package |
| :--- | :--- | :--- |
| **Ubuntu / Debian / Mint** | `sudo apt update` | `sudo apt install vlc` |
| **Fedora / RHEL / Rocky** | `sudo dnf check-update` | `sudo dnf install vlc` |
| **Arch / Manjaro** | `sudo pacman -Sy` | `sudo pacman -S vlc` |
| **openSUSE** | `sudo zypper refresh` | `sudo zypper install vlc` |

---

### The everyday apt workflow (Ubuntu / Debian)

```bash
sudo apt update               # refresh the list of available packages
sudo apt upgrade              # install available updates
sudo apt install htop         # install a program
sudo apt remove htop          # uninstall it
sudo apt autoremove           # clean up unused dependencies
apt search "text editor"      # search for packages
apt show htop                 # details about a package
```
""",
                    "exercises": []
                },
                {
                    "id": 9,
                    "title": "Chapter 9: Your First Practice Session",
                    "slug": "ch9-first-practice-session",
                    "order": 9,
                    "is_published": True,
                    "description": "A complete 10-minute hands-on practice session tying together all fundamentals from Part One.",
                    "content": """# 9. Your First Practice Session

Open your terminal on the right and work through this. It takes about ten minutes and uses almost everything from Part One.

---

### Step-by-Step Hands-On Workflow

1. **Find out where you are:**
   ```bash
   pwd
   ```

2. **Make a practice area:**
   ```bash
   mkdir -p ~/linux-practice/docs
   cd ~/linux-practice
   ```

3. **Create files:**
   ```bash
   touch docs/a.txt docs/b.txt
   ```

4. **Write into one and view it:**
   ```bash
   echo "Hello Linux" > docs/a.txt
   cat docs/a.txt
   ```

5. **Copy it:**
   ```bash
   cp docs/a.txt docs/c.txt
   ```

6. **Rename a file:**
   ```bash
   mv docs/b.txt docs/notes.txt
   ```

7. **List everything with details:**
   ```bash
   ls -lah docs
   ```

8. **Make a script, make it executable, and run it:**
   ```bash
   echo 'echo Hi there' > hello.sh
   chmod +x hello.sh
   ./hello.sh
   ```

9. **Clean up:**
   ```bash
   cd ~
   # rm -r linux-practice  # (Wait until verified!)
   ```

---

### Quick reference: the essential commands

| Command | Purpose |
| :--- | :--- |
| `pwd` | Show current directory |
| `ls -lah` | List all files with details |
| `cd dir` | Change directory |
| `mkdir -p a/b` | Create folders |
| `touch f` | Create empty file |
| `cp -r a b` | Copy |
| `mv a b` | Move or rename |
| `rm -r a` | Delete (permanent) |
| `cat / less f` | View file contents |
| `nano f` | Edit a file |
| `chmod +x f` | Make executable |
| `sudo cmd` | Run as administrator |
| `man cmd` | Read the manual |
| `history` | List past commands |
| `clear` | Clear the screen |
""",
                    "exercises": [
                        {
                            "id": 6,
                            "title": "Complete Practice Session Setup",
                            "slug": "practice-session-setup",
                            "order": 1,
                            "instructions": "Execute steps 2 through 8 of Chapter 9 in your terminal to set up the practice area:\n\n```bash\nmkdir -p ~/linux-practice/docs\necho 'Hello Linux' > ~/linux-practice/docs/a.txt\ncp ~/linux-practice/docs/a.txt ~/linux-practice/docs/c.txt\necho 'Notes' > ~/linux-practice/docs/notes.txt\necho 'echo Hi there' > ~/linux-practice/hello.sh\nchmod +x ~/linux-practice/hello.sh\n```",
                            "hint": "Make sure ~/linux-practice/docs/a.txt has 'Hello Linux' and hello.sh is executable.",
                            "points": 20,
                            "verification_rules": [
                                {
                                    "rule_type": "file_exists",
                                    "target": "/root/linux-practice/docs/a.txt",
                                    "feedback_on_failure": "~/linux-practice/docs/a.txt missing"
                                },
                                {
                                    "rule_type": "file_contains",
                                    "target": "/root/linux-practice/docs/a.txt",
                                    "expected_value": "Hello Linux",
                                    "feedback_on_failure": "a.txt must contain 'Hello Linux'"
                                },
                                {
                                    "rule_type": "file_exists",
                                    "target": "/root/linux-practice/docs/c.txt",
                                    "feedback_on_failure": "~/linux-practice/docs/c.txt missing"
                                },
                                {
                                    "rule_type": "command_exit_zero",
                                    "target": "test -x /root/linux-practice/hello.sh",
                                    "feedback_on_failure": "hello.sh must be executable"
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "id": 2,
            "title": "Part Two: Going Further",
            "slug": "linux-administration",
            "difficulty": "intermediate",
            "estimated_hours": 10,
            "is_published": True,
            "order": 2,
            "description": "Pipes, permissions, processes, networking, services, scripting, security and the habits of confident Linux users.",
            "lessons": [
                {
                    "id": 10,
                    "title": "Chapter 10: The Shell in Depth",
                    "slug": "ch10-shell-in-depth",
                    "order": 1,
                    "is_published": True,
                    "description": "Variables, PATH, quoting styles, chaining operators, aliases, and startup files.",
                    "content": """# 10. The Shell in Depth

### Variables

```bash
name="Jaya"                 # no spaces around =
echo "Hello, ${name}"       # use $name or ${name} to read it
echo "Today is $(date +%A)" # $(...) runs a command and inserts its output
export EDITOR=nano          # export makes it visible to programs you start
env                         # list all environment variables
printenv HOME               # show one
```

| Variable | Meaning |
| :--- | :--- |
| `$HOME` | Your home directory. |
| `$USER` | Your username. |
| `$PATH` | Colon-separated list of folders searched for commands. |
| `$PWD` | Current directory. |
| `$SHELL` | Your login shell. |
| `$?` | Exit status of the last command (0 = success, anything else = failure). |
| `$$` | Process ID of the current shell. |
| `$0, $1, $2 ...` | Script name and its arguments (inside scripts). |

---

### The PATH

When you type `ls`, the shell looks through every folder in `$PATH` until it finds a program called `ls`. To run your own tools from anywhere, add their folder:

```bash
echo $PATH
export PATH="$HOME/bin:$PATH"     # add ~/bin at the front (put in ~/.bashrc to keep it)
which python3                     # show which file would run
```

---

### Quoting

| Style | Behaviour | Example |
| :--- | :--- | :--- |
| Double quotes `"..."` | Spaces are preserved; variables and `$(...)` are still expanded. | `echo "Hi $USER"` |
| Single quotes `'...'` | Everything is literal. Nothing is expanded. | `echo 'Hi $USER'` |
| Backslash `\\` | Escapes the next character. | `echo \\$HOME` |

---

### Chaining commands

```bash
mkdir test ; cd test            # ; runs one after the other, no matter what
mkdir test && cd test           # && runs the second ONLY if the first succeeded
cd /nowhere || echo "failed"    # || runs the second ONLY if the first failed
sleep 60 &                      # & runs it in the background
```

---

### Aliases and startup files

An alias is a custom shortcut. Put aliases and settings in `~/.bashrc` (loaded for each new terminal) so they survive restarts.

```bash
alias ll='ls -lah'
alias update='sudo apt update && sudo apt upgrade'
alias gs='git status'
unalias ll                  # remove for this session

nano ~/.bashrc              # add lines here to make them permanent
source ~/.bashrc            # reload without opening a new terminal
```

| File | Purpose |
| :--- | :--- |
| `~/.bashrc` | Read by every new interactive terminal. Aliases, prompt, functions go here. |
| `~/.profile` or `~/.bash_profile` | Read at login. Good for environment variables. |
| `/etc/profile`, `/etc/bash.bashrc` | System-wide equivalents. |
| `~/.bash_history` | Saved command history. |

---

### History

```bash
history | tail -20       # last 20 commands
!123                     # re-run command number 123
!grep                    # re-run the most recent command starting with grep
Ctrl + R                 # search history interactively
```
""",
                    "exercises": []
                },
                {
                    "id": 11,
                    "title": "Chapter 11: Pipes and Redirection",
                    "slug": "ch11-pipes-and-redirection",
                    "order": 2,
                    "is_published": True,
                    "description": "Standard streams (stdin, stdout, stderr), redirection operators, pipes, tee and xargs.",
                    "content": """# 11. Pipes and Redirection

Each program has three data streams: **stdin** (input, number 0), **stdout** (normal output, 1) and **stderr** (error messages, 2). Redirection and pipes let you connect them. This idea – small tools that do one job and can be chained – is the heart of Linux.

---

### Redirection

| Syntax | Meaning | Example |
| :--- | :--- | :--- |
| `cmd > file` | Send output to a file, overwriting it. | `ls > list.txt` |
| `cmd >> file` | Append output to a file. | `date >> log.txt` |
| `cmd < file` | Read input from a file. | `sort < names.txt` |
| `cmd 2> file` | Send only error messages to a file. | `find / -name x 2> errors.txt` |
| `cmd > f 2>&1` | Send both output and errors to the same file. | `make > build.log 2>&1` |
| `cmd &> file` | Bash shortcut for the line above. | `make &> build.log` |
| `cmd > /dev/null` | Throw the output away. | `ping -c1 x > /dev/null` |

---

### Pipes

The pipe `|` feeds the output of one command into the input of the next.

```bash
ls -l | less                                # scroll a long listing
history | grep ssh                          # find old ssh commands
ps aux | grep nginx                         # is nginx running?
cat access.log | cut -d' ' -f1 | sort | uniq -c | sort -nr | head
#   ^ the top 10 IP addresses in a web server log
```

---

### tee and xargs

```bash
ls -l | tee list.txt                 # show on screen AND save to a file
echo "line" | sudo tee /etc/myfile   # write to a root-owned file (sudo > won't work)
echo "x" | sudo tee -a /etc/myfile   # -a appends

find . -name "*.tmp" | xargs rm      # turn lines of input into arguments
find . -name "*.tmp" -print0 | xargs -0 rm   # safe with spaces in names
```

> **Tip:** `sudo echo hi > /root/file` fails because the redirection `>` is done by your shell, not by sudo. Use `echo hi | sudo tee /root/file` instead.
""",
                    "exercises": [
                        {
                            "id": 7,
                            "title": "Pipes & Redirection Practice",
                            "slug": "pipes-redirection-practice",
                            "order": 1,
                            "instructions": "List `/bin` programs, pipe them to `grep sh`, and save the result in `~/shells.txt`:\n\n```bash\nls /bin | grep sh > ~/shells.txt\ncat ~/shells.txt\n```",
                            "hint": "Run `ls /bin | grep sh > ~/shells.txt` in the terminal.",
                            "points": 10,
                            "verification_rules": [
                                {
                                    "rule_type": "file_exists",
                                    "target": "/root/shells.txt",
                                    "feedback_on_failure": "~/shells.txt not found"
                                },
                                {
                                    "rule_type": "file_contains",
                                    "target": "/root/shells.txt",
                                    "expected_value": "sh",
                                    "feedback_on_failure": "File must contain matching shell names"
                                }
                            ]
                        }
                    ]
                },
                {
                    "id": 12,
                    "title": "Chapter 12: Finding Files and Searching Text",
                    "slug": "ch12-finding-files-and-searching-text",
                    "order": 3,
                    "is_published": True,
                    "description": "Find files with find/locate and search contents using grep, regex, and modern alternatives.",
                    "content": """# 12. Finding Files and Searching Text

### find – search by name, type, size, age

```bash
find /home -name "report.pdf"            # by exact name
find . -iname "*.jpg"                    # case-insensitive pattern
find . -type d -name "node_modules"      # directories only (-type f for files)
find / -size +500M 2>/dev/null           # files bigger than 500 MB
find . -mtime -7                         # modified in the last 7 days
find . -mtime +30 -name "*.log"          # older than 30 days
find . -user jaya                        # owned by a user
find . -perm -4000                       # files with the setuid bit
find . -name "*.tmp" -delete             # find and delete
find . -name "*.sh" -exec chmod +x {} \; # run a command on every match
```

---

### locate, which, whereis

```bash
sudo updatedb              # refresh the file index
locate nginx.conf          # instant search using the index
which python3              # path of the command that would run
whereis ls                 # binary, source and man page locations
```

---

### grep – search inside files

```bash
grep "error" app.log                 # lines containing "error"
grep -i "error" app.log              # ignore case
grep -n "error" app.log              # show line numbers
grep -v "debug" app.log              # lines that do NOT match
grep -c "error" app.log              # just count the matches
grep -r "TODO" ./src                 # search a whole folder recursively
grep -rl "password" /etc 2>/dev/null # only list file names
grep -w "cat" file.txt               # whole word only
grep -A2 -B2 "crash" app.log         # 2 lines of context after / before
grep -E "error|fail|fatal" app.log   # extended regex (alternatives)
grep -P "\\d{3}-\\d{4}" file.txt       # Perl-style regex
```

---

### Regular expressions cheat sheet

| Pattern | Matches |
| :--- | :--- |
| `.` | Any single character |
| `*` | Zero or more of the previous item |
| `+` `?` | One or more / zero or one (with `-E`) |
| `^` `$` | Start / end of a line |
| `[a-z]` `[0-9]` | A character from a range |
| `[^abc]` | Any character except a, b, c |
| `(a\|b)` | Either a or b (with `-E`) |
| `{2,4}` | Between 2 and 4 repeats (with `-E`) |
| `\\.` | A literal dot |

> **Modern alternatives:** `ripgrep` (`rg`) for code searching, `fd` for finding files, `fzf` for fuzzy finding, and `bat` as a modern cat.
""",
                    "exercises": []
                },
                {
                    "id": 13,
                    "title": "Chapter 13: Processing Text",
                    "slug": "ch13-processing-text",
                    "order": 4,
                    "is_published": True,
                    "description": "Stream text processing using sort, uniq, cut, tr, awk, sed, and column.",
                    "content": """# 13. Processing Text

Because Linux treats nearly everything as text, these tools let you analyse logs, CSVs and command output in one line.

| Command | What it does | Example |
| :--- | :--- | :--- |
| `sort` | Sort lines. `-n` numeric, `-r` reverse, `-u` unique, `-k2` by 2nd column. | `sort -nr sizes.txt` |
| `uniq` | Remove adjacent duplicates. `-c` counts. Usually used after sort. | `sort a.txt \| uniq -c` |
| `cut` | Extract columns. `-d` delimiter, `-f` field. | `cut -d: -f1 /etc/passwd` |
| `tr` | Translate or delete characters. | `echo HI \| tr A-Z a-z` |
| `paste` | Merge files side by side. | `paste a.txt b.txt` |
| `column -t` | Align output into a neat table. | `mount \| column -t` |
| `diff` | Show differences between two files. `-u` for unified format. | `diff -u old new` |
| `comm` | Compare two sorted files. | `comm -12 a b` |
| `wc` | Count lines, words, bytes. | `wc -l *.txt` |
| `jq` | Query and format JSON (install separately). | `curl -s url \| jq '.items[0]'` |

---

### awk – work with columns

awk splits every line into fields (`$1`, `$2`, …; `$0` is the whole line).

```bash
awk '{print $1}' file.txt                    # first column
awk -F: '{print $1, $3}' /etc/passwd         # custom separator: user and UID
awk '$3 > 1000 {print $1}' data.txt          # only rows where column 3 > 1000
awk '{sum += $2} END {print sum}' sales.txt  # add up a column
awk 'NR==5' file.txt                         # print line 5
```

---

### sed – find and replace in streams

```bash
sed 's/old/new/' file.txt           # replace first match on each line
sed 's/old/new/g' file.txt          # replace all matches
sed -i 's/old/new/g' file.txt       # edit the file in place
sed -i.bak 's/old/new/g' file.txt   # in place, but keep a .bak backup
sed -n '10,20p' file.txt            # print only lines 10-20
sed '/^#/d' config.conf             # delete comment lines
sed '/^$/d' file.txt                # delete empty lines
```

> **Tip:** Practice on a copy first, or use `sed -i.bak`. A wrong in-place edit cannot be undone.
""",
                    "exercises": []
                },
                {
                    "id": 14,
                    "title": "Chapter 14: Permissions in Depth",
                    "slug": "ch14-permissions-in-depth",
                    "order": 5,
                    "is_published": True,
                    "description": "Numeric octal permissions, ownership (chown), umask, setuid/setgid/sticky bits, and ACLs.",
                    "content": """# 14. Permissions in Depth

### Numeric (octal) notation

Each permission has a value: read = 4, write = 2, execute = 1. Add them up for each of the three groups (owner, group, others).

| Digit | Symbols | Meaning |
| :--- | :--- | :--- |
| `7` | `rwx` | 4+2+1 – full access |
| `6` | `rw-` | 4+2 – read and write |
| `5` | `r-x` | 4+1 – read and run |
| `4` | `r--` | read only |
| `0` | `---` | no access |

| Common | Symbols | Typical use |
| :--- | :--- | :--- |
| `644` | `rw-r--r--` | Normal files. Owner edits, everyone reads. |
| `600` | `rw-------` | Private files such as SSH keys. |
| `755` | `rwxr-xr-x` | Programs and folders. |
| `700` | `rwx------` | Private folder (e.g. `~/.ssh`). |
| `775` | `rwxrwxr-x` | Shared folder for a group. |

---

### Ownership

```bash
sudo chown jaya file.txt                  # change owner
sudo chown jaya:devs file.txt             # owner and group
sudo chown -R www-data:www-data /var/www   # recursive
sudo chgrp devs shared/                   # group only
chmod -R u=rwX,g=rX,o= project/           # recursive; X = execute only for folders
```

---

### Directory permissions behave differently

* `r` – you can list the names inside.
* `w` – you can create, rename or delete entries inside.
* `x` – you can enter it (`cd`) and access files within. Without `x`, the folder is a dead end.

---

### umask – default permissions

`umask` removes permissions from new files. With the common `022`, new files become `644` and new folders `755`. Check it by running `umask`; set it in `~/.bashrc` if needed (`umask 027` is stricter).

---

### Special permission bits

| Bit | Effect | Set with |
| :--- | :--- | :--- |
| **setuid (4000)** | A program runs with the owner's rights. `passwd` uses this. Shown as `s` in owner position. | `chmod u+s file` |
| **setgid (2000)** | Program runs as the group; on a folder, new files inherit folder's group. | `chmod g+s dir` |
| **sticky bit (1000)** | In a shared folder, only the owner can delete a file. `/tmp` uses it (`t`). | `chmod +t dir` |

---

### ACLs and attributes

```bash
getfacl report.txt                    # view access control list
setfacl -m u:alice:rw report.txt      # give one extra user read+write
setfacl -x u:alice report.txt         # remove that entry
lsattr file                           # view file attributes
sudo chattr +i important.conf         # make immutable: not even root can edit/delete
sudo chattr -i important.conf         # undo
```
""",
                    "exercises": []
                },
                {
                    "id": 15,
                    "title": "Chapter 15: Users and Groups",
                    "slug": "ch15-users-and-groups",
                    "order": 6,
                    "is_published": True,
                    "description": "Managing users, groups, /etc/passwd, /etc/shadow, and sudoers configuration via visudo.",
                    "content": """# 15. Users and Groups

| Command | What it does | Example |
| :--- | :--- | :--- |
| `whoami` / `id` | Show current user, UID, GID and group memberships. | `id jaya` |
| `who` / `w` / `last` | Who is logged in now / login history. | `last -n 10` |
| `sudo adduser name` | Create a user interactively (Debian/Ubuntu). | `sudo adduser sam` |
| `sudo useradd -m -s /bin/bash name` | Create a user (all distros). `-m` makes home folder. | `sudo useradd -m -s /bin/bash sam` |
| `sudo passwd name` | Set or change a password. | `sudo passwd sam` |
| `sudo usermod -aG group name` | Add a user to a group. Always include `-a`. | `sudo usermod -aG sudo sam` |
| `sudo userdel -r name` | Delete a user and their home folder. | `sudo userdel -r sam` |
| `sudo groupadd name` | Create a group. | `sudo groupadd devs` |
| `groups name` | List groups of a user. | `groups sam` |
| `su - name` | Switch user (asks for that user's password). | `su - sam` |
| `sudo passwd -l name` | Lock an account. `-u` unlocks. | `sudo passwd -l sam` |

> **Warning:** `usermod -G` without `-a` replaces all the user's groups instead of adding one. Always write `-aG`.

---

### Important account files

| File | Contains |
| :--- | :--- |
| `/etc/passwd` | List of users: name, UID, GID, home, shell. Readable by everyone. |
| `/etc/shadow` | Password hashes. Readable only by root. |
| `/etc/group` | List of groups and their members. |
| `/etc/sudoers` | Who may use sudo. Edit only with `sudo visudo`, which checks syntax. |

```bash
# Example line in sudoers (via visudo) giving a group full sudo rights:
%admins ALL=(ALL:ALL) ALL

# Allow one user to restart nginx without a password:
sam ALL=(root) NOPASSWD: /bin/systemctl restart nginx
```

UIDs below 1000 are normally system accounts (services). Regular users usually start at 1000. UID 0 is root.
""",
                    "exercises": []
                },
                {
                    "id": 16,
                    "title": "Chapter 16: Processes and Jobs",
                    "slug": "ch16-processes-and-jobs",
                    "order": 7,
                    "is_published": True,
                    "description": "Viewing processes with ps and top, signals, killing processes, background jobs, and tmux.",
                    "content": """# 16. Processes and Jobs

A process is a running program. Each has a number (PID), an owner, and a parent.

---

### Viewing processes

```bash
ps aux                     # every process, with CPU and memory use
ps -ef --forest            # tree view showing parent/child
ps -u jaya                 # processes of one user
pgrep -a nginx             # find PIDs by name
top                        # live view (q quits)
htop                       # friendlier live view (install it)
pstree -p                  # process tree
```

In `top`, press **M** to sort by memory, **P** by CPU, **k** to kill a process, **1** to show each CPU core.

---

### Stopping processes

```bash
kill 1234              # ask PID 1234 to terminate nicely (SIGTERM, signal 15)
kill -9 1234           # force kill (SIGKILL) – last resort, no cleanup
pkill firefox          # by name
killall node           # all processes with this name
kill -HUP 1234         # many daemons reload config on SIGHUP
```

| Signal | Meaning |
| :--- | :--- |
| `SIGTERM (15)` | Polite request to stop. The default for kill. |
| `SIGKILL (9)` | Cannot be caught. Immediately removes the process. |
| `SIGINT (2)` | What Ctrl+C sends. |
| `SIGHUP (1)` | Hang up. Often means “reload your configuration”. |
| `SIGSTOP / SIGCONT` | Pause / resume (Ctrl+Z / fg). |

---

### Foreground, background and job control

```bash
long-task &            # start in the background
jobs                   # list jobs of this shell
Ctrl + Z               # pause the foreground job
bg %1                  # resume job 1 in the background
fg %1                  # bring job 1 to the foreground
nohup ./script.sh &    # keep running after you close terminal
disown %1              # detach a job from the shell
```

---

### Priorities & tmux

```bash
nice -n 10 ./heavy-job           # start with lower priority (range -20 to 19)
renice -n 5 -p 1234              # change priority of a running process
```

**tmux – sessions that survive disconnects:**
```bash
tmux new -s work       # start named session
# Ctrl+B then d        # detach
tmux ls                # list sessions
tmux attach -t work    # reattach
```
""",
                    "exercises": []
                },
                {
                    "id": 17,
                    "title": "Chapter 17: Package Management in Depth",
                    "slug": "ch17-package-management-in-depth",
                    "order": 8,
                    "is_published": True,
                    "description": "Advanced package management: apt/dpkg, dnf/rpm, pacman, universal formats, and source compilation.",
                    "content": """# 17. Package Management in Depth

### apt / dpkg (Debian, Ubuntu, Mint)

```bash
sudo apt update && sudo apt full-upgrade     # refresh lists and upgrade everything
apt list --installed | grep nginx            # is it installed?
apt policy nginx                             # installed vs available versions
sudo apt install nginx=1.24.0-1              # pin a specific version
sudo apt-mark hold nginx                     # prevent upgrades of a package
sudo apt purge nginx                         # remove including config files
sudo apt install ./app.deb                   # install a downloaded .deb
dpkg -L nginx                                # files installed by a package
dpkg -S /usr/sbin/nginx                      # which package owns a file
```

Third-party repositories are listed in `/etc/apt/sources.list` and `/etc/apt/sources.list.d/`.

---

### dnf / rpm (Fedora, RHEL, Rocky, Alma)

```bash
sudo dnf upgrade                  # update everything
sudo dnf install nginx
sudo dnf remove nginx
dnf search "web server"
dnf info nginx
dnf provides */nmap               # which package contains this file?
dnf history                       # list transactions; 'dnf history undo N' reverses one
rpm -qa | grep kernel             # all installed RPMs
rpm -ql nginx                     # files in a package
```

---

### pacman (Arch)

```bash
sudo pacman -Syu                  # sync and upgrade whole system
sudo pacman -S nginx              # install
sudo pacman -Rns nginx            # remove with unused dependencies and configs
pacman -Ss keyword                # search
pacman -Qi nginx                  # info on installed package
pacman -Qdtq | sudo pacman -Rns - # remove orphans
```

---

### Universal formats & building from source

| Format | Notes | Example |
| :--- | :--- | :--- |
| **Snap** | Canonical's sandboxed packages. | `sudo snap install code --classic` |
| **Flatpak** | Sandboxed desktop apps from Flathub. | `flatpak install flathub org.gimp.GIMP` |
| **AppImage** | Single downloadable file. `chmod +x` and run. | `./App.AppImage` |

**Building from source:**
```bash
sudo apt install build-essential        # compilers and tools
tar xf program-1.0.tar.gz && cd program-1.0
./configure --prefix=/usr/local         # check dependencies, set options
make -j"$(nproc)"                       # compile using all CPU cores
sudo make install                       # install
```
""",
                    "exercises": []
                },
                {
                    "id": 18,
                    "title": "Chapter 18: Disks, File Systems and Links",
                    "slug": "ch18-disks-file-systems-and-links",
                    "order": 9,
                    "is_published": True,
                    "description": "Block devices, df/du, fdisk, mkfs, /etc/fstab, ext4/xfs/btrfs, and hard vs symbolic links.",
                    "content": """# 18. Disks, File Systems and Links

### Seeing what you have

```bash
lsblk -f                  # block devices, file systems, mount points
df -hT                    # free space on mounted file systems
du -sh *                  # size of each item in the current folder
du -h --max-depth=1 / 2>/dev/null | sort -h   # which top-level folders are biggest
sudo blkid                # UUIDs of partitions
findmnt                   # tree of mounts
free -h                   # memory and swap
```

---

### Partitioning, formatting and mounting

```bash
sudo fdisk -l                          # list disks and partitions
sudo fdisk /dev/sdb                    # interactive partitioning (n new, w write)
sudo mkfs.ext4 /dev/sdb1               # create an ext4 file system
sudo mkdir -p /mnt/data
sudo mount /dev/sdb1 /mnt/data         # mount
sudo umount /mnt/data                  # unmount
```

> **Warning:** Formatting or partitioning the wrong device destroys data. Always double-check device names with `lsblk` before running `mkfs`, `fdisk` or `dd`.

---

### Mounting at boot – /etc/fstab

Each line of `/etc/fstab` describes one mount. Using UUID is safer than `/dev/sdb1` because names can change:

```
UUID=3f2a1c9e-7d4b-4a55-9c1e-0a1b2c3d4e5f  /mnt/data  ext4  defaults,nofail  0  2
```

Test before rebooting: `sudo mount -a`. If it prints nothing, the file is valid.

---

### Links: Symbolic vs Hard

```bash
ln -s /var/www/site ~/site       # symbolic (soft) link – points to path
ln file.txt hardlink.txt         # hard link – another name for the same data
readlink -f ~/site               # where does a link really point?
ls -li                           # show inode numbers
```

* A **symbolic link** breaks if the target is moved or deleted. It can point to folders and across file systems.
* A **hard link** is an extra name for the same data (same inode). Data remains until all names are deleted. It must stay on the same file system.
""",
                    "exercises": []
                },
                {
                    "id": 19,
                    "title": "Chapter 19: Archives, Compression and Backups",
                    "slug": "ch19-archives-compression-backups",
                    "order": 10,
                    "is_published": True,
                    "description": "Archiving with tar, gzip/xz/zip, incremental rsync, and robust 3-2-1 backup strategies.",
                    "content": """# 19. Archives, Compression and Backups

### tar

```bash
tar -cvf backup.tar folder/             # create archive (c=create v=verbose f=file)
tar -czvf backup.tar.gz folder/         # create gzip-compressed (.tar.gz / .tgz)
tar -cJvf backup.tar.xz folder/         # xz compression (smaller, slower)
tar -tf backup.tar.gz                   # list contents without extracting
tar -xzvf backup.tar.gz                 # extract
tar -xzvf backup.tar.gz -C /tmp/restore # extract into a chosen folder
tar --exclude='*.log' -czf site.tgz /var/www
```

---

### Single-file compressors and zip

```bash
gzip file.txt        # creates file.txt.gz and removes original
gunzip file.txt.gz
xz file.txt          # better compression
bzip2 file.txt
zip -r site.zip site/
unzip site.zip -d output/
zcat file.gz | head  # read compressed file without unpacking
```

---

### rsync – the right tool for copying and backups

`rsync` copies only what changed, can resume, and works over SSH:

```bash
rsync -av ~/Documents/ /mnt/backup/Documents/      # archive mode, verbose
rsync -avh --progress src/ user@server:/backups/   # to a remote machine
rsync -av --delete src/ dest/                      # make dest an exact mirror
rsync -avn --delete src/ dest/                     # -n = dry run, preview only
```

> **Note:** A trailing slash matters: `src/` copies the contents of src, while `src` copies the folder itself.

---

### A sensible backup habit

1. Keep **3 copies**, on **2 different kinds of storage**, with **1 off-site**.
2. Automate it with cron or a systemd timer.
3. Tools such as `restic`, `borgbackup` and `timeshift` add encryption, deduplication and snapshots.
4. **Test restores.** A backup you have never restored is only a hope.
""",
                    "exercises": []
                },
                {
                    "id": 20,
                    "title": "Chapter 20: Networking",
                    "slug": "ch20-networking",
                    "order": 11,
                    "is_published": True,
                    "description": "Inspecting network interfaces with ip/ss, connectivity testing, curl/wget, and firewall setup.",
                    "content": """# 20. Networking

### Inspecting your network

```bash
ip -br a                    # interfaces and IP addresses (brief)
ip route                    # routing table, shows default gateway
ip neigh                    # ARP table
ss -tulpn                   # listening ports and programs using them
ss -tan state established   # current TCP connections
hostname -I                 # your IP addresses
hostnamectl                 # hostname and OS info
nmcli device status         # NetworkManager overview
```

> **Note:** The old `ifconfig`, `netstat` and `route` commands are deprecated. Use `ip` and `ss`.

---

### Testing connectivity

```bash
ping -c 4 8.8.8.8           # is the internet reachable (by IP)?
ping -c 4 example.com       # ...and DNS working?
traceroute example.com      # path packets take (or: tracepath, mtr)
mtr example.com             # live combined ping + traceroute
dig example.com             # DNS lookup in detail
dig +short MX example.com   # just the mail records
nc -zv server 443           # test if a TCP port is open
```

---

### Downloading and talking to web servers

```bash
curl https://example.com                          # print the page
curl -I https://example.com                       # headers only
curl -O https://example.com/file.zip              # save with remote name
curl -L -o out.html https://short.link/x          # follow redirects, choose name
curl -X POST -H "Content-Type: application/json" \\
     -d '{"name":"Jaya"}' https://api.example.com/users

wget https://example.com/file.zip                 # simple downloader
wget -c URL                                       # resume interrupted download
```

---

### Firewalls (ufw example)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp           # ALWAYS allow SSH before enabling!
sudo ufw allow 80,443/tcp
sudo ufw enable
sudo ufw status verbose
```
""",
                    "exercises": []
                },
                {
                    "id": 21,
                    "title": "Chapter 21: SSH and Remote Work",
                    "slug": "ch21-ssh-and-remote-work",
                    "order": 12,
                    "is_published": True,
                    "description": "Secure Shell, key-based authentication, config shortcuts, SSH tunnels, and server hardening.",
                    "content": """# 21. SSH and Remote Work

SSH (Secure Shell) lets you log in to and control another machine over an encrypted connection.

```bash
ssh user@192.168.1.20            # log in
ssh -p 2222 user@host            # non-standard port
ssh user@host "uptime"           # run one command and return
scp file.txt user@host:/tmp/     # copy a file to server
scp -r user@host:/var/log/app .  # copy folder from server
sftp user@host                   # interactive file transfer
```

---

### Key-based login (more secure than passwords)

1. Create a key pair on your own computer:
   ```bash
   ssh-keygen -t ed25519 -C "jaya@laptop"
   ```
2. Copy public key to server:
   ```bash
   ssh-copy-id user@host
   ```
3. Log in without a password prompt.

> **Important:** Never share the private key (`~/.ssh/id_ed25519`). Only `id_ed25519.pub` is shareable. Correct permissions are required: `~/.ssh` must be `700` and private keys `600`, otherwise SSH refuses to use them.

---

### ~/.ssh/config shortcuts

```ini
Host prod
    HostName 203.0.113.10
    User deploy
    Port 2222
    IdentityFile ~/.ssh/id_ed25519

# now simply connect with:
# ssh prod
```

---

### Tunnels & Server Hardening

```bash
ssh -L 8080:localhost:80 user@server     # local port 8080 -> server's port 80
ssh -R 9000:localhost:3000 user@server   # expose local 3000 on server
ssh -D 1080 user@server                  # SOCKS proxy
```

**Hardening `/etc/ssh/sshd_config`:**
```ini
PermitRootLogin no
PasswordAuthentication no      # only after keys work!
PubkeyAuthentication yes
AllowUsers jaya deploy
```
Validate and reload: `sudo sshd -t && sudo systemctl reload ssh`.
""",
                    "exercises": []
                },
                {
                    "id": 22,
                    "title": "Chapter 22: Services with systemd",
                    "slug": "ch22-services-with-systemd",
                    "order": 13,
                    "is_published": True,
                    "description": "Managing systemd services, writing custom unit files, targets, and overrides.",
                    "content": """# 22. Services with systemd

On almost every modern distro systemd starts the system and manages background services (called units).

```bash
systemctl status nginx              # state, recent logs, PID
sudo systemctl start nginx          # start now
sudo systemctl stop nginx
sudo systemctl restart nginx        # stop then start
sudo systemctl reload nginx         # re-read config without dropping connections
sudo systemctl enable nginx         # start automatically at boot
sudo systemctl enable --now nginx   # enable and start together
sudo systemctl disable nginx
systemctl is-active nginx           # quick check, handy in scripts
systemctl list-units --type=service --state=running
systemctl --failed                  # what has failed?
sudo systemctl daemon-reload        # after editing unit files
```

---

### Writing your own service

Create `/etc/systemd/system/myapp.service`:

```ini
[Unit]
Description=My Node app
After=network.target

[Service]
User=deploy
WorkingDirectory=/opt/myapp
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now myapp
journalctl -u myapp -f              # watch its logs live
```
""",
                    "exercises": []
                },
                {
                    "id": 23,
                    "title": "Chapter 23: Scheduling Tasks",
                    "slug": "ch23-scheduling-tasks",
                    "order": 14,
                    "is_published": True,
                    "description": "Cron job syntax and management, at one-off scheduling, and systemd timers.",
                    "content": """# 23. Scheduling Tasks

### cron

Edit your schedule with `crontab -e`. Each line has five time fields followed by the command:

```
# ┌ minute (0-59)
# │ ┌ hour (0-23)
# │ │ ┌ day of month (1-31)
# │ │ │ ┌ month (1-12)
# │ │ │ │ ┌ day of week (0-7, Sun = 0 or 7)
# │ │ │ │ │
# * * * * *  command

0 2 * * *     /home/jaya/backup.sh            # every day at 02:00
*/15 * * * *  /usr/bin/check-site.sh          # every 15 minutes
30 8 * * 1-5  /home/jaya/report.sh            # 08:30 Monday to Friday
0 0 1 * *     /home/jaya/monthly.sh           # midnight on the 1st
@reboot       /home/jaya/startup.sh           # at every boot
```

* `crontab -l` – list your jobs
* `crontab -r` – remove all your jobs (careful!)

> Cron runs with a minimal environment – use full paths to programs and files.

---

### systemd timers

Timers are the modern alternative: they log to the journal, catch up on missed runs, and have dependencies:

```ini
# /etc/systemd/system/backup.timer
[Unit]
Description=Nightly backup

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

Enable and start with: `sudo systemctl enable --now backup.timer`.
""",
                    "exercises": []
                },
                {
                    "id": 24,
                    "title": "Chapter 24: Logs and Monitoring",
                    "slug": "ch24-logs-and-monitoring",
                    "order": 15,
                    "is_published": True,
                    "description": "Systemd journalctl queries, /var/log traditional logs, and system health monitoring tools.",
                    "content": """# 24. Logs and Monitoring

### journalctl – the systemd journal

```bash
journalctl -xe                       # latest entries with explanations
journalctl -u nginx                  # one service
journalctl -u nginx -f               # follow live
journalctl -u nginx --since "1 hour ago"
journalctl --since "2026-10-28" --until "2026-10-29 12:00"
journalctl -p err -b                 # errors from the current boot
journalctl -b -1                     # the previous boot
journalctl --disk-usage
sudo journalctl --vacuum-time=14d    # delete logs older than 14 days
```

---

### Classic log files in /var/log

| File | Contents |
| :--- | :--- |
| `/var/log/syslog` or `/var/log/messages` | General system messages. |
| `/var/log/auth.log` or `/var/log/secure` | Logins, sudo, SSH attempts. |
| `/var/log/kern.log`, `dmesg` | Kernel messages and hardware events. |
| `/var/log/nginx/`, `/var/log/apache2/` | Web server access and error logs. |
| `/var/log/apt/`, `/var/log/dnf.log` | Package manager history. |
| `/var/log/wtmp`, `btmp` | Login history (`last`) and failed logins (`lastb`). |

---

### Watching system health

| Command | What it does | Example |
| :--- | :--- | :--- |
| `uptime` | How long system has been up and load averages (1, 5, 15 min). | `uptime` |
| `free -h` | Memory and swap. Look at “available” column. | `free -h` |
| `vmstat 2` | CPU, memory, swap and I/O every 2 seconds. | `vmstat 2 5` |
| `iostat -x 2` | Disk activity (package sysstat). | `iostat -x 2` |
| `lsof` | List open files and sockets. | `lsof -p 1234` |
| `strace` | Trace system calls of a program. | `strace -f -o trace.txt ./app` |
""",
                    "exercises": []
                },
                {
                    "id": 25,
                    "title": "Chapter 25: Shell Scripting",
                    "slug": "ch25-shell-scripting",
                    "order": 16,
                    "is_published": True,
                    "description": "Write reliable Bash scripts: shebang, arguments, tests, loops, functions, and best practices.",
                    "content": """# 25. Shell Scripting

A script is a text file of commands. It turns anything you do twice into something you do once.

---

### Your first script

```bash
#!/usr/bin/env bash
# backup.sh - archive a folder with today's date
set -euo pipefail          # stop on errors, undefined variables and failed pipes

SRC="$HOME/Documents"
DEST="$HOME/backups"
STAMP="$(date +%F)"        # 2026-10-29

mkdir -p "$DEST"
tar -czf "$DEST/docs-$STAMP.tar.gz" "$SRC"
echo "Backup saved to $DEST/docs-$STAMP.tar.gz"
```

```bash
chmod +x backup.sh
./backup.sh
```

---

### Arguments and Input

```bash
#!/usr/bin/env bash
echo "Script name: $0"
echo "First argument: $1"
echo "All arguments: $@"
echo "Number of arguments: $#"

read -rp "What is your name? " name
echo "Hello, $name"
```

---

### Conditions & Tests

```bash
if [[ -f "$file" ]]; then
    echo "It is a file"
elif [[ -d "$file" ]]; then
    echo "It is a directory"
else
    echo "Does not exist"
fi
```

| Test | Meaning |
| :--- | :--- |
| `-e` `-f` `-d` | Exists / regular file / directory |
| `-r` `-w` `-x` | Readable / writable / executable |
| `-z` `-n` | String is empty / not empty |
| `==` `!=` | String equal / not equal |
| `-eq` `-ne` `-lt` `-le` `-gt` `-ge` | Numeric comparisons |

---

### Good habits

1. **Quote variables:** `"$file"` not `$file`.
2. Use `[[ ... ]]` for tests in Bash.
3. Check scripts with **ShellCheck** (`shellcheck script.sh`).
4. Debug with `bash -x script.sh`.
5. Use `trap 'rm -f "$tmp"' EXIT` to clean up temporary files.
""",
                    "exercises": []
                },
                {
                    "id": 26,
                    "title": "Chapter 26: Security Essentials",
                    "slug": "ch26-security-essentials",
                    "order": 17,
                    "is_published": True,
                    "description": "Hardening checklist, audit commands, MAC (SELinux & AppArmor), and encryption tools.",
                    "content": """# 26. Security Essentials

### A practical checklist

1. **Keep systems updated.** Enable automatic security updates.
2. **Use SSH keys,** disable password login and root login (Chapter 21).
3. **Enable a firewall** and open only the ports you need.
4. **Least privilege.** Use regular accounts, give sudo sparingly, and run services as dedicated non-root users.
5. **Install fail2ban** to ban IPs that repeatedly fail logins.
6. **Remove what you do not use.** Stop and disable unused services (`ss -tulpn`).
7. **Back up and test restores.**
8. **Watch the logs.** Check `/var/log/auth.log` or `journalctl -u ssh`.

---

### Handy audit commands

```bash
sudo ss -tulpn                         # what is exposed to the network?
last -n 20 ; sudo lastb | head         # successful and failed logins
sudo find / -perm -4000 -type f 2>/dev/null   # setuid programs
sudo find / -xdev -type f -perm -0002 2>/dev/null   # world-writable files
awk -F: '$3==0 {print $1}' /etc/passwd # accounts with UID 0 (should be only root)
sudo lynis audit system                # full security audit
```

---

### Mandatory Access Control (MAC) & Encryption

* **SELinux (RHEL, Fedora):** `getenforce`, `sestatus`, `ls -Z`, `restorecon -Rv /path`.
* **AppArmor (Ubuntu, Debian, SUSE):** `sudo aa-status`, profiles in `/etc/apparmor.d/`.

```bash
openssl rand -base64 24            # generate a random secret
gpg --full-generate-key            # create a GPG key
gpg -c secret.txt                  # encrypt a file with passphrase
gpg secret.txt.gpg                 # decrypt
```
""",
                    "exercises": []
                },
                {
                    "id": 27,
                    "title": "Chapter 27: Boot Process, Kernel and Hardware",
                    "slug": "ch27-boot-process-kernel-hardware",
                    "order": 18,
                    "is_published": True,
                    "description": "The 5 boot stages, hardware inspection, kernel modules, /proc and /sys, and GRUB recovery.",
                    "content": """# 27. Boot Process, Kernel and Hardware

### What happens when the machine starts

1. **Firmware (BIOS or UEFI)** tests hardware and finds boot device.
2. **Boot loader (usually GRUB)** loads kernel and initial RAM disk.
3. **Kernel starts,** detects hardware, mounts root file system.
4. **systemd (PID 1)** starts services until target is reached.
5. **Login prompt** or desktop appears.

---

### Inspecting hardware and the kernel

| Command | What it does | Example |
| :--- | :--- | :--- |
| `uname -a` | Kernel version and architecture. | `uname -r` |
| `lscpu` | CPU details. | `lscpu` |
| `lsmem` / `free -h` | Memory info. | `free -h` |
| `lspci` | PCI devices (graphics, network cards). | `lspci -k` |
| `lsusb` | USB devices. | `lsusb` |
| `lsblk` | Disks and partitions. | `lsblk` |
| `sudo dmidecode` | BIOS and hardware inventory. | `sudo dmidecode -t memory` |
| `lsmod` | Loaded kernel modules (drivers). | `lsmod \| grep nvidia` |
| `cat /etc/os-release` | Which distro and version is running. | `cat /etc/os-release` |

---

### Virtual file systems for live information

```bash
cat /proc/cpuinfo | head
cat /proc/meminfo | head
cat /proc/loadavg
ls /sys/class/net/                    # network interfaces
sysctl net.ipv4.ip_forward            # read kernel setting
sudo sysctl -w net.ipv4.ip_forward=1  # change until reboot
```
""",
                    "exercises": []
                },
                {
                    "id": 28,
                    "title": "Chapter 28: Developer Tools and Containers",
                    "slug": "ch28-developer-tools-and-containers",
                    "order": 19,
                    "is_published": True,
                    "description": "Git essentials, Docker fundamentals, language virtual environments, and everyday CLI utilities.",
                    "content": """# 28. Developer Tools and Containers

### Git essentials

```bash
git config --global user.name "Jaya Prakash"
git config --global user.email "you@example.com"
git clone https://github.com/user/repo.git
git status                      # what changed?
git add file.txt                # stage a change
git commit -m "Describe the change"
git log --oneline --graph -10
git switch -c feature/login     # new branch
git pull --rebase               # get updates
git push -u origin feature/login
git diff                        # unstaged changes
git stash ; git stash pop       # shelve and restore work in progress
```

---

### Docker essentials

```bash
docker run -d --name web -p 8080:80 nginx   # run container in background
docker ps                                   # running containers (-a for all)
docker logs -f web                          # follow logs
docker exec -it web bash                    # shell inside container
docker stop web && docker rm web
docker images                               # local images
docker build -t myapp .                     # build from Dockerfile
docker compose up -d                        # start multi-container app
docker system prune                         # clean unused data
```

---

### Working with languages and environments

```bash
python3 -m venv .venv && source .venv/bin/activate   # isolated Python environment
pip install requests
deactivate

node -v ; npm -v                                     # check Node.js
nvm install --lts                                    # manage Node versions
```

---

### Useful everyday extras

| Command | What it does | Example |
| :--- | :--- | :--- |
| `watch -n 2 cmd` | Re-run a command every 2 seconds. | `watch -n 2 df -h` |
| `time cmd` | Measure how long something takes. | `time ./build.sh` |
| `timeout 10 cmd` | Stop a command after a limit. | `timeout 10 ping x` |
| `screen` / `tmux` | Persistent terminal sessions. | `tmux new -s dev` |
| `jq` | Slice and format JSON. | `jq '.name' package.json` |
| `bc` | Quick calculations. | `echo '2^10' \| bc` |
""",
                    "exercises": []
                },
                {
                    "id": 29,
                    "title": "Chapter 29: Troubleshooting Playbook",
                    "slug": "ch29-troubleshooting-playbook",
                    "order": 20,
                    "is_published": True,
                    "description": "Structured troubleshooting for command not found, permission denied, full disks, failed services, and connectivity issues.",
                    "content": """# 29. Troubleshooting Playbook

Most problems follow a pattern. Work from the symptom to the evidence, change one thing at a time, and read the error message – it usually tells you exactly what is wrong.

---

### 1. Command not found
* Check spelling and case. Run `type name` or `which name`.
* Is it installed? Try `sudo apt install name`.
* Is the folder in `$PATH`? Run `echo $PATH`. For your own scripts use `./script.sh`.

---

### 2. Permission denied
* Check permissions and ownership: `ls -l file` and `ls -ld folder`.
* Executable bit missing? `chmod +x file`.
* Need admin rights? Use `sudo`, but understand why first.
* For every folder in a path, you need `x`. `namei -l /full/path/to/file` shows where access breaks.

---

### 3. Disk is full
```bash
df -h                                   # which file system is full?
df -i                                   # or out of inodes?
sudo du -h --max-depth=1 /var | sort -h # find culprit folder
sudo journalctl --vacuum-size=200M      # shrink journal
sudo apt clean ; sudo apt autoremove    # clear package caches
```

---

### 4. A service will not start
```bash
systemctl status myapp -l --no-pager
journalctl -u myapp -n 100 --no-pager
sudo ss -tulpn | grep :PORT             # is port already in use?
nginx -t                                # check syntax (or sshd -t, apachectl configtest)
```

---

### 5. System is slow
* `uptime` – is load average higher than number of CPU cores?
* `top` or `htop` – which process uses CPU or memory?
* `free -h` – is the machine swapping heavily?
* `iostat -x 2` or `iotop` – is disk I/O saturated?

---

### 6. Cannot reach a server or the internet
* `ip -br a` – do you have an IP address?
* `ping -c3 <gateway>` – is local network fine?
* `ping -c3 8.8.8.8` – is internet reachable by IP?
* `ping -c3 example.com` – if IP works but domain fails, it's DNS (check `/etc/resolv.conf`).
* `nc -zv host port` – test if the destination port is reachable or firewalled.
""",
                    "exercises": []
                },
                {
                    "id": 30,
                    "title": "Chapter 30: One-Page Command Cheat Sheet & Glossary",
                    "slug": "ch30-command-cheat-sheet",
                    "order": 21,
                    "is_published": True,
                    "description": "Comprehensive one-page command cheat sheet and core Linux glossary.",
                    "content": """# 30. One-Page Command Cheat Sheet & Glossary

### Files and folders

| Command | Purpose |
| :--- | :--- |
| `ls -lah` | List all with details |
| `cd -` / `cd ~` | Previous / home directory |
| `cp -a src dst` | Copy preserving everything |
| `mv a b` | Move or rename |
| `rm -rI dir` | Delete recursively with a prompt |
| `ln -s target link` | Symbolic link |
| `find . -name "*.log"` | Find by name |
| `du -sh *` | Sizes of items |
| `df -h` | Free disk space |
| `tar -czf a.tgz dir` | Create archive |
| `tar -xzf a.tgz` | Extract archive |
| `rsync -av src/ dst/` | Sync folders |

---

### Text processing

| Command | Purpose |
| :--- | :--- |
| `cat / less / head / tail -f` | View files and follow logs |
| `grep -rin "text" .` | Search recursively, ignoring case |
| `sort \| uniq -c \| sort -nr` | Count and rank lines |
| `cut -d, -f2 f.csv` | Extract a column |
| `awk '{print $1}'` | Print first column |
| `sed -i 's/a/b/g' f` | Replace in file |
| `diff -u a b` | Compare files |
| `wc -l` | Count lines |
| `tee file` | Save and display output |
| `xargs` | Build commands from input |

---

### System, users and processes

| Command | Purpose |
| :--- | :--- |
| `top / htop` | Live processes |
| `ps aux \| grep x` | Find a process |
| `kill PID / kill -9 PID` | Stop / force stop |
| `systemctl status\|start\|stop\|enable x` | Manage services |
| `journalctl -u x -f` | Follow service logs |
| `sudo useradd -m x` | Create a user |
| `sudo usermod -aG g x` | Add user to group |
| `chmod / chown` | Permissions / ownership |
| `crontab -e` | Schedule jobs |
| `uname -a / lsb_release -a` | System information |
| `free -h / uptime` | Memory and load |

---

### Network

| Command | Purpose |
| :--- | :--- |
| `ip -br a / ip route` | Addresses / routes |
| `ss -tulpn` | Listening ports |
| `ping -c3 host` | Reachability |
| `dig host / nslookup host` | DNS |
| `curl -I url` | HTTP headers |
| `wget -c url` | Download and resume |
| `ssh user@host` | Remote login |
| `scp / rsync -e ssh` | Copy over SSH |
| `sudo ufw allow 22/tcp` | Firewall rule |

---

### Glossary

| Term | Meaning |
| :--- | :--- |
| **Root** | The administrator account (UID 0), and also top of the file system (`/`). |
| **Daemon** | A background service, often ending in `d` (`sshd`, `crond`). |
| **Package** | An archive of software with metadata, installed by package manager. |
| **Repository** | A server that hosts packages for your distro. |
| **Mount point** | A folder where a disk or partition is attached to the tree. |
| **Inode** | The record that stores a file's metadata and where data sits on disk. |
| **PID** | Process ID, the number identifying a running process. |
| **Pipe** | The `\|` symbol connecting one command's output to another's input. |
| **Sudo** | Run a single command with administrator rights. |
| **Distro** | A complete Linux system: kernel plus tools, package manager and defaults. |
""",
                    "exercises": []
                }
            ]
        }
    ]
}

def main():
    curriculum_path = "/home/amogha/Linux Distro Hub/django/apps/learning/data/learning_curriculum.json"
    frontend_path = "/home/amogha/Linux Distro Hub/frontend/src/features/learning/learningData.js"
    
    with open(curriculum_path, "w", encoding="utf-8") as f:
        json.dump(CURRICULUM, f, indent=2, ensure_ascii=False)
    print(f"Written {curriculum_path}")

    # Also write frontend ES module version
    with open(frontend_path, "w", encoding="utf-8") as f:
        f.write("// Complete Linux Learning Curriculum — Static fallback & instant load\n")
        f.write("export const LEARNING_CURRICULUM = ")
        json.dump(CURRICULUM, f, indent=2, ensure_ascii=False)
        f.write(";\n")
    print(f"Written {frontend_path}")

if __name__ == "__main__":
    main()
