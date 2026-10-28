import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "dp/core/react.js";
import ReactMarkdown from "dp/core/markdown.js";
import remarkGfm from "dp/core/markdown.js";
import {
  Bot,
  Plus,
  Trash2,
  LogOut,
  SendHorizontal,
  Copy,
  Check,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  TriangleAlert,
  Download
} from "dp/core/icons.js";
import AuthPage from "./AuthPage.js";
import { useAuth } from "../hooks/useAuth.js";
import useMedia from "../hooks/useMedia.js";
import {
  listChats,
  createChat,
  getChat,
  deleteChat,
  renameChat,
  sendMessage,
  sendMessageStream,
  peekChatList,
  peekStaleChatList
} from "../services/chatApi.js";
import { THEME, LINE, LINE_SOFT, MONO } from "../theme/designTokens.js";
import { ChatListSkeleton, ChatMessagesSkeleton } from "../components/Skeleton.js";
const GLASS = {
  background: "rgba(28, 34, 41, 0.55)",
  backdropFilter: "blur(28px) saturate(170%)",
  WebkitBackdropFilter: "blur(28px) saturate(170%)",
  border: "1px solid rgba(255, 255, 255, 0.14)"
};
const extractText = (node) => {
  if (node === null || node === void 0 || node === false || node === true) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (React.isValidElement(node)) return extractText(node.props?.children);
  return "";
};
function CodeBlock({ language, code, children }) {
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef(null);
  useEffect(() => () => clearTimeout(copyTimer.current), []);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
    }
  };
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      style: {
        margin: "0 0 0.9rem",
        borderRadius: 10,
        overflow: "hidden",
        border: `1px solid ${LINE}`,
        background: THEME.bgCard
      }
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 12px",
          borderBottom: `1px solid ${LINE}`,
          background: "rgba(255,255,255,0.03)"
        }
      },
      /* @__PURE__ */ React.createElement(
        "span",
        {
          style: {
            fontFamily: MONO,
            fontSize: "0.7rem",
            letterSpacing: "0.08em",
            color: THEME.textMuted
          }
        },
        language || "code"
      ),
      /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: handleCopy,
          className: "flex items-center gap-1.5 transition-colors",
          style: {
            fontFamily: MONO,
            fontSize: "0.68rem",
            color: copied ? THEME.accent : THEME.textMuted,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "2px 4px",
            borderRadius: 6
          }
        },
        copied ? /* @__PURE__ */ React.createElement(Check, { size: 12 }) : /* @__PURE__ */ React.createElement(Copy, { size: 12 }),
        copied ? "Copied" : "Copy"
      )
    ),
    /* @__PURE__ */ React.createElement(
      "pre",
      {
        style: {
          margin: 0,
          padding: "12px 14px",
          overflowX: "auto",
          fontFamily: MONO,
          fontSize: "0.8rem",
          lineHeight: 1.65,
          color: THEME.textMain
        }
      },
      /* @__PURE__ */ React.createElement("code", { className: language ? `language-${language}` : void 0 }, children)
    )
  );
}
const tableToMarkdown = (tableEl) => {
  const rows = [...tableEl.querySelectorAll("tr")];
  const lines = rows.map((tr) => {
    const cells = [...tr.children].map(
      (c) => c.textContent.trim().replace(/\|/g, "\\|").replace(/\n+/g, " ")
    );
    return `| ${cells.join(" | ")} |`;
  });
  if (lines.length > 1) {
    const cols = rows[0].children.length;
    lines.splice(1, 0, `| ${Array(cols).fill("---").join(" | ")} |`);
  }
  return lines.join("\n");
};
function TableBlock({ children }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  const tableRef = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const handleCopy = () => {
    const table = tableRef.current;
    if (!table) return;
    navigator.clipboard.writeText(tableToMarkdown(table)).catch(() => {
    });
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1500);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "flex items-start", style: { gap: 6 } }, /* @__PURE__ */ React.createElement("div", { ref: tableRef, style: { flex: 1, minWidth: 0, overflowX: "auto" } }, /* @__PURE__ */ React.createElement("table", null, children)), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: handleCopy,
      title: copied ? "Copied" : "Copy table as markdown",
      "aria-label": copied ? "Copied" : "Copy table as markdown",
      className: "flex items-center justify-center shrink-0 transition-colors",
      style: {
        width: 28,
        height: 28,
        borderRadius: 8,
        color: copied ? THEME.accent : THEME.textMuted,
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${copied ? `${THEME.accent}66` : LINE}`,
        cursor: "pointer",
        padding: 0
      },
      onMouseEnter: (e) => {
        if (!copied) e.currentTarget.style.color = THEME.textMain;
      },
      onMouseLeave: (e) => {
        if (!copied) e.currentTarget.style.color = THEME.textMuted;
      }
    },
    copied ? /* @__PURE__ */ React.createElement(Check, { size: 13 }) : /* @__PURE__ */ React.createElement(Copy, { size: 13 })
  ));
}
const useMarkdownComponents = () => useMemo(
  () => ({
    pre: ({ children }) => {
      const codeEl = Array.isArray(children) ? children[0] : children;
      if (!React.isValidElement(codeEl)) return /* @__PURE__ */ React.createElement("pre", null, children);
      const className = codeEl.props?.className || "";
      const match = /language-([\w+#.-]+)/.exec(className);
      return /* @__PURE__ */ React.createElement(
        CodeBlock,
        {
          language: match ? match[1] : void 0,
          code: extractText(codeEl.props?.children)
        },
        codeEl.props?.children
      );
    },
    table: ({ children }) => /* @__PURE__ */ React.createElement(TableBlock, null, children),
    a: ({ href, children }) => /* @__PURE__ */ React.createElement("a", { href, target: "_blank", rel: "noreferrer" }, children)
  }),
  []
);
function AnswerActions({ content, docName }) {
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef(null);
  useEffect(() => () => clearTimeout(copyTimer.current), []);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
    }
  };
  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(docName || "distropedia-answer").replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 48) || "distropedia-answer"}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
  const actionBtn = (onClick, icon, label, highlight) => /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick,
      className: "flex items-center gap-1.5 transition-colors",
      style: {
        fontFamily: MONO,
        fontSize: "0.68rem",
        color: highlight ? THEME.accent : THEME.textMuted,
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "2px 4px",
        borderRadius: 6
      }
    },
    icon,
    label
  );
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginTop: 4 } }, actionBtn(handleCopy, copied ? /* @__PURE__ */ React.createElement(Check, { size: 12 }) : /* @__PURE__ */ React.createElement(Copy, { size: 12 }), copied ? "Copied" : "Copy", copied), actionBtn(handleDownload, /* @__PURE__ */ React.createElement(Download, { size: 12 }), "Download .md", false));
}
function MessageRow({ message, docName }) {
  const components = useMarkdownComponents();
  if (message.role === "user") {
    return /* @__PURE__ */ React.createElement("div", { className: "dp-fade flex justify-end", style: { padding: "6px 0" } }, /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          maxWidth: "78%",
          background: "rgba(255,255,255,0.06)",
          border: `1px solid ${LINE}`,
          borderRadius: 16,
          borderBottomRightRadius: 6,
          padding: "10px 14px",
          fontFamily: MONO,
          fontSize: "0.86rem",
          lineHeight: 1.6,
          color: THEME.textMain,
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere"
        }
      },
      message.content
    ));
  }
  return /* @__PURE__ */ React.createElement("div", { className: "dp-fade", style: { padding: "6px 0 14px" } }, /* @__PURE__ */ React.createElement("div", { className: "dp-md" }, /* @__PURE__ */ React.createElement(ReactMarkdown, { remarkPlugins: [remarkGfm], components }, message.content)), message.sources?.length > 0 && /* @__PURE__ */ React.createElement(
    "div",
    {
      style: {
        marginTop: 10,
        paddingTop: 10,
        borderTop: `1px dashed ${LINE}`
      }
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          fontFamily: MONO,
          fontSize: "0.64rem",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: THEME.textMuted,
          marginBottom: 6
        }
      },
      "Sources"
    ),
    /* @__PURE__ */ React.createElement("ul", { style: { margin: 0, padding: 0, listStyle: "none" } }, message.sources.map((s, i) => /* @__PURE__ */ React.createElement(
      "li",
      {
        key: s.url || i,
        style: {
          fontFamily: MONO,
          fontSize: "0.74rem",
          lineHeight: 1.8,
          display: "flex",
          gap: 6,
          alignItems: "baseline"
        }
      },
      /* @__PURE__ */ React.createElement("span", { style: { color: THEME.textMuted } }, String(i + 1).padStart(2, "0")),
      /* @__PURE__ */ React.createElement(
        "a",
        {
          href: s.url,
          target: "_blank",
          rel: "noreferrer",
          className: "transition-colors",
          style: {
            color: THEME.accent,
            textDecoration: "underline",
            textUnderlineOffset: 2,
            overflowWrap: "anywhere"
          }
        },
        s.title || s.url
      )
    )))
  ), !message.revealing && message.content && /* @__PURE__ */ React.createElement(AnswerActions, { content: message.content, docName }));
}
const MAX_INPUT_HEIGHT = 128;
function InputBar({ draft, onDraftChange, onSend, disabled, autoFocus }) {
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef(null);
  const resizeNow = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_INPUT_HEIGHT)}px`;
  };
  useEffect(() => {
    if (!draft) resizeNow();
  }, [draft]);
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "flex-end",
        gap: 8,
        background: THEME.bgCard,
        border: `1px solid ${focused ? `${THEME.accent}66` : LINE}`,
        borderRadius: 16,
        padding: "10px 10px 10px 16px",
        boxShadow: focused ? `0 0 0 3px ${THEME.accent}14, 0 10px 30px rgba(0,0,0,0.35)` : "0 10px 30px rgba(0,0,0,0.35)",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease"
      }
    },
    /* @__PURE__ */ React.createElement(
      "textarea",
      {
        ref: textareaRef,
        rows: 1,
        value: draft,
        autoFocus,
        placeholder: "Ask about distros, setup, troubleshooting\u2026",
        onChange: (e) => {
          onDraftChange(e.target.value);
          const el = textareaRef.current;
          if (el) {
            el.style.height = "auto";
            el.style.height = `${Math.min(el.scrollHeight, MAX_INPUT_HEIGHT)}px`;
          }
        },
        onKeyDown: handleKeyDown,
        onFocus: () => setFocused(true),
        onBlur: () => setFocused(false),
        style: {
          flex: 1,
          background: "transparent",
          border: "none",
          outline: "none",
          resize: "none",
          fontFamily: MONO,
          fontSize: "0.88rem",
          lineHeight: 1.5,
          color: THEME.textMain,
          maxHeight: MAX_INPUT_HEIGHT,
          padding: "4px 0",
          overflowY: "auto"
        }
      }
    ),
    /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: onSend,
        disabled: disabled || !draft.trim(),
        title: "Send message",
        className: "flex items-center justify-center shrink-0 transition-all",
        style: {
          width: 36,
          height: 36,
          borderRadius: 9999,
          border: "1px solid rgba(255,255,255,0.25)",
          color: "#fff",
          background: `linear-gradient(135deg, ${THEME.accent} 0%, #b83d25 100%)`,
          boxShadow: `0 2px 14px ${THEME.accent}55, 0 1px 0 rgba(255,255,255,0.35) inset`,
          cursor: disabled || !draft.trim() ? "not-allowed" : "pointer",
          opacity: disabled || !draft.trim() ? 0.45 : 1
        }
      },
      /* @__PURE__ */ React.createElement(SendHorizontal, { size: 16 })
    )
  );
}
const THINKING_WORDS = [
  "Penguining\u2026",
  "Sudoing\u2026",
  "Grepping the forums\u2026",
  "Apt-getting answers\u2026",
  "Compiling wisdom\u2026",
  "Kerneling\u2026",
  "Chmod-ing fixes\u2026",
  "Tux is thinking\u2026",
  "Mounting solutions\u2026",
  "Distrowatching\u2026"
];
const STREAM_STAGE_LABELS = {
  research: "Searching Reddit + knowledge\u2026",
  synthesizing: "Writing answer\u2026",
  citations: "Checking sources\u2026"
};
function ThinkingWords() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % THINKING_WORDS.length), 900);
    return () => clearInterval(t);
  }, []);
  return /* @__PURE__ */ React.createElement(
    "span",
    {
      key: i,
      className: "dp-fade",
      style: {
        fontFamily: MONO,
        fontSize: "0.78rem",
        color: THEME.textMuted,
        display: "inline-block"
      }
    },
    THINKING_WORDS[i]
  );
}
function DeleteChatDialog({ chatTitle, deleting, onCancel, onConfirm }) {
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      onClick: onCancel,
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(10, 12, 16, 0.6)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)"
      }
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "Delete chat confirmation",
        onClick: (e) => e.stopPropagation(),
        style: {
          width: "min(400px, calc(100vw - 48px))",
          borderRadius: 16,
          padding: "22px 22px 18px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
          ...GLASS,
          background: "rgba(28, 34, 41, 0.85)"
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 } }, /* @__PURE__ */ React.createElement(TriangleAlert, { size: 18, color: THEME.accent }), /* @__PURE__ */ React.createElement(
        "span",
        {
          style: {
            fontFamily: MONO,
            fontWeight: 800,
            fontSize: "0.95rem",
            color: THEME.textMain
          }
        },
        "Delete this chat?"
      )),
      /* @__PURE__ */ React.createElement(
        "p",
        {
          style: {
            fontFamily: MONO,
            fontSize: "0.76rem",
            color: THEME.textMuted,
            margin: "0 0 18px",
            lineHeight: 1.7,
            overflowWrap: "anywhere"
          }
        },
        "\u201C",
        chatTitle || "Untitled chat",
        "\u201D and all of its messages will be permanently removed. This cannot be undone."
      ),
      /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "flex-end", gap: 8 } }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: onCancel,
          style: {
            fontFamily: MONO,
            fontSize: "0.76rem",
            fontWeight: 700,
            color: THEME.silver,
            background: "transparent",
            border: `1px solid ${LINE_SOFT}`,
            borderRadius: 9999,
            padding: "7px 16px",
            cursor: "pointer"
          }
        },
        "Cancel"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: onConfirm,
          disabled: deleting,
          style: {
            fontFamily: MONO,
            fontSize: "0.76rem",
            fontWeight: 700,
            color: "#fff",
            background: `linear-gradient(135deg, ${THEME.accent} 0%, #b83d25 100%)`,
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: 9999,
            padding: "7px 16px",
            cursor: deleting ? "wait" : "pointer",
            opacity: deleting ? 0.7 : 1
          }
        },
        "Delete"
      ))
    )
  );
}
const railBtn = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 34,
  height: 34,
  borderRadius: 9,
  border: "none",
  background: "transparent",
  color: THEME.textMuted,
  cursor: "pointer",
  transition: "background 0.15s ease, color 0.15s ease"
};
const railBtnHover = (e, on) => {
  e.currentTarget.style.color = on ? THEME.textMain : THEME.textMuted;
  e.currentTarget.style.background = on ? "rgba(255,255,255,0.08)" : "transparent";
};
function Sidebar({
  chats,
  activeId,
  user,
  onNewChat,
  onOpenChat,
  onRequestDelete,
  onRenameChat,
  onLogout,
  creating,
  onNavigateHome,
  collapsed,
  onToggleCollapse,
  // Mobile drawer mode: sidebar becomes a fixed overlay instead of squeezing
  // the conversation into ~80px. `open` controls visibility, `onClose` backs out.
  overlay = false,
  open = false,
  onClose,
  // History load state: 'loading' on first open (never show a bare empty
  // list while the fetch is in flight), 'error' with retry on failure.
  chatsLoading = false,
  chatsError = null,
  onRetryChats
}) {
  const [hoveredId, setHoveredId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const editRef = useRef(null);
  useEffect(() => {
    if (editingId) editRef.current?.focus();
  }, [editingId]);
  const startEdit = (chat) => {
    setEditingId(chat.id);
    setEditValue(chat.title || "");
  };
  const commitEdit = () => {
    const v = editValue.trim();
    if (editingId && v) onRenameChat(editingId, v);
    setEditingId(null);
  };
  const asideStyle = overlay ? {
    position: "fixed",
    zIndex: 60,
    top: 10,
    bottom: 10,
    left: 10,
    width: "min(300px, calc(100vw - 80px))",
    flexShrink: 0,
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 18px 50px rgba(0,0,0,0.55)",
    transform: open ? "translateX(0)" : "translateX(calc(-100% - 20px))",
    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    visibility: open ? "visible" : "hidden",
    ...GLASS
  } : {
    position: "relative",
    zIndex: 10,
    flexShrink: 0,
    width: collapsed ? 60 : 272,
    height: "calc(100% - 20px)",
    margin: 10,
    marginRight: 0,
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 18px 50px rgba(0,0,0,0.4)",
    transition: "width 0.32s cubic-bezier(0.4, 0, 0.2, 1)",
    ...GLASS
  };
  const expandedVisible = overlay ? open : !collapsed;
  return /* @__PURE__ */ React.createElement("aside", { style: asideStyle }, /* @__PURE__ */ React.createElement(
    "div",
    {
      style: {
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        opacity: expandedVisible ? 1 : 0,
        pointerEvents: expandedVisible ? "auto" : "none",
        transition: "opacity 0.2s ease"
      }
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "13px 10px 13px 16px",
          borderBottom: `1px solid ${LINE}`
        }
      },
      /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: onNavigateHome,
          title: "Back to DistroPedia home",
          style: {
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 9,
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            textAlign: "left",
            minWidth: 0
          }
        },
        /* @__PURE__ */ React.createElement(Bot, { size: 19, color: THEME.accent }),
        /* @__PURE__ */ React.createElement(
          "span",
          {
            style: {
              flex: 1,
              fontFamily: MONO,
              fontSize: "0.92rem",
              fontWeight: 800,
              letterSpacing: "0.04em",
              whiteSpace: "nowrap"
            }
          },
          /* @__PURE__ */ React.createElement("span", { style: { color: THEME.textMain } }, "Distro"),
          /* @__PURE__ */ React.createElement("span", { style: { color: THEME.accent } }, "Pedia"),
          /* @__PURE__ */ React.createElement("span", { style: { color: THEME.silver } }, " AI")
        )
      ),
      /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          title: overlay ? "Close sidebar" : "Collapse sidebar",
          onClick: overlay ? onClose : onToggleCollapse,
          style: railBtn,
          onMouseEnter: (e) => railBtnHover(e, true),
          onMouseLeave: (e) => railBtnHover(e, false)
        },
        /* @__PURE__ */ React.createElement(PanelLeftClose, { size: 17 })
      )
    ),
    /* @__PURE__ */ React.createElement("div", { style: { padding: "12px 12px 4px" } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: onNewChat,
        disabled: creating,
        className: "flex w-full items-center justify-center gap-2 transition-all",
        style: {
          fontFamily: MONO,
          fontSize: "0.8rem",
          fontWeight: 700,
          letterSpacing: "0.03em",
          color: "#fff",
          background: `linear-gradient(135deg, ${THEME.accent} 0%, #b83d25 100%)`,
          border: "1px solid rgba(255,255,255,0.25)",
          borderRadius: 9999,
          padding: "9px 14px",
          cursor: creating ? "wait" : "pointer",
          opacity: creating ? 0.7 : 1,
          boxShadow: `0 2px 16px ${THEME.accent}55, 0 1px 0 rgba(255,255,255,0.35) inset`
        }
      },
      /* @__PURE__ */ React.createElement(Plus, { size: 15 }),
      "New chat"
    )),
    /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px 6px",
          fontFamily: MONO,
          fontSize: "0.62rem",
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: THEME.textMuted
        }
      },
      /* @__PURE__ */ React.createElement("span", null, "Chats"),
      chats.length > 0 && /* @__PURE__ */ React.createElement("span", null, chats.length)
    ),
    /* @__PURE__ */ React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "0 10px 10px" } }, chatsLoading && chats.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { padding: "6px 2px" } }, /* @__PURE__ */ React.createElement(ChatListSkeleton, { count: 5 })), chatsError && chats.length === 0 && !chatsLoading && /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "14px 8px" } }, /* @__PURE__ */ React.createElement(
      "p",
      {
        style: {
          fontFamily: MONO,
          fontSize: "0.7rem",
          color: THEME.accent,
          margin: "0 0 8px",
          lineHeight: 1.6
        }
      },
      "Couldn't load chats."
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: onRetryChats,
        style: {
          fontFamily: MONO,
          fontSize: "0.7rem",
          fontWeight: 700,
          color: THEME.textMain,
          background: "rgba(255,255,255,0.07)",
          border: `1px solid ${LINE}`,
          borderRadius: 9999,
          padding: "5px 14px",
          cursor: "pointer"
        }
      },
      "Retry"
    )), !chatsLoading && !chatsError && chats.length === 0 && /* @__PURE__ */ React.createElement(
      "p",
      {
        style: {
          fontFamily: MONO,
          fontSize: "0.72rem",
          color: THEME.textMuted,
          textAlign: "center",
          padding: "18px 8px",
          margin: 0
        }
      },
      "No conversations yet"
    ), chats.map((chat) => {
      const isActive = chat.id === activeId;
      const isEditing = editingId === chat.id;
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: chat.id,
          role: "button",
          tabIndex: isEditing ? -1 : 0,
          onClick: () => !isEditing && onOpenChat(chat.id),
          onKeyDown: (e) => e.key === "Enter" && !isEditing && onOpenChat(chat.id),
          onMouseEnter: () => setHoveredId(chat.id),
          onMouseLeave: () => setHoveredId(null),
          className: "group flex items-center cursor-pointer transition-colors",
          style: {
            gap: 9,
            padding: "8px 10px",
            marginBottom: 2,
            borderRadius: 10,
            position: "relative",
            fontFamily: MONO,
            fontSize: "0.78rem",
            border: `1px solid ${isActive ? "rgba(224,90,56,0.35)" : "transparent"}`,
            background: isActive ? "rgba(224,90,56,0.1)" : hoveredId === chat.id ? "rgba(255,255,255,0.04)" : "transparent"
          },
          title: isEditing ? void 0 : chat.title || "Untitled chat"
        },
        isActive && /* @__PURE__ */ React.createElement(
          "span",
          {
            style: {
              position: "absolute",
              left: 0,
              top: 8,
              bottom: 8,
              width: 3,
              borderRadius: 9999,
              background: THEME.accent
            }
          }
        ),
        /* @__PURE__ */ React.createElement(
          MessageSquare,
          {
            size: 14,
            className: "shrink-0",
            style: { color: isActive ? THEME.accent : THEME.textMuted }
          }
        ),
        isEditing ? /* @__PURE__ */ React.createElement(
          "input",
          {
            ref: editRef,
            value: editValue,
            onChange: (e) => setEditValue(e.target.value),
            onClick: (e) => e.stopPropagation(),
            onKeyDown: (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitEdit();
              } else if (e.key === "Escape") {
                setEditingId(null);
              }
            },
            onBlur: commitEdit,
            style: {
              flex: 1,
              minWidth: 0,
              background: "rgba(20,24,32,0.6)",
              border: `1px solid ${THEME.accent}88`,
              borderRadius: 6,
              outline: "none",
              fontFamily: MONO,
              fontSize: "0.76rem",
              color: THEME.textMain,
              padding: "3px 7px"
            }
          }
        ) : /* @__PURE__ */ React.createElement(
          "span",
          {
            style: {
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: isActive ? THEME.textMain : THEME.silver
            }
          },
          chat.title || "Untitled chat"
        ),
        !isEditing && /* @__PURE__ */ React.createElement(
          "span",
          {
            className: "shrink-0 flex items-center",
            style: { opacity: hoveredId === chat.id ? 1 : 0, transition: "opacity 0.15s" }
          },
          /* @__PURE__ */ React.createElement(
            "button",
            {
              type: "button",
              title: "Rename chat",
              onClick: (e) => {
                e.stopPropagation();
                startEdit(chat);
              },
              style: {
                ...railBtn,
                width: 22,
                height: 22,
                borderRadius: 6
              },
              onMouseEnter: (e) => {
                e.currentTarget.style.color = THEME.textMain;
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              },
              onMouseLeave: (e) => {
                e.currentTarget.style.color = THEME.textMuted;
                e.currentTarget.style.background = "transparent";
              }
            },
            /* @__PURE__ */ React.createElement(Pencil, { size: 12 })
          ),
          /* @__PURE__ */ React.createElement(
            "button",
            {
              type: "button",
              title: "Delete chat",
              onClick: (e) => {
                e.stopPropagation();
                onRequestDelete(chat);
              },
              style: {
                ...railBtn,
                width: 22,
                height: 22,
                borderRadius: 6
              },
              onMouseEnter: (e) => {
                e.currentTarget.style.color = THEME.accent;
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              },
              onMouseLeave: (e) => {
                e.currentTarget.style.color = THEME.textMuted;
                e.currentTarget.style.background = "transparent";
              }
            },
            /* @__PURE__ */ React.createElement(Trash2, { size: 13 })
          )
        )
      );
    })),
    /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 14px",
          borderTop: `1px solid ${LINE}`
        }
      },
      /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "flex items-center justify-center shrink-0",
          style: {
            width: 32,
            height: 32,
            borderRadius: 9999,
            background: "rgba(224,90,56,0.15)",
            border: `1px solid rgba(224,90,56,0.4)`,
            fontFamily: MONO,
            fontSize: "0.8rem",
            fontWeight: 800,
            color: THEME.accent,
            textTransform: "uppercase"
          }
        },
        (user?.email || "D")[0]
      ),
      /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement(
        "div",
        {
          style: {
            fontFamily: MONO,
            fontSize: "0.72rem",
            color: THEME.textMain,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          },
          title: user?.email || "Signed in"
        },
        user?.email || "Signed in"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: onNavigateHome,
          className: "transition-colors",
          style: {
            background: "none",
            border: "none",
            padding: 0,
            marginTop: 2,
            fontFamily: MONO,
            fontSize: "0.66rem",
            color: THEME.textMuted,
            cursor: "pointer"
          }
        },
        "\u2190 Back to DistroPedia"
      )),
      /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          title: "Log out",
          onClick: onLogout,
          className: "shrink-0 transition-colors",
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 30,
            height: 30,
            borderRadius: 8,
            border: `1px solid ${LINE_SOFT}`,
            background: "transparent",
            color: THEME.textMuted,
            cursor: "pointer"
          },
          onMouseEnter: (e) => {
            e.currentTarget.style.color = THEME.accent;
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.color = THEME.textMuted;
            e.currentTarget.style.background = "transparent";
          }
        },
        /* @__PURE__ */ React.createElement(LogOut, { size: 14 })
      )
    )
  ), !overlay && /* @__PURE__ */ React.createElement(
    "div",
    {
      style: {
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "10px 0",
        gap: 6,
        opacity: collapsed ? 1 : 0,
        pointerEvents: collapsed ? "auto" : "none",
        transition: "opacity 0.25s ease 0.12s"
      }
    },
    /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        title: "Expand sidebar",
        onClick: onToggleCollapse,
        style: railBtn,
        onMouseEnter: (e) => railBtnHover(e, true),
        onMouseLeave: (e) => railBtnHover(e, false)
      },
      /* @__PURE__ */ React.createElement(PanelLeftOpen, { size: 17 })
    ),
    /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        title: "New chat",
        onClick: onNewChat,
        disabled: creating,
        className: "flex items-center justify-center transition-all",
        style: {
          width: 34,
          height: 34,
          borderRadius: 9,
          border: "none",
          color: "#fff",
          background: `linear-gradient(135deg, ${THEME.accent} 0%, #b83d25 100%)`,
          cursor: creating ? "wait" : "pointer",
          opacity: creating ? 0.7 : 1,
          boxShadow: `0 2px 12px ${THEME.accent}55`
        }
      },
      /* @__PURE__ */ React.createElement(Plus, { size: 17 })
    ),
    /* @__PURE__ */ React.createElement("div", { style: { width: 26, borderTop: `1px solid ${LINE}`, margin: "6px 0" } }),
    /* @__PURE__ */ React.createElement("div", { style: { flex: 1, overflowY: "auto", width: "100%", padding: "0 13px" } }, chats.slice(0, 12).map((chat) => {
      const isActive = chat.id === activeId;
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: chat.id,
          type: "button",
          title: chat.title || "Untitled chat",
          onClick: () => onOpenChat(chat.id),
          className: "flex items-center justify-center transition-all mx-auto",
          style: {
            ...railBtn,
            marginBottom: 4,
            color: isActive ? THEME.accent : THEME.textMuted,
            background: isActive ? "rgba(224,90,56,0.12)" : "transparent"
          },
          onMouseEnter: (e) => {
            if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.08)";
          },
          onMouseLeave: (e) => {
            if (!isActive) e.currentTarget.style.background = "transparent";
          }
        },
        /* @__PURE__ */ React.createElement(MessageSquare, { size: 16 })
      );
    })),
    /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        title: user?.email || "Log out",
        onClick: onLogout,
        style: railBtn,
        onMouseEnter: (e) => railBtnHover(e, true),
        onMouseLeave: (e) => railBtnHover(e, false)
      },
      /* @__PURE__ */ React.createElement(LogOut, { size: 16 })
    )
  ));
}
function ChatPage({ onNavigate }) {
  const { user, token, logout } = useAuth();
  const isMobile = useMedia("(max-width: 767px)");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [initialChats] = useState(() => peekChatList() ?? peekStaleChatList());
  const [chats, setChats] = useState(initialChats || []);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendingChatId, setSendingChatId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [chatsLoading, setChatsLoading] = useState(!initialChats);
  const [chatsError, setChatsError] = useState(null);
  const [reveal, setReveal] = useState(null);
  const [streamStage, setStreamStage] = useState(null);
  const streamAbortRef = useRef(null);
  const scrollRef = useRef(null);
  const activeIdRef = useRef(activeId);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);
  useEffect(() => () => streamAbortRef.current?.abort(), []);
  const refreshChats = useCallback(async () => {
    setChatsLoading(true);
    setChatsError(null);
    try {
      const list = await listChats();
      setChats(list);
    } catch (err) {
      if (err.status === 401) {
        logout();
        return;
      }
      console.error("[chat] failed to load history:", err.message);
      setChatsError(err.message || "Could not load chats.");
    } finally {
      setChatsLoading(false);
    }
  }, [logout]);
  useEffect(() => {
    if (token) refreshChats();
  }, [token, refreshChats]);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending, reveal?.shown]);
  useEffect(() => {
    setReveal(null);
  }, [activeId]);
  useEffect(() => {
    if (!reveal) return void 0;
    if (reveal.shown >= reveal.full.length) {
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.revealing) {
          next[next.length - 1] = { ...last, content: reveal.full };
          delete next[next.length - 1].revealing;
        }
        return next;
      });
      setReveal(null);
      return void 0;
    }
    const t = setTimeout(() => {
      setReveal(
        (r) => r ? {
          ...r,
          shown: Math.min(r.full.length, r.shown + Math.max(6, Math.ceil(r.full.length / 240)))
        } : r
      );
    }, 26);
    return () => clearTimeout(t);
  }, [reveal]);
  const handleNewChat = async () => {
    if (creating || sending || loadingChat) return;
    setError(null);
    setCreating(true);
    try {
      const chat = await createChat();
      setActiveId(chat.id);
      setMessages([]);
      refreshChats();
    } catch (err) {
      if (err.status === 401) {
        logout();
        return;
      }
      setError(err.message || "Could not create a new chat.");
    } finally {
      setCreating(false);
    }
  };
  const handleOpenChat = async (id) => {
    if (id === activeId || loadingChat || creating) return;
    streamAbortRef.current?.abort();
    streamAbortRef.current = null;
    setStreamStage(null);
    setError(null);
    setLoadingChat(true);
    try {
      const data = await getChat(id);
      setActiveId(id);
      setMessages(data.messages || []);
    } catch (err) {
      if (err.status === 401) {
        logout();
        return;
      }
      setError(err.message || "Could not load that conversation.");
    } finally {
      setLoadingChat(false);
    }
  };
  const handleRenameChat = async (id, title) => {
    try {
      await renameChat(id, title);
      setChats((prev) => prev.map((c) => c.id === id ? { ...c, title } : c));
    } catch (err) {
      if (err.status === 401) {
        logout();
        return;
      }
      refreshChats();
    }
  };
  const handleRequestDelete = (chat) => {
    setConfirmDelete(chat);
  };
  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    const id = confirmDelete.id;
    try {
      await deleteChat(id);
    } catch (err) {
      if (err.status === 401) {
        logout();
        return;
      }
    }
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (activeIdRef.current === id) {
      setActiveId(null);
      setMessages([]);
      setReveal(null);
    }
    setConfirmDelete(null);
    setDeleting(false);
  };
  const handleSend = async () => {
    const content = draft.trim();
    if (!content || sending) return;
    setError(null);
    setDraft("");
    setSending(true);
    setSendingChatId(activeIdRef.current);
    setReveal(null);
    setStreamStage(null);
    setMessages((prev) => [...prev, { role: "user", content, optimistic: true }]);
    let chatId = activeIdRef.current;
    const finishLegacy = async () => {
      const data = await sendMessage(chatId, content);
      if (activeIdRef.current === chatId) {
        setMessages((prev) => [
          ...prev.filter((m) => !m.optimistic),
          data.userMessage,
          { ...data.assistantMessage, content: "", revealing: true }
        ]);
        setReveal({ full: data.assistantMessage.content, shown: 0 });
      }
      refreshChats();
    };
    try {
      if (!chatId) {
        const chat = await createChat();
        chatId = chat.id;
        activeIdRef.current = chatId;
        setActiveId(chatId);
      }
      setSendingChatId(chatId);
      setMessages((prev) => [
        ...prev.filter((m) => !m.optimistic),
        { role: "user", content },
        { role: "assistant", content: "", streaming: true }
      ]);
      const aborter = new AbortController();
      streamAbortRef.current = aborter;
      let streamed = "";
      try {
        const data = await sendMessageStream(chatId, content, {
          signal: aborter.signal,
          onStage: (stage) => {
            if (activeIdRef.current === chatId) setStreamStage(stage);
          },
          onToken: (t) => {
            if (!t || activeIdRef.current !== chatId) return;
            streamed += t;
            const snap = streamed;
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last && last.streaming) {
                next[next.length - 1] = { ...last, content: snap };
              }
              return next;
            });
          }
        });
        streamAbortRef.current = null;
        if (activeIdRef.current === chatId) {
          setMessages((prev) => {
            const base = prev.filter((m) => !m.optimistic);
            const last = base[base.length - 1];
            if (last && last.streaming) {
              base[base.length - 1] = data.assistantMessage;
              return base;
            }
            return [...base, data.userMessage, data.assistantMessage];
          });
          setStreamStage(null);
        }
        refreshChats();
      } catch (streamErr) {
        streamAbortRef.current = null;
        if (streamErr?.name === "AbortError" || activeIdRef.current !== chatId) return;
        if (!streamed) {
          setMessages((prev) => [
            ...prev.filter(
              (m) => !m.streaming && !(m.role === "user" && !m.optimistic && m.content === content)
            ),
            { role: "user", content, optimistic: true }
          ]);
          await finishLegacy();
          return;
        }
        throw streamErr;
      }
    } catch (err) {
      if (err.status === 401) {
        logout();
        return;
      }
      setMessages((prev) => prev.filter((m) => !m.optimistic && !m.streaming));
      setDraft((prev) => prev || content);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSending(false);
      setSendingChatId(null);
      setStreamStage(null);
    }
  };
  if (!token) {
    return /* @__PURE__ */ React.createElement(AuthPage, { onAuthSuccess: () => onNavigate?.("/chat"), onNavigate });
  }
  const isEmpty = messages.length === 0 && !loadingChat;
  const activeTitle = chats.find((c) => c.id === activeId)?.title;
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      style: {
        backgroundColor: THEME.bg,
        height: "100vh",
        display: "flex",
        overflow: "hidden",
        position: "relative"
      }
    },
    /* @__PURE__ */ React.createElement("div", { className: "hero-bg fixed inset-0 z-0", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("div", { className: "grain-fine" }), /* @__PURE__ */ React.createElement("div", { className: "grain-fiber" })),
    /* @__PURE__ */ React.createElement(
      Sidebar,
      {
        chats,
        activeId,
        user,
        onNewChat: (...args) => {
          setMobileNavOpen(false);
          return handleNewChat(...args);
        },
        onOpenChat: (...args) => {
          setMobileNavOpen(false);
          return handleOpenChat(...args);
        },
        onRequestDelete: handleRequestDelete,
        onRenameChat: handleRenameChat,
        onLogout: logout,
        creating,
        onNavigateHome: () => onNavigate?.("/"),
        collapsed: sidebarCollapsed,
        onToggleCollapse: () => setSidebarCollapsed((v) => !v),
        overlay: isMobile,
        open: mobileNavOpen,
        onClose: () => setMobileNavOpen(false),
        chatsLoading,
        chatsError,
        onRetryChats: refreshChats
      }
    ),
    isMobile && mobileNavOpen && /* @__PURE__ */ React.createElement(
      "div",
      {
        onClick: () => setMobileNavOpen(false),
        "aria-hidden": "true",
        style: {
          position: "fixed",
          inset: 0,
          zIndex: 55,
          background: "rgba(10, 12, 16, 0.6)"
        }
      }
    ),
    /* @__PURE__ */ React.createElement(
      "main",
      {
        className: "relative z-10 flex flex-col",
        style: { flex: 1, minWidth: 0, height: "100%" }
      },
      isMobile && /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "flex items-center",
          style: {
            gap: 10,
            padding: "12px 12px 8px",
            flexShrink: 0
          }
        },
        /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            title: "Open chat history",
            "aria-label": "Open chat history",
            onClick: () => setMobileNavOpen(true),
            className: "flex items-center justify-center shrink-0",
            style: {
              width: 38,
              height: 38,
              borderRadius: 12,
              border: `1px solid ${LINE_SOFT}`,
              background: "rgba(255,255,255,0.05)",
              color: THEME.textMain,
              cursor: "pointer"
            }
          },
          /* @__PURE__ */ React.createElement(PanelLeftOpen, { size: 17 })
        ),
        /* @__PURE__ */ React.createElement(
          "span",
          {
            style: {
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: MONO,
              fontSize: "0.9rem",
              fontWeight: 800
            }
          },
          /* @__PURE__ */ React.createElement("span", { style: { color: THEME.textMain } }, "Distro"),
          /* @__PURE__ */ React.createElement("span", { style: { color: THEME.accent } }, "Pedia"),
          /* @__PURE__ */ React.createElement("span", { style: { color: THEME.silver } }, " AI")
        ),
        /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            title: "New chat",
            "aria-label": "New chat",
            onClick: handleNewChat,
            disabled: creating,
            className: "flex items-center justify-center shrink-0",
            style: {
              width: 38,
              height: 38,
              borderRadius: 12,
              border: "none",
              color: "#fff",
              background: `linear-gradient(135deg, ${THEME.accent} 0%, #b83d25 100%)`,
              cursor: creating ? "wait" : "pointer",
              opacity: creating ? 0.7 : 1
            }
          },
          /* @__PURE__ */ React.createElement(Plus, { size: 17 })
        )
      ),
      isEmpty ? (
        /* Empty state: centered greeting + input */
        /* @__PURE__ */ React.createElement(
          "div",
          {
            className: "flex flex-col items-center justify-center",
            style: { flex: 1, padding: "24px" }
          },
          /* @__PURE__ */ React.createElement(
            "div",
            {
              className: "flex items-center justify-center",
              style: {
                width: 64,
                height: 64,
                borderRadius: 9999,
                background: THEME.bgCard,
                border: `1px solid ${LINE_SOFT}`,
                marginBottom: 20
              }
            },
            /* @__PURE__ */ React.createElement(Bot, { size: 30, color: THEME.accent })
          ),
          /* @__PURE__ */ React.createElement(
            "h1",
            {
              style: {
                fontFamily: MONO,
                fontSize: "1.35rem",
                fontWeight: 800,
                letterSpacing: "0.02em",
                color: THEME.textMain,
                margin: "0 0 8px",
                textAlign: "center"
              }
            },
            "How can I help your Linux today?"
          ),
          /* @__PURE__ */ React.createElement(
            "p",
            {
              style: {
                fontFamily: MONO,
                fontSize: "0.78rem",
                color: THEME.textMuted,
                margin: "0 0 26px",
                textAlign: "center"
              }
            },
            "Distros, installs, config, troubleshooting \u2014 grounded with web sources."
          ),
          /* @__PURE__ */ React.createElement("div", { style: { width: "min(680px, 100%)" } }, /* @__PURE__ */ React.createElement(
            InputBar,
            {
              draft,
              onDraftChange: setDraft,
              onSend: handleSend,
              disabled: sending,
              autoFocus: true
            }
          ))
        )
      ) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
        "div",
        {
          ref: scrollRef,
          style: {
            flex: 1,
            overflowY: "auto",
            padding: isMobile ? "12px 12px 8px" : "20px 24px 8px"
          }
        },
        /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 780, margin: "0 auto" } }, loadingChat && messages.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { padding: "12px 0 24px" } }, /* @__PURE__ */ React.createElement(ChatMessagesSkeleton, { count: 3 })) : null, messages.map((msg, i) => {
          const isRevealing = reveal && msg.revealing && i === messages.length - 1;
          const shown = isRevealing ? {
            ...msg,
            content: reveal.full.slice(0, reveal.shown),
            sources: []
          } : msg;
          return /* @__PURE__ */ React.createElement(
            MessageRow,
            {
              key: msg.optimistic ? `optimistic-${i}` : `${activeId}-${i}`,
              message: shown,
              docName: activeTitle
            }
          );
        }), sending && sendingChatId === activeId && !(messages.length > 0 && messages[messages.length - 1].streaming && messages[messages.length - 1].content) && /* @__PURE__ */ React.createElement(
          "div",
          {
            className: "dp-fade flex items-center",
            style: { gap: 10, padding: "8px 0 14px" }
          },
          streamStage && STREAM_STAGE_LABELS[streamStage] ? /* @__PURE__ */ React.createElement(
            "span",
            {
              style: {
                fontFamily: MONO,
                fontSize: "0.76rem",
                color: THEME.textMuted
              }
            },
            STREAM_STAGE_LABELS[streamStage]
          ) : /* @__PURE__ */ React.createElement(ThinkingWords, null),
          /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", gap: 3 } }, /* @__PURE__ */ React.createElement("span", { className: "dp-dot" }), /* @__PURE__ */ React.createElement("span", { className: "dp-dot" }), /* @__PURE__ */ React.createElement("span", { className: "dp-dot" }))
        ))
      ), /* @__PURE__ */ React.createElement("div", { style: { padding: isMobile ? "8px 12px 16px" : "8px 24px 20px" } }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 780, margin: "0 auto" } }, error && /* @__PURE__ */ React.createElement(
        "p",
        {
          style: {
            fontFamily: MONO,
            fontSize: "0.72rem",
            color: THEME.accent,
            margin: "0 0 8px",
            textAlign: "center"
          }
        },
        error
      ), /* @__PURE__ */ React.createElement(
        InputBar,
        {
          draft,
          onDraftChange: setDraft,
          onSend: handleSend,
          disabled: sending
        }
      )))),
      isEmpty && error && /* @__PURE__ */ React.createElement(
        "p",
        {
          style: {
            fontFamily: MONO,
            fontSize: "0.72rem",
            color: THEME.accent,
            margin: "10px 0 18px",
            textAlign: "center",
            flexShrink: 0
          }
        },
        error
      )
    ),
    confirmDelete && /* @__PURE__ */ React.createElement(
      DeleteChatDialog,
      {
        chatTitle: confirmDelete.title,
        deleting,
        onCancel: () => setConfirmDelete(null),
        onConfirm: handleConfirmDelete
      }
    )
  );
}
export {
  ChatPage as default
};
