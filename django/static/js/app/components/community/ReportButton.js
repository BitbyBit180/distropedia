import React, { useEffect, useRef, useState } from "dp/core/react.js";
import { Flag, Check } from "dp/core/icons.js";
import { THEME, LINE, MONO } from "../../theme/designTokens.js";
import { createReport } from "../../services/communityApi.js";
const REASONS = [
  { key: "spam", label: "Spam" },
  { key: "harassment", label: "Harassment" },
  { key: "off-topic", label: "Off-topic" },
  { key: "wrong-channel", label: "Wrong channel" },
  { key: "other", label: "Other" }
];
function ReportButton({ targetType, targetId }) {
  const [open, setOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const [error, setError] = useState(null);
  const rootRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);
  const send = async (reason) => {
    setOpen(false);
    setError(null);
    try {
      await createReport({ targetType, targetId, reason });
      setReported(true);
    } catch (err) {
      if (err.status === 409) setReported(true);
      else setError(err.message || "Report failed");
    }
  };
  return /* @__PURE__ */ React.createElement("span", { ref: rootRef, style: { position: "relative", display: "inline-flex" } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      title: reported ? "Reported" : "Report",
      onClick: () => !reported && setOpen((v) => !v),
      className: "inline-flex items-center transition-colors",
      style: {
        gap: 5,
        fontFamily: MONO,
        fontSize: "0.7rem",
        fontWeight: 600,
        color: reported ? THEME.accent : THEME.textMuted,
        background: "none",
        border: "none",
        padding: "4px 8px",
        borderRadius: 9999,
        cursor: reported ? "default" : "pointer"
      },
      onMouseEnter: (e) => {
        if (!reported) {
          e.currentTarget.style.background = "rgba(255,255,255,0.06)";
          e.currentTarget.style.color = THEME.textMain;
        }
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = reported ? THEME.accent : THEME.textMuted;
      }
    },
    reported ? /* @__PURE__ */ React.createElement(Check, { size: 13 }) : /* @__PURE__ */ React.createElement(Flag, { size: 13 }),
    reported ? "Reported" : "Report"
  ), open && /* @__PURE__ */ React.createElement(
    "span",
    {
      style: {
        position: "absolute",
        bottom: "calc(100% + 6px)",
        left: 0,
        zIndex: 80,
        minWidth: 150,
        borderRadius: 10,
        background: "rgba(22, 27, 34, 0.97)",
        border: `1px solid ${LINE}`,
        boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
        padding: 4,
        display: "flex",
        flexDirection: "column"
      }
    },
    REASONS.map((r) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: r.key,
        type: "button",
        onClick: () => send(r.key),
        style: {
          background: "none",
          border: "none",
          textAlign: "left",
          fontFamily: MONO,
          fontSize: "0.7rem",
          color: THEME.textMain,
          padding: "7px 10px",
          borderRadius: 6,
          cursor: "pointer"
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.07)";
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.background = "none";
        }
      },
      r.label
    ))
  ), error && /* @__PURE__ */ React.createElement("span", { style: { fontFamily: MONO, fontSize: "0.62rem", color: THEME.accent } }, error));
}
export {
  ReportButton as default
};
