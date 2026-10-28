import React, { useEffect, useState } from "dp/core/react.js";
import { Globe, Lock, FileText } from "dp/core/icons.js";
import { THEME, LINE, MONO } from "../../theme/designTokens.js";
import { RailCard } from "./CommunityShell.js";
import { RailListSkeleton } from "../Skeleton.js";
import { ChannelAvatar } from "./Avatar.js";
import { timeAgo } from "../../utils/timeAgo.js";
import { listPosts, getChannelStats, peekChannelStats, peekStaleChannelStats, peekPosts, peekStalePosts } from "../../services/communityApi.js";
const railText = { fontFamily: MONO, fontSize: "0.72rem", color: THEME.silver, lineHeight: 1.6 };
function AboutCommunity() {
  const [stats, setStats] = useState(() => peekChannelStats("all") ?? peekStaleChannelStats("all"));
  useEffect(() => {
    let cancelled = false;
    getChannelStats("all").then((s) => !cancelled && setStats(s)).catch(() => {
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return /* @__PURE__ */ React.createElement(RailCard, { label: "Community" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, alignItems: "center", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, textAlign: "center" } }, /* @__PURE__ */ React.createElement(
    "div",
    {
      style: {
        fontFamily: MONO,
        fontSize: "1.1rem",
        fontWeight: 800,
        color: THEME.textMain
      }
    },
    stats ? stats.posts : "\u2014"
  ), /* @__PURE__ */ React.createElement("div", { style: { ...railText, fontSize: "0.62rem" } }, "posts")), /* @__PURE__ */ React.createElement("div", { style: { width: 1, height: 30, background: LINE } }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, textAlign: "center" } }, /* @__PURE__ */ React.createElement(
    "div",
    {
      style: {
        fontFamily: MONO,
        fontSize: "1.1rem",
        fontWeight: 800,
        color: THEME.textMain
      }
    },
    stats ? stats.comments : "\u2014"
  ), /* @__PURE__ */ React.createElement("div", { style: { ...railText, fontSize: "0.62rem" } }, "comments"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center", style: { gap: 6, ...railText } }, /* @__PURE__ */ React.createElement(Globe, { size: 12 }), "Public community"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center", style: { gap: 6, marginTop: 6, ...railText } }, /* @__PURE__ */ React.createElement(Lock, { size: 12 }), "Login required to post"));
}
function AboutChannel({ channel, distro, stats }) {
  const isGeneral = channel === "general";
  const name = isGeneral ? "General" : distro?.name || channel;
  const tagline = isGeneral ? "Everything Linux \u2014 introductions, news and off-topic chat." : distro?.tagline || `Discussions about ${name}.`;
  return /* @__PURE__ */ React.createElement(RailCard, { label: "About this channel" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center", style: { gap: 10, marginBottom: 8 } }, /* @__PURE__ */ React.createElement(ChannelAvatar, { channel, distro, size: 40 }), /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement(
    "div",
    {
      style: {
        fontFamily: MONO,
        fontSize: "0.86rem",
        fontWeight: 800,
        color: THEME.textMain,
        overflowWrap: "anywhere"
      }
    },
    "d/",
    isGeneral ? "General" : channel
  ), /* @__PURE__ */ React.createElement("div", { style: { ...railText, fontSize: "0.62rem" } }, name))), /* @__PURE__ */ React.createElement("p", { style: { ...railText, margin: "0 0 10px" } }, tagline), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, alignItems: "center", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontFamily: MONO, fontSize: "0.92rem", fontWeight: 800, color: THEME.textMain } }, stats ? stats.posts : "\u2014"), /* @__PURE__ */ React.createElement("div", { style: { ...railText, fontSize: "0.6rem" } }, "posts")), /* @__PURE__ */ React.createElement("div", { style: { width: 1, height: 26, background: LINE } }), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontFamily: MONO, fontSize: "0.92rem", fontWeight: 800, color: THEME.textMain } }, stats ? stats.comments : "\u2014"), /* @__PURE__ */ React.createElement("div", { style: { ...railText, fontSize: "0.6rem" } }, "comments"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center", style: { gap: 6, ...railText } }, /* @__PURE__ */ React.createElement(Globe, { size: 12 }), "Public"));
}
function RecentPosts({ onOpen }) {
  const [recent, setRecent] = useState(
    () => peekPosts({ sort: "new", page: 1, limit: 5 })?.posts ?? peekStalePosts({ sort: "new", page: 1, limit: 5 })?.posts ?? null
  );
  useEffect(() => {
    let cancelled = false;
    listPosts({ sort: "new", page: 1, limit: 5 }).then((d) => !cancelled && setRecent(d.posts || [])).catch(() => !cancelled && setRecent([]));
    return () => {
      cancelled = true;
    };
  }, []);
  return /* @__PURE__ */ React.createElement(RailCard, { label: "Recent posts" }, recent === null && /* @__PURE__ */ React.createElement(RailListSkeleton, { count: 4 }), recent?.length === 0 && /* @__PURE__ */ React.createElement("p", { style: { ...railText, margin: 0, fontSize: "0.66rem" } }, "Nothing posted yet."), recent?.map((p, i) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: p.id,
      type: "button",
      onClick: () => onOpen?.(p),
      className: "w-full text-left transition-colors",
      style: {
        background: "none",
        border: "none",
        borderTop: i === 0 ? "none" : `1px solid ${LINE}`,
        padding: "10px 2px",
        cursor: "pointer"
      },
      onMouseEnter: (e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.03)";
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.background = "none";
      }
    },
    /* @__PURE__ */ React.createElement("div", { className: "flex items-center", style: { gap: 6, marginBottom: 4 } }, /* @__PURE__ */ React.createElement(ChannelAvatar, { channel: p.channel, size: 18 }), /* @__PURE__ */ React.createElement(
      "span",
      {
        style: {
          fontFamily: MONO,
          fontSize: "0.62rem",
          fontWeight: 700,
          color: THEME.silver,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }
      },
      "d/",
      p.channel === "general" ? "General" : p.channel
    ), /* @__PURE__ */ React.createElement("span", { style: { color: THEME.textMuted, fontSize: "0.55rem" } }, "\u2022"), /* @__PURE__ */ React.createElement("span", { style: { fontFamily: MONO, fontSize: "0.6rem", color: THEME.textMuted } }, timeAgo(p.createdAt))),
    /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          fontFamily: MONO,
          fontSize: "0.74rem",
          fontWeight: 700,
          color: THEME.textMain,
          lineHeight: 1.45,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          textAlign: "left"
        }
      },
      p.title
    ),
    /* @__PURE__ */ React.createElement("div", { style: { fontFamily: MONO, fontSize: "0.62rem", color: THEME.textMuted, marginTop: 4 } }, p.score, " ", p.score === 1 ? "upvote" : "upvotes", " \xB7 ", p.commentCount, " ", p.commentCount === 1 ? "comment" : "comments")
  )));
}
function CommunityRules() {
  const rules = [
    "Search the community before posting",
    "Use the right channel for your topic",
    "Be kind \u2014 no flame wars",
    "No low-quality posts or spam"
  ];
  return /* @__PURE__ */ React.createElement(RailCard, { label: "Community rules" }, /* @__PURE__ */ React.createElement("ol", { style: { margin: 0, padding: 0, listStyle: "none" } }, rules.map((r, i) => /* @__PURE__ */ React.createElement(
    "li",
    {
      key: r,
      className: "flex",
      style: {
        gap: 10,
        padding: "8px 0",
        borderTop: i === 0 ? "none" : `1px solid ${LINE}`
      }
    },
    /* @__PURE__ */ React.createElement(
      "span",
      {
        style: {
          fontFamily: MONO,
          fontSize: "0.68rem",
          fontWeight: 800,
          color: THEME.textMuted,
          minWidth: 14
        }
      },
      i + 1
    ),
    /* @__PURE__ */ React.createElement("span", { style: { ...railText, fontSize: "0.68rem" } }, r)
  ))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center", style: { gap: 6, marginTop: 6, ...railText } }, /* @__PURE__ */ React.createElement(FileText, { size: 12 }), "Moderated by DistroPedia admins"));
}
export {
  AboutChannel,
  AboutCommunity,
  CommunityRules,
  RecentPosts
};
