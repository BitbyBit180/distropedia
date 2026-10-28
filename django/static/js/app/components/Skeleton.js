import React from "dp/core/react.js";
import { THEME, LINE, MONO } from "../theme/designTokens.js";
function Skeleton({ width = "100%", height = 12, radius = 8, style }) {
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      "aria-hidden": "true",
      className: "dp-skeleton",
      style: {
        width,
        height,
        borderRadius: radius,
        ...style
      }
    }
  );
}
function TextLines({ lines = 3, gap = 8, widths }) {
  return /* @__PURE__ */ React.createElement("div", { "aria-hidden": "true", style: { display: "flex", flexDirection: "column", gap } }, Array.from({ length: lines }).map((_, i) => /* @__PURE__ */ React.createElement(
    Skeleton,
    {
      key: i,
      height: 10,
      width: widths?.[i] ?? (i === lines - 1 ? "62%" : "100%")
    }
  )));
}
function PageSkeleton() {
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      role: "status",
      "aria-label": "Loading page",
      style: { minHeight: "100vh", position: "relative", overflowX: "hidden" }
    },
    /* @__PURE__ */ React.createElement("div", { className: "hero-bg fixed inset-0 z-0", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("div", { className: "grain-fine" }), /* @__PURE__ */ React.createElement("div", { className: "grain-fiber" })),
    /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "relative z-10 mx-auto w-full",
        style: { maxWidth: 1120, padding: "110px 20px 64px" }
      },
      /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center", style: { marginBottom: 28 } }, /* @__PURE__ */ React.createElement(Skeleton, { width: 220, height: 36, radius: 9999 })),
      /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center", style: { gap: 12, marginBottom: 36 } }, /* @__PURE__ */ React.createElement(Skeleton, { width: "min(420px, 80%)", height: 22 }), /* @__PURE__ */ React.createElement(Skeleton, { width: "min(300px, 60%)", height: 14 })),
      /* @__PURE__ */ React.createElement(
        "div",
        {
          style: {
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))"
          }
        },
        Array.from({ length: 5 }).map((_, i) => /* @__PURE__ */ React.createElement(DistroCardSkeleton, { key: i }))
      )
    )
  );
}
function DistroCardSkeleton() {
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      "aria-hidden": "true",
      style: {
        borderRadius: 26,
        border: `1px solid ${LINE}`,
        background: "rgba(255,255,255,0.02)",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        aspectRatio: "3 / 4"
      },
      className: "sm:aspect-[4/5]"
    },
    /* @__PURE__ */ React.createElement(Skeleton, { width: 68, height: 68, radius: 20 }),
    /* @__PURE__ */ React.createElement(Skeleton, { width: "70%", height: 18 }),
    /* @__PURE__ */ React.createElement(Skeleton, { width: "45%", height: 10 })
  );
}
function DistroGridSkeleton({ count = 10 }) {
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      "aria-hidden": "true",
      className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 sm:gap-6"
    },
    Array.from({ length: count }).map((_, i) => /* @__PURE__ */ React.createElement(DistroCardSkeleton, { key: i }))
  );
}
function DistroDetailSkeleton() {
  return /* @__PURE__ */ React.createElement("div", { "aria-hidden": "true", style: { width: "100%" } }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "w-full flex flex-col items-center text-center justify-center",
      style: { gap: 18, minHeight: "calc(100vh - 6.5rem)", paddingBottom: 48 }
    },
    /* @__PURE__ */ React.createElement(Skeleton, { width: 112, height: 112, radius: 24 }),
    /* @__PURE__ */ React.createElement(Skeleton, { width: "min(320px, 70%)", height: 44, radius: 10 }),
    /* @__PURE__ */ React.createElement(Skeleton, { width: "min(480px, 85%)", height: 16 }),
    /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center flex-wrap", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Skeleton, { width: 150, height: 44, radius: 9999 }), /* @__PURE__ */ React.createElement(Skeleton, { width: 150, height: 44, radius: 9999 }))
  ), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
      style: { gap: 12, marginBottom: 40 }
    },
    Array.from({ length: 6 }).map((_, i) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: i,
        style: {
          padding: 16,
          borderRadius: 16,
          background: "rgba(255,255,255,0.02)",
          border: `1px solid ${LINE}`
        }
      },
      /* @__PURE__ */ React.createElement(Skeleton, { width: "55%", height: 10, style: { marginBottom: 10 } }),
      /* @__PURE__ */ React.createElement(Skeleton, { width: "85%", height: 14 })
    ))
  ), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 28 } }, Array.from({ length: 3 }).map((_, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", gap: 20 } }, /* @__PURE__ */ React.createElement(Skeleton, { width: 28, height: 20, radius: 6, style: { flexShrink: 0 } }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", gap: 10 } }, /* @__PURE__ */ React.createElement(Skeleton, { width: "40%", height: 16 }), /* @__PURE__ */ React.createElement(TextLines, { lines: 2 }), /* @__PURE__ */ React.createElement(Skeleton, { width: "100%", height: 64, radius: 10 }))))));
}
function CompareTableSkeleton({ cols = 3, rows = 8 }) {
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      "aria-hidden": "true",
      style: {
        borderRadius: 16,
        border: `1px solid ${LINE}`,
        background: "rgba(255,255,255,0.03)",
        overflow: "hidden"
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 0, borderBottom: `1px solid ${LINE}` } }, /* @__PURE__ */ React.createElement("div", { style: { width: 140, flexShrink: 0, padding: "20px 16px" } }, /* @__PURE__ */ React.createElement(Skeleton, { width: "60%", height: 10 })), Array.from({ length: cols }).map((_, i) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: i,
        style: {
          flex: 1,
          minWidth: 150,
          padding: "16px 12px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          borderLeft: "1px solid rgba(255,255,255,0.05)"
        }
      },
      /* @__PURE__ */ React.createElement(Skeleton, { width: 56, height: 56, radius: 16 }),
      /* @__PURE__ */ React.createElement(Skeleton, { width: "60%", height: 14 })
    ))),
    Array.from({ length: rows }).map((_, r) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: r,
        style: {
          display: "flex",
          borderTop: r === 0 ? "none" : "1px solid rgba(255,255,255,0.05)"
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { width: 140, flexShrink: 0, padding: "14px 16px" } }, /* @__PURE__ */ React.createElement(Skeleton, { width: "70%", height: 10 })),
      Array.from({ length: cols }).map((_2, c) => /* @__PURE__ */ React.createElement(
        "div",
        {
          key: c,
          style: {
            flex: 1,
            minWidth: 150,
            padding: "14px 16px",
            borderLeft: "1px solid rgba(255,255,255,0.05)"
          }
        },
        /* @__PURE__ */ React.createElement(Skeleton, { width: c === cols - 1 && r % 3 === 0 ? "55%" : "85%", height: 12 })
      ))
    ))
  );
}
function PostRowSkeleton() {
  return /* @__PURE__ */ React.createElement("div", { "aria-hidden": "true", style: { padding: "14px 4px" } }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center", style: { gap: 8, marginBottom: 10 } }, /* @__PURE__ */ React.createElement(Skeleton, { width: 26, height: 26, radius: 9999 }), /* @__PURE__ */ React.createElement(Skeleton, { width: 110, height: 11 }), /* @__PURE__ */ React.createElement(Skeleton, { width: 80, height: 10 })), /* @__PURE__ */ React.createElement(Skeleton, { width: "82%", height: 18, style: { marginBottom: 8 } }), /* @__PURE__ */ React.createElement(TextLines, { lines: 2, widths: ["96%", "55%"] }), /* @__PURE__ */ React.createElement("div", { className: "flex items-center", style: { gap: 8, marginTop: 12 } }, /* @__PURE__ */ React.createElement(Skeleton, { width: 64, height: 28, radius: 9999 }), /* @__PURE__ */ React.createElement(Skeleton, { width: 90, height: 24, radius: 9999 }), /* @__PURE__ */ React.createElement(Skeleton, { width: 70, height: 24, radius: 9999 })));
}
function CommunityFeedSkeleton({ count = 4 }) {
  return /* @__PURE__ */ React.createElement("div", { "aria-hidden": "true" }, Array.from({ length: count }).map((_, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { borderBottom: i === count - 1 ? "none" : `1px solid ${LINE}` } }, /* @__PURE__ */ React.createElement(PostRowSkeleton, null))));
}
function RailListSkeleton({ count = 4 }) {
  return /* @__PURE__ */ React.createElement("div", { "aria-hidden": "true", style: { display: "flex", flexDirection: "column", gap: 10 } }, Array.from({ length: count }).map((_, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", flexDirection: "column", gap: 6 } }, /* @__PURE__ */ React.createElement(Skeleton, { width: `${88 - i * 7}%`, height: 12 }), /* @__PURE__ */ React.createElement(Skeleton, { width: "45%", height: 9 }))));
}
function PostDetailSkeleton() {
  return /* @__PURE__ */ React.createElement("div", { "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center", style: { gap: 10, marginBottom: 14 } }, /* @__PURE__ */ React.createElement(Skeleton, { width: 36, height: 36, radius: 9999 }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } }, /* @__PURE__ */ React.createElement(Skeleton, { width: 140, height: 13 }), /* @__PURE__ */ React.createElement(Skeleton, { width: 190, height: 10 }))), /* @__PURE__ */ React.createElement(Skeleton, { width: "90%", height: 26, style: { marginBottom: 12 } }), /* @__PURE__ */ React.createElement(TextLines, { lines: 4 }), /* @__PURE__ */ React.createElement("div", { className: "flex items-center", style: { gap: 8, marginTop: 16 } }, /* @__PURE__ */ React.createElement(Skeleton, { width: 64, height: 28, radius: 9999 }), /* @__PURE__ */ React.createElement(Skeleton, { width: 100, height: 24, radius: 9999 }), /* @__PURE__ */ React.createElement(Skeleton, { width: 70, height: 24, radius: 9999 })), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 28, display: "flex", flexDirection: "column", gap: 16 } }, Array.from({ length: 2 }).map((_, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", gap: 10 } }, /* @__PURE__ */ React.createElement(Skeleton, { width: 30, height: 30, radius: 9999, style: { flexShrink: 0 } }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Skeleton, { width: "30%", height: 11, style: { marginBottom: 8 } }), /* @__PURE__ */ React.createElement(TextLines, { lines: 2, widths: ["92%", "60%"] }))))));
}
function ChatListSkeleton({ count = 5 }) {
  return /* @__PURE__ */ React.createElement("div", { "aria-hidden": "true", style: { display: "flex", flexDirection: "column", gap: 4 } }, Array.from({ length: count }).map((_, i) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: i,
      className: "flex items-center",
      style: { gap: 9, padding: "8px 10px" }
    },
    /* @__PURE__ */ React.createElement(Skeleton, { width: 14, height: 14, radius: 4 }),
    /* @__PURE__ */ React.createElement(Skeleton, { width: `${72 - i * 6}%`, height: 12 })
  )));
}
function ChatMessagesSkeleton({ count = 3 }) {
  return /* @__PURE__ */ React.createElement("div", { "aria-hidden": "true", style: { display: "flex", flexDirection: "column", gap: 18 } }, Array.from({ length: count }).map(
    (_, i) => i % 2 === 0 ? /* @__PURE__ */ React.createElement("div", { key: i, className: "flex justify-end" }, /* @__PURE__ */ React.createElement("div", { style: { width: "62%", display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" } }, /* @__PURE__ */ React.createElement(Skeleton, { width: "100%", height: 44, radius: 16 }), /* @__PURE__ */ React.createElement(Skeleton, { width: "55%", height: 12 }))) : /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", flexDirection: "column", gap: 8 } }, /* @__PURE__ */ React.createElement(Skeleton, { width: "92%", height: 14 }), /* @__PURE__ */ React.createElement(Skeleton, { width: "88%", height: 14 }), /* @__PURE__ */ React.createElement(Skeleton, { width: "60%", height: 14 }), /* @__PURE__ */ React.createElement(Skeleton, { width: 120, height: 64, radius: 10 }))
  ));
}
function QuizResultSkeleton() {
  return /* @__PURE__ */ React.createElement("div", { "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "flex items-center",
      style: {
        gap: 16,
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        border: `1px solid ${LINE}`,
        background: "rgba(255,255,255,0.03)"
      }
    },
    /* @__PURE__ */ React.createElement(Skeleton, { width: 72, height: 72, radius: 9999, style: { flexShrink: 0 } }),
    /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", gap: 10 } }, /* @__PURE__ */ React.createElement(Skeleton, { width: "35%", height: 10 }), /* @__PURE__ */ React.createElement(Skeleton, { width: "55%", height: 22 }), /* @__PURE__ */ React.createElement(Skeleton, { width: "80%", height: 12 }), /* @__PURE__ */ React.createElement(Skeleton, { width: 140, height: 34, radius: 9999 }))
  ), Array.from({ length: 2 }).map((_, i) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: i,
      className: "flex items-center",
      style: {
        gap: 14,
        borderRadius: 14,
        padding: "12px 16px",
        marginBottom: 10,
        border: `1px solid ${LINE}`,
        background: "rgba(255,255,255,0.02)"
      }
    },
    /* @__PURE__ */ React.createElement(Skeleton, { width: 44, height: 44, radius: 9999, style: { flexShrink: 0 } }),
    /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", gap: 8 } }, /* @__PURE__ */ React.createElement(Skeleton, { width: "40%", height: 13 }), /* @__PURE__ */ React.createElement(Skeleton, { width: "65%", height: 10 }))
  )), /* @__PURE__ */ React.createElement(
    "p",
    {
      style: {
        fontFamily: MONO,
        fontSize: "0.72rem",
        color: THEME.textMuted,
        textAlign: "center",
        margin: "14px 0 0"
      }
    },
    "Comparing all 14 distros against your answers\u2026"
  ));
}
export {
  ChatListSkeleton,
  ChatMessagesSkeleton,
  CommunityFeedSkeleton,
  CompareTableSkeleton,
  DistroCardSkeleton,
  DistroDetailSkeleton,
  DistroGridSkeleton,
  PageSkeleton,
  PostDetailSkeleton,
  PostRowSkeleton,
  QuizResultSkeleton,
  RailListSkeleton,
  Skeleton,
  TextLines
};
