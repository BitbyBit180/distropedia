/**
 * A small stand-in for the React surface this app actually used: `h` (element
 * factory), a keyed differ, and the hooks the pages call (useState / useEffect
 * / useRef / useMemo / useCallback).
 *
 * The design is the contract, so re-rendering must not rebuild the DOM: CSS
 * keyframes (`dp-fade-up`), running transitions, focus and caret position all
 * survive only if the nodes survive. Hence a vnode tree that is *patched* into
 * the existing DOM, component by component — the same guarantee React gave.
 *
 * Component functions take `props` and return vnodes (one, an array, or null).
 * A vnode whose `type` is a function is a child component; it keeps its own
 * hook state while it stays at the same position (or `key`) in its parent.
 */

export const __dpVersion = "probe-9";

const SVG_NS = "http://www.w3.org/2000/svg";

const RESERVED = new Set(["key", "ref", "children", "class", "className", "style", "html"]);

// React's "numbers are px except…" list, so inline styles keep working as-is.
const UNITLESS = new Set([
  "animationIterationCount", "aspectRatio", "borderImageOutset", "borderImageSlice",
  "borderImageWidth", "boxFlex", "boxFlexGroup", "boxOrdinalGroup", "columnCount",
  "columns", "flex", "flexGrow", "flexPositive", "flexShrink", "flexNegative",
  "flexOrder", "gridArea", "gridRow", "gridRowEnd", "gridRowSpan", "gridRowStart",
  "gridColumn", "gridColumnEnd", "gridColumnSpan", "gridColumnStart", "fontWeight",
  "lineClamp", "lineHeight", "opacity", "order", "orphans", "tabSize", "widows",
  "zIndex", "zoom", "fillOpacity", "strokeOpacity", "strokeDashoffset", "strokeWidth",
]);

const SVG_ATTR = {
  viewBox: "viewBox",
  preserveAspectRatio: "preserveAspectRatio",
  xlinkHref: "xlink:href",
};

const Fragment = Symbol("dp.fragment");

const isText = (v) => typeof v === "string" || typeof v === "number";
const isBlank = (v) => v === null || v === undefined || v === false || v === true;

function flatten(list, out = []) {
  for (const item of list) {
    if (isBlank(item)) continue;
    if (Array.isArray(item)) flatten(item, out);
    else if (item && item.type === Fragment) flatten(item.children, out);
    else out.push(item);
  }
  return out;
}

/** h('div', { class: 'x', style: {...}, onClick: fn }, child, ...) */
export function h(type, props, ...children) {
  const p = props || {};
  let kids = flatten(children);
  // `createElement(Comp, { children })` — React accepts children in props.
  if (!kids.length && p.children !== undefined && p.children !== null) {
    kids = flatten(Array.isArray(p.children) ? p.children : [p.children]);
  }
  return {
    type,
    props: p,
    key: p.key === undefined || p.key === null ? null : String(p.key),
    children: kids,
  };
}

/** h(Fragment, null, a, b) — a group with no DOM node of its own. */
export function fragment(props, ...children) {
  return { type: Fragment, props: props || {}, key: null, children: flatten(children) };
}
export { Fragment };

// --------------------------------------------------------------------------
// scheduling

let current = null; // instance whose body is running
const dirty = new Set();
let scheduled = false;
let flushing = false;
const effectQueue = [];

function invalidate(instance) {
  if (instance.destroyed) return;
  dirty.add(instance);
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(flushDirty);
}

/**
 * Render everything queued, then run effects. React treats discrete events
 * (click, input) as sync-priority: the state they set is committed before the
 * next event is delivered. Without this flush the shim would only commit on
 * the microtask, so two dispatches inside one task (a script that types and
 * then submits, a click that opens a dialog the handler immediately reads)
 * would run against state from the previous render.
 */
