import React, { useCallback, useEffect, useRef, useState } from "dp/core/react.js";
import { Bell, CheckCheck } from "dp/core/icons.js";
import { THEME, LINE, MONO } from "../../theme/designTokens.js";
import { timeAgo } from "../../utils/timeAgo.js";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from "../../services/communityApi.js";
function NotificationBell({ onOpenPost }) {
  const [notes, setNotes] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const refresh = useCallback(async () => {
    try {
      const data = await getNotifications({ page: 1, limit: 8 });
      setNotes(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } catch {
    }
  }, []);
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 3e4);
    return () => clearInterval(t);
  }, [refresh]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);
  const handleOpen = async (n) => {
    setOpen(false);
    if (!n.read) {
      setUnread((u) => Math.max(0, u - 1));
      setNotes((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
      try {
        await markNotificationRead(n.id);
      } catch {
        refresh();
        return;
      }
    }
    onOpenPost?.(n.post?.id || n.post);
  };
  const handleReadAll = async () => {
    try {
      await markAllNotificationsRead();
      setUnread(0);
      setNotes((prev) => prev.map((x) => ({ ...x, read: true })));
    } catch {
    }
  };
  const label = (n) => n.type === "reply" ? `replied to you` : `commented on your post`;
  return /* @__PURE__ */ React.createElement("div", { ref: rootRef, style: { position: "relative", flexShrink: 0 } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      title: "Notifications",
      "aria-label": `Notifications${unread ? ` (${unread} unread)` : ""}`,
      onClick: () => setOpen((v) => !v),
      className: "flex items-center justify-center transition-colors",
      style: {
        width: 32,
        height: 32,
        borderRadius: 9999,
        border: `1px solid ${LINE}`,
        background: open ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
        color: unread ? THEME.textMain : THEME.textMuted,
        cursor: "pointer"
      }
    },
    /* @__PURE__ */ React.createElement(Bell, { size: 15 }),
    unread > 0 && /* @__PURE__ */ React.createElement(
      "span",
      {
        style: {
          position: "absolute",
          top: -4,
          right: -4,
          minWidth: 16,
          height: 16,
          borderRadius: 9999,
          background: THEME.accent,
          color: "#fff",
          fontFamily: MONO,
          fontSize: "0.58rem",
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 4px"
        }
      },
      unread > 9 ? "9+" : unread
    )
  ), open && /* @__PURE__ */ React.createElement(
    "div",
    {
      style: {
        position: "absolute",
        top: "calc(100% + 8px)",
        right: 0,
        width: "min(320px, calc(100vw - 48px))",
        maxHeight: 380,
        overflowY: "auto",
        zIndex: 80,
        borderRadius: 14,
        background: "rgba(22, 27, 34, 0.95)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        border: `1px solid ${LINE}`,
        boxShadow: "0 18px 50px rgba(0,0,0,0.5)",
        padding: 6
      }
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "flex items-center justify-between",
        style: { padding: "6px 8px" }
      },
      /* @__PURE__ */ React.createElement(
        "span",
        {
          style: {
            fontFamily: MONO,
            fontSize: "0.62rem",
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: THEME.textMuted
          }
        },
        "Notifications"
      ),
      unread > 0 && /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: handleReadAll,
          className: "inline-flex items-center transition-colors",
          style: {
            gap: 4,
            background: "none",
            border: "none",
            fontFamily: MONO,
            fontSize: "0.64rem",
            color: THEME.accent,
            cursor: "pointer",
            padding: "2px 4px"
          }
        },
        /* @__PURE__ */ React.createElement(CheckCheck, { size: 12 }),
        "Mark all read"
      )
    ),
    notes.length === 0 && /* @__PURE__ */ React.createElement(
      "p",
      {
        style: {
          fontFamily: MONO,
          fontSize: "0.7rem",
          color: THEME.textMuted,
          textAlign: "center",
          padding: "18px 8px",
          margin: 0
        }
      },
      "No notifications yet."
    ),
    notes.map((n, i) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: n.id,
        type: "button",
        onClick: () => handleOpen(n),
        className: "w-full text-left transition-colors",
        style: {
          display: "block",
          background: n.read ? "transparent" : "rgba(224, 90, 56, 0.07)",
          border: "none",
          borderTop: i === 0 ? "none" : `1px solid ${LINE}`,
          borderRadius: 8,
          padding: "9px 10px",
          cursor: "pointer",
          fontFamily: MONO
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: "0.72rem", color: THEME.textMain, lineHeight: 1.5 } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 800 } }, "u/", n.actor?.name || "someone"), " ", label(n)),
      /* @__PURE__ */ React.createElement(
        "div",
        {
          style: {
            fontSize: "0.68rem",
            color: THEME.silver,
            marginTop: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }
        },
        n.post?.title || "your post"
      ),
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: "0.6rem", color: THEME.textMuted, marginTop: 2 } }, timeAgo(n.createdAt))
    ))
  ));
}
export {
  NotificationBell as default
};
