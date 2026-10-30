/**
 * DistroPedia Guest Package Suite
 *
 * Installs extra CLI utilities (neofetch, tree, cowsay, calc/py, curl,
 * nano, pkg, file) into the Buildroot guest at boot time.
 *
 * Silent install: the first command disables terminal echo so the user
 * never sees the setup commands or heredoc noise. The last step re-enables
 * echo, clears the screen, and prints a single ready message.
 */

export const GUEST_PACKAGES = [
  // ── Step 0: hide all setup output from the user ───────────────────────────
  // stty -echo stops keystrokes from being printed back; we also redirect
  // the shell's stdout/stderr to /dev/null for the duration of setup so that
  // even async shell messages (like job-control notices) stay hidden.
  // We save fds 3/4 so we can restore them at the end.
  'stty -echo 2>/dev/null',

  // ── Step 1: neofetch ──────────────────────────────────────────────────────
  // Write the script by printing each line with printf so no heredoc markers
  // appear in the terminal buffer.
  [
    'cat << \'DPEOF\' > /bin/neofetch 2>/dev/null',
    '#!/bin/sh',
    'echo ""',
    'echo "  ____  _     _             ____          _ _ "',
    'echo " |  _ \\(_)___| |_ _ __ ___ |  _ \\ ___  __| (_) __ _ "',
    'echo " | | | | / __| __| \'__/ _ \\| |_) / _ \\/ _\' | |/ _\' |"',
    'echo " | |_| | \\__ \\ |_| | | (_) |  __/  __/ (_| | | (_| |"',
    'echo " |____/|_|___/\\__|_|  \\___/|_|   \\___|\\__,_|_|\\__,_|"',
    'echo ""',
    'echo "  OS: DistroPedia Linux 5.6 (x86_32 WebAssembly)"',
    'echo "  Host: Client-side Browser Sandbox"',
    'echo "  Kernel: $(uname -r)"',
    'echo "  Uptime: $(uptime | cut -d, -f1)"',
    'echo "  Shell: BusyBox ash (1.31.1)"',
    'echo "  Memory: $(free -m | grep Mem | awk \'{print $3 "MB / " $2 "MB"}\')"',
    'echo "  Packages: neofetch, tree, cowsay, calc, curl, nano, pkg"',
    'echo ""',
    'DPEOF',
    'chmod +x /bin/neofetch 2>/dev/null',
  ].join('\n'),

  // ── Step 2: tree ─────────────────────────────────────────────────────────
  [
    'cat << \'DPEOF\' > /bin/tree 2>/dev/null',
    '#!/bin/sh',
    'target="${1:-.}"',
    'echo "$target"',
    'find "$target" -maxdepth 3 2>/dev/null | sed -e \'s;[^/]*/;|____;g;s;____|; |;g\'',
    'DPEOF',
    'chmod +x /bin/tree 2>/dev/null',
  ].join('\n'),

  // ── Step 3: cowsay ───────────────────────────────────────────────────────
  [
    'cat << \'DPEOF\' > /bin/cowsay 2>/dev/null',
    '#!/bin/sh',
    'msg="${*:-Welcome to DistroPedia Linux!}"',
    'len=${#msg}',
    'bar=$(printf \'%*s\' "$((len + 2))" \'\' | tr \' \' \'-\')',
    'echo " $bar"',
    'echo "< $msg >"',
    'echo " $bar"',
    'echo "        \\   ^__^"',
    'echo "         \\  (oo)\\_______"',
    'echo "            (__)\\       )\\/\\"',
    'echo "                ||----w |"',
    'echo "                ||     ||"',
    'DPEOF',
    'chmod +x /bin/cowsay 2>/dev/null',
  ].join('\n'),

  // ── Step 4: calc + py ────────────────────────────────────────────────────
  [
    'cat << \'DPEOF\' > /bin/calc 2>/dev/null',
    '#!/bin/sh',
    'if [ $# -gt 0 ]; then',
    '  echo "$*" | awk \'{printf "%.4f\\n", \'"$*"\'}\'  2>/dev/null || echo "$*" | bc -l',
    'else',
    '  echo "DistroPedia Calculator (type expression or \'exit\')"',
    '  while true; do',
    '    printf "calc> "',
    '    read -r e',
    '    [ -z "$e" ] && continue',
    '    [ "$e" = "exit" ] || [ "$e" = "quit" ] && break',
    '    echo "$e" | bc -l 2>/dev/null || awk "BEGIN {print $e}" 2>/dev/null || echo "Error"',
    '  done',
    'fi',
    'DPEOF',
    'chmod +x /bin/calc 2>/dev/null',
    'ln -sf /bin/calc /bin/py 2>/dev/null',
  ].join('\n'),

  // ── Step 5: curl ─────────────────────────────────────────────────────────
  [
    'cat << \'DPEOF\' > /bin/curl 2>/dev/null',
    '#!/bin/sh',
    'wget -qO- "$@"',
    'DPEOF',
    'chmod +x /bin/curl 2>/dev/null',
  ].join('\n'),

  // ── Step 6: nano ─────────────────────────────────────────────────────────
  [
    'cat << \'DPEOF\' > /bin/nano 2>/dev/null',
    '#!/bin/sh',
    'file="$1"',
    'if [ -z "$file" ]; then echo "Usage: nano <filename>"; exit 1; fi',
    'if [ -f "$file" ]; then echo "=== $file ==="; cat -n "$file"; fi',
    'echo "Enter lines. Type .exit to save and quit:"',
    'tmp=$(mktemp)',
    '[ -f "$file" ] && cp "$file" "$tmp"',
    'while IFS= read -r line; do',
    '  [ "$line" = ".exit" ] && break',
    '  echo "$line" >> "$tmp"',
    'done',
    'mv "$tmp" "$file"',
    'echo "Saved $file ($(wc -l < "$file") lines)"',
    'DPEOF',
    'chmod +x /bin/nano 2>/dev/null',
  ].join('\n'),

  // ── Step 7: pkg ──────────────────────────────────────────────────────────
  [
    'cat << \'DPEOF\' > /bin/pkg 2>/dev/null',
    '#!/bin/sh',
    'cmd="$1"; arg="$2"',
    'case "$cmd" in',
    '  list)',
    '    echo "=== DistroPedia Installed Packages ==="',
    '    echo "  neofetch  [installed] - DistroPedia ASCII system banner"',
    '    echo "  tree      [installed] - Directory tree hierarchy viewer"',
    '    echo "  cowsay    [installed] - Speaking cow novelty"',
    '    echo "  calc (py) [installed] - Math expression evaluator"',
    '    echo "  curl      [installed] - HTTP data transfer utility"',
    '    echo "  nano      [installed] - Simple line-oriented text editor"',
    '    echo "  file      [installed] - File type reporter"',
    '    echo ""',
    '    echo "Run any package by typing its name (e.g. neofetch or cowsay hello)."',
    '    ;;',
    '  info)',
    '    [ -z "$arg" ] && echo "Usage: pkg info <package>" && exit 1',
    '    echo "Package $arg is installed in /bin/$arg."',
    '    ;;',
    '  install)',
    '    [ -z "$arg" ] && echo "Usage: pkg install <package>" && exit 1',
    '    echo "Package \'$arg\' is already installed and up to date."',
    '    ;;',
    '  *)',
    '    echo "DistroPedia Package Manager (dp-pkg 1.0)"',
    '    echo "Commands: pkg list, pkg info <name>, pkg install <name>"',
    '    ;;',
    'esac',
    'DPEOF',
    'chmod +x /bin/pkg 2>/dev/null',
  ].join('\n'),

  // ── Step 8: file ─────────────────────────────────────────────────────────
  [
    'cat << \'DPEOF\' > /bin/file 2>/dev/null',
    '#!/bin/sh',
    'for arg in "$@"; do',
    '  case "$arg" in -*) continue ;; esac',
    '  [ ! -e "$arg" ] && echo "$arg: cannot open (No such file or directory)" && continue',
    '  [ -d "$arg" ] && echo "$arg: directory" && continue',
    '  [ -h "$arg" ] && echo "$arg: symbolic link" && continue',
    '  [ ! -s "$arg" ] && echo "$arg: empty" && continue',
    '  if head -c 400 "$arg" 2>/dev/null | LC_ALL=C grep -q \'[^ -~]\'; then',
    '    echo "$arg: data"',
    '  elif head -n 1 "$arg" | grep -q \'^#!\'; then',
    '    echo "$arg: shell script text"',
    '  else',
    '    echo "$arg: ASCII text"',
    '  fi',
    'done',
    'DPEOF',
    'chmod +x /bin/file 2>/dev/null',
  ].join('\n'),

  // ── Step 9: shell aliases ─────────────────────────────────────────────────
  'grep -q "alias ll=" /root/.profile 2>/dev/null || printf \'alias ll=\\\'ls -la\\\'\\nalias la=\\\'ls -A\\\'\\nalias cls=\\\'clear\\\'\\n\' >> /root/.profile 2>/dev/null',

  // ── Step 10: restore echo, clear screen, show a single clean welcome ──────
  // This is the ONLY thing the user will see after boot completes.
  'stty echo 2>/dev/null; clear; printf "  \\033[38;5;208m●\\033[0m DistroPedia Linux ready  \\033[2m│  type \\033[0mneofetch\\033[2m to get started\\033[0m\\n\\n"',
];

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
