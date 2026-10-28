import React, { useState } from "dp/core/react.js";
import { Home, Plus, Bot } from "dp/core/icons.js";
import DistroIcon from "../DistroIcon.js";
import { THEME, LINE, MONO } from "../../theme/designTokens.js";
import { ChannelAvatar } from "./Avatar.js";
const GLASS = {
  background: "rgba(28, 34, 41, 0.55)",
  backdropFilter: "blur(28px) saturate(170%)",
  WebkitBackdropFilter: "blur(28px) saturate(170%)",
  border: `1px solid ${LINE}`
};
const navBtn = (active) => ({
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  fontFamily: MONO,
  fontSize: "0.78rem",
  fontWeight: active ? 700 : 500,
  color: active ? THEME.textMain : "rgba(240,244,248,0.65)",
  background: active ? "rgba(255,255,255,0.08)" : "transparent",
  border: "none",
  borderRadius: 9999,
  padding: "8px 14px",
  cursor: "pointer",
  textAlign: "left",
  transition: "background 0.15s ease, color 0.15s ease"
});
const sectionLabel = {
  fontFamily: MONO,
  fontSize: "0.6rem",
  fontWeight: 700,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: THEME.textMuted,
  padding: "14px 14px 6px"
};
function CommunityNav({ distros, channel, onNavigate, onChannel, onCreatePost }) {
  const [channelsExpanded, setChannelsExpanded] = useState(false);
  const channelRow = (key, label, distro) => {
    const active = channel === key;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key,
        type: "button",
        style: navBtn(active),
        onClick: () => onChannel?.(key),
        onMouseEnter: (e) => {
          if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
        },
        onMouseLeave: (e) => {
          if (!active) e.currentTarget.style.background = "transparent";
        }
      },
      /* @__PURE__ */ React.createElement(ChannelAvatar, { channel: key, distro, size: 24 }),
      /* @__PURE__ */ React.createElement(
        "span",
        {
          style: {
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }
        },
        label
      )
    );
  };
  return /* @__PURE__ */ React.createElement(
    "aside",
    {
      className: "flex flex-col",
      style: {
        width: 236,
        flexShrink: 0,
        position: "sticky",
        top: 16,
        maxHeight: "calc(100vh - 32px)",
        overflowY: "auto",
        borderRadius: 18,
        padding: "12px 10px",
        ...GLASS
      }
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        role: "button",
        tabIndex: 0,
        onClick: () => onNavigate?.("/"),
        className: "flex items-center select-none",
        style: { gap: 8, padding: "4px 12px 12px", cursor: "pointer" }
      },
      /* @__PURE__ */ React.createElement(Bot, { size: 20, color: THEME.accent }),
      /* @__PURE__ */ React.createElement("span", { style: { fontFamily: MONO, fontSize: "0.9rem", fontWeight: 800 } }, /* @__PURE__ */ React.createElement("span", { style: { color: THEME.textMain } }, "Distro"), /* @__PURE__ */ React.createElement("span", { style: { color: THEME.accent } }, "Pedia"))
    ),
    /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: onCreatePost,
        className: "flex items-center justify-center transition-all",
        style: {
          gap: 6,
          fontFamily: MONO,
          fontSize: "0.76rem",
          fontWeight: 700,
          color: "#fff",
          background: `linear-gradient(135deg, ${THEME.accent} 0%, #b83d25 100%)`,
          border: "1px solid rgba(255,255,255,0.25)",
          borderRadius: 9999,
          padding: "9px 14px",
          cursor: "pointer",
          boxShadow: `0 2px 16px ${THEME.accent}55, 0 1px 0 rgba(255,255,255,0.35) inset`,
          marginBottom: 8
        }
      },
      /* @__PURE__ */ React.createElement(Plus, { size: 15 }),
      "Create post"
    ),
    /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        style: navBtn(channel === "all"),
        onClick: () => {
          onChannel?.("all");
          onNavigate?.("/community");
        },
        onMouseEnter: (e) => {
          if (channel !== "all") {
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            e.currentTarget.style.color = THEME.textMain;
          }
        },
        onMouseLeave: (e) => {
          if (channel !== "all") {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(240,244,248,0.65)";
          }
        }
      },
      /* @__PURE__ */ React.createElement(Home, { size: 17 }),
      "Home"
    ),
    /* @__PURE__ */ React.createElement("div", { style: sectionLabel }, "Channels"),
    channelRow("general", "General", null),
    (channelsExpanded ? distros : distros.slice(0, 4)).map(
      (d) => channelRow(d.id, d.name, d)
    ),
    distros.length > 4 && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setChannelsExpanded((v) => !v),
        className: "transition-colors",
        style: {
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          fontFamily: MONO,
          fontSize: "0.7rem",
          fontWeight: 600,
          color: THEME.textMuted,
          background: "transparent",
          border: "none",
          borderRadius: 9999,
          padding: "7px 14px",
          cursor: "pointer",
          textAlign: "left"
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.color = THEME.textMain;
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.color = THEME.textMuted;
        }
      },
      channelsExpanded ? "Show fewer" : `Show all (${distros.length})`
    ),
    /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          marginTop: "auto",
          paddingTop: 12,
          fontFamily: MONO,
          fontSize: "0.6rem",
          color: THEME.textMuted,
          textAlign: "center"
        }
      },
      "DistroPedia Community"
    )
  );
}
function MobileChannelBar({ items = [], active, onChannel, onCreatePost }) {
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      style: {
        ...GLASS,
        borderRadius: 16,
        padding: "10px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 8
      }
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "flex items-center",
        style: { gap: 6, overflowX: "auto", paddingBottom: 2 }
      },
      items.map((item) => {
        const isActive = active === item.key;
        return /* @__PURE__ */ React.createElement(
          "button",
          {
            key: item.key,
            type: "button",
            onClick: () => onChannel?.(item.key),
            className: "inline-flex items-center shrink-0 transition-colors",
            style: {
              gap: 6,
              fontFamily: MONO,
              fontSize: "0.7rem",
              fontWeight: isActive ? 700 : 500,
              color: isActive ? THEME.textMain : "rgba(240,244,248,0.65)",
              background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
              border: `1px solid ${isActive ? "rgba(255,255,255,0.3)" : LINE}`,
              borderRadius: 9999,
              padding: "6px 12px 6px 8px",
              cursor: "pointer",
              whiteSpace: "nowrap"
            }
          },
          /* @__PURE__ */ React.createElement(ChannelAvatar, { channel: item.key, distro: item.distro, size: 18 }),
          item.label
        );
      })
    ),
    /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: onCreatePost,
        className: "flex items-center justify-center transition-all",
        style: {
          gap: 6,
          fontFamily: MONO,
          fontSize: "0.74rem",
          fontWeight: 700,
          color: "#fff",
          background: `linear-gradient(135deg, ${THEME.accent} 0%, #b83d25 100%)`,
          border: "1px solid rgba(255,255,255,0.25)",
          borderRadius: 9999,
          padding: "8px 14px",
          cursor: "pointer",
          width: "100%"
        }
      },
      /* @__PURE__ */ React.createElement(Plus, { size: 14 }),
      "Create post"
    )
  );
}
export {
  MobileChannelBar,
  CommunityNav as default
};