function flushDirty() {
  if (flushing || renderDepth > 0) return;
  flushing = true;
  scheduled = false;
  try {
    let guard = 0;
    while (dirty.size && guard++ < 50) {
      const batch = [...dirty];
      dirty.clear();
      for (const instance of batch) renderComponent(instance, false);
      drainEffects();
    }
    if (dirty.size) {
      console.error("dp: render loop did not settle — state set during render?");
      dirty.clear();
    }
  } finally {
    flushing = false;
  }
}

export { flushDirty as flushSync };

function drainEffects() {
  const queued = effectQueue.splice(0);
  for (const run of queued) {
    if (run.instance.destroyed) continue;
    try {
      run();
    } catch (err) {
      // One failing effect must not strand the rest of the queue (and the
      // reconcile that was waiting on it).
      console.error(err);
    }
  }
}

const same = (a, b) =>
  !!a && !!b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));

// --------------------------------------------------------------------------
// hooks

export function useState(initial) {
  const instance = current;
  const i = instance.cursor++;
  if (!(i in instance.hooks)) {
    instance.hooks[i] = { value: typeof initial === "function" ? initial() : initial };
  }
  const slot = instance.hooks[i];
  const set = (next) => {
    const value = typeof next === "function" ? next(slot.value) : next;
    if (Object.is(value, slot.value)) return;
    slot.value = value;
    invalidate(instance);
  };
  return [slot.value, set];
}

export function useRef(initial) {
  const instance = current;
  const i = instance.cursor++;
  if (!(i in instance.hooks)) instance.hooks[i] = { ref: { current: initial } };
  return instance.hooks[i].ref;
}

export function useMemo(factory, deps) {
  const instance = current;
  const i = instance.cursor++;
  const slot = instance.hooks[i];
  if (slot && deps && same(slot.deps, deps)) return slot.value;
  const value = factory();
  instance.hooks[i] = { deps, value };
  return value;
}

export function useCallback(factory, deps) {
  // Returns the function itself — `useMemo(() => factory, deps)`. Calling it
  // would run the callback on every render and hand back its result.
  const instance = current;
  return useMemo(() => factory, deps);
}

export function useEffect(create, deps) {
  const instance = current;
  const i = instance.cursor++;
  const prev = instance.hooks[i];
  const slot = { deps, cleanup: prev ? prev.cleanup : undefined, create };
  instance.hooks[i] = slot;
  if (!prev || !deps || !same(prev.deps, deps)) {
    const run = () => {
      if (typeof slot.cleanup === "function") slot.cleanup();
      slot.cleanup = slot.create();
      if (typeof slot.cleanup !== "function" && slot.cleanup !== undefined) {
        slot.cleanup = undefined;
      }
    };
    run.instance = instance;
    effectQueue.push(run);
  }
}

// --------------------------------------------------------------------------
// records (vnode <-> DOM)

function recordOf(vnode) {
  if (isText(vnode))
    return {
      kind: "text",
      vnode,
      text: String(vnode),
      children: [],
      el: document.createTextNode(String(vnode)),
    };
  if (typeof vnode.type === "function")
    return { kind: "component", vnode, el: null, children: [], instance: null };
  return { kind: "element", vnode, el: null, children: [], props: {} };
}

