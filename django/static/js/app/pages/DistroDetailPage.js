import React, { useState, useEffect } from "dp/core/react.js";
import { motion, useScroll, useTransform, AnimatePresence } from "dp/core/motion.js";
import {
  ArrowLeft,
  ExternalLink,
  Download,
  Terminal,
  Cpu,
  Layers,
  HardDrive,
  Copy,
  Check,
  CheckCircle2,
  Calendar,
  Sparkles,
  Monitor,
  Laptop,
  Box,
  Split,
  AlertTriangle,
  ShieldAlert,
  Info,
  Wrench,
  Clock,
  ChevronUp,
  Compass,
  Image as ImageIcon,
  ZoomIn,
  X
} from "dp/core/icons.js";
import DistroIcon from "../components/DistroIcon.js";
import { DistroDetailSkeleton } from "../components/Skeleton.js";
import { getInstallationData } from "../data/installGuide.js";
import { useDistro } from "../hooks/useDistro.js";
import { THEME } from "../theme/designTokens.js";
const MODE_ICONS = { laptop: Laptop, split: Split, box: Box };
const resolveModeIcon = (icon) => typeof icon === "string" ? MODE_ICONS[icon] || Laptop : icon;
const STATIC_DOTS = [
  { top: "4%", left: "8%" },
  { top: "6%", left: "24%" },
  { top: "5%", left: "42%" },
  { top: "8%", left: "61%" },
  { top: "3%", left: "78%" },
  { top: "7%", left: "92%" },
  { top: "12%", left: "14%" },
  { top: "15%", left: "33%" },
  { top: "11%", left: "55%" },
  { top: "14%", left: "72%" },
  { top: "17%", left: "86%" },
  { top: "21%", left: "5%" },
  { top: "23%", left: "19%" },
  { top: "19%", left: "48%" },
  { top: "22%", left: "67%" },
  { top: "26%", left: "82%" },
  { top: "28%", left: "95%" },
  { top: "31%", left: "12%" },
  { top: "34%", left: "29%" },
  { top: "30%", left: "58%" },
  { top: "33%", left: "75%" },
  { top: "37%", left: "89%" },
  { top: "41%", left: "7%" },
  { top: "39%", left: "22%" },
  { top: "44%", left: "38%" },
  { top: "42%", left: "64%" },
  { top: "45%", left: "80%" },
  { top: "49%", left: "15%" },
  { top: "47%", left: "31%" },
  { top: "52%", left: "49%" },
  { top: "50%", left: "71%" },
  { top: "53%", left: "93%" },
  { top: "57%", left: "9%" },
  { top: "55%", left: "25%" },
  { top: "59%", left: "43%" },
  { top: "58%", left: "62%" },
  { top: "61%", left: "79%" },
  { top: "64%", left: "18%" },
  { top: "66%", left: "35%" }
];
function DistroDetailPage({ distroId, onNavigate }) {
  const [installMode, setInstallMode] = useState("normal");
  const [copiedCmdId, setCopiedCmdId] = useState(null);
  const [showSideNav, setShowSideNav] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setActiveLightboxImage(null);
    };
    if (activeLightboxImage) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeLightboxImage]);
  const { scrollY } = useScroll();
  const bannerY = useTransform(scrollY, [0, 900], [0, 200]);
  const bannerOpacity = useTransform(scrollY, [150, 850], [1, 0]);
  const bannerScale = useTransform(scrollY, [0, 900], [1, 1.06]);
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY;
      setShowSideNav(scrollPos > 280);
      const specsEl = document.getElementById("section-specs");
      const installEl = document.getElementById("section-install");
      const exploreEl = document.getElementById("section-explore");
      const triggerOffset = window.innerHeight * 0.4;
      if (exploreEl && exploreEl.getBoundingClientRect().top <= triggerOffset) {
        setActiveSection("explore");
      } else if (installEl && installEl.getBoundingClientRect().top <= triggerOffset) {
        setActiveSection("install");
      } else if (specsEl && specsEl.getBoundingClientRect().top <= triggerOffset) {
        setActiveSection("specs");
      } else {
        setActiveSection("hero");
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const scrollToSection = (sectionId) => {
    if (sectionId === "section-hero") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };
  const { distro, otherDistros, loading } = useDistro(distroId);
  const installationData = distro.installGuide || getInstallationData(distro);
  const rawMode = installationData[installMode] || installationData.normal;
  const currentMode = { ...rawMode, icon: resolveModeIcon(rawMode.icon) };
  const copyStepCmd = (cmd, stepId) => {
    if (cmd) {
      navigator.clipboard.writeText(cmd);
      setCopiedCmdId(stepId);
      setTimeout(() => setCopiedCmdId(null), 2e3);
    }
  };
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      style: {
        backgroundColor: "#161B22",
        minHeight: "100vh",
        position: "relative",
        overflowX: "hidden"
      },
      className: "flex flex-col text-[#F0F4F8]"
    },
    /* @__PURE__ */ React.createElement("div", { className: "hero-bg fixed inset-0 z-0", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("div", { className: "grain-fine" }), /* @__PURE__ */ React.createElement("div", { className: "grain-fiber" })),
    /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 pointer-events-none z-[1]" }, STATIC_DOTS.map((dot, idx) => /* @__PURE__ */ React.createElement(
      "span",
      {
        key: idx,
        style: {
          width: "2px",
          height: "2px",
          borderRadius: "50%",
          background: THEME.textMuted,
          opacity: 0.15,
          position: "absolute",
          top: dot.top,
          left: dot.left
        }
      }
    ))),
    distro.preview && /* @__PURE__ */ React.createElement(
      motion.div,
      {
        style: {
          y: bannerY,
          opacity: bannerOpacity,
          scale: bannerScale
        },
        className: "absolute top-0 left-0 right-0 h-[105vh] min-h-[780px] overflow-hidden pointer-events-none z-0"
      },
      /* @__PURE__ */ React.createElement(
        "img",
        {
          src: distro.preview,
          alt: `${distro.name} Desktop Preview Banner`,
          className: "w-full h-full object-cover object-top sm:object-center brightness-[0.42] contrast-[1.12] saturate-[0.88]"
        }
      ),
      /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "absolute inset-0",
          style: {
            background: "rgba(10, 13, 18, 0.52)"
          }
        }
      ),
      /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "absolute inset-0",
          style: {
            background: "radial-gradient(ellipse at 50% 35%, rgba(10, 13, 18, 0.25) 0%, rgba(15, 18, 24, 0.72) 65%, #161B22 100%)"
          }
        }
      ),
      /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "absolute inset-0",
          style: {
            background: `radial-gradient(ellipse at 30% 20%, ${distro.accent}22 0%, transparent 60%)`,
            mixBlendMode: "screen"
          }
        }
      ),
      /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "absolute top-0 left-0 right-0 h-32",
          style: {
            background: "linear-gradient(to bottom, rgba(10, 13, 18, 0.9) 0%, rgba(15, 18, 24, 0.4) 60%, transparent 100%)"
          }
        }
      ),
      /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "absolute bottom-0 left-0 right-0 h-[450px]",
          style: {
            background: "linear-gradient(to bottom, transparent 0%, rgba(15, 18, 24, 0.4) 25%, rgba(22, 27, 34, 0.85) 65%, #161B22 100%)"
          }
        }
      )
    ),
    /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "fixed top-0 left-1/2 -translate-x-1/2 pointer-events-none z-[1] w-[800px] h-[500px]",
        style: {
          background: `radial-gradient(ellipse at 50% 10%, ${distro.accent}20 0%, ${distro.accent}05 50%, transparent 75%)`,
          filter: "blur(50px)"
        }
      }
    ),
    /* @__PURE__ */ React.createElement(
      "nav",
      {
        style: {
          position: "fixed",
          top: "18px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100,
          display: "inline-flex",
          alignItems: "center",
          borderRadius: "9999px",
          padding: "6px 12px 6px 8px",
          background: "rgba(255, 255, 255, 0.12)",
          backdropFilter: "blur(32px) saturate(180%) brightness(1.15)",
          WebkitBackdropFilter: "blur(32px) saturate(180%) brightness(1.15)",
          border: "1px solid rgba(255, 255, 255, 0.28)",
          boxShadow: "0 4px 28px rgba(0, 0, 0, 0.22), 0 1px 0 rgba(255,255,255,0.55) inset",
          whiteSpace: "nowrap",
          gap: "8px"
        },
        className: "select-none"
      },
      /* @__PURE__ */ React.createElement(
        "div",
        {
          role: "button",
          tabIndex: 0,
          onClick: () => onNavigate?.("/"),
          style: {
            display: "flex",
            alignItems: "center",
            gap: "1px",
            padding: "6px 14px",
            borderRadius: "9999px",
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.22)",
            boxShadow: "0 1px 0 rgba(255,255,255,0.4) inset",
            cursor: "pointer"
          }
        },
        /* @__PURE__ */ React.createElement("span", { className: "text-white font-mono font-extrabold text-sm tracking-wide" }, "Distro"),
        /* @__PURE__ */ React.createElement("span", { style: { color: THEME.accent }, className: "font-mono font-extrabold text-sm" }, "Pedia")
      ),
      /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => onNavigate?.("/flavours"),
          className: "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono text-xs font-semibold text-white/80 hover:text-white hover:bg-white/15 transition-all"
        },
        /* @__PURE__ */ React.createElement(ArrowLeft, { size: 14 }),
        /* @__PURE__ */ React.createElement("span", null, "All Flavours")
      ),
      /* @__PURE__ */ React.createElement("div", { className: "hidden sm:flex items-center gap-2 pl-2 border-l border-white/20" }, ["Community", "AI Chat"].map((item) => /* @__PURE__ */ React.createElement(
        "a",
        {
          key: item,
          href: "#",
          onClick: (e) => e.preventDefault(),
          className: "px-3 py-1 rounded-full font-mono text-xs text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        },
        item
      )))
    ),
    /* @__PURE__ */ React.createElement("div", { className: "absolute top-20 sm:top-6 left-4 sm:left-8 z-30" }, /* @__PURE__ */ React.createElement("div", { className: "inline-flex items-center gap-2 font-mono text-xs text-white/85 bg-black/55 px-3.5 py-1.5 rounded-full border border-white/20 backdrop-blur-xl shadow-xl" }, /* @__PURE__ */ React.createElement("button", { onClick: () => onNavigate?.("/"), className: "hover:text-white transition-colors" }, "Home"), /* @__PURE__ */ React.createElement("span", { className: "text-white/40" }, "/"), /* @__PURE__ */ React.createElement("button", { onClick: () => onNavigate?.("/flavours"), className: "hover:text-white transition-colors" }, "Flavours"), /* @__PURE__ */ React.createElement("span", { className: "text-white/40" }, "/"), /* @__PURE__ */ React.createElement("span", { style: { color: distro.accent }, className: "font-bold" }, distro.name))),
    /* @__PURE__ */ React.createElement("main", { className: "relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-24" }, loading ? /* @__PURE__ */ React.createElement(DistroDetailSkeleton, null) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { id: "section-hero", className: "w-full min-h-[calc(100vh-6.5rem)] flex flex-col items-center text-center justify-center gap-6 pb-12 mx-auto" }, /* @__PURE__ */ React.createElement("div", { className: "w-full flex justify-center items-center" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center shrink-0 border border-white/20 transition-transform hover:scale-105 backdrop-blur-md",
        style: {
          background: "rgba(15, 18, 24, 0.85)",
          boxShadow: "none"
        }
      },
      /* @__PURE__ */ React.createElement(DistroIcon, { name: distro.name, accent: distro.accent, size: 64 })
    )), /* @__PURE__ */ React.createElement("div", { className: "w-full flex flex-col items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center gap-3 flex-wrap" }, /* @__PURE__ */ React.createElement("h1", { className: "text-4xl sm:text-5xl md:text-6xl font-mono font-extrabold text-white tracking-wide drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]" }, distro.name), /* @__PURE__ */ React.createElement(
      "span",
      {
        className: "px-3.5 py-1 rounded-full text-xs font-mono font-semibold backdrop-blur-md",
        style: {
          background: `${distro.accent}33`,
          color: distro.accent,
          border: `1px solid ${distro.accent}88`,
          boxShadow: `0 2px 12px ${distro.accent}33`
        }
      },
      distro.category
    )), /* @__PURE__ */ React.createElement("p", { className: "text-base sm:text-lg font-mono text-white/90 max-w-2xl mx-auto leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]" }, distro.tagline)), /* @__PURE__ */ React.createElement("div", { className: "w-full flex items-center justify-center gap-4 flex-wrap pt-1" }, distro.downloadUrl && /* @__PURE__ */ React.createElement(
      "a",
      {
        href: distro.downloadUrl,
        target: "_blank",
        rel: "noopener noreferrer",
        className: "inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-mono text-xs font-bold text-white transition-transform hover:scale-105 backdrop-blur-sm shadow-2xl",
        style: {
          background: `linear-gradient(135deg, ${distro.accent} 0%, #b83d25 120%)`,
          border: "1px solid rgba(255,255,255,0.35)",
          boxShadow: `0 6px 28px ${distro.accent}66`
        }
      },
      /* @__PURE__ */ React.createElement(Download, { size: 16 }),
      /* @__PURE__ */ React.createElement("span", null, "Download ISO")
    ), distro.website && /* @__PURE__ */ React.createElement(
      "a",
      {
        href: distro.website,
        target: "_blank",
        rel: "noopener noreferrer",
        className: "inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full font-mono text-xs font-semibold text-white/95 hover:text-white bg-black/45 hover:bg-black/65 border border-white/25 backdrop-blur-md transition-all shadow-xl"
      },
      /* @__PURE__ */ React.createElement("span", null, "Official Website"),
      /* @__PURE__ */ React.createElement(ExternalLink, { size: 15 })
    ))), /* @__PURE__ */ React.createElement("section", { id: "section-specs", className: "mb-12 scroll-mt-24" }, /* @__PURE__ */ React.createElement("h2", { className: "text-lg font-mono font-bold text-white/90 mb-4 flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Sparkles, { size: 16, style: { color: distro.accent } }), /* @__PURE__ */ React.createElement("span", null, "Technical Specifications")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 font-mono" }, [
      { label: "Based On", value: distro.basedOn || "Independent", icon: Layers },
      { label: "Package Mgr", value: distro.pkgMgr || "Custom", icon: Terminal },
      { label: "Init System", value: distro.init || "systemd", icon: Cpu },
      { label: "Desktop Env", value: distro.desktop || "Configurable", icon: HardDrive },
      { label: "Release Model", value: distro.releaseModel || "Rolling", icon: Calendar },
      { label: "Architecture", value: distro.architectures || "x86_64", icon: Cpu }
    ].map((spec, i) => {
      const Icon = spec.icon;
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: i,
          className: "p-4 rounded-2xl bg-[#161B22]/80 backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors shadow-lg"
        },
        /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 text-white/50 text-xs mb-1.5" }, /* @__PURE__ */ React.createElement(Icon, { size: 13 }), /* @__PURE__ */ React.createElement("span", null, spec.label)),
        /* @__PURE__ */ React.createElement("div", { className: "font-bold text-white text-sm truncate", title: spec.value }, spec.value)
      );
    }))), /* @__PURE__ */ React.createElement("section", { id: "section-install", className: "mb-14 pt-4 border-t border-white/10 scroll-mt-24" }, /* @__PURE__ */ React.createElement("div", { className: "mb-6" }, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl font-mono font-bold text-white mb-1.5 flex items-center gap-2.5" }, /* @__PURE__ */ React.createElement(Wrench, { size: 20, style: { color: distro.accent } }), /* @__PURE__ */ React.createElement("span", null, "How to Install ", distro.name)), /* @__PURE__ */ React.createElement("p", { className: "text-sm font-mono text-white/60" }, "Select your installation method and follow the step-by-step instructions.")), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2 mb-6" }, [
      { id: "normal", name: "Normal Boot", icon: Laptop },
      { id: "dual", name: "Dual Boot (Windows)", icon: Split },
      { id: "vm", name: "Virtual Machine", icon: Box }
    ].map((tab) => {
      const Icon = tab.icon;
      const isActive = installMode === tab.id;
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: tab.id,
          type: "button",
          onClick: () => setInstallMode(tab.id),
          className: `inline-flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xs font-semibold transition-all cursor-pointer ${isActive ? "text-white shadow-md" : "text-white/60 hover:text-white hover:bg-white/10 bg-transparent border border-white/15"}`,
          style: {
            background: isActive ? distro.accent : void 0,
            borderColor: isActive ? distro.accent : void 0
          }
        },
        /* @__PURE__ */ React.createElement(Icon, { size: 14 }),
        /* @__PURE__ */ React.createElement("span", null, tab.name)
      );
    })), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono text-white/50 mb-8 pb-4 border-b border-white/10" }, /* @__PURE__ */ React.createElement("span", { className: "text-white/90 font-semibold" }, currentMode.title), /* @__PURE__ */ React.createElement("span", null, "\u2022"), /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1" }, /* @__PURE__ */ React.createElement(Clock, { size: 12, className: "text-[#38BDF8]" }), /* @__PURE__ */ React.createElement("span", null, currentMode.time)), /* @__PURE__ */ React.createElement("span", null, "\u2022"), /* @__PURE__ */ React.createElement("span", null, "Prerequisites: ", currentMode.requirements.join(", "))), /* @__PURE__ */ React.createElement("div", { className: "space-y-8" }, currentMode.steps.map((step, idx) => /* @__PURE__ */ React.createElement("div", { key: idx, className: "flex items-start gap-4 sm:gap-6" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "font-mono font-bold text-sm sm:text-base shrink-0 select-none pt-0.5",
        style: { color: distro.accent }
      },
      step.num,
      "."
    ), /* @__PURE__ */ React.createElement("div", { className: "flex-1 space-y-3" }, /* @__PURE__ */ React.createElement("h3", { className: "font-mono text-base font-bold text-white" }, step.title), /* @__PURE__ */ React.createElement("p", { className: "font-sans text-sm text-white/75 leading-relaxed" }, step.desc), step.action && /* @__PURE__ */ React.createElement("div", { className: "pt-1" }, /* @__PURE__ */ React.createElement(
      "a",
      {
        href: step.action.url,
        target: "_blank",
        rel: "noopener noreferrer",
        className: "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-semibold text-white transition-opacity hover:opacity-90",
        style: { background: distro.accent }
      },
      /* @__PURE__ */ React.createElement(Download, { size: 13 }),
      /* @__PURE__ */ React.createElement("span", null, step.action.label),
      /* @__PURE__ */ React.createElement(ExternalLink, { size: 12 })
    )), step.substeps && /* @__PURE__ */ React.createElement("ul", { className: "space-y-1.5 font-sans text-xs sm:text-sm text-white/75 list-disc list-inside pt-1" }, step.substeps.map((sub, i) => /* @__PURE__ */ React.createElement("li", { key: i, className: "leading-relaxed" }, /* @__PURE__ */ React.createElement("span", { className: "text-white/80" }, sub)))), step.options && /* @__PURE__ */ React.createElement("div", { className: "space-y-2 pt-1 font-sans text-xs sm:text-sm" }, step.options.map((opt, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "text-white/80" }, /* @__PURE__ */ React.createElement("span", { className: "font-mono font-semibold text-white" }, "\u2022 ", opt.label, ":"), " ", /* @__PURE__ */ React.createElement("span", { className: "text-white/60" }, opt.detail)))), step.tools && /* @__PURE__ */ React.createElement("div", { className: "text-xs font-mono text-white/60 pt-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-white/40" }, "Tools: "), step.tools.join(" \u2022 ")), step.keys && /* @__PURE__ */ React.createElement("div", { className: "text-xs font-mono text-white/60 pt-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-white/40" }, "Boot keys: "), step.keys.join(", ")), step.cmd && /* @__PURE__ */ React.createElement("div", { className: "pt-1" }, /* @__PURE__ */ React.createElement("div", { className: "rounded-lg p-3 bg-black/60 border border-white/10 font-mono text-xs max-w-2xl" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-white/40 mb-1 text-[11px]" }, /* @__PURE__ */ React.createElement("span", null, step.cmdLabel || "Command"), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => copyStepCmd(step.cmd, `${currentMode.id}-${step.num}`),
        className: "flex items-center gap-1 text-white/60 hover:text-white transition-colors cursor-pointer"
      },
      copiedCmdId === `${currentMode.id}-${step.num}` ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Check, { size: 12, className: "text-green-400" }), /* @__PURE__ */ React.createElement("span", { className: "text-green-400" }, "Copied")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Copy, { size: 12 }), /* @__PURE__ */ React.createElement("span", null, "Copy"))
    )), /* @__PURE__ */ React.createElement("code", { className: "text-[#38BDF8] block overflow-x-auto select-all" }, "$ ", step.cmd))), step.warning && /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-2 text-xs font-sans text-amber-300/90 pt-1" }, /* @__PURE__ */ React.createElement(AlertTriangle, { size: 14, className: "shrink-0 mt-0.5 text-amber-400" }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("strong", { className: "font-mono text-amber-300" }, "Note: "), step.warning)), step.tip && /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-2 text-xs font-sans text-white/60 pt-1" }, /* @__PURE__ */ React.createElement(Info, { size: 14, className: "shrink-0 mt-0.5", style: { color: distro.accent } }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("strong", { className: "font-mono text-white/80" }, "Tip: "), step.tip)), step.image && /* @__PURE__ */ React.createElement("div", { className: "pt-2 max-w-2xl" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        onClick: () => setActiveLightboxImage({
          url: step.image,
          title: step.title,
          caption: step.imageCaption,
          num: step.num
        }),
        className: "group relative rounded-xl border border-white/15 bg-black/40 overflow-hidden shadow-xl hover:border-white/35 transition-all cursor-pointer"
      },
      /* @__PURE__ */ React.createElement("div", { className: "relative overflow-hidden bg-black/50" }, /* @__PURE__ */ React.createElement(
        "img",
        {
          src: step.image,
          alt: step.title,
          loading: "lazy",
          className: "w-full h-auto max-h-72 object-cover object-top brightness-[0.92] group-hover:brightness-100 group-hover:scale-[1.01] transition-all duration-300",
          onError: (e) => {
            if (e.currentTarget?.parentElement?.parentElement) {
              e.currentTarget.parentElement.parentElement.style.display = "none";
            }
          }
        }
      ), /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-white font-mono text-xs shadow-lg" }, /* @__PURE__ */ React.createElement(ZoomIn, { size: 13 }), /* @__PURE__ */ React.createElement("span", null, "Click to enlarge")))),
      step.imageCaption && /* @__PURE__ */ React.createElement("div", { className: "px-3.5 py-2 bg-[#0d1117]/90 border-t border-white/10 flex items-center justify-between text-xs font-mono text-white/60" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 truncate pr-2" }, /* @__PURE__ */ React.createElement(ImageIcon, { size: 13, className: "shrink-0", style: { color: distro.accent } }), /* @__PURE__ */ React.createElement("span", { className: "truncate" }, step.imageCaption)), /* @__PURE__ */ React.createElement("span", { className: "shrink-0 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/50" }, "Real Reference"))
    ))))))), /* @__PURE__ */ React.createElement("section", { id: "section-explore", className: "pt-8 border-t border-white/10 scroll-mt-24" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-6" }, /* @__PURE__ */ React.createElement("h2", { className: "text-xl font-mono font-bold text-white" }, "Explore Other Distributions"), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => onNavigate?.("/flavours"),
        className: "font-mono text-xs text-white/60 hover:text-white transition-colors flex items-center gap-1"
      },
      /* @__PURE__ */ React.createElement("span", null, "View all"),
      /* @__PURE__ */ React.createElement(ArrowLeft, { size: 13, className: "rotate-180" })
    )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs" }, otherDistros.map((od) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: od.id,
        onClick: () => onNavigate?.(`/distro/${od.id}`),
        className: "p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 transition-all cursor-pointer group flex items-center gap-3"
      },
      /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/10",
          style: { background: "rgba(20, 24, 32, 0.7)" }
        },
        /* @__PURE__ */ React.createElement(DistroIcon, { name: od.name, accent: od.accent, size: 24 })
      ),
      /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "font-bold text-white group-hover:text-[#38BDF8] transition-colors" }, od.name), /* @__PURE__ */ React.createElement("div", { className: "text-white/50 text-[11px] truncate max-w-[120px]" }, od.basedOn))
    )))))),
    /* @__PURE__ */ React.createElement(AnimatePresence, null, showSideNav && /* @__PURE__ */ React.createElement(
      motion.aside,
      {
        initial: { opacity: 0, x: -28, scale: 0.92 },
        animate: { opacity: 1, x: 0, scale: 1 },
        exit: { opacity: 0, x: -28, scale: 0.92 },
        transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
        className: "fixed left-3 sm:left-6 inset-y-0 my-auto h-fit z-40 hidden md:flex flex-col items-start pointer-events-auto",
        style: {
          top: 0,
          bottom: 0,
          marginTop: "auto",
          marginBottom: "auto",
          height: "fit-content"
        },
        "aria-label": "Section navigation"
      },
      /* @__PURE__ */ React.createElement(
        motion.div,
        {
          onMouseEnter: () => setIsNavExpanded(true),
          onMouseLeave: () => setIsNavExpanded(false),
          animate: { width: isNavExpanded ? 200 : 54 },
          transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
          className: "p-1.5 rounded-2xl flex flex-col items-start gap-1.5 select-none shadow-2xl backdrop-blur-2xl overflow-hidden cursor-pointer",
          style: {
            background: "rgba(15, 18, 24, 0.88)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            boxShadow: "0 12px 40px rgba(0, 0, 0, 0.55), 0 1px 0 rgba(255, 255, 255, 0.15) inset"
          }
        },
        /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => scrollToSection("section-hero"),
            className: `w-full h-10 rounded-xl flex items-center transition-all cursor-pointer hover:scale-[1.02] overflow-hidden ${isNavExpanded ? "px-2.5 gap-2.5 justify-start" : "justify-center"}`,
            style: {
              background: activeSection === "hero" ? "rgba(255, 255, 255, 0.18)" : "rgba(255,255,255,0.04)",
              border: activeSection === "hero" ? "1px solid rgba(255, 255, 255, 0.38)" : "1px solid rgba(255,255,255,0.08)",
              boxShadow: activeSection === "hero" ? "0 2px 14px rgba(255, 255, 255, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.45)" : void 0
            },
            "aria-label": "Scroll to Overview"
          },
          /* @__PURE__ */ React.createElement("div", { className: "w-7 h-7 shrink-0 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(DistroIcon, { name: distro.name, accent: distro.accent, size: 20 })),
          /* @__PURE__ */ React.createElement(
            "span",
            {
              className: `font-mono text-xs font-bold text-white whitespace-nowrap transition-all duration-200 ${isNavExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3 pointer-events-none w-0"}`
            },
            distro.name
          )
        ),
        /* @__PURE__ */ React.createElement("div", { className: `h-px bg-white/10 transition-all duration-200 self-center ${isNavExpanded ? "w-full" : "w-6"}` }),
        [
          { id: "section-specs", key: "specs", label: "Tech Specs", icon: Sparkles },
          { id: "section-install", key: "install", label: "Install Guide", icon: Wrench },
          { id: "section-explore", key: "explore", label: "Other Distros", icon: Compass }
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.key;
          return /* @__PURE__ */ React.createElement(
            "button",
            {
              key: item.id,
              type: "button",
              onClick: () => scrollToSection(item.id),
              className: `w-full h-10 rounded-xl flex items-center transition-all cursor-pointer overflow-hidden ${isNavExpanded ? "px-2.5 gap-2.5 justify-start" : "justify-center"} ${isActive ? "text-white font-bold" : "text-white/50 hover:text-white hover:bg-white/10"}`,
              style: {
                background: isActive ? "rgba(255, 255, 255, 0.18)" : "transparent",
                border: isActive ? "1px solid rgba(255, 255, 255, 0.38)" : "1px solid transparent",
                color: isActive ? "#FFFFFF" : void 0,
                boxShadow: isActive ? "0 2px 14px rgba(255, 255, 255, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.45)" : void 0
              },
              "aria-label": item.label
            },
            /* @__PURE__ */ React.createElement("div", { className: "w-7 h-7 shrink-0 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(Icon, { size: 17 })),
            /* @__PURE__ */ React.createElement(
              "span",
              {
                className: `font-mono text-xs font-semibold whitespace-nowrap transition-all duration-200 ${isActive ? "text-white" : "text-white/80"} ${isNavExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3 pointer-events-none w-0"}`
              },
              item.label
            )
          );
        }),
        /* @__PURE__ */ React.createElement("div", { className: `h-px bg-white/10 transition-all duration-200 self-center ${isNavExpanded ? "w-full" : "w-6"}` }),
        distro.downloadUrl && /* @__PURE__ */ React.createElement(
          "a",
          {
            href: distro.downloadUrl,
            target: "_blank",
            rel: "noopener noreferrer",
            className: `w-full h-10 rounded-xl flex items-center transition-all cursor-pointer hover:scale-[1.02] text-white overflow-hidden ${isNavExpanded ? "px-2.5 gap-2.5 justify-start" : "justify-center"}`,
            style: {
              background: `linear-gradient(135deg, ${distro.accent} 0%, #b83d25 120%)`,
              border: "1px solid rgba(255,255,255,0.3)",
              boxShadow: `0 3px 12px ${distro.accent}40`
            },
            "aria-label": "Download ISO"
          },
          /* @__PURE__ */ React.createElement("div", { className: "w-7 h-7 shrink-0 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(Download, { size: 15 })),
          /* @__PURE__ */ React.createElement(
            "span",
            {
              className: `font-mono text-xs font-bold text-white whitespace-nowrap transition-all duration-200 ${isNavExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3 pointer-events-none w-0"}`
            },
            "Download ISO"
          )
        ),
        /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
            className: `w-full h-10 rounded-xl flex items-center transition-all cursor-pointer text-white/40 hover:text-white hover:bg-white/10 overflow-hidden ${isNavExpanded ? "px-2.5 gap-2.5 justify-start" : "justify-center"}`,
            "aria-label": "Scroll to top"
          },
          /* @__PURE__ */ React.createElement("div", { className: "w-7 h-7 shrink-0 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(ChevronUp, { size: 18 })),
          /* @__PURE__ */ React.createElement(
            "span",
            {
              className: `font-mono text-xs font-semibold text-white/70 whitespace-nowrap transition-all duration-200 ${isNavExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3 pointer-events-none w-0"}`
            },
            "Back to Top"
          )
        )
      )
    )),
    /* @__PURE__ */ React.createElement(AnimatePresence, null, showSideNav && /* @__PURE__ */ React.createElement(
      motion.button,
      {
        initial: { opacity: 0, scale: 0.8, y: 12 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.8, y: 12 },
        onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
        className: "md:hidden fixed bottom-6 right-5 z-40 w-11 h-11 rounded-full bg-[#0E1217]/90 border border-white/20 text-white flex items-center justify-center shadow-2xl backdrop-blur-xl cursor-pointer",
        style: {
          boxShadow: `0 4px 20px rgba(0,0,0,0.6)`
        },
        "aria-label": "Back to top"
      },
      /* @__PURE__ */ React.createElement(ChevronUp, { size: 20 })
    )),
    /* @__PURE__ */ React.createElement(AnimatePresence, null, activeLightboxImage && /* @__PURE__ */ React.createElement(
      motion.div,
      {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 },
        onClick: () => setActiveLightboxImage(null),
        className: "fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 cursor-zoom-out"
      },
      /* @__PURE__ */ React.createElement(
        motion.div,
        {
          initial: { scale: 0.95, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0.95, opacity: 0 },
          transition: { duration: 0.2 },
          onClick: (e) => e.stopPropagation(),
          className: "relative max-w-4xl max-h-[90vh] w-full rounded-2xl border border-white/20 bg-[#0d1117] overflow-hidden shadow-2xl flex flex-col cursor-default"
        },
        /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-black/50" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5 truncate pr-2" }, /* @__PURE__ */ React.createElement(
          "span",
          {
            className: "font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/10 shrink-0",
            style: { color: distro.accent }
          },
          "Step ",
          activeLightboxImage.num
        ), /* @__PURE__ */ React.createElement("h4", { className: "font-mono text-sm font-semibold text-white truncate" }, activeLightboxImage.title)), /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => setActiveLightboxImage(null),
            className: "p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer shrink-0",
            "aria-label": "Close image preview"
          },
          /* @__PURE__ */ React.createElement(X, { size: 18 })
        )),
        /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-auto p-4 flex items-center justify-center bg-black/70" }, /* @__PURE__ */ React.createElement(
          "img",
          {
            src: activeLightboxImage.url,
            alt: activeLightboxImage.title,
            className: "max-h-[72vh] w-auto max-w-full rounded-lg object-contain shadow-2xl border border-white/10"
          }
        )),
        activeLightboxImage.caption && /* @__PURE__ */ React.createElement("div", { className: "px-5 py-3 border-t border-white/10 bg-black/50 text-xs font-mono text-white/75 flex items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 truncate" }, /* @__PURE__ */ React.createElement(Info, { size: 14, className: "shrink-0", style: { color: distro.accent } }), /* @__PURE__ */ React.createElement("span", { className: "truncate" }, activeLightboxImage.caption)), /* @__PURE__ */ React.createElement("span", { className: "shrink-0 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/50" }, "Real Screenshot"))
      )
    ))
  );
}
export {
  DistroDetailPage as default
};
