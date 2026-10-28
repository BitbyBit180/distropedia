import React from "dp/core/react.js";
import { THEME, LINE } from "../../theme/designTokens.js";
import useMedia from "../../hooks/useMedia.js";
function CommunityShell({ nav, rail, mobileBar, children }) {
  const showNav = useMedia("(min-width: 1024px)");
  const showRail = useMedia("(min-width: 1280px)");
  return /* @__PURE__ */ React.createElement("div", { style: { backgroundColor: THEME.bg, minHeight: "100vh", position: "relative" } }, /* @__PURE__ */ React.createElement("div", { className: "hero-bg fixed inset-0 z-0", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("div", { className: "grain-fine" }), /* @__PURE__ */ React.createElement("div", { className: "grain-fiber" })), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "relative z-10 mx-auto flex",
      style: {
        maxWidth: 1320,
        gap: 20,
        padding: "12px 12px 64px",
        alignItems: "flex-start"
      }
    },
    nav && showNav && nav,
    /* @__PURE__ */ React.createElement("main", { style: { flex: 1, minWidth: 0, paddingTop: 2 } }, mobileBar && !showNav && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, mobileBar), children),
    rail && showRail && /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          width: 300,
          flexShrink: 0,
          position: "sticky",
          top: 16,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          maxHeight: "calc(100vh - 32px)",
          overflowY: "auto"
        }
      },
      rail
    )
  ));
}
function RailCard({ label, action, children }) {
  return /* @__PURE__ */ React.createElement(
    "section",
    {
      style: {
        borderRadius: 18,
        padding: "14px 14px 12px",
        background: "rgba(28, 34, 41, 0.55)",
        backdropFilter: "blur(28px) saturate(170%)",
        WebkitBackdropFilter: "blur(28px) saturate(170%)",
        border: `1px solid ${LINE}`,
        overflow: "hidden"
      }
    },
    (label || action) && /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "flex items-center justify-between",
        style: {
          marginBottom: 10,
          fontFamily: "JetBrains Mono, monospace, ui-monospace, monospace",
          fontSize: "0.62rem",
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: THEME.textMuted
        }
      },
      /* @__PURE__ */ React.createElement("span", null, label),
      action
    ),
    children
  );
}
export {
  RailCard,
  CommunityShell as default
};