function svgAttr(key, isSvg) {
  if (!isSvg) return key;
  if (SVG_ATTR[key]) return SVG_ATTR[key];
  if (key === "class" || key === "style" || key === "id" || key === "href") return key;
  if (/^on/.test(key)) return key;
  return /[A-Z]/.test(key) ? key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`) : key;
}

function patchProps(record, props, previous) {
  const el = record.el;
  const svg = record.svg;
  const old = previous || {};

  const cls = props.className !== undefined ? props.className : props.class;
  if (cls !== undefined && cls !== (old.className !== undefined ? old.className : old.class)) {
    if (svg) el.setAttribute("class", cls == null ? "" : String(cls));
    else el.className = cls == null ? "" : String(cls);
  }

  if (props.style !== undefined) {
    if (props.style !== old.style) {
      if (typeof props.style === "string") {
        el.setAttribute("style", props.style);
      } else {
        const prevStyle = old.style && typeof old.style === "object" ? old.style : {};
        for (const key of Object.keys(prevStyle)) if (!(key in props.style)) el.style[key] = "";
        for (const key of Object.keys(props.style)) {
          const value = props.style[key];
          if (value === null || value === undefined || value === false || value === "") {
            el.style[key] = "";
            continue;
          }
          el.style[key] = typeof value === "number" && !UNITLESS.has(key) ? `${value}px` : String(value);
        }
      }
    }
  } else if (old.style !== undefined) {
    el.removeAttribute("style");
  }

  if (props.html !== undefined && props.html !== old.html) {
    el.innerHTML = props.html == null ? "" : String(props.html);
  }

  for (const key of Object.keys(props)) {
    if (RESERVED.has(key)) continue;
    if (key === "html") continue;
    const value = props[key];
    const before = old[key];

    if (key.startsWith("on") && typeof value === "function") {
      const event = key.slice(2).toLowerCase();
      record.events = record.events || {};
      if (!record.events[event]) {
        // One listener per node forever; it calls whatever the newest handler is.
        record.events[event] = value;
        el.addEventListener(event, (e) => {
          const handler = record.events[event];
          if (handler) handler(e);
          flushDirty();
        });
      } else {
        record.events[event] = value;
      }
      continue;
    }

    if (value === before && !isText(value)) continue;

    if (value === null || value === undefined || value === false) {
      if (!svg && (key === "value" || key === "checked")) {
        el[key] = key === "value" ? "" : false;
      } else if (!svg && key in el && typeof el[key] === "boolean") {
        el[key] = false;
      } else {
        el.removeAttribute(svgAttr(key, svg));
      }
      continue;
    }
    if (value === true) {
      if (!svg && typeof el[key] === "boolean") el[key] = true;
      else el.setAttribute(svgAttr(key, svg), "");
      continue;
    }
    if (!svg && (key === "value" || key === "checked" || key === "selected" || key === "multiple")) {
      if (key === "value") {
        const text = String(value);
        // Never rewrite the same string into a focused field: that resets the caret.
        if (el === document.activeElement && el.value === text) continue;
        el.value = text;
      } else {
        el[key] = value;
      }
      continue;
    }
    el.setAttribute(svgAttr(key, svg), typeof value === "number" ? String(value) : value);
  }
}

function setRef(ref, value) {
  if (typeof ref === "function") ref(value);
  else if (ref && typeof ref === "object") ref.current = value;
}

/** Build `vnode` (already flattened into `parentEl`) and return its record. */
function create(vnode, parentEl, before, svg) {
  if (before && before.parentNode !== parentEl) before = null;
  const record = recordOf(vnode);
  if (record.kind === "text") {
    parentEl.insertBefore(record.el, before || null);
    return record;
  }
  if (record.kind === "component") {
    record.instance = createInstance(vnode.type, propsFor(vnode), parentEl, before, svg, record);
    return record;
  }
  const tag = vnode.type;
  const isSvg = svg || tag === "svg";
  record.svg = isSvg;
  record.el = isSvg ? document.createElementNS(SVG_NS, tag) : document.createElement(tag);
  patchProps(record, vnode.props, {});
  record.props = vnode.props;
  for (const child of vnode.children) {
    record.children.push(create(child, record.el, null, isSvg));
  }
  // Children were appended blindly; tell any component child where its slice ends.
  for (const child of record.children) {
    if (child.kind === "component") reanchor(child.instance);
  }
  parentEl.insertBefore(record.el, before || null);
  return record;
}

function remove(record) {
  if (record.kind === "component") destroyInstance(record.instance);
  for (const child of childRecords(record)) remove(child);
  record.children = [];
  if (record.kind !== "component") {
    if (record.el && record.el.parentNode) record.el.parentNode.removeChild(record.el);
    const ref = record.vnode && record.vnode.props && record.vnode.props.ref;
    if (ref) setRef(ref, null);
  }
}

/** A component's records live on its instance, not on the record itself. */
function childRecords(record) {
  if (record.kind === "component") return record.instance ? record.instance.children : record.children;
  return record.children;
}

/** Top-level DOM nodes a record owns, in document order. */
function nodesOf(record, out = []) {
  if (record.kind === "text" || record.kind === "element") {
    if (record.el) out.push(record.el);
    return out;
  }
  for (const child of childRecords(record)) nodesOf(child, out);
  return out;
}

function matches(record, vnode) {
  if (isText(vnode)) return record.kind === "text";
  if (record.kind === "text") return false;
  return record.vnode.type === vnode.type;
}

/** Components read nested vnodes as `props.children`, like React does. */
function propsFor(vnode) {
  if (typeof vnode.type === "function" || vnode.type === Fragment) {
    return { ...vnode.props, children: vnode.children };
  }
  return vnode.props;
}

function update(record, vnode, parentEl) {
  record.vnode = vnode;
  if (record.kind === "text") {
    const text = String(vnode);
    if (text !== record.text) {
      record.text = text;
      record.el.nodeValue = text;
    }
    return;
  }
  if (record.kind === "component") {
    renderComponent(record.instance, false, propsFor(vnode));
    return;
  }
  const previousProps = record.props;
  patchProps(record, vnode.props, previousProps);
  record.props = vnode.props;
  const children = reconcileChildren(record.children, vnode.children, record.el, record.svg);
  record.children = children;
}

/**
 * Diff old records against new vnodes inside `parentEl`, keeping nodes that
 * still match (by key when present, else by position+type).
 *
 * `trailing` is the first node after this range that `parentEl` does *not*
 * own — a component mounted next to a foreign sibling passes its anchor so
 * that nodes added later land in front of it instead of at the parent's end.
 */
function reconcileChildren(oldRecords, vnodes, parentEl, svg, trailing) {
  const next = vnodes;
  if (trailing && trailing.parentNode !== parentEl) trailing = null;
  const byKey = new Map();
  for (const record of oldRecords) {
    if (record.vnode && record.vnode.key) byKey.set(record.vnode.key, record);
  }
  const pool = oldRecords.filter((record) => !(record.vnode && record.vnode.key));
  const results = [];
  let fallback = 0;

  for (const vnode of next) {
    let record = null;
    if (vnode.key) {
      record = byKey.get(vnode.key) || null;
      if (record) byKey.delete(vnode.key);
    }
    if (!record) {
      // position match: consume pool entries, dropping anything that can't match
      while (fallback < pool.length) {
        const candidate = pool[fallback++];
        if (matches(candidate, vnode)) {
          record = candidate;
          break;
        }
      }
    }
    if (record) {
      if (record.kind === "component") reanchor(record.instance, trailing);
      update(record, vnode, parentEl);
      results.push(record);
    } else {
      results.push(create(vnode, parentEl, trailing, svg));
    }
  }

  // anything left over is gone
  for (const record of oldRecords) {
    if (!results.includes(record)) remove(record);
  }

  // place nodes in the new order (cheap when nothing moved)
  let anchor = trailing || null;
  for (let i = results.length - 1; i >= 0; i--) {
    const nodes = nodesOf(results[i]);
    for (let j = nodes.length - 1; j >= 0; j--) {
      const node = nodes[j];
      if (anchor) {
        if (node.parentNode !== parentEl || node.nextSibling !== anchor) {
          parentEl.insertBefore(node, anchor);
        }
      } else if (node.parentNode !== parentEl || parentEl.lastChild !== node) {
        parentEl.appendChild(node);
      }
      anchor = node;
    }
    if (results[i].kind === "component") reanchor(results[i].instance);
  }
  return results;
}

/**
 * A component re-renders into its own slice of the parent; before doing so,
 * re-derive where that slice currently ends so newly created nodes are
 * inserted in the right place rather than at the parent's tail.
 */
function reanchor(instance, fallbackTrailing) {
  if (!instance) return;
  const nodes = [];
  for (const child of instance.children) nodesOf(child, nodes);
  const last = nodes[nodes.length - 1];
  if (last && last.parentNode === instance.parentEl) {
    instance.before = last.nextSibling;
  } else if (fallbackTrailing !== undefined) {
    instance.before = fallbackTrailing;
  }
}

// --------------------------------------------------------------------------
// components

function createInstance(fn, props, parentEl, before, svg, record) {
  const instance = {
    fn,
    props,
    record,
    parentEl,
    before: before || null,
    svg: !!svg,
    hooks: [],
    cursor: 0,
    children: [],
    destroyed: false,
    mounted: false,
  };
  if (record) record.instance = instance;
  renderComponent(instance, true);
  return instance;
}

let renderDepth = 0; // how deep the current render is inside a commit

function renderComponent(instance, initial, newProps) {
  if (instance.destroyed) return;
  if (newProps !== undefined) instance.props = newProps;
  const previousCurrent = current;
  current = instance;
  instance.cursor = 0;
  renderDepth++;
  let vnode;
  try {
    vnode = instance.fn(instance.props);
  } finally {
    current = previousCurrent;
  }
  const vnodes = isBlank(vnode)
    ? []
    : Array.isArray(vnode)
      ? flatten(vnode)
      : vnode && vnode.type === Fragment
        ? vnode.children
        : [vnode];

  try {
    if (initial) {
      instance.children = vnodes.map((child) => create(child, instance.parentEl, instance.before, instance.svg));
      instance.mounted = true;
      applyRefs(instance);
      // Effects run only once the *whole* subtree is committed, so a child's
      // `ref` is already filled by the time its parent's effect reads it —
      // draining mid-tree would hand an effect a null ref forever.
      if (renderDepth === 1) drainEffects();
      return;
    }

    instance.children = reconcileChildren(
      instance.children,
      vnodes,
      instance.parentEl,
      instance.svg,
      instance.before
    );
    applyRefs(instance);
  } finally {
    renderDepth--;
  }
}

function applyRefs(instance) {
  const walk = (record) => {
    if (record.kind === "component") {
      for (const child of childRecords(record)) walk(child);
      return;
    }
    const ref = record.vnode && record.vnode.props && record.vnode.props.ref;
    if (ref && record.el) setRef(ref, record.el);
    for (const child of record.children) walk(child);
  };
  for (const record of instance.children) walk(record);
}

function destroyInstance(instance) {
  if (!instance || instance.destroyed) return;
  instance.destroyed = true;
  dirty.delete(instance);
  for (const slot of instance.hooks) {
    if (slot && typeof slot.cleanup === "function") {
      try {
        slot.cleanup();
      } catch (err) {
        console.error(err);
      }
      slot.cleanup = undefined;
    }
  }
}

/**
 * Mount a component into `container` (returns the instance for later
 * `unmount`). `before` inserts the page in front of an existing node.
 */
export function mount(fn, props, container, before = null) {
  const record = { kind: "component", vnode: { type: fn, props: props || {}, key: null, children: [] }, el: null, children: [], instance: null };
  const instance = createInstance(fn, { ...(props || {}), children: [] }, container, before, false, record);
  record.instance = instance;
  return instance;
}

export function unmount(instance) {
  if (!instance) return;
  const record = instance.record;
  destroyInstance(instance);
  if (record) remove(record);
}

/** React.createElement / isValidElement, so ported JSX needs no rewrite. */
function isValidElement(value) {
  return !!value && typeof value === "object" && "type" in value && "props" in value;
}

function createRef() {
  return { current: null };
}

/** `React.memo` keeps identity-checking out of the runtime; the ported tree
 *  re-renders parents anyway, so memo is an pass-through. */
const memo = (component) => component;

const React = {
  createElement: h,
  createFragment: fragment,
  Fragment,
  isValidElement,
  createRef,
  memo,
  useState,
  useRef,
  useMemo,
  useCallback,
  useEffect,
  StrictMode: ({ children }) => children,
};

export default React;
