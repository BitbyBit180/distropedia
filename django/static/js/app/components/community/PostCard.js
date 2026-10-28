import React, { useRef, useState, useEffect } from "dp/core/react.js";
import { MessageSquare, ExternalLink, Share2, Pencil, Trash2, Check, Link2 } from "dp/core/icons.js";
import { THEME, LINE, MONO } from "../../theme/designTokens.js";
import VotePill from "./VotePill.js";
import { ChannelAvatar } from "./Avatar.js";
import { timeAgo } from "../../utils/timeAgo.js";
function RowAction({ icon, label, onClick, danger, stop }) {
  return /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: (e) => {
        if (stop) e.stopPropagation();
        onClick?.(e);
      },
      className: "inline-flex items-center transition-colors",
      style: {
        gap: 5,
        fontFamily: MONO,
        fontSize: "0.7rem",
        fontWeight: 600,
        color: THEME.textMuted,
        background: "none",
        border: "none",
        padding: "4px 8px",
        borderRadius: 9999,
        cursor: "pointer"
      },
      onMouseEnter: (e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.06)";
        e.currentTarget.style.color = danger ? THEME.accent : THEME.textMain;
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = THEME.textMuted;
      }
    },
    icon,
    label
  );
}
const previewText = (body) => (body || "").replace(/```[\s\S]*?```/g, " [code] ").replace(/[#>*_`~\-]{1,3}/g, " ").replace(/\[(.*?)\]\((.*?)\)/g, "$1").replace(/\s+/g, " ").trim();
function PostCard({
  post,
  distro,
  onOpen,
  onVote,
  isOwner = false,
  onEdit,
  onDelete,
  hideDivider = false,
  voteDisabled = false
}) {
  const [shared, setShared] = useState(false);
  const shareTimer = useRef(null);
  useEffect(() => () => clearTimeout(shareTimer.current), []);
  const hostname = (() => {
    try {
      return new URL(post.linkUrl).hostname.replace(/^www\./, "");
    } catch {
      return null;
    }
  })();
  const handleShare = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/community/${post.id}`;
    navigator.clipboard.writeText(url).catch(() => {
    });
    setShared(true);
    clearTimeout(shareTimer.current);
    shareTimer.current = setTimeout(() => setShared(false), 1500);
  };
  const preview = previewText(post.body);
  return /* @__PURE__ */ React.createElement(
    "article",
    {
      onClick: () => onOpen?.(post),
      className: "cursor-pointer",
      style: {
        padding: "14px 4px",
        borderBottom: hideDivider ? "none" : `1px solid ${LINE}`
      }
    },
    /* @__PURE__ */ React.createElement("div", { className: "flex items-center", style: { gap: 8, marginBottom: 8 } }, /* @__PURE__ */ React.createElement(ChannelAvatar, { channel: post.channel, distro, size: 26 }), /* @__PURE__ */ React.createElement(
      "span",
      {
        style: {
          fontFamily: MONO,
          fontSize: "0.72rem",
          fontWeight: 700,
          color: THEME.textMain
        }
      },
      "d/",
      post.channel === "general" ? "General" : post.channel
    ), /* @__PURE__ */ React.createElement("span", { style: { color: THEME.textMuted, fontSize: "0.6rem" } }, "\u2022"), /* @__PURE__ */ React.createElement("span", { style: { fontFamily: MONO, fontSize: "0.68rem", color: THEME.silver } }, "u/", post.author?.name || "unknown"), /* @__PURE__ */ React.createElement("span", { style: { color: THEME.textMuted, fontSize: "0.6rem" } }, "\u2022"), /* @__PURE__ */ React.createElement("span", { style: { fontFamily: MONO, fontSize: "0.68rem", color: THEME.textMuted } }, timeAgo(post.createdAt), post.updatedAt && post.updatedAt !== post.createdAt ? ` \xB7 edited ${timeAgo(post.updatedAt)}` : "")),
    /* @__PURE__ */ React.createElement(
      "h3",
      {
        style: {
          fontFamily: MONO,
          fontSize: "1.02rem",
          fontWeight: 700,
          color: THEME.textMain,
          margin: 0,
          lineHeight: 1.45,
          overflowWrap: "anywhere"
        }
      },
      post.title
    ),
    post.linkUrl && hostname && /* @__PURE__ */ React.createElement(
      "a",
      {
        href: post.linkUrl,
        target: "_blank",
        rel: "noreferrer",
        onClick: (e) => e.stopPropagation(),
        className: "inline-flex items-center transition-colors",
        style: {
          marginTop: 6,
          gap: 4,
          fontFamily: MONO,
          fontSize: "0.7rem",
          color: THEME.accent,
          textDecoration: "none"
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.textDecoration = "underline";
          e.currentTarget.style.textUnderlineOffset = 2;
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.textDecoration = "none";
        }
      },
      /* @__PURE__ */ React.createElement(Link2, { size: 11 }),
      hostname
    ),
    preview && /* @__PURE__ */ React.createElement(
      "p",
      {
        style: {
          margin: "6px 0 0",
          fontFamily: MONO,
          fontSize: "0.78rem",
          lineHeight: 1.6,
          color: THEME.silver,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          overflowWrap: "anywhere"
        }
      },
      preview
    ),
    /* @__PURE__ */ React.createElement("div", { className: "flex items-center flex-wrap", style: { gap: 8, marginTop: 12 } }, /* @__PURE__ */ React.createElement(VotePill, { score: post.score, userVote: post.userVote, onVote, disabled: voteDisabled }), /* @__PURE__ */ React.createElement(
      RowAction,
      {
        icon: /* @__PURE__ */ React.createElement(MessageSquare, { size: 14 }),
        label: `${post.commentCount ?? 0} ${(post.commentCount ?? 0) === 1 ? "comment" : "comments"}`,
        onClick: () => onOpen?.(post)
      }
    ), /* @__PURE__ */ React.createElement(
      RowAction,
      {
        icon: shared ? /* @__PURE__ */ React.createElement(Check, { size: 14 }) : /* @__PURE__ */ React.createElement(Share2, { size: 14 }),
        label: shared ? "Copied" : "Share",
        onClick: handleShare,
        stop: true
      }
    ), isOwner && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(RowAction, { icon: /* @__PURE__ */ React.createElement(Pencil, { size: 13 }), label: "Edit", onClick: () => onEdit?.(post), stop: true }), /* @__PURE__ */ React.createElement(
      RowAction,
      {
        icon: /* @__PURE__ */ React.createElement(Trash2, { size: 13 }),
        label: "Delete",
        danger: true,
        onClick: () => onDelete?.(post),
        stop: true
      }
    )), post.linkUrl && hostname && /* @__PURE__ */ React.createElement("span", { className: "hidden sm:inline-flex" }, /* @__PURE__ */ React.createElement(
      RowAction,
      {
        icon: /* @__PURE__ */ React.createElement(ExternalLink, { size: 13 }),
        label: hostname,
        onClick: () => window.open(post.linkUrl, "_blank", "noopener"),
        stop: true
      }
    )))
  );
}
export {
  RowAction,
  PostCard as default
};
