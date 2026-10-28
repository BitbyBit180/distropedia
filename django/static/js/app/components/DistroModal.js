import React, { useEffect } from "dp/core/react.js";
import { motion, AnimatePresence } from "dp/core/motion.js";
import { X, ExternalLink, Terminal, Cpu, Layers, HardDrive } from "dp/core/icons.js";
import DistroIcon from "./DistroIcon.js";
function DistroModal({ distro, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
  if (!distro) return null;
  return /* @__PURE__ */ React.createElement(AnimatePresence, null, /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto" }, /* @__PURE__ */ React.createElement(
    motion.div,
    {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      onClick: onClose,
      className: "fixed inset-0 bg-black/75 backdrop-blur-md"
    }
  ), /* @__PURE__ */ React.createElement(
    motion.div,
    {
      initial: { opacity: 0, scale: 0.92, y: 20 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.92, y: 20 },
      transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
      className: "relative w-full max-w-2xl overflow-hidden rounded-3xl z-10 text-[#F0F4F8]",
      style: {
        background: "linear-gradient(170deg, #1C2229 0%, #12161C 100%)",
        border: `1px solid ${distro.accent}66`,
        boxShadow: `0 24px 60px -15px rgba(0,0,0,0.8), 0 0 35px ${distro.accent}33, inset 0 1px 0 rgba(255,255,255,0.15)`
      }
    },
    /* @__PURE__ */ React.createElement("div", { className: "relative w-full h-48 sm:h-56 bg-black/50 overflow-hidden border-b border-white/10" }, distro.preview ? /* @__PURE__ */ React.createElement(
      "img",
      {
        src: distro.preview,
        alt: `${distro.name} Desktop`,
        className: "w-full h-full object-cover object-center brightness-[0.85] contrast-[1.05]"
      }
    ) : /* @__PURE__ */ React.createElement("div", { className: "w-full h-full flex items-center justify-center bg-black/40" }, /* @__PURE__ */ React.createElement(DistroIcon, { name: distro.name, accent: distro.accent, size: 72 })), /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 bg-gradient-to-t from-[#1C2229] via-transparent to-black/30" }), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: onClose,
        className: "absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white border border-white/20 transition-all",
        "aria-label": "Close"
      },
      /* @__PURE__ */ React.createElement(X, { size: 18 })
    )),
    /* @__PURE__ */ React.createElement("div", { className: "p-6 sm:p-8 relative" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-4 -mt-14 mb-4" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 border border-white/20 shadow-2xl",
        style: {
          background: "rgba(15, 18, 24, 0.92)",
          boxShadow: `0 8px 24px ${distro.accent}44, inset 0 0 12px ${distro.accent}33`
        }
      },
      /* @__PURE__ */ React.createElement(DistroIcon, { name: distro.name, accent: distro.accent, size: 44 })
    ), /* @__PURE__ */ React.createElement("div", { className: "pt-8 flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5 flex-wrap" }, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl sm:text-3xl font-bold font-mono text-white" }, distro.name), /* @__PURE__ */ React.createElement(
      "span",
      {
        className: "px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold",
        style: {
          background: `${distro.accent}22`,
          color: distro.accent,
          border: `1px solid ${distro.accent}55`
        }
      },
      distro.category || "Linux"
    )), /* @__PURE__ */ React.createElement("p", { className: "text-sm font-mono text-white/70 mt-1" }, distro.tagline))), /* @__PURE__ */ React.createElement("p", { className: "text-sm leading-relaxed text-white/80 font-sans mb-6" }, distro.description), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 font-mono text-xs" }, /* @__PURE__ */ React.createElement("div", { className: "p-3 rounded-xl bg-white/[0.04] border border-white/10" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 text-white/50 mb-1" }, /* @__PURE__ */ React.createElement(Layers, { size: 13 }), /* @__PURE__ */ React.createElement("span", null, "Based On")), /* @__PURE__ */ React.createElement("div", { className: "font-semibold text-white" }, distro.basedOn || "Independent")), /* @__PURE__ */ React.createElement("div", { className: "p-3 rounded-xl bg-white/[0.04] border border-white/10" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 text-white/50 mb-1" }, /* @__PURE__ */ React.createElement(Terminal, { size: 13 }), /* @__PURE__ */ React.createElement("span", null, "Package Mgr")), /* @__PURE__ */ React.createElement("div", { className: "font-semibold text-white font-mono" }, distro.pkgMgr || "Custom")), /* @__PURE__ */ React.createElement("div", { className: "p-3 rounded-xl bg-white/[0.04] border border-white/10" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 text-white/50 mb-1" }, /* @__PURE__ */ React.createElement(Cpu, { size: 13 }), /* @__PURE__ */ React.createElement("span", null, "Init System")), /* @__PURE__ */ React.createElement("div", { className: "font-semibold text-white" }, distro.init || "systemd")), /* @__PURE__ */ React.createElement("div", { className: "p-3 rounded-xl bg-white/[0.04] border border-white/10" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 text-white/50 mb-1" }, /* @__PURE__ */ React.createElement(HardDrive, { size: 13 }), /* @__PURE__ */ React.createElement("span", null, "Desktop")), /* @__PURE__ */ React.createElement("div", { className: "font-semibold text-white truncate", title: distro.desktop }, distro.desktop || "Configurable"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-end gap-3 pt-2 border-t border-white/10" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: onClose,
        className: "px-4 py-2 rounded-xl text-xs font-mono font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
      },
      "Close"
    ), distro.website && /* @__PURE__ */ React.createElement(
      "a",
      {
        href: distro.website,
        target: "_blank",
        rel: "noopener noreferrer",
        className: "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold text-white transition-all duration-200",
        style: {
          background: `linear-gradient(135deg, ${distro.accent} 0%, #1c2229 140%)`,
          border: "1px solid rgba(255,255,255,0.2)",
          boxShadow: `0 4px 20px ${distro.accent}66`
        }
      },
      /* @__PURE__ */ React.createElement("span", null, "Official Website"),
      /* @__PURE__ */ React.createElement(ExternalLink, { size: 14 })
    )))
  )));
}
export {
  DistroModal as default
};
