/**
 * react-markdown + remark-gfm stand-in.
 *
 * Only what the app relies on is reproduced: GFM block/inline tokens
 * (tables, strikethrough, autolinks) turned into vnodes, with the page's
 * `components` overrides applied per tag — `pre`, `table`, `a`, `code`.
 *
 * The parser is the vendored `marked` UMD build (window.marked); its lexer
 * gives the same token tree remark produces for the syntax this content
 * uses. Raw HTML is rendered as text, like react-markdown does without
 * rehype-raw — the old bundle never trusted post/AI markup.
 */
import React, { useMemo } from "dp/core/react.js";

const BLOCK_TAGS = {
  paragraph: "p",
  heading: (token) => `h${token.depth}`,
  blockquote: "blockquote",
  list: (token) => (token.ordered ? "ol" : "ul"),
  listItem: "li",
  table: "table",
  hr: "hr",
  html: "span",
};

const INLINE_TAGS = {
  strong: "strong",
  em: "em",
  del: "del",
  codespan: "code",
  br: "br",
  link: "a",
  image: "img",
};

const escapeText = (value) => String(value ?? "");

/** Token children -> element props for the `components` overrides. */
function propsFor(token, children) {
  const props = { children };
  if (token.type === "link") props.href = token.href;
  if (token.type === "image") {
    props.src = token.href;
    props.alt = escapeText(token.text);
  }
  if (token.type === "heading") props.level = token.depth;
  if (token.type === "codespan" || token.type === "code") {
    props.className = token.lang ? `language-${token.lang}` : undefined;
  }
  if (token.type === "list") {
    props.start = token.ordered && token.start !== null ? token.start : undefined;
    props.ordered = token.ordered;
    props.checked = typeof token.checked === "boolean" ? token.checked : null;
  }
  return props;
}

function renderToken(token, components, key) {
  if (!token) return null;

  if (token.type === "text" || token.type === "escape") {
    const text = escapeText(token.text ?? token.raw);
    // Plain text with no inline children renders as a string child.
    return token.tokens && token.tokens.length ? renderInline(token.tokens, components) : text;
  }

  if (token.type === "html") {
    return React.createElement("span", { key }, escapeText(token.text ?? token.raw));
  }

  if (token.type === "code") {
    const code = React.createElement(
      "code",
      { className: token.lang ? `language-${token.lang}` : undefined },
      escapeText(token.text)
    );
    const Pre = components.pre;
    return Pre
      ? React.createElement(Pre, { key, children: code })
      : React.createElement("pre", { key }, code);
  }

  if (token.type === "table") {
    const head = token.header || [];
    const rows = token.rows || [];
    const children = [
      React.createElement(
        "thead",
        null,
        React.createElement(
          "tr",
          null,
          head.map((cell, index) =>
            React.createElement("th", { key: `h${index}` }, renderInline(cell.tokens || [], components))
          )
        )
      ),
      rows.length
        ? React.createElement(
            "tbody",
            null,
            rows.map((row, rowIndex) =>
              React.createElement(
                "tr",
                { key: `r${rowIndex}` },
                row.map((cell, cellIndex) =>
                  React.createElement(
                    "td",
                    { key: `c${cellIndex}` },
                    renderInline(cell.tokens || [], components)
                  )
                )
              )
            )
          )
        : null,
    ].filter(Boolean);
    const Table = components.table;
    return Table
      ? React.createElement(Table, { key, children })
      : React.createElement("table", { key }, children);
  }

  if (token.type === "list") {
    const tag = token.ordered ? "ol" : "ul";
    const items = (token.items || []).map((item, index) =>
      renderToken({ ...item, type: "listItem" }, components, `i${index}`)
    );
    const props = { key };
    if (token.ordered && token.start !== 1 && token.start != null) props.start = token.start;
    return React.createElement(tag, props, items);
  }

  if (token.type === "listItem") {
    return React.createElement(
      "li",
      { key },
      ...(token.tokens ? renderNodes(token.tokens, components) : [escapeText(token.text)])
    );
  }

  if (token.type === "blockquote" || token.type === "paragraph" || token.type === "heading") {
    const tag = token.type === "heading" ? `h${token.depth}` : BLOCK_TAGS[token.type];
    const children = token.tokens
      ? token.tokens.every((child) => INLINE_ONLY.has(child.type))
        ? renderInline(token.tokens, components)
        : renderNodes(token.tokens, components)
      : [escapeText(token.text ?? token.raw)];
    const Custom = components[tag];
    if (Custom) {
      const props = { key, children };
      if (token.type === "heading") props.level = token.depth;
      return React.createElement(Custom, props);
    }
    return React.createElement(tag, { key }, children);
  }

  if (token.type === "hr") {
    return React.createElement("hr", { key });
  }

  if (token.type === "space") return null;

  // Inline token reached from a block walk: render it directly.
  const inline = renderInline([token], components);
  return inline.length === 1 ? inline[0] : React.createElement(React.Fragment, { key }, inline);
}

const INLINE_ONLY = new Set(["codespan", "del", "em", "image", "inline-text", "link", "strong", "text", "br", "escape"]);

function renderInline(tokens, components) {
  const out = [];
  (tokens || []).forEach((token, index) => {
    const key = `i${index}`;
    if (!token) return;
    if (token.type === "text" || token.type === "escape") {
      const nested = token.tokens && token.tokens.length ? renderInline(token.tokens, components) : null;
      out.push(nested || escapeText(token.text ?? token.raw));
      return;
    }
    if (token.type === "br") {
      out.push(React.createElement("br", { key }));
      return;
    }
    const tag = INLINE_TAGS[token.type];
    const children =
      token.type === "codespan"
        ? escapeText(token.text)
        : token.type === "image"
          ? null
          : renderInline(token.tokens || [], components);
    const Custom = components[tag] || components[token.type === "codespan" ? "code" : token.type];
    const props = propsFor(token, children);
    props.key = key;
    if (tag === "a" && !Custom) {
      // react-markdown keeps plain links; the app's override adds target/rel.
      props.href = token.href;
    }
    if (Custom) {
      out.push(React.createElement(Custom, props));
    } else {
      out.push(React.createElement(tag || "span", props, children));
    }
  });
  return out;
}

function renderNodes(tokens, components) {
  const out = [];
  (tokens || []).forEach((token, index) => {
    const node = renderToken(token, components, `b${index}`);
    if (node === null || node === undefined) return;
    out.push(node);
  });
  return out;
}

export default function ReactMarkdown({ children, components }) {
  const overrides = components || {};
  const source = Array.isArray(children) ? children.join("") : String(children ?? "");
  const tree = useMemo(() => {
    const marked = typeof window !== "undefined" ? window.marked : null;
    if (!marked || !source.trim()) return [];
    try {
      return marked.lexer(source);
    } catch {
      return null;
    }
  }, [source]);

  if (tree === null) return source;
  if (tree.length === 0) return null;
  return renderNodes(tree, overrides);
}

/** remark-gfm is already baked into marked's GFM mode. */
export function remarkGfm() {
  return undefined;
}
