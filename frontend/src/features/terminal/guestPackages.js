/**
 * DistroPedia Guest Package Suite
 * Provides clean, minimal utilities for the in-browser Linux VM:
 * - file: lightweight file type detector (Buildroot does not ship libmagic)
 * - tree: recursive directory hierarchy visualizer
 * - curl: wrapper around BusyBox wget
 * - neofetch: clean system information banner
 * - aliases: ll ('ls -la'), la ('ls -A'), cls ('clear')
 *
 * Runs 100% silently in the background at boot time before the terminal is revealed.
 */

export const GUEST_SETUP_SCRIPT = `
cat << 'EOF' > /bin/file && chmod +x /bin/file
#!/bin/sh
for arg in "$@"; do
  case "$arg" in -*) continue ;; esac
  if [ ! -e "$arg" ]; then echo "$arg: cannot open (No such file or directory)"; continue; fi
  if [ -d "$arg" ]; then echo "$arg: directory"; continue; fi
  if [ -h "$arg" ]; then echo "$arg: symbolic link"; continue; fi
  if [ ! -s "$arg" ]; then echo "$arg: empty"; continue; fi
  if head -c 400 "$arg" 2>/dev/null | LC_ALL=C grep -q '[^ -~]'; then
    echo "$arg: data"
  elif head -n 1 "$arg" | grep -q '^#!'; then
    echo "$arg: shell script text"
  else
    echo "$arg: ASCII text"
  fi
done
EOF

cat << 'EOF' > /bin/tree && chmod +x /bin/tree
#!/bin/sh
target="\${1:-.}"
echo "$target"
find "$target" -maxdepth 3 2>/dev/null | sed -e 's;[^/]*/;|____;g;s;____|; |;g'
EOF

cat << 'EOF' > /bin/curl && chmod +x /bin/curl
#!/bin/sh
wget -qO- "$@"
EOF

cat << 'EOF' > /bin/neofetch && chmod +x /bin/neofetch
#!/bin/sh
echo ""
echo "  DistroPedia Linux 5.6 (x86_32 WebAssembly)"
echo "  Kernel: \$(uname -r)"
echo "  Uptime: \$(uptime | cut -d, -f1)"
echo "  Memory: \$(free -m | grep Mem | awk '{print \$3 \"MB / \" \$2 \"MB\"}')"
echo "  Shell:  BusyBox ash (1.31.1)"
echo ""
EOF

grep -q "alias ll=" /root/.profile 2>/dev/null || cat << 'EOF' >> /root/.profile
alias ll='ls -la'
alias la='ls -A'
alias cls='clear'
EOF
`.trim();

/**
 * Commands the syllabus teaches that this Buildroot guest genuinely cannot run
 * (no package manager, no compiler, no print spooler, no roff suite, no ssh
 * client, bash-only syntax). Used to keep "try it now" chips honest; the book
 * text still explains them.
 */
export const GUEST_UNAVAILABLE_COMMANDS = new Set([
  'apt', 'apt-get', 'yum', 'dnf', 'rpm', 'dpkg', 'pacman', 'zypper', 'emerge',
  'gcc', 'cc', 'g++', 'make', 'autoconf', 'automake',
  'bash', 'zsh', 'csh', 'tcsh', 'ksh', 'dash',
  'man', 'apropos', 'whatis', 'info',
  'ssh', 'scp', 'slogin', 'rsync', 'nc', 'netcat', 'dig',
  'zip', 'bzip2', '7z', 'rar',
  'lp', 'lpr', 'lpq', 'lprm', 'lpstat', 'lpc', 'cancel', 'a2ps', 'enscript', 'ps2pdf',
  'groff', 'nroff', 'troff', 'roff', 'tbl', 'eqn', 'mandoc', 'pr', 'fmt', 'expand',
  'unexpand', 'col', 'colrm', 'tabs', 'aspell', 'spell', 'diction',
  'stat', 'mkfs', 'wodim', 'cdrecord', 'vmstat', 'iostat', 'cal', 'at', 'batch',
  'sudo', 'vim', 'gedit', 'python', 'python3', 'perl', 'ruby',
  'shutdown', 'poweroff', 'ifup', 'ifdown', 'nmcli', 'systemctl', 'service',
]);
