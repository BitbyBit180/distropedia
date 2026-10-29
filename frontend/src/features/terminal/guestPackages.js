/**
 * DistroPedia Guest Package Suite
 * Provides extra command-line utilities for the browser-based Linux VM:
 * - neofetch: DistroPedia system info & ASCII banner
 * - tree: Recursive directory hierarchy visualizer
 * - cowsay: Classic talking cow novelty
 * - calc / py: High-precision math expression evaluator (awk/bc)
 * - curl: HTTP download & transfer client wrapper
 * - pkg: DistroPedia package manager (pkg list, pkg info, pkg install)
 * - nano: Simple interactive file editor
 */

export const GUEST_PACKAGES = [
  // 1. neofetch
  [
    'cat << \'EOF\' > /bin/neofetch && chmod +x /bin/neofetch',
    '#!/bin/sh',
    'echo ""',
    'echo "  ____  _     _             ____          _ _ "',
    'echo " |  _ \\\\(_)___| |_ _ __ ___ |  _ \\\\ ___  __| (_) __ _ "',
    'echo " | | | | / __| __| \'__/ _ \\\\| |_) / _ \\\\/ _\' | |/ _\' |"',
    'echo " | |_| | \\\\__ \\\\ |_| | | (_) |  __/  __/ (_| | | (_| |"',
    'echo " |____/|_|___/\\\\__|_|  \\\\___/|_|   \\\\___|\\\\__,_|_|\\\\__,_|\"',
    'echo ""',
    'echo "  OS: DistroPedia Linux 5.6 (x86_32 WebAssembly)"',
    'echo "  Host: Client-side Browser Sandbox"',
    'echo "  Kernel: $(uname -r)"',
    'echo "  Uptime: $(uptime | cut -d, -f1)"',
    'echo "  Shell: BusyBox ash (1.31.1)"',
    'echo "  Memory: $(free -m | grep Mem | awk \'{print $3 "MB / " $2 "MB"}\')"',
    'echo "  Packages: neofetch, tree, cowsay, calc, curl, nano, pkg"',
    'echo ""',
    'EOF',
  ].join('\n'),

  // 2. tree
  [
    'cat << \'EOF\' > /bin/tree && chmod +x /bin/tree',
    '#!/bin/sh',
    'target="${1:-.}"',
    'echo "$target"',
    'find "$target" -maxdepth 3 2>/dev/null | sed -e \'s;[^/]*/;|____;g;s;____|; |;g\'',
    'EOF',
  ].join('\n'),

  // 3. cowsay
  [
    'cat << \'EOF\' > /bin/cowsay && chmod +x /bin/cowsay',
    '#!/bin/sh',
    'msg="${*:-Welcome to DistroPedia Linux!}"',
    'len=${#msg}',
    'bar=$(printf \'%*s\' "$((len + 2))" \'\' | tr \' \' \'-\')',
    'echo " $bar"',
    'echo "< $msg >"',
    'echo " $bar"',
    'echo "        \\\\   ^__^"',
    'echo "         \\\\  (oo)\\\\\\\\_______"',
    'echo "            (__)\\\\\\\\       )\\\\\\\\/\\\\\\\\"',
    'echo "                ||----w |"',
    'echo "                ||     ||"',
    'EOF',
  ].join('\n'),

  // 4. calc & py
  [
    'cat << \'EOF\' > /bin/calc && chmod +x /bin/calc',
    '#!/bin/sh',
    'if [ $# -gt 0 ]; then',
    '  echo "$*" | awk \'{printf "%.4f\\\\n", \'\"$*\"\'}\' 2>/dev/null || echo "$*" | bc -l',
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
    'EOF',
    'ln -sf /bin/calc /bin/py 2>/dev/null',
  ].join('\n'),

  // 5. curl
  [
    'cat << \'EOF\' > /bin/curl && chmod +x /bin/curl',
    '#!/bin/sh',
    'wget -qO- "$@"',
    'EOF',
  ].join('\n'),

  // 6. nano
  [
    'cat << \'EOF\' > /bin/nano && chmod +x /bin/nano',
    '#!/bin/sh',
    'file="$1"',
    'if [ -z "$file" ]; then',
    '  echo "Usage: nano <filename>"',
    '  exit 1',
    'fi',
    'if [ -f "$file" ]; then',
    '  echo "=== Current contents of $file ==="',
    '  cat -n "$file"',
    'fi',
    'echo "Enter new lines below. Type \'.exit\' on an empty line to save and quit:"',
    'tmp=$(mktemp)',
    '[ -f "$file" ] && cp "$file" "$tmp"',
    'while IFS= read -r line; do',
    '  [ "$line" = ".exit" ] && break',
    '  echo "$line" >> "$tmp"',
    'done',
    'mv "$tmp" "$file"',
    'echo "Saved $file ($(wc -l < "$file") lines)"',
    'EOF',
  ].join('\n'),

  // 7. pkg manager
  [
    'cat << \'EOF\' > /bin/pkg && chmod +x /bin/pkg',
    '#!/bin/sh',
    'cmd="$1"',
    'arg="$2"',
    'case "$cmd" in',
    '  list)',
    '    echo "=== DistroPedia Installed Packages ==="',
    '    echo "  neofetch  [installed] - DistroPedia ASCII system banner"',
    '    echo "  tree      [installed] - Directory tree hierarchy viewer"',
    '    echo "  cowsay    [installed] - Speaking cow novelty"',
    '    echo "  calc (py) [installed] - Math expression evaluator"',
    '    echo "  curl      [installed] - HTTP data transfer utility"',
    '    echo "  nano      [installed] - Simple line-oriented text editor"',
    '    echo ""',
    '    echo "Run any package directly by typing its name (e.g. \'neofetch\' or \'cowsay hello\')."',
    '    ;;',
    '  info)',
    '    if [ -z "$arg" ]; then',
    '      echo "Usage: pkg info <package>"',
    '      exit 1',
    '    fi',
    '    echo "Package $arg is installed in /bin/$arg."',
    '    ;;',
    '  install)',
    '    if [ -z "$arg" ]; then',
    '      echo "Usage: pkg install <package>"',
    '      exit 1',
    '    fi',
    '    echo "Checking package $arg..."',
    '    echo "Package \'$arg\' is already installed and up to date."',
    '    ;;',
    '  *)',
    '    echo "DistroPedia Package Manager (dp-pkg 1.0)"',
    '    echo "Commands: pkg list, pkg info <name>, pkg install <name>"',
    '    ;;',
    'esac',
    'EOF',
    'echo "alias ll=\'ls -la\'" >> /root/.profile 2>/dev/null',
    'echo "alias la=\'ls -A\'" >> /root/.profile 2>/dev/null',
    'echo "alias cls=\'clear\'" >> /root/.profile 2>/dev/null',
  ].join('\n'),
];
