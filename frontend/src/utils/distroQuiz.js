/**
 * "Which distro fits me?" — questions only.
 *
 * The recommendation itself is fully AI: the answers go to the backend,
 * where Jev (TypeSafe System One) picks the winner from the whole distro
 * catalogue based on user needs and hardware specifications.
 * No points, no scoring table anywhere in the codebase —
 * do NOT add one here (or server-side).
 */

export const QUIZ_QUESTIONS = [
  // --- Profile & Use Case ---
  {
    id: 'experience',
    category: 'Profile & Experience',
    question: 'How much Linux experience do you have?',
    options: [
      {
        label: 'I’m completely new',
        desc: 'First time switching or exploring from Windows/macOS.',
      },
      {
        label: 'I’ve dabbled a bit',
        desc: 'Used it in a virtual machine or tried Ubuntu/Mint briefly.',
      },
      {
        label: 'I use it as a daily driver',
        desc: 'Comfortable with everyday usage and basic troubleshooting.',
      },
      {
        label: 'I’m a pro / sysadmin',
        desc: 'Comfortable with kernel configs, compiling, and deep customization.',
      },
    ],
  },
  {
    id: 'use',
    category: 'Primary Use Case',
    question: 'What will you mainly use this machine for?',
    options: [
      {
        label: 'Everyday desktop & media',
        desc: 'Web browsing, video streaming, office docs, and general tasks.',
      },
      {
        label: 'Software development & programming',
        desc: 'Coding, Docker containers, web dev, and developer tooling.',
      },
      {
        label: 'Gaming & entertainment',
        desc: 'Steam, Proton, Lutris, Wine, and graphics performance.',
      },
      {
        label: 'Cybersecurity & penetration testing',
        desc: 'Ethical hacking, forensics, packet analysis, and security auditing.',
      },
      {
        label: 'Servers, cloud & virtualization',
        desc: 'Home lab, self-hosted services, Docker/Podman, and headless setups.',
      },
      {
        label: 'Reviving older or low-spec hardware',
        desc: 'Giving an older laptop or desktop a snappy second life.',
      },
    ],
  },

  // --- Hardware & Machine Details ---
  {
    id: 'device_type',
    category: 'Hardware: Device Type',
    question: 'What type of computer are you installing on?',
    options: [
      {
        label: 'Laptop / Notebook',
        desc: 'Need good battery life, touchpad gesture support, and Wi-Fi/sleep reliability.',
      },
      {
        label: 'Desktop PC / Custom Rig',
        desc: 'Plenty of power, multiple monitors, dedicated cooling, always plugged in.',
      },
      {
        label: 'Older refurbished PC / Netbook',
        desc: 'Older CPU and limited resources requiring a featherweight OS footprint.',
      },
      {
        label: 'Mini PC / Home Server / Single Board',
        desc: 'Quiet 24/7 continuous operation, headless or lightweight footprint.',
      },
    ],
  },
  {
    id: 'ram',
    category: 'Hardware: RAM / Memory',
    question: 'How much RAM (Memory) does your computer have?',
    options: [
      {
        label: '16 GB or more',
        desc: 'High capacity — effortlessly runs heavy desktops (GNOME/KDE), VMs, and games.',
      },
      {
        label: '8 GB',
        desc: 'Modern sweet spot — smooth multitasking and fluid desktop performance.',
      },
      {
        label: '4 GB',
        desc: 'Modest capacity — benefits from resource-conscious desktops (XFCE, Cinnamon).',
      },
      {
        label: '1 GB to 2 GB',
        desc: 'Very limited — requires ultra-lightweight distros (Alpine, Void, Debian XFCE).',
      },
    ],
  },
  {
    id: 'gpu',
    category: 'Hardware: Graphics / GPU',
    question: 'What graphics card (GPU) does your machine have?',
    options: [
      {
        label: 'Dedicated NVIDIA GPU',
        desc: 'Needs reliable proprietary NVIDIA drivers and prime offload (Pop!_OS, Mint, Ubuntu).',
      },
      {
        label: 'AMD Radeon or Intel Graphics',
        desc: 'Open-source Mesa drivers work flawlessly out-of-the-box on all distros.',
      },
      {
        label: 'Dual / Hybrid graphics (Laptop)',
        desc: 'Integrated GPU for battery saving + dedicated NVIDIA/AMD GPU for power.',
      },
      {
        label: 'Very old or legacy graphics',
        desc: 'Requires legacy drivers or lightweight X11 display compositing.',
      },
    ],
  },
  {
    id: 'storage',
    category: 'Hardware: Storage Drive',
    question: 'What type of primary storage drive are you using?',
    options: [
      {
        label: 'Fast Solid-State Drive (NVMe or SATA SSD)',
        desc: 'Near-instant boot times and app launches; handles any modern OS.',
      },
      {
        label: 'Traditional Hard Drive (HDD) or slow eMMC',
        desc: 'Heavy distros will feel sluggish; lightweight distros keep it responsive.',
      },
      {
        label: 'USB Flash Drive / External portable drive',
        desc: 'Live boot with persistence or portable on-the-go Linux environment.',
      },
    ],
  },
  {
    id: 'cpu',
    category: 'Hardware: Processor (CPU)',
    question: 'What processor generation does the computer have?',
    options: [
      {
        label: 'Modern multi-core (Intel Core / AMD Ryzen)',
        desc: 'Recent 64-bit multi-core CPU with fast single-thread and hardware virtualization.',
      },
      {
        label: 'Older 64-bit CPU (Core 2 Duo, older i3/i5, Athlon)',
        desc: 'Functional but older architecture; benefits from lightweight distributions.',
      },
      {
        label: 'Low-power entry CPU (Intel Celeron, Pentium, Atom)',
        desc: 'Limited compute power; best paired with streamlined, lean desktop environments.',
      },
    ],
  },

  // --- Desktop Experience & Preferences ---
  {
    id: 'desktop',
    category: 'Desktop Environment',
    question: 'What should the desktop interface feel like?',
    options: [
      {
        label: 'Familiar & traditional (like Windows / macOS)',
        desc: 'Bottom taskbar, application start menu, standard system tray (Cinnamon, XFCE).',
      },
      {
        label: 'Modern & gesture-driven (like GNOME / COSMIC)',
        desc: 'Full-screen app overview, trackpad swipe gestures, clean distraction-free UI.',
      },
      {
        label: 'Highly customizable & lightweight',
        desc: 'Tweak themes, panels, widgets, and shortcuts to create your dream desktop.',
      },
      {
        label: 'Tiling window manager or minimal CLI',
        desc: 'Keyboard-driven efficiency without bloated desktop layers (i3, Sway, dwm).',
      },
    ],
  },
  {
    id: 'updates',
    category: 'Release Model',
    question: 'How do you like your system updates delivered?',
    options: [
      {
        label: 'Rock solid & conservative (LTS / Point releases)',
        desc: 'Packages remain stable for years; security patches only, zero surprise breakage.',
      },
      {
        label: 'Balanced & fresh',
        desc: 'Up-to-date kernels and applications every 6 months with thorough QA testing.',
      },
      {
        label: 'Rolling release (bleeding edge)',
        desc: 'New software and kernels pushed as soon as upstream developers release them.',
      },
    ],
  },
  {
    id: 'effort',
    category: 'Setup & Maintenance',
    question: 'How much setup and maintenance effort do you want?',
    options: [
      {
        label: 'It should just work out-of-the-box',
        desc: 'Pre-installed codecs, graphic driver manager, and graphical software center.',
      },
      {
        label: 'Some configuration is fine',
        desc: 'Comfortable with standard settings, CLI packages, and minor config adjustments.',
      },
      {
        label: 'I enjoy building things from scratch',
        desc: 'Manual partitioning, terminal installer, and tailored configuration files.',
      },
    ],
  },
  {
    id: 'terminal',
    category: 'Terminal Comfort',
    question: 'How comfortable are you using the command line?',
    options: [
      {
        label: 'I avoid it — give me graphical buttons',
        desc: 'Prefer GUI app stores, graphical settings panels, and point-and-click tools.',
      },
      {
        label: 'I can handle basic commands when needed',
        desc: 'Comfortable copying commands from guides or doing simple file operations.',
      },
      {
        label: 'I live in the terminal',
        desc: 'Fast typing, bash scripts, package management, and config editing in vim/nano.',
      },
    ],
  },
  {
    id: 'priority',
    category: 'Final Decision Factor',
    question: 'What matters most to you in your daily computing?',
    options: [
      {
        label: 'Maximum ease of use & community support',
        desc: 'Massive user community, millions of forum solutions, and zero friction.',
      },
      {
        label: 'Blazing speed & minimal resource consumption',
        desc: 'Ultra-fast boot, low RAM footprint, and responsive even under load.',
      },
      {
        label: 'Dedicated gaming & graphics driver readiness',
        desc: 'First-class NVIDIA/AMD driver tools, GameMode, Steam, and Proton readiness.',
      },
      {
        label: 'Total system control & reproducibility',
        desc: 'Declarative configs, rolling updates, or complete software freedom.',
      },
    ],
  },
];
