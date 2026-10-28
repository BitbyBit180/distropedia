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
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Pencil,
  Trash2,
  Loader2,
  TriangleAlert,
  MessageSquare,
  Search,
  Share2,
  X
} from "dp/core/icons.js";
import { useAuth } from "../hooks/useAuth.js";
import { useDistros } from "../hooks/useDistros.js";
import { THEME, LINE, LINE_SOFT, MONO } from "../theme/designTokens.js";
import VotePill from "../components/community/VotePill.js";
import NotificationBell from "../components/community/NotificationBell.js";
import ReportButton from "../components/community/ReportButton.js";
import { ChannelAvatar } from "../components/community/Avatar.js";
import { RowAction } from "../components/community/PostCard.js";
import { PostDetailSkeleton } from "../components/Skeleton.js";
import CommentItem from "../components/community/CommentItem.js";
import CommunityShell from "../components/community/CommunityShell.js";
import { RailCard } from "../components/community/CommunityShell.js";
import CommunityNav from "../components/community/CommunityNav.js";
import { MobileChannelBar } from "../components/community/CommunityNav.js";
import { AboutChannel } from "../components/community/CommunitySidebar.js";
import { timeAgo } from "../utils/timeAgo.js";
import {
  getPost,
  peekPost,
  peekStalePost,
  getChannelStats,
  peekChannelStats,
  peekStaleChannelStats,
  updatePost,
  deletePost,
  votePost,
  addComment,
  updateComment,
  deleteComment,
  voteComment
} from "../services/communityApi.js";
const GLASS = {
  background: "rgba(28, 34, 41, 0.55)",
  backdropFilter: "blur(28px) saturate(170%)",
  WebkitBackdropFilter: "blur(28px) saturate(170%)",
  border: `1px solid ${LINE}`
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
    a: ({ href, children }) => /* @__PURE__ */ React.createElement("a", { href, target: "_blank", rel: "noreferrer" }, children)
  }),
  []
);
function EditPostForm({ post, saving, onSave, onCancel }) {
  const [title, setTitle] = useState(post.title || "");
  const [body, setBody] = useState(post.body || "");
  const [linkUrl, setLinkUrl] = useState(post.linkUrl || "");
  const [localError, setLocalError] = useState(null);
  const titleValid = title.trim().length >= 3;
  const handleSave = () => {
    if (!titleValid) {
      setLocalError("Title is required (at least 3 characters).");
      return;
    }
    setLocalError(null);
    onSave({ title: title.trim(), body: body.trim(), linkUrl: linkUrl.trim() });
  };
  return /* @__PURE__ */ React.createElement("div", { className: "dp-fade", style: { marginTop: 10 } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      value: title,
      onChange: (e) => setTitle(e.target.value),
      maxLength: 200,
      style: {
        width: "100%",
        boxSizing: "border-box",
        fontFamily: MONO,
        fontSize: "0.9rem",
        fontWeight: 700,
        color: THEME.textMain,
        background: "rgba(20, 24, 32, 0.6)",
        border: `1px solid ${LINE}`,
        borderRadius: 10,
        padding: "9px 12px",
        outline: "none",
        marginBottom: 10
      }
    }
  ), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      value: body,
      onChange: (e) => setBody(e.target.value),
      rows: 7,
      placeholder: "Body (markdown supported \u2014 optional)",
      style: {
        width: "100%",
        boxSizing: "border-box",
        resize: "vertical",
        fontFamily: MONO,
        fontSize: "0.8rem",
        lineHeight: 1.6,
        color: THEME.textMain,
        background: "rgba(20, 24, 32, 0.6)",
        border: `1px solid ${LINE}`,
        borderRadius: 10,
        padding: "10px 12px",
        outline: "none",
        marginBottom: 8
      }
    }
  ), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: linkUrl,
      onChange: (e) => setLinkUrl(e.target.value),
      placeholder: "Link URL (optional \u2014 https://\u2026)",
      style: {
        width: "100%",
        boxSizing: "border-box",
        fontFamily: MONO,
        fontSize: "0.76rem",
        color: THEME.textMain,
        background: "rgba(20, 24, 32, 0.6)",
        border: `1px solid ${LINE}`,
        borderRadius: 10,
        padding: "8px 12px",
        outline: "none",
        marginBottom: 10
      }
    }
  ), localError && /* @__PURE__ */ React.createElement(
    "p",
    {
      style: {
        margin: "0 0 8px",
        fontFamily: MONO,
        fontSize: "0.7rem",
        color: THEME.accent
      }
    },
    localError
  ), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: handleSave,
      disabled: saving || !titleValid,
      className: "transition-all",
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: MONO,
        fontSize: "0.74rem",
        fontWeight: 700,
        color: "#fff",
        background: `linear-gradient(135deg, ${THEME.accent} 0%, #b83d25 100%)`,
        border: "1px solid rgba(255,255,255,0.25)",
        borderRadius: 9999,
        padding: "7px 16px",
        cursor: saving || !titleValid ? "wait" : "pointer",
        opacity: saving || !titleValid ? 0.55 : 1
      }
    },
    saving && /* @__PURE__ */ React.createElement(Loader2, { size: 12, className: "animate-spin" }),
    "Save changes"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: onCancel,
      style: {
        fontFamily: MONO,
        fontSize: "0.74rem",
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
  )));
}
function DeletePostDialog({ deleting, onCancel, onConfirm }) {
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
        "aria-label": "Delete post confirmation",
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
        "Delete this post?"
      )),
      /* @__PURE__ */ React.createElement(
        "p",
        {
          style: {
            fontFamily: MONO,
            fontSize: "0.76rem",
            color: THEME.textMuted,
            margin: "0 0 18px",
            lineHeight: 1.7
          }
        },
        "The post and all of its comments will be permanently removed. This cannot be undone."
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
const mapComments = (comments, fn) => comments.map((c) => {
  const updated = fn(c) || c;
  return { ...updated, replies: mapComments(updated.replies || [], fn) };
});
const filterComments = (comments, pred) => comments.filter(pred).map((c) => ({ ...c, replies: filterComments(c.replies || [], pred) }));
const countComments = (comments) => comments.reduce(
  (acc, c) => acc + 1 + countComments(c.replies || []),
  0
);
const findComment = (comments, id) => {
  for (const c of comments) {
    if (c.id === id) return c;
    const hit = findComment(c.replies || [], id);
    if (hit) return hit;
  }
  return null;
};
const sortComments = (comments, mode) => [...comments].sort(
  (a, b) => mode === "new" ? new Date(b.createdAt) - new Date(a.createdAt) : b.score - a.score
).map((c) => ({ ...c, replies: sortComments(c.replies || [], mode) }));
const searchComments = (comments, q) => comments.map((c) => ({ ...c, replies: searchComments(c.replies || [], q) })).filter(
  (c) => c.body.toLowerCase().includes(q) || c.replies.length > 0
);
function PostDetailPage({ postId, onNavigate }) {
  const { user, token, logout } = useAuth();
  const { distros } = useDistros();
  const distroMap = useMemo(
    () => Object.fromEntries(distros.map((d) => [d.id, d])),
    [distros]
  );
  const [initialPost] = useState(() => peekPost(postId) ?? peekStalePost(postId));
  const [post, setPost] = useState(initialPost?.post || null);
  const [comments, setComments] = useState(initialPost?.comments || []);
  const [loading, setLoading] = useState(!initialPost);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [savingPost, setSavingPost] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [commentSort, setCommentSort] = useState("best");
  const [commentSearch, setCommentSearch] = useState("");
  const [shared, setShared] = useState(false);
  const shareTimer = useRef(null);
  const [votingPost, setVotingPost] = useState(false);
  const [votingCommentIds, setVotingCommentIds] = useState(() => /* @__PURE__ */ new Set());
  const [channelStats, setChannelStats] = useState(null);
  const components = useMarkdownComponents();
  const visibleComments = useMemo(() => {
    let list = comments;
    const q = commentSearch.trim().toLowerCase();
    if (q) list = searchComments(list, q);
    list = sortComments(list, commentSort);
    return list;
  }, [comments, commentSort, commentSearch]);
  const load = useCallback(async () => {
    const cached = peekPost(postId) ?? peekStalePost(postId);
    if (cached) {
      setPost(cached.post);
      setComments(cached.comments || []);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await getPost(postId);
      setPost(data.post);
      setComments(data.comments || []);
    } catch (err) {
      if (err.status === 401) {
        logout();
        return;
      }
      setError(err.message || "Could not load this post.");
    } finally {
      setLoading(false);
    }
  }, [postId, logout]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (!post?.channel) return;
    const cachedStats = peekChannelStats(post.channel) ?? peekStaleChannelStats(post.channel);
    if (cachedStats) setChannelStats(cachedStats);
    let cancelled = false;
    getChannelStats(post.channel).then((s) => !cancelled && setChannelStats(s)).catch(() => {
    });
    return () => {
      cancelled = true;
    };
  }, [post?.channel]);
  const handleVote = async (value) => {
    if (!post || votingPost) return;
    const prevScore = post.score;
    const prevVote = post.userVote;
    setVotingPost(true);
    setPost({ ...post, score: prevScore + (value - prevVote), userVote: value });
    try {
      const data = await votePost(post.id, value);
      setPost(
        (p) => p && p.id === post.id ? { ...p, score: data.score, userVote: data.userVote } : p
      );
    } catch (err) {
      if (err.status === 401) {
        logout();
        return;
      }
      setPost((p) => p ? { ...p, score: prevScore, userVote: prevVote } : p);
      setError(err.message || "Vote failed. Please try again.");
    } finally {
      setVotingPost(false);
    }
  };
  const handleSavePost = async ({ title, body, linkUrl }) => {
    setSavingPost(true);
    try {
      const data = await updatePost(postId, { title, body, linkUrl });
      setPost(data);
      setEditing(false);
    } catch (err) {
      if (err.status === 401) {
        logout();
        return;
      }
      setError(err.message || "Could not save your changes.");
    } finally {
      setSavingPost(false);
    }
  };
  const handleDeletePost = async () => {
    setDeleting(true);
    try {
      await deletePost(postId);
    } catch (err) {
      if (err.status === 401) {
        logout();
        return;
      }
    }
    onNavigate?.("/community");
  };
  const handleAddComment = async () => {
    const body = commentDraft.trim();
    if (!body || postingComment) return;
    setPostingComment(true);
    setError(null);
    const optimistic = {
      id: `optimistic-${Date.now()}`,
      postId,
      parentId: null,
      body,
      score: 0,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      author: { id: user?.id, name: user?.name || "you" },
      userVote: 0,
      replies: [],
      optimistic: true
    };
    setComments((prev) => [...prev, optimistic]);
    setCommentDraft("");
    try {
      const created = await addComment(postId, { body });
      setComments((prev) => prev.map((c) => c.id === optimistic.id ? created : c));
    } catch (err) {
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      setCommentDraft((d) => d || body);
      if (err.status === 401) {
        logout();
        return;
      }
      setError(err.message || "Could not post your comment.");
    } finally {
      setPostingComment(false);
    }
  };
  const handleReply = async (body, parentId) => {
    setError(null);
    const optimistic = {
      id: `optimistic-${Date.now()}`,
      postId,
      parentId,
      body,
      score: 0,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      author: { id: user?.id, name: user?.name || "you" },
      userVote: 0,
      replies: [],
      optimistic: true
    };
    setComments(
      (prev) => mapComments(
        prev,
        (c) => c.id === parentId ? { ...c, replies: [...c.replies || [], optimistic] } : c
      )
    );
    try {
      const created = await addComment(postId, { body, parentId });
      setComments(
        (prev) => mapComments(
          prev,
          (c) => c.id === parentId ? {
            ...c,
            replies: (c.replies || []).map(
              (r) => r.id === optimistic.id ? created : r
            )
          } : c
        )
      );
    } catch (err) {
      setComments(
        (prev) => mapComments(
          prev,
          (c) => c.id === parentId ? { ...c, replies: (c.replies || []).filter((r) => r.id !== optimistic.id) } : c
        )
      );
      if (err.status === 401) {
        logout();
        return;
      }
      setError(err.message || "Could not post your reply.");
    }
  };
  const handleCommentVote = async (commentId, value) => {
    if (votingCommentIds.has(commentId)) return;
    const target = findComment(comments, commentId);
    if (!target) return;
    const prevScore = target.score;
    const prevVote = target.userVote;
    setVotingCommentIds((prev) => new Set(prev).add(commentId));
    setComments(
      (prev) => mapComments(
        prev,
        (c) => c.id === commentId ? { ...c, score: prevScore + (value - prevVote), userVote: value } : c
      )
    );
    try {
      const data = await voteComment(commentId, value);
      setComments(
        (prev) => mapComments(
          prev,
          (c) => c.id === commentId ? { ...c, score: data.score, userVote: data.userVote } : c
        )
      );
    } catch (err) {
      setComments(
        (prev) => mapComments(
          prev,
          (c) => c.id === commentId ? { ...c, score: prevScore, userVote: prevVote } : c
        )
      );
      if (err.status === 401) {
        logout();
        return;
      }
      setError(err.message || "Vote failed. Please try again.");
    } finally {
      setVotingCommentIds((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }
  };
  const handleEditComment = async (commentId, body) => {
    try {
      const data = await updateComment(commentId, body);
      setComments(
        (prev) => mapComments(prev, (c) => c.id === commentId ? { ...c, ...data } : c)
      );
    } catch (err) {
      if (err.status === 401) {
        logout();
        return;
      }
      setError(err.message || "Could not update the comment.");
    }
  };
  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
    } catch (err) {
      if (err.status === 401) {
        logout();
        return;
      }
    }
    setComments((prev) => filterComments(prev, (c) => c.id !== commentId));
  };
  if (!token) {
    return /* @__PURE__ */ React.createElement(AuthPage, { onAuthSuccess: () => onNavigate?.(`/community/${postId}`), onNavigate });
  }
  const isOwner = post && user && post.author?.id === user.id;
  const distro = post ? distroMap[post.channel] : null;
  const channelItems = useMemo(
    () => [
      { key: "general", label: "General" },
      ...distros.map((d) => ({ key: d.id, label: d.name, distro: d }))
    ],
    [distros]
  );
  const hostname = (() => {
    if (!post?.linkUrl) return null;
    try {
      return new URL(post.linkUrl).hostname.replace(/^www\./, "");
    } catch {
      return post.linkUrl;
    }
  })();
  const commentTotal = countComments(comments);
  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/community/${postId}`).catch(() => {
    });
    setShared(true);
    clearTimeout(shareTimer.current);
    shareTimer.current = setTimeout(() => setShared(false), 1500);
  };
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    CommunityShell,
    {
      nav: /* @__PURE__ */ React.createElement(
        CommunityNav,
        {
          distros,
          channel: post?.channel || "all",
          onNavigate,
          onChannel: (k) => onNavigate?.("/community"),
          onCreatePost: () => onNavigate?.("/community")
        }
      ),
      rail: post ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(AboutChannel, { channel: post.channel, distro, stats: channelStats })) : null,
      mobileBar: /* @__PURE__ */ React.createElement(
        MobileChannelBar,
        {
          items: channelItems,
          active: post?.channel,
          onChannel: () => onNavigate?.("/community"),
          onCreatePost: () => onNavigate?.("/community")
        }
      )
    },
    /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between", style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => onNavigate?.("/community"),
        title: "Back to Community",
        className: "inline-flex items-center justify-center transition-colors",
        style: {
          width: 36,
          height: 36,
          borderRadius: 9999,
          border: `1px solid ${LINE}`,
          background: "rgba(255,255,255,0.04)",
          color: THEME.textMuted,
          cursor: "pointer"
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.color = THEME.textMain;
          e.currentTarget.style.background = "rgba(255,255,255,0.08)";
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.color = THEME.textMuted;
          e.currentTarget.style.background = "rgba(255,255,255,0.04)";
        }
      },
      /* @__PURE__ */ React.createElement(ArrowLeft, { size: 16 })
    ), /* @__PURE__ */ React.createElement(NotificationBell, { onOpenPost: (id) => id !== postId && onNavigate?.(`/community/${id}`) })),
    loading ? /* @__PURE__ */ React.createElement(PostDetailSkeleton, null) : error && !post ? /* @__PURE__ */ React.createElement(
      "p",
      {
        style: {
          fontFamily: MONO,
          fontSize: "0.78rem",
          color: THEME.accent,
          textAlign: "center",
          padding: "48px 0"
        }
      },
      error
    ) : post ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("article", { style: { borderBottom: `1px solid ${LINE}`, paddingBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center", style: { gap: 10, marginBottom: 12 } }, /* @__PURE__ */ React.createElement(ChannelAvatar, { channel: post.channel, distro, size: 36 }), /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          fontFamily: MONO,
          fontSize: "0.78rem",
          fontWeight: 700,
          color: THEME.textMain
        }
      },
      "d/",
      post.channel === "general" ? "General" : post.channel
    ), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: MONO, fontSize: "0.66rem", color: THEME.silver } }, "u/", post.author?.name || "unknown", " \xB7 ", timeAgo(post.createdAt), post.updatedAt && post.updatedAt !== post.createdAt ? ` \xB7 edited ${timeAgo(post.updatedAt)}` : ""))), editing ? /* @__PURE__ */ React.createElement(
      EditPostForm,
      {
        post,
        saving: savingPost,
        onSave: handleSavePost,
        onCancel: () => setEditing(false)
      }
    ) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
      "h1",
      {
        style: {
          fontFamily: MONO,
          fontSize: "1.28rem",
          fontWeight: 800,
          color: THEME.textMain,
          margin: 0,
          lineHeight: 1.4,
          overflowWrap: "anywhere"
        }
      },
      post.title
    ), post.linkUrl && hostname && /* @__PURE__ */ React.createElement(
      "a",
      {
        href: post.linkUrl,
        target: "_blank",
        rel: "noreferrer",
        className: "inline-flex items-center transition-colors",
        style: {
          marginTop: 8,
          gap: 5,
          fontFamily: MONO,
          fontSize: "0.74rem",
          color: THEME.accent,
          textDecoration: "none",
          overflowWrap: "anywhere"
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.textDecoration = "underline";
          e.currentTarget.style.textUnderlineOffset = 2;
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.textDecoration = "none";
        }
      },
      /* @__PURE__ */ React.createElement(ExternalLink, { size: 12 }),
      post.linkUrl
    ), post.body && /* @__PURE__ */ React.createElement("div", { className: "dp-md", style: { marginTop: 12 } }, /* @__PURE__ */ React.createElement(ReactMarkdown, { remarkPlugins: [remarkGfm], components }, post.body))), !editing && /* @__PURE__ */ React.createElement("div", { className: "flex items-center flex-wrap", style: { gap: 8, marginTop: 16 } }, /* @__PURE__ */ React.createElement(
      VotePill,
      {
        score: post.score,
        userVote: post.userVote,
        onVote: handleVote,
        size: 17,
        disabled: votingPost
      }
    ), /* @__PURE__ */ React.createElement(
      RowAction,
      {
        icon: /* @__PURE__ */ React.createElement(MessageSquare, { size: 14 }),
        label: `${commentTotal} ${commentTotal === 1 ? "comment" : "comments"}`,
        onClick: () => document.getElementById("community-comments")?.scrollIntoView({ behavior: "smooth" })
      }
    ), /* @__PURE__ */ React.createElement(
      RowAction,
      {
        icon: shared ? /* @__PURE__ */ React.createElement(Check, { size: 14 }) : /* @__PURE__ */ React.createElement(Share2, { size: 14 }),
        label: shared ? "Copied" : "Share",
        onClick: handleShare
      }
    ), isOwner && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
      RowAction,
      {
        icon: /* @__PURE__ */ React.createElement(Pencil, { size: 13 }),
        label: "Edit",
        onClick: () => setEditing(true)
      }
    ), /* @__PURE__ */ React.createElement(
      RowAction,
      {
        icon: /* @__PURE__ */ React.createElement(Trash2, { size: 13 }),
        label: "Delete",
        danger: true,
        onClick: () => setConfirmDelete(true)
      }
    )), !isOwner && post?.id && /* @__PURE__ */ React.createElement(ReportButton, { targetType: "post", targetId: post.id }))), /* @__PURE__ */ React.createElement("section", { id: "community-comments", style: { marginTop: 24 } }, /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          border: `1px solid ${commentDraft ? `${THEME.accent}55` : LINE}`,
          borderRadius: commentDraft ? 16 : 9999,
          transition: "border-color 0.2s ease, border-radius 0.2s ease",
          background: "rgba(20, 24, 32, 0.45)",
          overflow: "hidden"
        }
      },
      /* @__PURE__ */ React.createElement(
        "textarea",
        {
          value: commentDraft,
          onChange: (e) => setCommentDraft(e.target.value),
          rows: commentDraft ? 3 : 1,
          placeholder: "Join the conversation",
          style: {
            width: "100%",
            boxSizing: "border-box",
            display: "block",
            resize: "none",
            background: "transparent",
            border: "none",
            borderRadius: 0,
            outline: "none",
            padding: commentDraft ? "12px 16px" : "10px 18px",
            fontFamily: MONO,
            fontSize: "0.8rem",
            lineHeight: 1.6,
            color: THEME.textMain
          }
        }
      )
    ), commentDraft && /* @__PURE__ */ React.createElement("div", { className: "flex items-center", style: { gap: 8, marginTop: 8 } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleAddComment,
        disabled: postingComment,
        className: "inline-flex items-center transition-all",
        style: {
          gap: 6,
          fontFamily: MONO,
          fontSize: "0.74rem",
          fontWeight: 700,
          color: "#fff",
          background: `linear-gradient(135deg, ${THEME.accent} 0%, #b83d25 100%)`,
          border: "1px solid rgba(255,255,255,0.25)",
          borderRadius: 9999,
          padding: "6px 16px",
          cursor: postingComment ? "wait" : "pointer",
          opacity: postingComment ? 0.7 : 1
        }
      },
      postingComment && /* @__PURE__ */ React.createElement(Loader2, { size: 12, className: "animate-spin" }),
      "Comment"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setCommentDraft(""),
        className: "inline-flex items-center transition-colors",
        style: {
          gap: 4,
          fontFamily: MONO,
          fontSize: "0.7rem",
          color: THEME.textMuted,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px 6px"
        }
      },
      /* @__PURE__ */ React.createElement(X, { size: 12 }),
      "Clear"
    )), commentTotal > 3 && /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "flex flex-wrap items-center",
        style: { gap: 8, margin: "20px 0 12px" }
      },
      /* @__PURE__ */ React.createElement(
        "span",
        {
          style: {
            fontFamily: MONO,
            fontSize: "0.7rem",
            color: THEME.textMuted
          }
        },
        "Sort by:"
      ),
      [
        { key: "best", label: "Best" },
        { key: "new", label: "New" }
      ].map((s) => {
        const active = commentSort === s.key;
        return /* @__PURE__ */ React.createElement(
          "button",
          {
            key: s.key,
            type: "button",
            onClick: () => setCommentSort(s.key),
            className: "rounded-full font-mono transition-all shrink-0",
            style: {
              fontFamily: MONO,
              fontSize: "0.68rem",
              fontWeight: 700,
              padding: "3px 11px",
              background: active ? "rgba(224, 90, 56, 0.16)" : "transparent",
              color: active ? THEME.accent : THEME.textMuted,
              border: active ? "1px solid rgba(224, 90, 56, 0.45)" : `1px solid ${LINE}`,
              cursor: "pointer"
            }
          },
          s.label
        );
      }),
      /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 4 } }),
      /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "flex items-center",
          style: {
            flex: "1 1 150px",
            minWidth: 140,
            maxWidth: 280,
            background: "rgba(20, 24, 32, 0.55)",
            border: `1px solid ${LINE}`,
            borderRadius: 9999,
            padding: "4px 12px",
            gap: 8
          }
        },
        /* @__PURE__ */ React.createElement(Search, { size: 13, style: { color: THEME.textMuted, flexShrink: 0 } }),
        /* @__PURE__ */ React.createElement(
          "input",
          {
            type: "text",
            value: commentSearch,
            onChange: (e) => setCommentSearch(e.target.value),
            placeholder: "Search comments",
            style: {
              flex: 1,
              minWidth: 0,
              background: "transparent",
              border: "none",
              outline: "none",
              fontFamily: MONO,
              fontSize: "0.72rem",
              color: THEME.textMain
            }
          }
        ),
        commentSearch && /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => setCommentSearch(""),
            style: {
              background: "none",
              border: "none",
              color: THEME.textMuted,
              cursor: "pointer",
              padding: 0,
              display: "flex"
            }
          },
          /* @__PURE__ */ React.createElement(X, { size: 12 })
        )
      )
    ), /* @__PURE__ */ React.createElement("div", { className: "flex items-center", style: { gap: 8, marginBottom: 8 } }, /* @__PURE__ */ React.createElement(MessageSquare, { size: 14, style: { color: THEME.textMuted } }), /* @__PURE__ */ React.createElement(
      "h2",
      {
        style: {
          fontFamily: MONO,
          fontSize: "0.84rem",
          fontWeight: 800,
          color: THEME.textMain,
          margin: 0
        }
      },
      commentTotal,
      " ",
      commentTotal === 1 ? "comment" : "comments"
    )), error && /* @__PURE__ */ React.createElement(
      "p",
      {
        style: {
          fontFamily: MONO,
          fontSize: "0.72rem",
          color: THEME.accent,
          textAlign: "center",
          margin: "0 0 12px"
        }
      },
      error
    ), visibleComments.length === 0 ? /* @__PURE__ */ React.createElement(
      "p",
      {
        style: {
          fontFamily: MONO,
          fontSize: "0.76rem",
          color: THEME.textMuted,
          textAlign: "center",
          padding: "20px 0"
        }
      },
      commentSearch.trim() ? "No comments match your search." : "No comments yet \u2014 be the first."
    ) : visibleComments.map((c) => /* @__PURE__ */ React.createElement(
      CommentItem,
      {
        key: c.id,
        comment: c,
        user,
        onVote: handleCommentVote,
        onReply: handleReply,
        onEdit: handleEditComment,
        onDelete: handleDeleteComment,
        voteDisabled: votingCommentIds.has(c.id)
      }
    )))) : null
  ), confirmDelete && /* @__PURE__ */ React.createElement(
    DeletePostDialog,
    {
      deleting,
      onCancel: () => setConfirmDelete(false),
      onConfirm: handleDeletePost
    }
  ));
}
export {
  PostDetailPage as default
};
