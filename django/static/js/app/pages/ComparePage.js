import React, { useEffect, useMemo, useState } from "dp/core/react.js";
import { motion } from "dp/core/motion.js";
import { Plus, X, Scale, Search } from "dp/core/icons.js";
import Navbar from "../components/Navbar.js";
import DistroIcon from "../components/DistroIcon.js";
import { CompareTableSkeleton } from "../components/Skeleton.js";
import { useDistros } from "../hooks/useDistros.js";
import { useCompare, MAX_COMPARE } from "../hooks/useCompare.js";
import { THEME, LINE, MONO } from "../theme/designTokens.js";
const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};
const ExternalLinkCell = ({ url }) => url ? /* @__PURE__ */ React.createElement(
  "a",
  {
    href: url,
    target: "_blank",
    rel: "noreferrer",
    className: "underline decoration-white/30 underline-offset-2 hover:decoration-white/80 transition-colors",
    style: { color: THEME.accent }
  },
  hostOf(url),
  " \u2197"
) : "\u2014";
const COMPARE_ROWS = (onNavigate) => [
  {
    label: "Desktop preview",
    render: (d) => d.preview ? /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => onNavigate?.(`/distro/${d.id}`),
        className: "block w-full rounded-lg overflow-hidden border border-white/15 hover:border-white/40 transition-colors",
        title: `Open ${d.name} preview`
      },
      /* @__PURE__ */ React.createElement(
        "img",
        {
          src: d.preview,
          alt: `${d.name} desktop preview`,
          loading: "lazy",
          className: "w-full aspect-[16/10] object-cover object-top"
        }
      )
    ) : "\u2014"
  },
  { label: "Latest version", field: "latestVersion" },
  { label: "Min RAM", field: "minRam" },
  { label: "Min disk", field: "minDisk" },
  { label: "Release model", field: "releaseModel" },
  { label: "License", field: "license" },
  { label: "Based on", field: "basedOn" },
  { label: "Init system", field: "init" },
  { label: "Package manager", field: "pkgMgr" },
  { label: "Desktop", field: "desktop" },
  { label: "Architectures", field: "architectures" },
  { label: "Category", field: "category" },
  { label: "Install command", field: "installCmd" },
  { label: "Website", render: (d) => /* @__PURE__ */ React.createElement(ExternalLinkCell, { url: d.website }) },
  { label: "Download", render: (d) => /* @__PURE__ */ React.createElement(ExternalLinkCell, { url: d.downloadUrl }) }
];
function parseIdsFromQuery(query) {
  const params = new URLSearchParams(query || "");
  const raw = (params.get("ids") || "").split(",");
  const ids = raw.map((id) => id.trim().toLowerCase()).filter(Boolean);
  return [...new Set(ids)].slice(0, MAX_COMPARE);
}
function ComparePage({ query, onNavigate }) {
  const [selectedIds, setSelectedIds] = useState(() => parseIdsFromQuery(query));
  const [pickerQuery, setPickerQuery] = useState("");
  const { distros: catalogue } = useDistros();
  const { distros, loading } = useCompare(selectedIds);
  useEffect(() => {
    const next = parseIdsFromQuery(query);
    setSelectedIds((prev) => {
      const prevKey = prev.join(",");
      return prevKey === next.join(",") ? prev : next;
    });
  }, [query]);
  useEffect(() => {
    const url = selectedIds.length ? `/compare?ids=${selectedIds.join(",")}` : "/compare";
    window.history.replaceState({}, "", url);
  }, [selectedIds]);
  const toggleId = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  };
  const pickerResults = useMemo(() => {
    const q = pickerQuery.toLowerCase().trim();
    if (!q) return catalogue;
    return catalogue.filter(
      (d) => d.name.toLowerCase().includes(q) || d.tagline.toLowerCase().includes(q) || d.category.toLowerCase().includes(q)
    );
  }, [pickerQuery, catalogue]);
  const isFull = selectedIds.length >= MAX_COMPARE;
  const hasSelection = distros.length > 0;
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      style: {
        backgroundColor: THEME.bg,
        minHeight: "100vh",
        position: "relative",
        overflowX: "hidden"
      },
      className: "flex flex-col text-[#F0F4F8]"
    },
    /* @__PURE__ */ React.createElement("div", { className: "hero-bg fixed inset-0 z-0", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("div", { className: "grain-fine" }), /* @__PURE__ */ React.createElement("div", { className: "grain-fiber" })),
    /* @__PURE__ */ React.createElement(Navbar, { currentRoute: "/compare", onNavigate }),
    /* @__PURE__ */ React.createElement("main", { className: "relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24" }, /* @__PURE__ */ React.createElement("div", { className: "text-center mb-10" }, /* @__PURE__ */ React.createElement("h1", { className: "text-2xl sm:text-3xl md:text-4xl font-mono font-bold tracking-wider text-white flex items-center justify-center gap-3" }, /* @__PURE__ */ React.createElement(Scale, { size: 28, style: { color: THEME.accent } }), "Compare distros")), /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "mb-10 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-5 sm:p-6",
        style: { borderColor: LINE }
      },
      /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4" }, /* @__PURE__ */ React.createElement(
        "span",
        {
          className: "font-mono text-[10px] uppercase tracking-[0.18em] text-white/40",
          style: { fontFamily: MONO }
        },
        "Select distros"
      ), /* @__PURE__ */ React.createElement(
        "span",
        {
          className: "font-mono text-[10px] tracking-[0.14em]",
          style: {
            fontFamily: MONO,
            color: isFull ? THEME.accent : "rgba(240,244,248,0.55)"
          }
        },
        selectedIds.length,
        " / ",
        MAX_COMPARE,
        " selected",
        isFull ? " \u2014 remove one to add another" : ""
      )),
      /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-2 mb-4 min-h-[34px]" }, selectedIds.length === 0 && /* @__PURE__ */ React.createElement("span", { className: "font-mono text-xs text-white/35" }, "Nothing selected yet \u2014 search below and add distros"), selectedIds.map((id) => {
        const cat = catalogue.find((d) => d.id === id);
        return /* @__PURE__ */ React.createElement(
          motion.button,
          {
            layout: true,
            key: id,
            type: "button",
            onClick: () => toggleId(id),
            className: "group flex items-center gap-2 pl-2.5 pr-1.5 py-1.5 rounded-full font-mono text-xs text-white transition-colors",
            style: {
              background: "rgba(255,255,255,0.08)",
              border: `1px solid ${cat?.accent ?? THEME.accent}66`
            },
            title: "Remove from comparison"
          },
          /* @__PURE__ */ React.createElement(
            "span",
            {
              className: "w-2 h-2 rounded-full shrink-0",
              style: { background: cat?.accent ?? THEME.accent }
            }
          ),
          cat?.name ?? id,
          /* @__PURE__ */ React.createElement(X, { size: 13, className: "text-white/50 group-hover:text-white" })
        );
      })),
      /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "flex items-center gap-2 rounded-full px-4 py-2 mb-3",
          style: {
            background: "rgba(20,24,32,0.45)",
            border: "1px solid rgba(255,255,255,0.18)"
          }
        },
        /* @__PURE__ */ React.createElement(Search, { size: 15, className: "text-white/50 shrink-0" }),
        /* @__PURE__ */ React.createElement(
          "input",
          {
            type: "text",
            value: pickerQuery,
            onChange: (e) => setPickerQuery(e.target.value),
            placeholder: "Search distros to compare...",
            className: "w-full bg-transparent border-none outline-none text-white/90 text-xs placeholder:text-white/35",
            style: { fontFamily: MONO }
          }
        )
      ),
      /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2 max-h-44 overflow-y-auto scrollbar-none" }, pickerResults.map((d) => {
        const selected = selectedIds.includes(d.id);
        const disabled = !selected && isFull;
        return /* @__PURE__ */ React.createElement(
          "button",
          {
            key: d.id,
            type: "button",
            disabled,
            onClick: () => toggleId(d.id),
            className: "flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-xs transition-all duration-150",
            style: {
              background: selected ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.04)",
              color: disabled ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.8)",
              border: `1px solid ${selected ? `${d.accent}88` : "rgba(255,255,255,0.1)"}`,
              cursor: disabled ? "not-allowed" : "pointer"
            }
          },
          !selected && !disabled && /* @__PURE__ */ React.createElement(Plus, { size: 12, className: "text-white/50" }),
          d.name
        );
      }), pickerResults.length === 0 && /* @__PURE__ */ React.createElement("span", { className: "font-mono text-xs text-white/35 py-2" }, "No distros matched \u201C", pickerQuery, "\u201D"))
    ), loading ? /* @__PURE__ */ React.createElement(CompareTableSkeleton, { cols: Math.max(selectedIds.length, 1) }) : !hasSelection ? /* @__PURE__ */ React.createElement("div", { className: "text-center py-16 bg-white/[0.02] rounded-3xl border border-white/10 backdrop-blur-sm" }, /* @__PURE__ */ React.createElement(Scale, { size: 36, className: "mx-auto mb-4 text-white/25" }), /* @__PURE__ */ React.createElement("p", { className: "text-white/60 font-mono text-sm mb-1" }, "Select at least one distro to start comparing"), /* @__PURE__ */ React.createElement("p", { className: "text-white/35 font-mono text-xs" }, "Try Ubuntu vs Arch vs Alpine \u2014 or pick from the list above")) : /* @__PURE__ */ React.createElement("div", { className: "rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md overflow-x-auto" }, /* @__PURE__ */ React.createElement("table", { className: "w-full border-collapse", style: { minWidth: "640px" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement(
      "th",
      {
        className: "sticky left-0 z-[1] text-left px-4 py-3",
        style: { background: THEME.bg, minWidth: "140px" }
      },
      /* @__PURE__ */ React.createElement(
        "span",
        {
          className: "font-mono text-[10px] uppercase tracking-[0.18em] text-white/40",
          style: { fontFamily: MONO }
        },
        "Spec"
      )
    ), distros.map((d) => /* @__PURE__ */ React.createElement(
      "th",
      {
        key: d.id,
        className: "relative px-3 py-4 text-center align-middle",
        style: { borderTop: `3px solid ${d.accent}`, minWidth: "170px" }
      },
      /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => toggleId(d.id),
          className: "absolute top-2 right-2 text-white/40 hover:text-white transition-colors",
          title: `Remove ${d.name}`,
          "aria-label": `Remove ${d.name}`
        },
        /* @__PURE__ */ React.createElement(X, { size: 14 })
      ),
      /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => onNavigate?.(`/distro/${d.id}`),
          className: "mx-auto flex flex-col items-center gap-2 transition-transform duration-200 hover:scale-105",
          title: `Open ${d.name} details`,
          "aria-label": `Open ${d.name} details`
        },
        /* @__PURE__ */ React.createElement(DistroIcon, { name: d.name, accent: "#FFFFFF", size: 76 }),
        /* @__PURE__ */ React.createElement(
          "span",
          {
            className: "font-mono font-bold text-sm text-white tracking-wide",
            style: { fontFamily: MONO }
          },
          d.name
        )
      )
    )))), /* @__PURE__ */ React.createElement("tbody", null, COMPARE_ROWS(onNavigate).map((row, idx) => /* @__PURE__ */ React.createElement(
      "tr",
      {
        key: row.label,
        style: { borderTop: `1px solid ${idx === 0 ? LINE : "rgba(255,255,255,0.05)"}` }
      },
      /* @__PURE__ */ React.createElement(
        "td",
        {
          className: "sticky left-0 z-[1] px-4 py-3 align-top",
          style: { background: THEME.bg }
        },
        /* @__PURE__ */ React.createElement(
          "span",
          {
            className: "font-mono text-[10px] uppercase tracking-[0.14em] text-white/45",
            style: { fontFamily: MONO }
          },
          row.label
        )
      ),
      distros.map((d) => /* @__PURE__ */ React.createElement(
        "td",
        {
          key: `${d.id}-${row.label}`,
          className: `px-4 py-3 align-top text-xs sm:text-[13px] text-white/85 ${row.field === "installCmd" ? "break-words" : ""}`,
          style: { fontFamily: MONO }
        },
        row.render ? row.render(d) : d[row.field] || "\u2014"
      ))
    ))))))
  );
}
export {
  ComparePage as default
};
