import React from "dp/core/react.js";
import { ChevronUp, ChevronDown } from "dp/core/icons.js";
import { THEME, LINE, MONO } from "../../theme/designTokens.js";
const scoreColor = (score) => {
  if (score > 0) return THEME.accent;
  if (score < 0) return "rgba(90, 140, 255, 0.9)";
  return THEME.textMain;
};
function VotePill({ score = 0, userVote = 0, onVote, size = 16, disabled = false }) {
  const arrowBtn = (dir) => {
    const dirValue = dir === "up" ? 1 : -1;
    const active = userVote === dirValue;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        title: dir === "up" ? "Upvote" : "Downvote",
        "aria-label": dir === "up" ? "Upvote" : "Downvote",
        "aria-pressed": active,
        disabled,
        onClick: (e) => {
          e.stopPropagation();
          if (disabled) return;
          onVote?.(userVote === dirValue ? 0 : dirValue);
        },
        className: "flex items-center justify-center transition-colors",
        style: {
          width: 26,
          height: 24,
          borderRadius: 9999,
          border: active ? `1px solid ${dir === "up" ? "rgba(224, 90, 56, 0.5)" : "rgba(90, 140, 255, 0.5)"}` : "1px solid transparent",
          background: active ? dir === "up" ? "rgba(224, 90, 56, 0.16)" : "rgba(90, 140, 255, 0.16)" : "transparent",
          color: active ? scoreColor(dir === "up" ? 1 : -1) : THEME.textMuted,
          cursor: disabled ? "wait" : "pointer",
          opacity: disabled && !active ? 0.5 : 1,
          padding: 0
        },
        onMouseEnter: (e) => {
          if (!active && !disabled) e.currentTarget.style.color = scoreColor(dir === "up" ? 1 : -1);
        },
        onMouseLeave: (e) => {
          if (!active) e.currentTarget.style.color = THEME.textMuted;
        }
      },
      dir === "up" ? /* @__PURE__ */ React.createElement(ChevronUp, { size, strokeWidth: 2.6 }) : /* @__PURE__ */ React.createElement(ChevronDown, { size, strokeWidth: 2.6 })
    );
  };
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "inline-flex items-center select-none",
      style: {
        gap: 2,
        background: "rgba(255,255,255,0.05)",
        border: `1px solid ${LINE}`,
        borderRadius: 9999,
        padding: "1px 4px"
      },
      onClick: (e) => e.stopPropagation()
    },
    arrowBtn("up"),
    /* @__PURE__ */ React.createElement(
      "span",
      {
        style: {
          fontFamily: MONO,
          fontSize: "0.74rem",
          fontWeight: 800,
          color: scoreColor(score),
          minWidth: 18,
          textAlign: "center"
        }
      },
      score
    ),
    arrowBtn("down")
  );
}
export {
  VotePill as default
};
