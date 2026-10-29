// Complete Linux Learning Curriculum — Static fallback & instant load
export const LEARNING_CURRICULUM = {
  "plans": [
    {
      "id": 1,
      "title": "Part One: Linux Basics",
      "slug": "linux-basics",
      "difficulty": "beginner",
      "estimated_hours": 4,
      "is_published": true,
      "order": 1,
      "description": "Everything you need to open a terminal, find your way around and start getting real work done.",
      "lessons": [
        {
          "id": 1,
          "title": "Chapter 1: What Linux Is",
          "slug": "ch1-what-linux-is",
          "order": 1,
          "is_published": true,
          "description": "Understand what Linux is, how kernels, distros, and shells interact, and safe ways to try it.",
          "content": "# 1. What Linux Is\n\nLinux is a free, open-source operating system. It runs most of the internet's servers, every Android phone, many supercomputers, smart TVs, routers and a growing number of personal laptops. Learning it gives you a skill that works almost everywhere in computing.\n\n---\n\n### The pieces that make up a Linux system\n\n* **Kernel** – the core of the system. It talks to your hardware (CPU, memory, disks, network) and shares those resources between programs. The kernel itself is called Linux.\n* **Distribution (distro)** – the kernel bundled with software, a package manager, a desktop and default settings. Ubuntu, Debian, Fedora, Arch and Linux Mint are all distros.\n* **Shell** – the program that reads the commands you type and runs them. The most common one is Bash. Others include Zsh and Fish.\n* **Terminal** – the window where you type to the shell. Sometimes called the console or command line.\n* **Desktop environment** – the graphical interface (GNOME, KDE Plasma, Xfce). Optional – servers usually have none.\n\n---\n\n### Common distributions\n\n| Distro | Known for | Package tool |\n| :--- | :--- | :--- |\n| **Ubuntu** | Very popular, huge community, long-term support (LTS) releases every two years. | `apt` |\n| **Debian** | Stable and conservative. Ubuntu is built on it. | `apt` |\n| **Linux Mint** | Ubuntu-based, familiar desktop for people coming from Windows. | `apt` |\n| **Fedora** | Newer software, sponsored by Red Hat. Good for developers. | `dnf` |\n| **RHEL / Rocky / AlmaLinux** | Enterprise servers. Rocky and Alma are free RHEL-compatible builds. | `dnf` |\n| **Arch Linux** | Rolling release, you build the system yourself. Excellent documentation (Arch Wiki). | `pacman` |\n| **openSUSE** | Strong admin tools (YaST), Leap or Tumbleweed (rolling). | `zypper` |\n\n> **Tip:** All distros share the same core commands. What you learn in this guide works on every one of them. The main difference is the package manager (covered in Chapters 8 and 17).\n\n---\n\n### Ways to try Linux safely\n\n1. **Live USB** – boot from a USB stick without installing anything.\n2. **Virtual machine** – run Linux inside VirtualBox or VMware on your current computer.\n3. **WSL2** – on Windows 10/11, run `wsl --install` in PowerShell to get a real Linux shell inside Windows.\n4. **Cloud server** – rent a small server and connect with SSH.\n5. **Dual boot** – install it next to your existing system on the same disk.\n6. **In-Browser Terminal** – use the interactive terminal right here in DistroPedia Linux Lab!\n",
          "exercises": []
        },
        {
          "id": 2,
          "title": "Chapter 2: The Terminal and Shell",
          "slug": "ch2-terminal-and-shell",
          "order": 2,
          "is_published": true,
          "description": "How commands are built, case sensitivity, getting help, and keyboard shortcuts that save hours.",
          "content": "# 2. The Terminal and Shell\n\nAlmost everything in Linux can be done by typing commands. It feels slow at first, but it quickly becomes faster and more powerful than clicking, and it is the only interface available on most servers.\n\n---\n\n### Opening a terminal\n\nOn most desktops press **Ctrl + Alt + T**, or search for “Terminal” in the application menu. You will see a prompt like this:\n\n```bash\njaya@mylaptop:~$\n```\n\n* `jaya` – your username\n* `mylaptop` – the computer's hostname\n* `~` – the current directory (`~` means your home folder)\n* `$` – you are a normal user. A `#` instead means you are root (the administrator).\n\n---\n\n### How a command is built\n\n```bash\ncommand  [options]  [arguments]\n\nls  -l  /etc\n```\n\n* **Command** – the program to run (`ls`).\n* **Options** (also called flags or switches) – change how it behaves. Short form uses one dash (`-l`), long form uses two (`--long`). Short options can be combined: `-l -a -h` is the same as `-lah`.\n* **Arguments** – what to act on (a file, folder, or text).\n\n> **Note:** Linux is case-sensitive. `Notes.txt`, `notes.txt` and `NOTES.TXT` are three different files. Spaces separate words, so a file name with spaces must be quoted: `cat \"my file.txt\"`.\n\n---\n\n### Getting help\n\nYou do not have to memorise everything. Linux documents itself.\n\n| Command | What it does | Example |\n| :--- | :--- | :--- |\n| `man ls` | Opens the manual page for a command. Press `q` to quit, `/word` to search, `n` for next match. | `man grep` |\n| `ls --help` | Short summary of options (works with most commands). | `cp --help` |\n| `info coreutils` | More detailed GNU documentation. | `info tar` |\n| `apropos keyword` | Searches manual pages by keyword. Same as `man -k`. | `apropos partition` |\n| `whatis ls` | One-line description of a command. | `whatis chmod` |\n| `type cd` | Tells you whether a command is a program, alias or shell built-in. | `type ll` |\n\n---\n\n### Keyboard shortcuts that save hours\n\n| Shortcut | What it does |\n| :--- | :--- |\n| **Tab** | Auto-completes file and command names. Press twice to list all possibilities. |\n| **Up / Down arrows** | Scroll through previous commands. |\n| **Ctrl + C** | Stop the running command. |\n| **Ctrl + D** | End input / log out of the shell. |\n| **Ctrl + L** | Clear the screen (same as `clear`). |\n| **Ctrl + A / Ctrl + E** | Jump to start / end of the line. |\n| **Ctrl + U / Ctrl + K** | Delete everything before / after the cursor. |\n| **Ctrl + W** | Delete the previous word. |\n| **Ctrl + R** | Search your command history. Type part of an old command. |\n| **Ctrl + Z** | Pause the running command (resume with `fg`). |\n| **!!** | Repeats the last command. `sudo !!` re-runs it as root. |\n",
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
          "is_published": true,
          "description": "Understand the single root tree, standard directories, and absolute vs relative paths.",
          "content": "# 3. The File System Layout\n\nLinux has one single tree that starts at `/` (called root). There are no drive letters like `C:` – extra disks and USB sticks are attached (“mounted”) somewhere inside the tree. Everything is a file: documents, folders, devices and even running-process information.\n\n---\n\n### Standard Directory Hierarchy\n\n| Location | What is in it |\n| :--- | :--- |\n| `/` | The top of the tree. Everything lives below it. |\n| `/home` | Personal folders for each user, e.g. `/home/jaya`. Your documents and settings live here. |\n| `/root` | Home folder of the root (administrator) user. |\n| `/etc` | System-wide configuration files (text files you can edit). |\n| `/bin`, `/sbin`, `/usr/bin` | Programs and commands. `sbin` holds admin tools. |\n| `/usr` | Installed software, libraries and documentation. |\n| `/var` | Data that changes: logs (`/var/log`), mail, databases, web content. |\n| `/tmp` | Temporary files. Often cleared on reboot. |\n| `/dev` | Device files such as disks (`/dev/sda`) and special ones like `/dev/null`. |\n| `/proc`, `/sys` | Virtual files that show live information about processes, kernel and hardware. |\n| `/mnt`, `/media` | Where external disks and USB drives are usually mounted. |\n| `/opt` | Optional third-party software. |\n| `/boot` | Kernel and boot loader files. |\n\n---\n\n### Paths\n\n* **Absolute path** – starts from `/`: `/home/jaya/Documents/notes.txt`. Works from anywhere.\n* **Relative path** – starts from where you are now: `Documents/notes.txt`.\n* `.` means the current directory, `..` means the parent directory.\n* `~` means your home directory. `~/Downloads` is the same as `/home/jaya/Downloads`.\n* `-` (with `cd`) jumps back to the previous directory.\n* Files starting with a dot (like `.bashrc`) are hidden. Show them with `ls -a`.\n",
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
          "is_published": true,
          "description": "Master navigation using pwd, ls, cd, and essential command options.",
          "content": "# 4. Moving Around\n\nNavigation is the foundation of working in the terminal. Learn these core navigation tools:\n\n| Command | What it does | Example |\n| :--- | :--- | :--- |\n| `pwd` | Print the directory you are in. | `pwd` |\n| `ls` | List files and folders. | `ls -lah /var/log` |\n| `cd` | Change directory. | `cd ~/Documents` |\n| `tree` | Show folders as a tree (may need installing). | `tree -L 2` |\n\n---\n\n### ls options you will use daily\n\n| Command | Meaning |\n| :--- | :--- |\n| `ls -l` | Long format: permissions, owner, size, date. |\n| `ls -a` | Include hidden files (starting with `.`). |\n| `ls -h` | Human-readable sizes (K, M, G). Use with `-l`. |\n| `ls -t` | Sort by modification time, newest first. |\n| `ls -R` | Recurse into sub-folders. |\n| `ls -d */` | List only directories. |\n\n---\n\n### cd shortcuts\n\n```bash\ncd              # go to your home directory\ncd ~            # same thing\ncd ..           # up one level\ncd ../..        # up two levels\ncd -            # back to where you just were\ncd /            # the top of the file system\n```\n",
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
          "is_published": true,
          "description": "Creating, copying, moving, renaming, deleting, viewing files, and wildcards.",
          "content": "# 5. Working with Files and Folders\n\n### Creating\n\n```bash\ntouch notes.txt              # create an empty file (or update its timestamp)\nmkdir projects               # create a folder\nmkdir -p projects/web/css    # create nested folders in one go\n```\n\n---\n\n### Copying, moving and renaming\n\n```bash\ncp notes.txt backup.txt          # copy a file\ncp -r projects projects-old      # copy a folder (-r = recursive)\nmv notes.txt Documents/          # move a file\nmv old.txt new.txt               # rename (moving to the same folder)\n```\n\n---\n\n### Deleting\n\n```bash\nrm notes.txt          # delete a file\nrm -r projects-old    # delete a folder and everything inside\nrm -i file.txt        # ask before deleting\nrmdir emptyfolder     # delete an EMPTY folder only\n```\n\n> **Warning:** Linux has no recycle bin on the command line. `rm` is permanent. Never run `rm -rf /` or `rm -rf *` unless you are absolutely sure where you are. Run `pwd` and `ls` first. Using `rm -i` or `rm -I` adds a safety prompt.\n\n---\n\n### Looking inside files\n\n| Command | What it does | Example |\n| :--- | :--- | :--- |\n| `cat file` | Print the whole file. | `cat /etc/os-release` |\n| `less file` | Scroll a long file. `q` quits, `/text` searches. | `less /var/log/syslog` |\n| `head -n 5 file` | First 5 lines. | `head -n 5 data.csv` |\n| `tail -n 5 file` | Last 5 lines. | `tail -n 20 app.log` |\n| `tail -f file` | Follow a file as it grows (great for logs). Ctrl+C to stop. | `tail -f app.log` |\n| `wc -l file` | Count lines (also `-w` words, `-c` bytes). | `wc -l notes.txt` |\n| `file name` | Tells you what type of file it is. | `file photo.jpg` |\n| `stat name` | Detailed information: size, permissions, timestamps. | `stat notes.txt` |\n\n---\n\n### Wildcards\n\nThe shell expands these patterns into matching file names before the command runs.\n\n| Pattern | What it does | Example |\n| :--- | :--- | :--- |\n| `*` | Any number of characters. | `ls *.txt` |\n| `?` | Exactly one character. | `ls file?.txt` |\n| `[abc]` | One character from the set. | `ls file[123].txt` |\n| `{a,b}` | Brace expansion – creates several words. | `touch report_{jan,feb,mar}.txt` |\n",
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
          "is_published": true,
          "description": "Learn nano and the essential vim survival kit used across servers.",
          "content": "# 6. Editing Text in the Terminal\n\n### nano – the easy editor\n\nRun `nano filename`. The shortcuts are shown at the bottom of the screen (`^` means Ctrl).\n\n* **Ctrl + O** then Enter – save\n* **Ctrl + X** – exit\n* **Ctrl + W** – search\n* **Ctrl + K** / **Ctrl + U** – cut / paste a line\n\n---\n\n### vim – the editor you will meet on every server\n\nVim has modes. You start in **Normal mode**, where keys are commands, not text. The survival kit:\n\n| Keys | What happens |\n| :--- | :--- |\n| `i` | Enter **Insert mode** so you can type text. |\n| `Esc` | Go back to **Normal mode**. |\n| `:w` | Save. |\n| `:q` | Quit. |\n| `:wq` or `ZZ` | Save and quit. |\n| `:q!` | Quit and throw away changes. |\n| `dd` | Delete (cut) the current line. |\n| `yy` / `p` | Copy a line / paste it. |\n| `u` | Undo. |\n| `/word` | Search for “word”. `n` for the next match. |\n| `gg` / `G` | Jump to the top / bottom of the file. |\n\n> **Tip:** Stuck in vim? Press **Esc** a couple of times, then type `:q!` and press Enter to leave without saving.\n",
          "exercises": []
        },
        {
          "id": 7,
          "title": "Chapter 7: Permissions and sudo",
          "slug": "ch7-permissions-and-sudo",
          "order": 7,
          "is_published": true,
          "description": "Understand multi-user permissions, chmod syntax, and superuser privileges with sudo.",
          "content": "# 7. Permissions and sudo\n\nLinux is a multi-user system, so every file has an owner and rules about who can read, write or run it. Look at them with `ls -l`:\n\n```bash\n$ ls -l script.sh\n-rwxr-xr-- 1 jaya devs 482 Oct 29 10:15 script.sh\n```\n\n| Part | Meaning |\n| :--- | :--- |\n| `-` | File type: `-` file, `d` directory, `l` symbolic link. |\n| `rwx` | Owner (user) permissions: read, write, execute. |\n| `r-x` | Group permissions: read and execute, no write. |\n| `r--` | Everyone else: read only. |\n| `jaya devs` | Owner and group of the file. |\n\n---\n\n### Changing permissions with chmod\n\n```bash\nchmod +x script.sh        # make a file executable\nchmod u+w notes.txt       # add write for the owner\nchmod go-r secret.txt     # remove read from group and others\nchmod 644 notes.txt       # rw-r--r-- (numbers, explained in Chapter 14)\nchmod 755 script.sh       # rwxr-xr-x\n```\n\n* **Letters:** `u` = user (owner), `g` = group, `o` = others, `a` = all.\n* **Operators:** `+` add, `-` remove, `=` set exactly.\n\n---\n\n### Running as administrator\n\nThe root user can do anything, so you normally work as a regular user and borrow root power only when needed with `sudo` (“superuser do”):\n\n```bash\nsudo apt update          # run one command as root\nsudo -i                  # open a root shell (be careful, exit when done)\nwhoami                   # shows who you are right now\n```\n\n> **Warning:** Treat `sudo` with respect. A command run with it can delete or overwrite anything. Read the command twice before pressing Enter, especially if you copied it from a website.\n",
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
          "is_published": true,
          "description": "How package managers work across distro families, and the everyday apt workflow.",
          "content": "# 8. Installing Software\n\nInstead of downloading installers from websites, Linux uses a package manager that fetches software from trusted repositories and keeps it updated. Which one you use depends on your distro.\n\n---\n\n### Package managers by distro family\n\n| Distro family | Refresh package list | Install a package |\n| :--- | :--- | :--- |\n| **Ubuntu / Debian / Mint** | `sudo apt update` | `sudo apt install vlc` |\n| **Fedora / RHEL / Rocky** | `sudo dnf check-update` | `sudo dnf install vlc` |\n| **Arch / Manjaro** | `sudo pacman -Sy` | `sudo pacman -S vlc` |\n| **openSUSE** | `sudo zypper refresh` | `sudo zypper install vlc` |\n\n---\n\n### The everyday apt workflow (Ubuntu / Debian)\n\n```bash\nsudo apt update               # refresh the list of available packages\nsudo apt upgrade              # install available updates\nsudo apt install htop         # install a program\nsudo apt remove htop          # uninstall it\nsudo apt autoremove           # clean up unused dependencies\napt search \"text editor\"      # search for packages\napt show htop                 # details about a package\n```\n",
          "exercises": []
        },
        {
          "id": 9,
          "title": "Chapter 9: Your First Practice Session",
          "slug": "ch9-first-practice-session",
          "order": 9,
          "is_published": true,
          "description": "A complete 10-minute hands-on practice session tying together all fundamentals from Part One.",
          "content": "# 9. Your First Practice Session\n\nOpen your terminal on the right and work through this. It takes about ten minutes and uses almost everything from Part One.\n\n---\n\n### Step-by-Step Hands-On Workflow\n\n1. **Find out where you are:**\n   ```bash\n   pwd\n   ```\n\n2. **Make a practice area:**\n   ```bash\n   mkdir -p ~/linux-practice/docs\n   cd ~/linux-practice\n   ```\n\n3. **Create files:**\n   ```bash\n   touch docs/a.txt docs/b.txt\n   ```\n\n4. **Write into one and view it:**\n   ```bash\n   echo \"Hello Linux\" > docs/a.txt\n   cat docs/a.txt\n   ```\n\n5. **Copy it:**\n   ```bash\n   cp docs/a.txt docs/c.txt\n   ```\n\n6. **Rename a file:**\n   ```bash\n   mv docs/b.txt docs/notes.txt\n   ```\n\n7. **List everything with details:**\n   ```bash\n   ls -lah docs\n   ```\n\n8. **Make a script, make it executable, and run it:**\n   ```bash\n   echo 'echo Hi there' > hello.sh\n   chmod +x hello.sh\n   ./hello.sh\n   ```\n\n9. **Clean up:**\n   ```bash\n   cd ~\n   # rm -r linux-practice  # (Wait until verified!)\n   ```\n\n---\n\n### Quick reference: the essential commands\n\n| Command | Purpose |\n| :--- | :--- |\n| `pwd` | Show current directory |\n| `ls -lah` | List all files with details |\n| `cd dir` | Change directory |\n| `mkdir -p a/b` | Create folders |\n| `touch f` | Create empty file |\n| `cp -r a b` | Copy |\n| `mv a b` | Move or rename |\n| `rm -r a` | Delete (permanent) |\n| `cat / less f` | View file contents |\n| `nano f` | Edit a file |\n| `chmod +x f` | Make executable |\n| `sudo cmd` | Run as administrator |\n| `man cmd` | Read the manual |\n| `history` | List past commands |\n| `clear` | Clear the screen |\n",
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
      "is_published": true,
      "order": 2,
      "description": "Pipes, permissions, processes, networking, services, scripting, security and the habits of confident Linux users.",
      "lessons": [
        {
          "id": 10,
          "title": "Chapter 10: The Shell in Depth",
          "slug": "ch10-shell-in-depth",
          "order": 1,
          "is_published": true,
          "description": "Variables, PATH, quoting styles, chaining operators, aliases, and startup files.",
          "content": "# 10. The Shell in Depth\n\n### Variables\n\n```bash\nname=\"Jaya\"                 # no spaces around =\necho \"Hello, ${name}\"       # use $name or ${name} to read it\necho \"Today is $(date +%A)\" # $(...) runs a command and inserts its output\nexport EDITOR=nano          # export makes it visible to programs you start\nenv                         # list all environment variables\nprintenv HOME               # show one\n```\n\n| Variable | Meaning |\n| :--- | :--- |\n| `$HOME` | Your home directory. |\n| `$USER` | Your username. |\n| `$PATH` | Colon-separated list of folders searched for commands. |\n| `$PWD` | Current directory. |\n| `$SHELL` | Your login shell. |\n| `$?` | Exit status of the last command (0 = success, anything else = failure). |\n| `$$` | Process ID of the current shell. |\n| `$0, $1, $2 ...` | Script name and its arguments (inside scripts). |\n\n---\n\n### The PATH\n\nWhen you type `ls`, the shell looks through every folder in `$PATH` until it finds a program called `ls`. To run your own tools from anywhere, add their folder:\n\n```bash\necho $PATH\nexport PATH=\"$HOME/bin:$PATH\"     # add ~/bin at the front (put in ~/.bashrc to keep it)\nwhich python3                     # show which file would run\n```\n\n---\n\n### Quoting\n\n| Style | Behaviour | Example |\n| :--- | :--- | :--- |\n| Double quotes `\"...\"` | Spaces are preserved; variables and `$(...)` are still expanded. | `echo \"Hi $USER\"` |\n| Single quotes `'...'` | Everything is literal. Nothing is expanded. | `echo 'Hi $USER'` |\n| Backslash `\\` | Escapes the next character. | `echo \\$HOME` |\n\n---\n\n### Chaining commands\n\n```bash\nmkdir test ; cd test            # ; runs one after the other, no matter what\nmkdir test && cd test           # && runs the second ONLY if the first succeeded\ncd /nowhere || echo \"failed\"    # || runs the second ONLY if the first failed\nsleep 60 &                      # & runs it in the background\n```\n\n---\n\n### Aliases and startup files\n\nAn alias is a custom shortcut. Put aliases and settings in `~/.bashrc` (loaded for each new terminal) so they survive restarts.\n\n```bash\nalias ll='ls -lah'\nalias update='sudo apt update && sudo apt upgrade'\nalias gs='git status'\nunalias ll                  # remove for this session\n\nnano ~/.bashrc              # add lines here to make them permanent\nsource ~/.bashrc            # reload without opening a new terminal\n```\n\n| File | Purpose |\n| :--- | :--- |\n| `~/.bashrc` | Read by every new interactive terminal. Aliases, prompt, functions go here. |\n| `~/.profile` or `~/.bash_profile` | Read at login. Good for environment variables. |\n| `/etc/profile`, `/etc/bash.bashrc` | System-wide equivalents. |\n| `~/.bash_history` | Saved command history. |\n\n---\n\n### History\n\n```bash\nhistory | tail -20       # last 20 commands\n!123                     # re-run command number 123\n!grep                    # re-run the most recent command starting with grep\nCtrl + R                 # search history interactively\n```\n",
          "exercises": []
        },
        {
          "id": 11,
          "title": "Chapter 11: Pipes and Redirection",
          "slug": "ch11-pipes-and-redirection",
          "order": 2,
          "is_published": true,
          "description": "Standard streams (stdin, stdout, stderr), redirection operators, pipes, tee and xargs.",
          "content": "# 11. Pipes and Redirection\n\nEach program has three data streams: **stdin** (input, number 0), **stdout** (normal output, 1) and **stderr** (error messages, 2). Redirection and pipes let you connect them. This idea – small tools that do one job and can be chained – is the heart of Linux.\n\n---\n\n### Redirection\n\n| Syntax | Meaning | Example |\n| :--- | :--- | :--- |\n| `cmd > file` | Send output to a file, overwriting it. | `ls > list.txt` |\n| `cmd >> file` | Append output to a file. | `date >> log.txt` |\n| `cmd < file` | Read input from a file. | `sort < names.txt` |\n| `cmd 2> file` | Send only error messages to a file. | `find / -name x 2> errors.txt` |\n| `cmd > f 2>&1` | Send both output and errors to the same file. | `make > build.log 2>&1` |\n| `cmd &> file` | Bash shortcut for the line above. | `make &> build.log` |\n| `cmd > /dev/null` | Throw the output away. | `ping -c1 x > /dev/null` |\n\n---\n\n### Pipes\n\nThe pipe `|` feeds the output of one command into the input of the next.\n\n```bash\nls -l | less                                # scroll a long listing\nhistory | grep ssh                          # find old ssh commands\nps aux | grep nginx                         # is nginx running?\ncat access.log | cut -d' ' -f1 | sort | uniq -c | sort -nr | head\n#   ^ the top 10 IP addresses in a web server log\n```\n\n---\n\n### tee and xargs\n\n```bash\nls -l | tee list.txt                 # show on screen AND save to a file\necho \"line\" | sudo tee /etc/myfile   # write to a root-owned file (sudo > won't work)\necho \"x\" | sudo tee -a /etc/myfile   # -a appends\n\nfind . -name \"*.tmp\" | xargs rm      # turn lines of input into arguments\nfind . -name \"*.tmp\" -print0 | xargs -0 rm   # safe with spaces in names\n```\n\n> **Tip:** `sudo echo hi > /root/file` fails because the redirection `>` is done by your shell, not by sudo. Use `echo hi | sudo tee /root/file` instead.\n",
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
          "is_published": true,
          "description": "Find files with find/locate and search contents using grep, regex, and modern alternatives.",
          "content": "# 12. Finding Files and Searching Text\n\n### find – search by name, type, size, age\n\n```bash\nfind /home -name \"report.pdf\"            # by exact name\nfind . -iname \"*.jpg\"                    # case-insensitive pattern\nfind . -type d -name \"node_modules\"      # directories only (-type f for files)\nfind / -size +500M 2>/dev/null           # files bigger than 500 MB\nfind . -mtime -7                         # modified in the last 7 days\nfind . -mtime +30 -name \"*.log\"          # older than 30 days\nfind . -user jaya                        # owned by a user\nfind . -perm -4000                       # files with the setuid bit\nfind . -name \"*.tmp\" -delete             # find and delete\nfind . -name \"*.sh\" -exec chmod +x {} \\; # run a command on every match\n```\n\n---\n\n### locate, which, whereis\n\n```bash\nsudo updatedb              # refresh the file index\nlocate nginx.conf          # instant search using the index\nwhich python3              # path of the command that would run\nwhereis ls                 # binary, source and man page locations\n```\n\n---\n\n### grep – search inside files\n\n```bash\ngrep \"error\" app.log                 # lines containing \"error\"\ngrep -i \"error\" app.log              # ignore case\ngrep -n \"error\" app.log              # show line numbers\ngrep -v \"debug\" app.log              # lines that do NOT match\ngrep -c \"error\" app.log              # just count the matches\ngrep -r \"TODO\" ./src                 # search a whole folder recursively\ngrep -rl \"password\" /etc 2>/dev/null # only list file names\ngrep -w \"cat\" file.txt               # whole word only\ngrep -A2 -B2 \"crash\" app.log         # 2 lines of context after / before\ngrep -E \"error|fail|fatal\" app.log   # extended regex (alternatives)\ngrep -P \"\\d{3}-\\d{4}\" file.txt       # Perl-style regex\n```\n\n---\n\n### Regular expressions cheat sheet\n\n| Pattern | Matches |\n| :--- | :--- |\n| `.` | Any single character |\n| `*` | Zero or more of the previous item |\n| `+` `?` | One or more / zero or one (with `-E`) |\n| `^` `$` | Start / end of a line |\n| `[a-z]` `[0-9]` | A character from a range |\n| `[^abc]` | Any character except a, b, c |\n| `(a\\|b)` | Either a or b (with `-E`) |\n| `{2,4}` | Between 2 and 4 repeats (with `-E`) |\n| `\\.` | A literal dot |\n\n> **Modern alternatives:** `ripgrep` (`rg`) for code searching, `fd` for finding files, `fzf` for fuzzy finding, and `bat` as a modern cat.\n",
          "exercises": []
        },
        {
          "id": 13,
          "title": "Chapter 13: Processing Text",
          "slug": "ch13-processing-text",
          "order": 4,
          "is_published": true,
          "description": "Stream text processing using sort, uniq, cut, tr, awk, sed, and column.",
          "content": "# 13. Processing Text\n\nBecause Linux treats nearly everything as text, these tools let you analyse logs, CSVs and command output in one line.\n\n| Command | What it does | Example |\n| :--- | :--- | :--- |\n| `sort` | Sort lines. `-n` numeric, `-r` reverse, `-u` unique, `-k2` by 2nd column. | `sort -nr sizes.txt` |\n| `uniq` | Remove adjacent duplicates. `-c` counts. Usually used after sort. | `sort a.txt \\| uniq -c` |\n| `cut` | Extract columns. `-d` delimiter, `-f` field. | `cut -d: -f1 /etc/passwd` |\n| `tr` | Translate or delete characters. | `echo HI \\| tr A-Z a-z` |\n| `paste` | Merge files side by side. | `paste a.txt b.txt` |\n| `column -t` | Align output into a neat table. | `mount \\| column -t` |\n| `diff` | Show differences between two files. `-u` for unified format. | `diff -u old new` |\n| `comm` | Compare two sorted files. | `comm -12 a b` |\n| `wc` | Count lines, words, bytes. | `wc -l *.txt` |\n| `jq` | Query and format JSON (install separately). | `curl -s url \\| jq '.items[0]'` |\n\n---\n\n### awk – work with columns\n\nawk splits every line into fields (`$1`, `$2`, …; `$0` is the whole line).\n\n```bash\nawk '{print $1}' file.txt                    # first column\nawk -F: '{print $1, $3}' /etc/passwd         # custom separator: user and UID\nawk '$3 > 1000 {print $1}' data.txt          # only rows where column 3 > 1000\nawk '{sum += $2} END {print sum}' sales.txt  # add up a column\nawk 'NR==5' file.txt                         # print line 5\n```\n\n---\n\n### sed – find and replace in streams\n\n```bash\nsed 's/old/new/' file.txt           # replace first match on each line\nsed 's/old/new/g' file.txt          # replace all matches\nsed -i 's/old/new/g' file.txt       # edit the file in place\nsed -i.bak 's/old/new/g' file.txt   # in place, but keep a .bak backup\nsed -n '10,20p' file.txt            # print only lines 10-20\nsed '/^#/d' config.conf             # delete comment lines\nsed '/^$/d' file.txt                # delete empty lines\n```\n\n> **Tip:** Practice on a copy first, or use `sed -i.bak`. A wrong in-place edit cannot be undone.\n",
          "exercises": []
        },
        {
          "id": 14,
          "title": "Chapter 14: Permissions in Depth",
          "slug": "ch14-permissions-in-depth",
          "order": 5,
          "is_published": true,
          "description": "Numeric octal permissions, ownership (chown), umask, setuid/setgid/sticky bits, and ACLs.",
          "content": "# 14. Permissions in Depth\n\n### Numeric (octal) notation\n\nEach permission has a value: read = 4, write = 2, execute = 1. Add them up for each of the three groups (owner, group, others).\n\n| Digit | Symbols | Meaning |\n| :--- | :--- | :--- |\n| `7` | `rwx` | 4+2+1 – full access |\n| `6` | `rw-` | 4+2 – read and write |\n| `5` | `r-x` | 4+1 – read and run |\n| `4` | `r--` | read only |\n| `0` | `---` | no access |\n\n| Common | Symbols | Typical use |\n| :--- | :--- | :--- |\n| `644` | `rw-r--r--` | Normal files. Owner edits, everyone reads. |\n| `600` | `rw-------` | Private files such as SSH keys. |\n| `755` | `rwxr-xr-x` | Programs and folders. |\n| `700` | `rwx------` | Private folder (e.g. `~/.ssh`). |\n| `775` | `rwxrwxr-x` | Shared folder for a group. |\n\n---\n\n### Ownership\n\n```bash\nsudo chown jaya file.txt                  # change owner\nsudo chown jaya:devs file.txt             # owner and group\nsudo chown -R www-data:www-data /var/www   # recursive\nsudo chgrp devs shared/                   # group only\nchmod -R u=rwX,g=rX,o= project/           # recursive; X = execute only for folders\n```\n\n---\n\n### Directory permissions behave differently\n\n* `r` – you can list the names inside.\n* `w` – you can create, rename or delete entries inside.\n* `x` – you can enter it (`cd`) and access files within. Without `x`, the folder is a dead end.\n\n---\n\n### umask – default permissions\n\n`umask` removes permissions from new files. With the common `022`, new files become `644` and new folders `755`. Check it by running `umask`; set it in `~/.bashrc` if needed (`umask 027` is stricter).\n\n---\n\n### Special permission bits\n\n| Bit | Effect | Set with |\n| :--- | :--- | :--- |\n| **setuid (4000)** | A program runs with the owner's rights. `passwd` uses this. Shown as `s` in owner position. | `chmod u+s file` |\n| **setgid (2000)** | Program runs as the group; on a folder, new files inherit folder's group. | `chmod g+s dir` |\n| **sticky bit (1000)** | In a shared folder, only the owner can delete a file. `/tmp` uses it (`t`). | `chmod +t dir` |\n\n---\n\n### ACLs and attributes\n\n```bash\ngetfacl report.txt                    # view access control list\nsetfacl -m u:alice:rw report.txt      # give one extra user read+write\nsetfacl -x u:alice report.txt         # remove that entry\nlsattr file                           # view file attributes\nsudo chattr +i important.conf         # make immutable: not even root can edit/delete\nsudo chattr -i important.conf         # undo\n```\n",
          "exercises": []
        },
        {
          "id": 15,
          "title": "Chapter 15: Users and Groups",
          "slug": "ch15-users-and-groups",
          "order": 6,
          "is_published": true,
          "description": "Managing users, groups, /etc/passwd, /etc/shadow, and sudoers configuration via visudo.",
          "content": "# 15. Users and Groups\n\n| Command | What it does | Example |\n| :--- | :--- | :--- |\n| `whoami` / `id` | Show current user, UID, GID and group memberships. | `id jaya` |\n| `who` / `w` / `last` | Who is logged in now / login history. | `last -n 10` |\n| `sudo adduser name` | Create a user interactively (Debian/Ubuntu). | `sudo adduser sam` |\n| `sudo useradd -m -s /bin/bash name` | Create a user (all distros). `-m` makes home folder. | `sudo useradd -m -s /bin/bash sam` |\n| `sudo passwd name` | Set or change a password. | `sudo passwd sam` |\n| `sudo usermod -aG group name` | Add a user to a group. Always include `-a`. | `sudo usermod -aG sudo sam` |\n| `sudo userdel -r name` | Delete a user and their home folder. | `sudo userdel -r sam` |\n| `sudo groupadd name` | Create a group. | `sudo groupadd devs` |\n| `groups name` | List groups of a user. | `groups sam` |\n| `su - name` | Switch user (asks for that user's password). | `su - sam` |\n| `sudo passwd -l name` | Lock an account. `-u` unlocks. | `sudo passwd -l sam` |\n\n> **Warning:** `usermod -G` without `-a` replaces all the user's groups instead of adding one. Always write `-aG`.\n\n---\n\n### Important account files\n\n| File | Contains |\n| :--- | :--- |\n| `/etc/passwd` | List of users: name, UID, GID, home, shell. Readable by everyone. |\n| `/etc/shadow` | Password hashes. Readable only by root. |\n| `/etc/group` | List of groups and their members. |\n| `/etc/sudoers` | Who may use sudo. Edit only with `sudo visudo`, which checks syntax. |\n\n```bash\n# Example line in sudoers (via visudo) giving a group full sudo rights:\n%admins ALL=(ALL:ALL) ALL\n\n# Allow one user to restart nginx without a password:\nsam ALL=(root) NOPASSWD: /bin/systemctl restart nginx\n```\n\nUIDs below 1000 are normally system accounts (services). Regular users usually start at 1000. UID 0 is root.\n",
          "exercises": []
        },
        {
          "id": 16,
          "title": "Chapter 16: Processes and Jobs",
          "slug": "ch16-processes-and-jobs",
          "order": 7,
          "is_published": true,
          "description": "Viewing processes with ps and top, signals, killing processes, background jobs, and tmux.",
          "content": "# 16. Processes and Jobs\n\nA process is a running program. Each has a number (PID), an owner, and a parent.\n\n---\n\n### Viewing processes\n\n```bash\nps aux                     # every process, with CPU and memory use\nps -ef --forest            # tree view showing parent/child\nps -u jaya                 # processes of one user\npgrep -a nginx             # find PIDs by name\ntop                        # live view (q quits)\nhtop                       # friendlier live view (install it)\npstree -p                  # process tree\n```\n\nIn `top`, press **M** to sort by memory, **P** by CPU, **k** to kill a process, **1** to show each CPU core.\n\n---\n\n### Stopping processes\n\n```bash\nkill 1234              # ask PID 1234 to terminate nicely (SIGTERM, signal 15)\nkill -9 1234           # force kill (SIGKILL) – last resort, no cleanup\npkill firefox          # by name\nkillall node           # all processes with this name\nkill -HUP 1234         # many daemons reload config on SIGHUP\n```\n\n| Signal | Meaning |\n| :--- | :--- |\n| `SIGTERM (15)` | Polite request to stop. The default for kill. |\n| `SIGKILL (9)` | Cannot be caught. Immediately removes the process. |\n| `SIGINT (2)` | What Ctrl+C sends. |\n| `SIGHUP (1)` | Hang up. Often means “reload your configuration”. |\n| `SIGSTOP / SIGCONT` | Pause / resume (Ctrl+Z / fg). |\n\n---\n\n### Foreground, background and job control\n\n```bash\nlong-task &            # start in the background\njobs                   # list jobs of this shell\nCtrl + Z               # pause the foreground job\nbg %1                  # resume job 1 in the background\nfg %1                  # bring job 1 to the foreground\nnohup ./script.sh &    # keep running after you close terminal\ndisown %1              # detach a job from the shell\n```\n\n---\n\n### Priorities & tmux\n\n```bash\nnice -n 10 ./heavy-job           # start with lower priority (range -20 to 19)\nrenice -n 5 -p 1234              # change priority of a running process\n```\n\n**tmux – sessions that survive disconnects:**\n```bash\ntmux new -s work       # start named session\n# Ctrl+B then d        # detach\ntmux ls                # list sessions\ntmux attach -t work    # reattach\n```\n",
          "exercises": []
        },
        {
          "id": 17,
          "title": "Chapter 17: Package Management in Depth",
          "slug": "ch17-package-management-in-depth",
          "order": 8,
          "is_published": true,
          "description": "Advanced package management: apt/dpkg, dnf/rpm, pacman, universal formats, and source compilation.",
          "content": "# 17. Package Management in Depth\n\n### apt / dpkg (Debian, Ubuntu, Mint)\n\n```bash\nsudo apt update && sudo apt full-upgrade     # refresh lists and upgrade everything\napt list --installed | grep nginx            # is it installed?\napt policy nginx                             # installed vs available versions\nsudo apt install nginx=1.24.0-1              # pin a specific version\nsudo apt-mark hold nginx                     # prevent upgrades of a package\nsudo apt purge nginx                         # remove including config files\nsudo apt install ./app.deb                   # install a downloaded .deb\ndpkg -L nginx                                # files installed by a package\ndpkg -S /usr/sbin/nginx                      # which package owns a file\n```\n\nThird-party repositories are listed in `/etc/apt/sources.list` and `/etc/apt/sources.list.d/`.\n\n---\n\n### dnf / rpm (Fedora, RHEL, Rocky, Alma)\n\n```bash\nsudo dnf upgrade                  # update everything\nsudo dnf install nginx\nsudo dnf remove nginx\ndnf search \"web server\"\ndnf info nginx\ndnf provides */nmap               # which package contains this file?\ndnf history                       # list transactions; 'dnf history undo N' reverses one\nrpm -qa | grep kernel             # all installed RPMs\nrpm -ql nginx                     # files in a package\n```\n\n---\n\n### pacman (Arch)\n\n```bash\nsudo pacman -Syu                  # sync and upgrade whole system\nsudo pacman -S nginx              # install\nsudo pacman -Rns nginx            # remove with unused dependencies and configs\npacman -Ss keyword                # search\npacman -Qi nginx                  # info on installed package\npacman -Qdtq | sudo pacman -Rns - # remove orphans\n```\n\n---\n\n### Universal formats & building from source\n\n| Format | Notes | Example |\n| :--- | :--- | :--- |\n| **Snap** | Canonical's sandboxed packages. | `sudo snap install code --classic` |\n| **Flatpak** | Sandboxed desktop apps from Flathub. | `flatpak install flathub org.gimp.GIMP` |\n| **AppImage** | Single downloadable file. `chmod +x` and run. | `./App.AppImage` |\n\n**Building from source:**\n```bash\nsudo apt install build-essential        # compilers and tools\ntar xf program-1.0.tar.gz && cd program-1.0\n./configure --prefix=/usr/local         # check dependencies, set options\nmake -j\"$(nproc)\"                       # compile using all CPU cores\nsudo make install                       # install\n```\n",
          "exercises": []
        },
        {
          "id": 18,
          "title": "Chapter 18: Disks, File Systems and Links",
          "slug": "ch18-disks-file-systems-and-links",
          "order": 9,
          "is_published": true,
          "description": "Block devices, df/du, fdisk, mkfs, /etc/fstab, ext4/xfs/btrfs, and hard vs symbolic links.",
          "content": "# 18. Disks, File Systems and Links\n\n### Seeing what you have\n\n```bash\nlsblk -f                  # block devices, file systems, mount points\ndf -hT                    # free space on mounted file systems\ndu -sh *                  # size of each item in the current folder\ndu -h --max-depth=1 / 2>/dev/null | sort -h   # which top-level folders are biggest\nsudo blkid                # UUIDs of partitions\nfindmnt                   # tree of mounts\nfree -h                   # memory and swap\n```\n\n---\n\n### Partitioning, formatting and mounting\n\n```bash\nsudo fdisk -l                          # list disks and partitions\nsudo fdisk /dev/sdb                    # interactive partitioning (n new, w write)\nsudo mkfs.ext4 /dev/sdb1               # create an ext4 file system\nsudo mkdir -p /mnt/data\nsudo mount /dev/sdb1 /mnt/data         # mount\nsudo umount /mnt/data                  # unmount\n```\n\n> **Warning:** Formatting or partitioning the wrong device destroys data. Always double-check device names with `lsblk` before running `mkfs`, `fdisk` or `dd`.\n\n---\n\n### Mounting at boot – /etc/fstab\n\nEach line of `/etc/fstab` describes one mount. Using UUID is safer than `/dev/sdb1` because names can change:\n\n```\nUUID=3f2a1c9e-7d4b-4a55-9c1e-0a1b2c3d4e5f  /mnt/data  ext4  defaults,nofail  0  2\n```\n\nTest before rebooting: `sudo mount -a`. If it prints nothing, the file is valid.\n\n---\n\n### Links: Symbolic vs Hard\n\n```bash\nln -s /var/www/site ~/site       # symbolic (soft) link – points to path\nln file.txt hardlink.txt         # hard link – another name for the same data\nreadlink -f ~/site               # where does a link really point?\nls -li                           # show inode numbers\n```\n\n* A **symbolic link** breaks if the target is moved or deleted. It can point to folders and across file systems.\n* A **hard link** is an extra name for the same data (same inode). Data remains until all names are deleted. It must stay on the same file system.\n",
          "exercises": []
        },
        {
          "id": 19,
          "title": "Chapter 19: Archives, Compression and Backups",
          "slug": "ch19-archives-compression-backups",
          "order": 10,
          "is_published": true,
          "description": "Archiving with tar, gzip/xz/zip, incremental rsync, and robust 3-2-1 backup strategies.",
          "content": "# 19. Archives, Compression and Backups\n\n### tar\n\n```bash\ntar -cvf backup.tar folder/             # create archive (c=create v=verbose f=file)\ntar -czvf backup.tar.gz folder/         # create gzip-compressed (.tar.gz / .tgz)\ntar -cJvf backup.tar.xz folder/         # xz compression (smaller, slower)\ntar -tf backup.tar.gz                   # list contents without extracting\ntar -xzvf backup.tar.gz                 # extract\ntar -xzvf backup.tar.gz -C /tmp/restore # extract into a chosen folder\ntar --exclude='*.log' -czf site.tgz /var/www\n```\n\n---\n\n### Single-file compressors and zip\n\n```bash\ngzip file.txt        # creates file.txt.gz and removes original\ngunzip file.txt.gz\nxz file.txt          # better compression\nbzip2 file.txt\nzip -r site.zip site/\nunzip site.zip -d output/\nzcat file.gz | head  # read compressed file without unpacking\n```\n\n---\n\n### rsync – the right tool for copying and backups\n\n`rsync` copies only what changed, can resume, and works over SSH:\n\n```bash\nrsync -av ~/Documents/ /mnt/backup/Documents/      # archive mode, verbose\nrsync -avh --progress src/ user@server:/backups/   # to a remote machine\nrsync -av --delete src/ dest/                      # make dest an exact mirror\nrsync -avn --delete src/ dest/                     # -n = dry run, preview only\n```\n\n> **Note:** A trailing slash matters: `src/` copies the contents of src, while `src` copies the folder itself.\n\n---\n\n### A sensible backup habit\n\n1. Keep **3 copies**, on **2 different kinds of storage**, with **1 off-site**.\n2. Automate it with cron or a systemd timer.\n3. Tools such as `restic`, `borgbackup` and `timeshift` add encryption, deduplication and snapshots.\n4. **Test restores.** A backup you have never restored is only a hope.\n",
          "exercises": []
        },
        {
          "id": 20,
          "title": "Chapter 20: Networking",
          "slug": "ch20-networking",
          "order": 11,
          "is_published": true,
          "description": "Inspecting network interfaces with ip/ss, connectivity testing, curl/wget, and firewall setup.",
          "content": "# 20. Networking\n\n### Inspecting your network\n\n```bash\nip -br a                    # interfaces and IP addresses (brief)\nip route                    # routing table, shows default gateway\nip neigh                    # ARP table\nss -tulpn                   # listening ports and programs using them\nss -tan state established   # current TCP connections\nhostname -I                 # your IP addresses\nhostnamectl                 # hostname and OS info\nnmcli device status         # NetworkManager overview\n```\n\n> **Note:** The old `ifconfig`, `netstat` and `route` commands are deprecated. Use `ip` and `ss`.\n\n---\n\n### Testing connectivity\n\n```bash\nping -c 4 8.8.8.8           # is the internet reachable (by IP)?\nping -c 4 example.com       # ...and DNS working?\ntraceroute example.com      # path packets take (or: tracepath, mtr)\nmtr example.com             # live combined ping + traceroute\ndig example.com             # DNS lookup in detail\ndig +short MX example.com   # just the mail records\nnc -zv server 443           # test if a TCP port is open\n```\n\n---\n\n### Downloading and talking to web servers\n\n```bash\ncurl https://example.com                          # print the page\ncurl -I https://example.com                       # headers only\ncurl -O https://example.com/file.zip              # save with remote name\ncurl -L -o out.html https://short.link/x          # follow redirects, choose name\ncurl -X POST -H \"Content-Type: application/json\" \\\n     -d '{\"name\":\"Jaya\"}' https://api.example.com/users\n\nwget https://example.com/file.zip                 # simple downloader\nwget -c URL                                       # resume interrupted download\n```\n\n---\n\n### Firewalls (ufw example)\n\n```bash\nsudo ufw default deny incoming\nsudo ufw default allow outgoing\nsudo ufw allow 22/tcp           # ALWAYS allow SSH before enabling!\nsudo ufw allow 80,443/tcp\nsudo ufw enable\nsudo ufw status verbose\n```\n",
          "exercises": []
        },
        {
          "id": 21,
          "title": "Chapter 21: SSH and Remote Work",
          "slug": "ch21-ssh-and-remote-work",
          "order": 12,
          "is_published": true,
          "description": "Secure Shell, key-based authentication, config shortcuts, SSH tunnels, and server hardening.",
          "content": "# 21. SSH and Remote Work\n\nSSH (Secure Shell) lets you log in to and control another machine over an encrypted connection.\n\n```bash\nssh user@192.168.1.20            # log in\nssh -p 2222 user@host            # non-standard port\nssh user@host \"uptime\"           # run one command and return\nscp file.txt user@host:/tmp/     # copy a file to server\nscp -r user@host:/var/log/app .  # copy folder from server\nsftp user@host                   # interactive file transfer\n```\n\n---\n\n### Key-based login (more secure than passwords)\n\n1. Create a key pair on your own computer:\n   ```bash\n   ssh-keygen -t ed25519 -C \"jaya@laptop\"\n   ```\n2. Copy public key to server:\n   ```bash\n   ssh-copy-id user@host\n   ```\n3. Log in without a password prompt.\n\n> **Important:** Never share the private key (`~/.ssh/id_ed25519`). Only `id_ed25519.pub` is shareable. Correct permissions are required: `~/.ssh` must be `700` and private keys `600`, otherwise SSH refuses to use them.\n\n---\n\n### ~/.ssh/config shortcuts\n\n```ini\nHost prod\n    HostName 203.0.113.10\n    User deploy\n    Port 2222\n    IdentityFile ~/.ssh/id_ed25519\n\n# now simply connect with:\n# ssh prod\n```\n\n---\n\n### Tunnels & Server Hardening\n\n```bash\nssh -L 8080:localhost:80 user@server     # local port 8080 -> server's port 80\nssh -R 9000:localhost:3000 user@server   # expose local 3000 on server\nssh -D 1080 user@server                  # SOCKS proxy\n```\n\n**Hardening `/etc/ssh/sshd_config`:**\n```ini\nPermitRootLogin no\nPasswordAuthentication no      # only after keys work!\nPubkeyAuthentication yes\nAllowUsers jaya deploy\n```\nValidate and reload: `sudo sshd -t && sudo systemctl reload ssh`.\n",
          "exercises": []
        },
        {
          "id": 22,
          "title": "Chapter 22: Services with systemd",
          "slug": "ch22-services-with-systemd",
          "order": 13,
          "is_published": true,
          "description": "Managing systemd services, writing custom unit files, targets, and overrides.",
          "content": "# 22. Services with systemd\n\nOn almost every modern distro systemd starts the system and manages background services (called units).\n\n```bash\nsystemctl status nginx              # state, recent logs, PID\nsudo systemctl start nginx          # start now\nsudo systemctl stop nginx\nsudo systemctl restart nginx        # stop then start\nsudo systemctl reload nginx         # re-read config without dropping connections\nsudo systemctl enable nginx         # start automatically at boot\nsudo systemctl enable --now nginx   # enable and start together\nsudo systemctl disable nginx\nsystemctl is-active nginx           # quick check, handy in scripts\nsystemctl list-units --type=service --state=running\nsystemctl --failed                  # what has failed?\nsudo systemctl daemon-reload        # after editing unit files\n```\n\n---\n\n### Writing your own service\n\nCreate `/etc/systemd/system/myapp.service`:\n\n```ini\n[Unit]\nDescription=My Node app\nAfter=network.target\n\n[Service]\nUser=deploy\nWorkingDirectory=/opt/myapp\nExecStart=/usr/bin/node server.js\nRestart=on-failure\nRestartSec=5\nEnvironment=NODE_ENV=production\n\n[Install]\nWantedBy=multi-user.target\n```\n\n```bash\nsudo systemctl daemon-reload\nsudo systemctl enable --now myapp\njournalctl -u myapp -f              # watch its logs live\n```\n",
          "exercises": []
        },
        {
          "id": 23,
          "title": "Chapter 23: Scheduling Tasks",
          "slug": "ch23-scheduling-tasks",
          "order": 14,
          "is_published": true,
          "description": "Cron job syntax and management, at one-off scheduling, and systemd timers.",
          "content": "# 23. Scheduling Tasks\n\n### cron\n\nEdit your schedule with `crontab -e`. Each line has five time fields followed by the command:\n\n```\n# ┌ minute (0-59)\n# │ ┌ hour (0-23)\n# │ │ ┌ day of month (1-31)\n# │ │ │ ┌ month (1-12)\n# │ │ │ │ ┌ day of week (0-7, Sun = 0 or 7)\n# │ │ │ │ │\n# * * * * *  command\n\n0 2 * * *     /home/jaya/backup.sh            # every day at 02:00\n*/15 * * * *  /usr/bin/check-site.sh          # every 15 minutes\n30 8 * * 1-5  /home/jaya/report.sh            # 08:30 Monday to Friday\n0 0 1 * *     /home/jaya/monthly.sh           # midnight on the 1st\n@reboot       /home/jaya/startup.sh           # at every boot\n```\n\n* `crontab -l` – list your jobs\n* `crontab -r` – remove all your jobs (careful!)\n\n> Cron runs with a minimal environment – use full paths to programs and files.\n\n---\n\n### systemd timers\n\nTimers are the modern alternative: they log to the journal, catch up on missed runs, and have dependencies:\n\n```ini\n# /etc/systemd/system/backup.timer\n[Unit]\nDescription=Nightly backup\n\n[Timer]\nOnCalendar=*-*-* 02:00:00\nPersistent=true\n\n[Install]\nWantedBy=timers.target\n```\n\nEnable and start with: `sudo systemctl enable --now backup.timer`.\n",
          "exercises": []
        },
        {
          "id": 24,
          "title": "Chapter 24: Logs and Monitoring",
          "slug": "ch24-logs-and-monitoring",
          "order": 15,
          "is_published": true,
          "description": "Systemd journalctl queries, /var/log traditional logs, and system health monitoring tools.",
          "content": "# 24. Logs and Monitoring\n\n### journalctl – the systemd journal\n\n```bash\njournalctl -xe                       # latest entries with explanations\njournalctl -u nginx                  # one service\njournalctl -u nginx -f               # follow live\njournalctl -u nginx --since \"1 hour ago\"\njournalctl --since \"2026-10-28\" --until \"2026-10-29 12:00\"\njournalctl -p err -b                 # errors from the current boot\njournalctl -b -1                     # the previous boot\njournalctl --disk-usage\nsudo journalctl --vacuum-time=14d    # delete logs older than 14 days\n```\n\n---\n\n### Classic log files in /var/log\n\n| File | Contents |\n| :--- | :--- |\n| `/var/log/syslog` or `/var/log/messages` | General system messages. |\n| `/var/log/auth.log` or `/var/log/secure` | Logins, sudo, SSH attempts. |\n| `/var/log/kern.log`, `dmesg` | Kernel messages and hardware events. |\n| `/var/log/nginx/`, `/var/log/apache2/` | Web server access and error logs. |\n| `/var/log/apt/`, `/var/log/dnf.log` | Package manager history. |\n| `/var/log/wtmp`, `btmp` | Login history (`last`) and failed logins (`lastb`). |\n\n---\n\n### Watching system health\n\n| Command | What it does | Example |\n| :--- | :--- | :--- |\n| `uptime` | How long system has been up and load averages (1, 5, 15 min). | `uptime` |\n| `free -h` | Memory and swap. Look at “available” column. | `free -h` |\n| `vmstat 2` | CPU, memory, swap and I/O every 2 seconds. | `vmstat 2 5` |\n| `iostat -x 2` | Disk activity (package sysstat). | `iostat -x 2` |\n| `lsof` | List open files and sockets. | `lsof -p 1234` |\n| `strace` | Trace system calls of a program. | `strace -f -o trace.txt ./app` |\n",
          "exercises": []
        },
        {
          "id": 25,
          "title": "Chapter 25: Shell Scripting",
          "slug": "ch25-shell-scripting",
          "order": 16,
          "is_published": true,
          "description": "Write reliable Bash scripts: shebang, arguments, tests, loops, functions, and best practices.",
          "content": "# 25. Shell Scripting\n\nA script is a text file of commands. It turns anything you do twice into something you do once.\n\n---\n\n### Your first script\n\n```bash\n#!/usr/bin/env bash\n# backup.sh - archive a folder with today's date\nset -euo pipefail          # stop on errors, undefined variables and failed pipes\n\nSRC=\"$HOME/Documents\"\nDEST=\"$HOME/backups\"\nSTAMP=\"$(date +%F)\"        # 2026-10-29\n\nmkdir -p \"$DEST\"\ntar -czf \"$DEST/docs-$STAMP.tar.gz\" \"$SRC\"\necho \"Backup saved to $DEST/docs-$STAMP.tar.gz\"\n```\n\n```bash\nchmod +x backup.sh\n./backup.sh\n```\n\n---\n\n### Arguments and Input\n\n```bash\n#!/usr/bin/env bash\necho \"Script name: $0\"\necho \"First argument: $1\"\necho \"All arguments: $@\"\necho \"Number of arguments: $#\"\n\nread -rp \"What is your name? \" name\necho \"Hello, $name\"\n```\n\n---\n\n### Conditions & Tests\n\n```bash\nif [[ -f \"$file\" ]]; then\n    echo \"It is a file\"\nelif [[ -d \"$file\" ]]; then\n    echo \"It is a directory\"\nelse\n    echo \"Does not exist\"\nfi\n```\n\n| Test | Meaning |\n| :--- | :--- |\n| `-e` `-f` `-d` | Exists / regular file / directory |\n| `-r` `-w` `-x` | Readable / writable / executable |\n| `-z` `-n` | String is empty / not empty |\n| `==` `!=` | String equal / not equal |\n| `-eq` `-ne` `-lt` `-le` `-gt` `-ge` | Numeric comparisons |\n\n---\n\n### Good habits\n\n1. **Quote variables:** `\"$file\"` not `$file`.\n2. Use `[[ ... ]]` for tests in Bash.\n3. Check scripts with **ShellCheck** (`shellcheck script.sh`).\n4. Debug with `bash -x script.sh`.\n5. Use `trap 'rm -f \"$tmp\"' EXIT` to clean up temporary files.\n",
          "exercises": []
        },
        {
          "id": 26,
          "title": "Chapter 26: Security Essentials",
          "slug": "ch26-security-essentials",
          "order": 17,
          "is_published": true,
          "description": "Hardening checklist, audit commands, MAC (SELinux & AppArmor), and encryption tools.",
          "content": "# 26. Security Essentials\n\n### A practical checklist\n\n1. **Keep systems updated.** Enable automatic security updates.\n2. **Use SSH keys,** disable password login and root login (Chapter 21).\n3. **Enable a firewall** and open only the ports you need.\n4. **Least privilege.** Use regular accounts, give sudo sparingly, and run services as dedicated non-root users.\n5. **Install fail2ban** to ban IPs that repeatedly fail logins.\n6. **Remove what you do not use.** Stop and disable unused services (`ss -tulpn`).\n7. **Back up and test restores.**\n8. **Watch the logs.** Check `/var/log/auth.log` or `journalctl -u ssh`.\n\n---\n\n### Handy audit commands\n\n```bash\nsudo ss -tulpn                         # what is exposed to the network?\nlast -n 20 ; sudo lastb | head         # successful and failed logins\nsudo find / -perm -4000 -type f 2>/dev/null   # setuid programs\nsudo find / -xdev -type f -perm -0002 2>/dev/null   # world-writable files\nawk -F: '$3==0 {print $1}' /etc/passwd # accounts with UID 0 (should be only root)\nsudo lynis audit system                # full security audit\n```\n\n---\n\n### Mandatory Access Control (MAC) & Encryption\n\n* **SELinux (RHEL, Fedora):** `getenforce`, `sestatus`, `ls -Z`, `restorecon -Rv /path`.\n* **AppArmor (Ubuntu, Debian, SUSE):** `sudo aa-status`, profiles in `/etc/apparmor.d/`.\n\n```bash\nopenssl rand -base64 24            # generate a random secret\ngpg --full-generate-key            # create a GPG key\ngpg -c secret.txt                  # encrypt a file with passphrase\ngpg secret.txt.gpg                 # decrypt\n```\n",
          "exercises": []
        },
        {
          "id": 27,
          "title": "Chapter 27: Boot Process, Kernel and Hardware",
          "slug": "ch27-boot-process-kernel-hardware",
          "order": 18,
          "is_published": true,
          "description": "The 5 boot stages, hardware inspection, kernel modules, /proc and /sys, and GRUB recovery.",
          "content": "# 27. Boot Process, Kernel and Hardware\n\n### What happens when the machine starts\n\n1. **Firmware (BIOS or UEFI)** tests hardware and finds boot device.\n2. **Boot loader (usually GRUB)** loads kernel and initial RAM disk.\n3. **Kernel starts,** detects hardware, mounts root file system.\n4. **systemd (PID 1)** starts services until target is reached.\n5. **Login prompt** or desktop appears.\n\n---\n\n### Inspecting hardware and the kernel\n\n| Command | What it does | Example |\n| :--- | :--- | :--- |\n| `uname -a` | Kernel version and architecture. | `uname -r` |\n| `lscpu` | CPU details. | `lscpu` |\n| `lsmem` / `free -h` | Memory info. | `free -h` |\n| `lspci` | PCI devices (graphics, network cards). | `lspci -k` |\n| `lsusb` | USB devices. | `lsusb` |\n| `lsblk` | Disks and partitions. | `lsblk` |\n| `sudo dmidecode` | BIOS and hardware inventory. | `sudo dmidecode -t memory` |\n| `lsmod` | Loaded kernel modules (drivers). | `lsmod \\| grep nvidia` |\n| `cat /etc/os-release` | Which distro and version is running. | `cat /etc/os-release` |\n\n---\n\n### Virtual file systems for live information\n\n```bash\ncat /proc/cpuinfo | head\ncat /proc/meminfo | head\ncat /proc/loadavg\nls /sys/class/net/                    # network interfaces\nsysctl net.ipv4.ip_forward            # read kernel setting\nsudo sysctl -w net.ipv4.ip_forward=1  # change until reboot\n```\n",
          "exercises": []
        },
        {
          "id": 28,
          "title": "Chapter 28: Developer Tools and Containers",
          "slug": "ch28-developer-tools-and-containers",
          "order": 19,
          "is_published": true,
          "description": "Git essentials, Docker fundamentals, language virtual environments, and everyday CLI utilities.",
          "content": "# 28. Developer Tools and Containers\n\n### Git essentials\n\n```bash\ngit config --global user.name \"Jaya Prakash\"\ngit config --global user.email \"you@example.com\"\ngit clone https://github.com/user/repo.git\ngit status                      # what changed?\ngit add file.txt                # stage a change\ngit commit -m \"Describe the change\"\ngit log --oneline --graph -10\ngit switch -c feature/login     # new branch\ngit pull --rebase               # get updates\ngit push -u origin feature/login\ngit diff                        # unstaged changes\ngit stash ; git stash pop       # shelve and restore work in progress\n```\n\n---\n\n### Docker essentials\n\n```bash\ndocker run -d --name web -p 8080:80 nginx   # run container in background\ndocker ps                                   # running containers (-a for all)\ndocker logs -f web                          # follow logs\ndocker exec -it web bash                    # shell inside container\ndocker stop web && docker rm web\ndocker images                               # local images\ndocker build -t myapp .                     # build from Dockerfile\ndocker compose up -d                        # start multi-container app\ndocker system prune                         # clean unused data\n```\n\n---\n\n### Working with languages and environments\n\n```bash\npython3 -m venv .venv && source .venv/bin/activate   # isolated Python environment\npip install requests\ndeactivate\n\nnode -v ; npm -v                                     # check Node.js\nnvm install --lts                                    # manage Node versions\n```\n\n---\n\n### Useful everyday extras\n\n| Command | What it does | Example |\n| :--- | :--- | :--- |\n| `watch -n 2 cmd` | Re-run a command every 2 seconds. | `watch -n 2 df -h` |\n| `time cmd` | Measure how long something takes. | `time ./build.sh` |\n| `timeout 10 cmd` | Stop a command after a limit. | `timeout 10 ping x` |\n| `screen` / `tmux` | Persistent terminal sessions. | `tmux new -s dev` |\n| `jq` | Slice and format JSON. | `jq '.name' package.json` |\n| `bc` | Quick calculations. | `echo '2^10' \\| bc` |\n",
          "exercises": []
        },
        {
          "id": 29,
          "title": "Chapter 29: Troubleshooting Playbook",
          "slug": "ch29-troubleshooting-playbook",
          "order": 20,
          "is_published": true,
          "description": "Structured troubleshooting for command not found, permission denied, full disks, failed services, and connectivity issues.",
          "content": "# 29. Troubleshooting Playbook\n\nMost problems follow a pattern. Work from the symptom to the evidence, change one thing at a time, and read the error message – it usually tells you exactly what is wrong.\n\n---\n\n### 1. Command not found\n* Check spelling and case. Run `type name` or `which name`.\n* Is it installed? Try `sudo apt install name`.\n* Is the folder in `$PATH`? Run `echo $PATH`. For your own scripts use `./script.sh`.\n\n---\n\n### 2. Permission denied\n* Check permissions and ownership: `ls -l file` and `ls -ld folder`.\n* Executable bit missing? `chmod +x file`.\n* Need admin rights? Use `sudo`, but understand why first.\n* For every folder in a path, you need `x`. `namei -l /full/path/to/file` shows where access breaks.\n\n---\n\n### 3. Disk is full\n```bash\ndf -h                                   # which file system is full?\ndf -i                                   # or out of inodes?\nsudo du -h --max-depth=1 /var | sort -h # find culprit folder\nsudo journalctl --vacuum-size=200M      # shrink journal\nsudo apt clean ; sudo apt autoremove    # clear package caches\n```\n\n---\n\n### 4. A service will not start\n```bash\nsystemctl status myapp -l --no-pager\njournalctl -u myapp -n 100 --no-pager\nsudo ss -tulpn | grep :PORT             # is port already in use?\nnginx -t                                # check syntax (or sshd -t, apachectl configtest)\n```\n\n---\n\n### 5. System is slow\n* `uptime` – is load average higher than number of CPU cores?\n* `top` or `htop` – which process uses CPU or memory?\n* `free -h` – is the machine swapping heavily?\n* `iostat -x 2` or `iotop` – is disk I/O saturated?\n\n---\n\n### 6. Cannot reach a server or the internet\n* `ip -br a` – do you have an IP address?\n* `ping -c3 <gateway>` – is local network fine?\n* `ping -c3 8.8.8.8` – is internet reachable by IP?\n* `ping -c3 example.com` – if IP works but domain fails, it's DNS (check `/etc/resolv.conf`).\n* `nc -zv host port` – test if the destination port is reachable or firewalled.\n",
          "exercises": []
        },
        {
          "id": 30,
          "title": "Chapter 30: One-Page Command Cheat Sheet & Glossary",
          "slug": "ch30-command-cheat-sheet",
          "order": 21,
          "is_published": true,
          "description": "Comprehensive one-page command cheat sheet and core Linux glossary.",
          "content": "# 30. One-Page Command Cheat Sheet & Glossary\n\n### Files and folders\n\n| Command | Purpose |\n| :--- | :--- |\n| `ls -lah` | List all with details |\n| `cd -` / `cd ~` | Previous / home directory |\n| `cp -a src dst` | Copy preserving everything |\n| `mv a b` | Move or rename |\n| `rm -rI dir` | Delete recursively with a prompt |\n| `ln -s target link` | Symbolic link |\n| `find . -name \"*.log\"` | Find by name |\n| `du -sh *` | Sizes of items |\n| `df -h` | Free disk space |\n| `tar -czf a.tgz dir` | Create archive |\n| `tar -xzf a.tgz` | Extract archive |\n| `rsync -av src/ dst/` | Sync folders |\n\n---\n\n### Text processing\n\n| Command | Purpose |\n| :--- | :--- |\n| `cat / less / head / tail -f` | View files and follow logs |\n| `grep -rin \"text\" .` | Search recursively, ignoring case |\n| `sort \\| uniq -c \\| sort -nr` | Count and rank lines |\n| `cut -d, -f2 f.csv` | Extract a column |\n| `awk '{print $1}'` | Print first column |\n| `sed -i 's/a/b/g' f` | Replace in file |\n| `diff -u a b` | Compare files |\n| `wc -l` | Count lines |\n| `tee file` | Save and display output |\n| `xargs` | Build commands from input |\n\n---\n\n### System, users and processes\n\n| Command | Purpose |\n| :--- | :--- |\n| `top / htop` | Live processes |\n| `ps aux \\| grep x` | Find a process |\n| `kill PID / kill -9 PID` | Stop / force stop |\n| `systemctl status\\|start\\|stop\\|enable x` | Manage services |\n| `journalctl -u x -f` | Follow service logs |\n| `sudo useradd -m x` | Create a user |\n| `sudo usermod -aG g x` | Add user to group |\n| `chmod / chown` | Permissions / ownership |\n| `crontab -e` | Schedule jobs |\n| `uname -a / lsb_release -a` | System information |\n| `free -h / uptime` | Memory and load |\n\n---\n\n### Network\n\n| Command | Purpose |\n| :--- | :--- |\n| `ip -br a / ip route` | Addresses / routes |\n| `ss -tulpn` | Listening ports |\n| `ping -c3 host` | Reachability |\n| `dig host / nslookup host` | DNS |\n| `curl -I url` | HTTP headers |\n| `wget -c url` | Download and resume |\n| `ssh user@host` | Remote login |\n| `scp / rsync -e ssh` | Copy over SSH |\n| `sudo ufw allow 22/tcp` | Firewall rule |\n\n---\n\n### Glossary\n\n| Term | Meaning |\n| :--- | :--- |\n| **Root** | The administrator account (UID 0), and also top of the file system (`/`). |\n| **Daemon** | A background service, often ending in `d` (`sshd`, `crond`). |\n| **Package** | An archive of software with metadata, installed by package manager. |\n| **Repository** | A server that hosts packages for your distro. |\n| **Mount point** | A folder where a disk or partition is attached to the tree. |\n| **Inode** | The record that stores a file's metadata and where data sits on disk. |\n| **PID** | Process ID, the number identifying a running process. |\n| **Pipe** | The `\\|` symbol connecting one command's output to another's input. |\n| **Sudo** | Run a single command with administrator rights. |\n| **Distro** | A complete Linux system: kernel plus tools, package manager and defaults. |\n",
          "exercises": []
        }
      ]
    }
  ]
};
