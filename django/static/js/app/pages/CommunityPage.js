import React, { useCallback, useEffect, useMemo, useRef, useState } from "dp/core/react.js";
import { Search, Loader2 } from "dp/core/icons.js";
import AuthPage from "./AuthPage.js";
import { useAuth } from "../hooks/useAuth.js";
import { useDistros } from "../hooks/useDistros.js";
import { THEME, LINE, LINE_SOFT, MONO } from "../theme/designTokens.js";
import PostCard from "../components/community/PostCard.js";
import NotificationBell from "../components/community/NotificationBell.js";
import CommunityShell from "../components/community/CommunityShell.js";
import { RailCard } from "../components/community/CommunityShell.js";
import { CommunityFeedSkeleton } from "../components/Skeleton.js";
import CommunityNav from "../components/community/CommunityNav.js";
import { MobileChannelBar } from "../components/community/CommunityNav.js";
import {
  RecentPosts
} from "../components/community/CommunitySidebar.js";
import { listPosts, createPost, votePost, suggestChannel, peekPosts, peekStalePosts } from "../services/communityApi.js";
const GLASS = {
  background: "rgba(28, 34, 41, 0.55)",
  backdropFilter: "blur(28px) saturate(170%)",
  WebkitBackdropFilter: "blur(28px) saturate(170%)",
  border: `1px solid ${LINE}`
};
const SORTS = [
  { key: "hot", label: "Hot" },
  { key: "new", label: "New" },
  { key: "top", label: "Top" }
];
const PAGE_SIZE = 10;
function Composer({ distros, defaultChannel, posting, onPost, onCancel }) {
  const [channel, setChannel] = useState(defaultChannel === "all" ? "general" : defaultChannel);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [showLink, setShowLink] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [suggesting, setSuggesting] = useState(false);
  useEffect(() => {
    setChannel(defaultChannel === "all" ? "general" : defaultChannel);
  }, [defaultChannel]);
  const titleValid = title.trim().length >= 3;
  const handleSubmit = () => {
    if (!titleValid) {
      setLocalError("Title is required (at least 3 characters).");
      return;
    }
    if (linkUrl.trim() && !/^https?:\/\//i.test(linkUrl.trim())) {
      setLocalError("Link URL must start with http:// or https://");
      return;
    }
    setLocalError(null);
    onPost({
      channel,
      title: title.trim(),
      body: body.trim() || void 0,
      linkUrl: linkUrl.trim() || void 0
    });
  };
  const handleSuggest = async () => {
    if (suggesting || title.trim().length < 3) return;
    setSuggesting(true);
    setSuggestion(null);
    setLocalError(null);
    try {
      const result = await suggestChannel({ title: title.trim(), body: body.trim() });
      setSuggestion(result);
    } catch (err) {
      setLocalError(err.message || "Channel suggestion failed.");
    } finally {
      setSuggesting(false);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "dp-fade", style: { ...GLASS, borderRadius: 18, padding: 16, marginBottom: 18 } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      value: title,
      onChange: (e) => setTitle(e.target.value),
      placeholder: "Post title",
      maxLength: 200,
      style: {
        width: "100%",
        boxSizing: "border-box",
        fontFamily: MONO,
        fontSize: "0.88rem",
        fontWeight: 700,
        color: THEME.textMain,
        background: "rgba(20, 24, 32, 0.6)",
        border: `1px solid ${LINE}`,
        borderRadius: 10,
        padding: "10px 12px",
        outline: "none",
        marginBottom: 10
      }
    }
  ), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      value: body,
      onChange: (e) => setBody(e.target.value),
      placeholder: "What do you want to share? (optional \u2014 markdown works)",
      rows: 4,
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
        marginBottom: 10
      }
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center", style: { gap: 8 } }, /* @__PURE__ */ React.createElement(
    "select",
    {
      value: channel,
      onChange: (e) => setChannel(e.target.value),
      style: {
        fontFamily: MONO,
        fontSize: "0.74rem",
        color: THEME.textMain,
        background: "rgba(20, 24, 32, 0.6)",
        border: `1px solid ${LINE}`,
        borderRadius: 9999,
        padding: "6px 10px",
        outline: "none",
        cursor: "pointer"
      }
    },
    /* @__PURE__ */ React.createElement("option", { value: "general" }, "General"),
    distros.map((d) => /* @__PURE__ */ React.createElement("option", { key: d.id, value: d.id }, d.name))
  ), !showLink && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setShowLink(true),
      className: "transition-colors",
      style: {
        fontFamily: MONO,
        fontSize: "0.72rem",
        color: THEME.textMuted,
        background: "none",
        border: `1px dashed ${LINE}`,
        borderRadius: 9999,
        padding: "6px 12px",
        cursor: "pointer"
      },
      onMouseEnter: (e) => {
        e.currentTarget.style.color = THEME.textMain;
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.color = THEME.textMuted;
      }
    },
    "+ Add link"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: handleSuggest,
      disabled: suggesting || title.trim().length < 3,
      className: "transition-colors",
      style: {
        fontFamily: MONO,
        fontSize: "0.72rem",
        color: THEME.accent,
        background: "none",
        border: `1px dashed ${THEME.accent}66`,
        borderRadius: 9999,
        padding: "6px 12px",
        cursor: suggesting || title.trim().length < 3 ? "not-allowed" : "pointer",
        opacity: suggesting || title.trim().length < 3 ? 0.55 : 1
      }
    },
    suggesting ? "Suggesting\u2026" : "\u2728 Suggest channel"
  ), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }), /* @__PURE__ */ React.createElement(
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
      onClick: handleSubmit,
      disabled: posting || !titleValid,
      className: "transition-all",
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: MONO,
        fontSize: "0.76rem",
        fontWeight: 700,
        color: "#fff",
        background: `linear-gradient(135deg, ${THEME.accent} 0%, #b83d25 100%)`,
        border: "1px solid rgba(255,255,255,0.25)",
        borderRadius: 9999,
        padding: "7px 18px",
        cursor: posting || !titleValid ? "not-allowed" : "pointer",
        opacity: posting || !titleValid ? 0.55 : 1,
        boxShadow: `0 2px 14px ${THEME.accent}55`
      }
    },
    posting && /* @__PURE__ */ React.createElement(Loader2, { size: 13, className: "animate-spin" }),
    "Post"
  )), showLink && /* @__PURE__ */ React.createElement(
    "input",
    {
      value: linkUrl,
      onChange: (e) => setLinkUrl(e.target.value),
      placeholder: "Link URL (https://\u2026)",
      autoFocus: true,
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
        marginTop: 10
      }
    }
  ), suggestion && /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "flex flex-wrap items-center",
      style: {
        gap: 8,
        marginTop: 10,
        fontFamily: MONO,
        fontSize: "0.72rem",
        color: THEME.textMuted
      }
    },
    /* @__PURE__ */ React.createElement("span", null, "Suggested: ", /* @__PURE__ */ React.createElement("span", { style: { color: THEME.textMain, fontWeight: 700 } }, "d/", suggestion.channel), typeof suggestion.confidence === "number" ? ` (${Math.round(suggestion.confidence * 100)}%)` : ""),
    suggestion.channel !== channel && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          setChannel(suggestion.channel);
          setSuggestion(null);
        },
        style: {
          fontFamily: MONO,
          fontSize: "0.7rem",
          fontWeight: 700,
          color: "#fff",
          background: `linear-gradient(135deg, ${THEME.accent} 0%, #b83d25 100%)`,
          border: "1px solid rgba(255,255,255,0.25)",
          borderRadius: 9999,
          padding: "4px 12px",
          cursor: "pointer"
        }
      },
      "Use it"
    )
  ), localError && /* @__PURE__ */ React.createElement(
    "p",
    {
      style: {
        margin: "10px 0 0",
        fontFamily: MONO,
        fontSize: "0.7rem",
        color: THEME.accent
      }
    },
    localError
  ));
}
function CommunityPage({ onNavigate }) {
  const { token, logout } = useAuth();
  const { distros } = useDistros();
  const distroMap = useMemo(
    () => Object.fromEntries(distros.map((d) => [d.id, d])),
    [distros]
  );
  const [channel, setChannel] = useState("all");
  const [sort, setSort] = useState("hot");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [initialFeed] = useState(
    () => peekPosts({ channel: "all", sort: "hot", search: "", page: 1, limit: PAGE_SIZE }) ?? peekStalePosts({ channel: "all", sort: "hot", search: "", page: 1, limit: PAGE_SIZE })
  );
  const [posts, setPosts] = useState(initialFeed?.posts || []);
  const [page, setPage] = useState(initialFeed?.page || 1);
  const [hasMore, setHasMore] = useState(Boolean(initialFeed?.hasMore));
  const [loading, setLoading] = useState(!initialFeed);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  const [votingIds, setVotingIds] = useState(() => /* @__PURE__ */ new Set());
  const requestIdRef = useRef(0);
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);
  const fetchPage = useCallback(
    async (targetPage, { append = false } = {}) => {
      const reqId = ++requestIdRef.current;
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      try {
        const data = await listPosts({ channel, sort, search, page: targetPage, limit: PAGE_SIZE });
        if (reqId !== requestIdRef.current) return;
        setPosts((prev) => append ? [...prev, ...data.posts || []] : data.posts || []);
        setPage(data.page || targetPage);
        setHasMore(Boolean(data.hasMore));
      } catch (err) {
        if (reqId !== requestIdRef.current) return;
        if (err.status === 401) {
          logout();
          return;
        }
        setError(err.message || "Could not load the community feed.");
      } finally {
        if (reqId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [channel, sort, search, logout]
  );
  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);
  const sentinelRef = useRef(null);
  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          fetchPage(page + 1, { append: true });
        }
      },
      { rootMargin: "600px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, loadingMore, page, fetchPage]);
  const handleVote = async (post, value) => {
    if (votingIds.has(post.id)) return;
    const prevVote = posts.find((p) => p.id === post.id)?.userVote ?? post.userVote;
    const prevScore = posts.find((p) => p.id === post.id)?.score ?? post.score;
    setPosts(
      (prev) => prev.map(
        (p) => p.id === post.id ? { ...p, score: (p.score ?? 0) + (value - (p.userVote ?? 0)), userVote: value } : p
      )
    );
    setVotingIds((prev) => new Set(prev).add(post.id));
    try {
      const data = await votePost(post.id, value);
      setPosts(
        (prev) => prev.map(
          (p) => p.id === post.id ? { ...p, score: data.score, userVote: data.userVote } : p
        )
      );
    } catch (err) {
      if (err.status === 401) {
        logout();
        return;
      }
      setPosts(
        (prev) => prev.map(
          (p) => p.id === post.id ? { ...p, score: prevScore, userVote: prevVote } : p
        )
      );
      setError(err.message || "Vote failed. Please try again.");
    } finally {
      setVotingIds((prev) => {
        const next = new Set(prev);
        next.delete(post.id);
        return next;
      });
    }
  };
  const handleCreate = async ({ channel: ch, title, body, linkUrl }) => {
    setPosting(true);
    setError(null);
    try {
      await createPost({ channel: ch, title, body, linkUrl });
      setComposerOpen(false);
      await fetchPage(1);
    } catch (err) {
      if (err.status === 401) {
        logout();
        return;
      }
      setError(err.message || "Could not publish your post.");
    } finally {
      setPosting(false);
    }
  };
  const handleDeletePost = async (post) => {
    onNavigate?.(`/community/${post.id}`);
  };
  if (!token) {
    return /* @__PURE__ */ React.createElement(AuthPage, { onAuthSuccess: () => onNavigate?.("/community"), onNavigate });
  }
  const activeChannelLabel = channel === "all" ? null : channel === "general" ? "General" : distroMap[channel]?.name;
  const channelItems = useMemo(
    () => [
      { key: "all", label: "All" },
      { key: "general", label: "General" },
      ...distros.map((d) => ({ key: d.id, label: d.name, distro: d }))
    ],
    [distros]
  );
  return /* @__PURE__ */ React.createElement(
    CommunityShell,
    {
      nav: /* @__PURE__ */ React.createElement(
        CommunityNav,
        {
          distros,
          channel,
          onNavigate,
          onChannel: (k) => setChannel(k),
          onCreatePost: () => setComposerOpen(true)
        }
      ),
      rail: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(RecentPosts, { onOpen: (p) => onNavigate?.(`/community/${p.id}`) })),
      mobileBar: /* @__PURE__ */ React.createElement(
        MobileChannelBar,
        {
          items: channelItems,
          active: channel,
          onChannel: (k) => setChannel(k),
          onCreatePost: () => setComposerOpen(true)
        }
      )
    },
    activeChannelLabel && /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          fontFamily: MONO,
          fontSize: "0.7rem",
          color: THEME.textMuted,
          margin: "2px 0 10px"
        }
      },
      "Browsing channel: ",
      /* @__PURE__ */ React.createElement("span", { style: { color: THEME.textMain } }, activeChannelLabel)
    ),
    composerOpen && /* @__PURE__ */ React.createElement(
      Composer,
      {
        distros,
        defaultChannel: channel,
        posting,
        onPost: handleCreate,
        onCancel: () => setComposerOpen(false)
      }
    ),
    /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center", style: { gap: 8, marginBottom: 14 } }, SORTS.map((s) => {
      const active = sort === s.key;
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: s.key,
          type: "button",
          onClick: () => setSort(s.key),
          className: "rounded-full font-mono transition-all duration-200 shrink-0",
          style: {
            fontFamily: MONO,
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.04em",
            padding: "4px 12px",
            background: active ? "rgba(224, 90, 56, 0.16)" : "transparent",
            color: active ? THEME.accent : THEME.textMuted,
            border: active ? `1px solid rgba(224, 90, 56, 0.45)` : `1px solid ${LINE}`,
            cursor: "pointer"
          }
        },
        s.label
      );
    }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 4 } }), /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "flex items-center",
        style: {
          flex: "1 1 150px",
          minWidth: 140,
          maxWidth: 300,
          background: "rgba(20, 24, 32, 0.55)",
          border: `1px solid ${LINE}`,
          borderRadius: 9999,
          padding: "5px 12px",
          gap: 8
        }
      },
      /* @__PURE__ */ React.createElement(Search, { size: 14, style: { color: THEME.textMuted, flexShrink: 0 } }),
      /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "text",
          value: searchInput,
          onChange: (e) => setSearchInput(e.target.value),
          placeholder: "Search posts\u2026",
          style: {
            flex: 1,
            minWidth: 0,
            background: "transparent",
            border: "none",
            outline: "none",
            fontFamily: MONO,
            fontSize: "0.76rem",
            color: THEME.textMain
          }
        }
      )
    ), /* @__PURE__ */ React.createElement(NotificationBell, { onOpenPost: (id) => onNavigate?.(`/community/${id}`) })),
    error && /* @__PURE__ */ React.createElement(
      "p",
      {
        style: {
          fontFamily: MONO,
          fontSize: "0.72rem",
          color: THEME.accent,
          textAlign: "center",
          margin: "0 0 14px"
        }
      },
      error
    ),
    /* @__PURE__ */ React.createElement("div", { style: { ...GLASS, borderRadius: 18, padding: "6px 18px 6px", overflow: "hidden" } }, loading ? /* @__PURE__ */ React.createElement(CommunityFeedSkeleton, { count: 4 }) : posts.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { padding: "42px 16px", textAlign: "center" } }, /* @__PURE__ */ React.createElement(
      "p",
      {
        style: {
          fontFamily: MONO,
          fontSize: "0.88rem",
          fontWeight: 700,
          color: THEME.textMain,
          margin: "0 0 6px"
        }
      },
      "No posts yet \u2014 start the conversation"
    ), /* @__PURE__ */ React.createElement(
      "p",
      {
        style: {
          fontFamily: MONO,
          fontSize: "0.72rem",
          color: THEME.textMuted,
          margin: 0
        }
      },
      "Hit \u201CCreate post\u201D to publish the first one."
    )) : posts.map((post, i) => /* @__PURE__ */ React.createElement(
      PostCard,
      {
        key: post.id,
        post,
        distro: distroMap[post.channel],
        onOpen: (p) => onNavigate?.(`/community/${p.id}`),
        onVote: (value) => handleVote(post, value),
        isOwner: false,
        onDelete: handleDeletePost,
        hideDivider: i === posts.length - 1,
        voteDisabled: votingIds.has(post.id)
      }
    ))),
    hasMore && !loading && /* @__PURE__ */ React.createElement("div", { ref: sentinelRef, "aria-hidden": "true", style: { height: 1 } }),
    hasMore && !loading && /* @__PURE__ */ React.createElement("div", { className: "flex justify-center", style: { marginTop: 20 } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => fetchPage(page + 1, { append: true }),
        disabled: loadingMore,
        className: "transition-all",
        style: {
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontFamily: MONO,
          fontSize: "0.76rem",
          fontWeight: 700,
          color: THEME.textMain,
          background: "rgba(255, 255, 255, 0.06)",
          border: `1px solid ${LINE_SOFT}`,
          borderRadius: 9999,
          padding: "8px 22px",
          cursor: loadingMore ? "wait" : "pointer",
          opacity: loadingMore ? 0.6 : 1
        }
      },
      loadingMore && /* @__PURE__ */ React.createElement(Loader2, { size: 13, className: "animate-spin" }),
      loadingMore ? "Loading\u2026" : "Load more"
    ))
  );
}
export {
  CommunityPage as default
};
