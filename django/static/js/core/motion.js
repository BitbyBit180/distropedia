/**
 * framer-motion stand-in.
 *
 * Only the surface the design actually uses is implemented — `motion.div /
 * button / aside / line` with `initial`, `animate`, `exit`, `transition`,
 * `whileHover`, `layout`, plus `AnimatePresence`, `useScroll` and
 * `useTransform`. Values are interpolated by hand (one rAF tween engine)
 * because the app animates three different kinds of target at once:
 * transform channels (x / y / scale / rotate), CSS properties (opacity,
 * width) and SVG geometry attributes (x2 / y2) — WAAPI cannot drive the last
 * group, and mixing engines would make the hero constellation and the card
 * entrance drift apart.
 */
import React, { useState, useRef, useEffect, useMemo } from "dp/core/react.js";

const TRANSFORM_KEYS = ["translateX", "translateY", "scale", "scaleX", "scaleY", "rotate"];
const TRANSFORM_ALIAS = { x: "translateX", y: "translateY", rotation: "rotate" };
// SVG geometry attributes that animate as attributes, not styles.
const ATTR_KEYS = new Set(["x1", "y1", "x2", "y2", "cx", "cy", "r", "width", "height", "opacity"]);

const EASINGS = {
  linear: [0, 0, 1, 1],
  easeOut: [0, 0, 0.58, 1],
  easeIn: [0.42, 0, 1, 1],
  easeInOut: [0.42, 0, 0.58, 1],
  backIn: [0.36, 0, 0.66, -0.56],
  backOut: [0.34, 1.56, 0.64, 1],
  anticipate: [0.36, 0, 0.66, -0.56],
};

// ---------------------------------------------------------------- motion values

class MotionValue {
  constructor(initial = 0) {
    this.current = initial;
    this.subscribers = new Set();
  }
  get() {
    return this.current;
  }
  set(value) {
    this.current = value;
    for (const fn of this.subscribers) fn(value);
  }
  on(fn) {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }
}

export function useMotionValue(initial = 0) {
  return useMemo(() => new MotionValue(initial), [initial]);
}

/** Scroll position of the window, as motion values. */
export function useScroll() {
  const values = useMemo(() => {
    const scrollY = new MotionValue(0);
    const scrollYProgress = new MotionValue(0);
    const measure = () => {
      const max = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      scrollY.set(window.scrollY);
      scrollYProgress.set(Math.min(1, window.scrollY / max));
    };
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return { scrollY, scrollYProgress, measure };
  }, []);
  useEffect(
    () => () => {
      window.removeEventListener("scroll", values.measure);
      window.removeEventListener("resize", values.measure);
    },
    [values]
  );
  return { scrollY: values.scrollY, scrollYProgress: values.scrollYProgress };
}

/** Map a motion value through an input range onto an output range. */
export function useTransform(value, input, output, clamp = true) {
  const result = useMemo(() => {
    const map = (raw) => {
      const t = (raw - input[0]) / (input[input.length - 1] - input[0] || 1);
      const k = clamp ? Math.max(0, Math.min(1, t)) : t;
      return output[0] + (output[output.length - 1] - output[0]) * k;
    };
    const mv = new MotionValue(map(value.get()));
    mv.source = value.on((raw) => mv.set(map(raw)));
    return mv;
  }, [value, JSON.stringify(input), JSON.stringify(output), clamp]);
  useEffect(
    () => () => {
      if (result.source) result.source();
    },
    [result]
  );
  return result;
}

// ------------------------------------------------------------------- tween core

const bezier = (points) => {
  // Cubic-bezier sampler (Newton iteration), matching CSS timing functions.
  const [x1, y1, x2, y2] = points;
  const calc = (t, a, b) => 3 * a * t * (1 - t) * (1 - t) + 3 * b * t * t * (1 - t) + t * t * t;
  return (u) => {
    if (u <= 0) return 0;
    if (u >= 1) return 1;
    let t = u;
    for (let i = 0; i < 6; i++) {
      const x = calc(t, x1, x2) - u;
      if (Math.abs(x) < 1e-4) break;
      const d = 3 * (1 - t) * (1 - t) * x1 + 6 * (1 - t) * t * (x2 - x1) + 3 * t * t * (1 - x2);
      if (Math.abs(d) < 1e-6) break;
      t -= x / d;
    }
    return calc(t, y1, y2);
  };
};

/** Critically-damped-ish spring → easing fn + settle duration (ms). */
const springEase = (transition) => {
  const stiffness = Number(transition.stiffness ?? 500);
  const damping = Number(transition.damping ?? 25);
  const mass = Number(transition.mass ?? 1);
  const omega = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const duration = Math.min(1600, Math.max(200, (zeta < 1 ? 5 : 7) / (zeta * omega || omega) * 1000));
  if (zeta >= 1) {
    return { easing: bezier([0.16, 1, 0.3, 1]), duration };
  }
  const omegaD = omega * Math.sqrt(1 - zeta * zeta);
  const progress = (u) => {
    const t = u * (duration / 1000);
    return 1 - Math.exp(-zeta * omega * t) * (Math.cos(omegaD * t) + ((zeta * omega) / omegaD) * Math.sin(omegaD * t));
  };
  return { easing: progress, duration };
};

const resolveTransition = (transition = {}) => {
  const spec = transition.type === "spring" ? springEase(transition) : null;
  const ease = transition.ease;
  const easing = spec
    ? spec.easing
    : Array.isArray(ease)
      ? bezier(ease)
      : typeof ease === "function"
        ? ease
        : bezier(EASINGS[ease] || EASINGS.easeOut);
  const durationMs = spec ? spec.duration : (transition.duration ?? 0.3) * 1000;
  return {
    duration: Math.max(0, durationMs),
    delay: (transition.delay ?? 0) * 1000,
    easing,
  };
};

/** Split a target into transform channels, CSS props and SVG attributes. */
function classify(target, isSvg) {
  const transform = {};
  const style = {};
  const attr = {};
  for (const [rawKey, rawValue] of Object.entries(target || {})) {
    const value = rawValue instanceof MotionValue ? rawValue.get() : rawValue;
    const key = TRANSFORM_ALIAS[rawKey] || rawKey;
    if (TRANSFORM_KEYS.includes(key)) {
      transform[key] = typeof value === "number" ? value : parseFloat(value) || 0;
      continue;
    }
    if (isSvg && ATTR_KEYS.has(rawKey) && typeof value === "number") {
      attr[rawKey] = value;
      continue;
    }
    if (isSvg && ATTR_KEYS.has(rawKey)) {
      attr[rawKey] = parseFloat(value) || 0;
      continue;
    }
    style[rawKey] = value;
  }
  return { transform, style, attr };
}

const px = (key, value) =>
  typeof value === "number"
    ? key === "opacity" || key === "scale" || key === "zIndex" || key === "fontWeight"
      ? String(value)
      : key === "rotate"
        ? `${value}deg`
        : `${value}px`
    : String(value);

const composeTransform = (state) => {
  const t = state.transform;
  const parts = [];
  const tx = t.translateX ?? 0;
  const ty = t.translateY ?? 0;
  if (tx || ty) parts.push(`translate(${px("x", tx)}, ${px("y", ty)})`);
  const scale = t.scale;
  if (scale !== undefined && scale !== 1) {
    parts.push(`scale(${scale}${t.scaleX !== undefined ? `, ${t.scaleX}` : ""}${t.scaleY !== undefined ? `, ${t.scaleY}` : ""})`);
  } else if (t.scaleX !== undefined || t.scaleY !== undefined) {
    parts.push(`scale(${t.scaleX ?? 1}, ${t.scaleY ?? 1})`);
  }
  if (t.rotate) parts.push(`rotate(${t.rotate}deg)`);
  return parts.join(" ") || "none";
};

/** Write the element's accumulated animation state onto the DOM. */
function writeSnapshot(el, state) {
  for (const [key, value] of Object.entries(state.style)) el.style[key] = px(key, value);
  for (const [key, value] of Object.entries(state.attr)) el.setAttribute(key, String(value));
  el.style.transform = composeTransform(state);
}

const motionState = (el) =>
  el.__dpMotion || (el.__dpMotion = { transform: { scale: 1 }, style: {}, attr: {} });

const running = new WeakMap(); // el -> requestAnimationFrame handle

/**
 * Tween the element from wherever its state currently sits to `target`.
 * Keys land in transform / CSS / SVG-attribute channels by `classify()`.
 */
function animateTo(el, target, options = {}) {
  const isSvg = el.namespaceURI === "http://www.w3.org/2000/svg";
  const state = motionState(el);
  const next = classify(target, isSvg);
  const from = {
    transform: { ...state.transform },
    style: {},
    attr: {},
  };
  for (const key of Object.keys(next.style)) {
    from.style[key] =
      key in state.style ? state.style[key] : numericFromComputedStyle(el, key, next.style[key]);
  }
  for (const key of Object.keys(next.attr)) {
    from.attr[key] = key in state.attr ? state.attr[key] : Number(el.getAttribute(key) || 0);
  }

  const { duration, delay, easing } = resolveTransition(options.transition);
  const token = Symbol("dp-motion");
  if (running.has(el)) cancelAnimationFrame(running.get(el));
  el.__dpToken = token;

  if (duration <= 0) {
    Object.assign(state.transform, next.transform);
    Object.assign(state.style, next.style);
    Object.assign(state.attr, next.attr);
    writeSnapshot(el, state);
    if (options.onComplete) options.onComplete();
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const begin = performance.now() + delay;
    const step = (now) => {
      if (el.__dpToken !== token) return resolve();
      if (now < begin) {
        running.set(el, requestAnimationFrame(step));
        return;
      }
      const u = Math.min(1, (now - begin) / duration);
      const p = easing(u);
      for (const key of Object.keys(next.transform)) {
        const a = from.transform[key] ?? identityTransform(key);
        const b = next.transform[key] ?? identityTransform(key);
        state.transform[key] = a + (b - a) * p;
      }
      for (const key of Object.keys(next.style)) {
        const a = Number(from.style[key]) || 0;
        const b = Number(next.style[key]);
        state.style[key] = Number.isFinite(b) ? a + (b - a) * p : next.style[key];
      }
      for (const key of Object.keys(next.attr)) {
        const a = Number(from.attr[key]) || 0;
        state.attr[key] = a + (Number(next.attr[key]) - a) * p;
      }
      writeSnapshot(el, state);
      if (u < 1) {
        running.set(el, requestAnimationFrame(step));
      } else {
        running.delete(el);
        if (options.onComplete) options.onComplete();
        resolve();
      }
    };
    running.set(el, requestAnimationFrame(step));
  });
}

const identityTransform = (key) => (key === "scale" || key === "scaleX" || key === "scaleY" ? 1 : 0);

const numericFromComputedStyle = (el, key, fallback) => {
  if (key === "opacity") return Number(getComputedStyle(el).opacity || 1);
  const raw = getComputedStyle(el)[key];
  const parsed = parseFloat(raw);
  if (Number.isFinite(parsed)) return parsed;
  return typeof fallback === "number" ? fallback : 0;
};

// ------------------------------------------------------------------ motion tags

const keyOf = (node) => (node && node.key != null ? String(node.key) : null);
const isVnode = (node) => !!node && typeof node === "object" && "type" in node && "props" in node;

function flattenChildren(children, out = []) {
  if (children === null || children === undefined || children === false || children === true) {
    return out;
  }
  if (Array.isArray(children)) {
    for (const child of children) flattenChildren(child, out);
    return out;
  }
  if (isVnode(children) && children.type === React.Fragment) {
    flattenChildren(children.props.children, out);
    return out;
  }
  out.push(children);
  return out;
}

const motionCache = new Map();

function createMotionComponent(tag) {
  if (motionCache.has(tag)) return motionCache.get(tag);

  const MotionComponent = (props) => {
    const {
      initial,
      animate,
      exit,
      transition,
      whileHover,
      layout,
      dpExiting,
      dpOnExitComplete,
      style,
      className,
      children,
      ...rest
    } = props;

    const elRef = useRef(null);
    const outerRef = rest.ref;
    const didMount = useRef(false);
    const exitStarted = useRef(false);

    // `style` may mix motion values (banner parallax) with plain CSS.
    const motionValues = useMemo(() => {
      if (!style) return null;
      const found = [];
      for (const [key, value] of Object.entries(style)) {
        if (value instanceof MotionValue) found.push([key, value]);
      }
      return found.length ? found : null;
    }, [style]);

    const staticStyle = useMemo(() => {
      if (!style || !motionValues) return style;
      const plain = {};
      for (const [key, value] of Object.entries(style)) {
        if (!(value instanceof MotionValue)) plain[key] = value;
      }
      return plain;
    }, [style, motionValues]);

    const targetOf = (value) => (typeof value === "function" ? value() : value);
    const animateTarget = targetOf(animate);
    const initialTarget = dpExiting ? null : targetOf(initial);
    const exitTarget = targetOf(exit);
    const hoverTarget = targetOf(whileHover);

    const attach = (el) => {
      elRef.current = el;
      if (outerRef) {
        if (typeof outerRef === "function") outerRef(el);
        else outerRef.current = el;
      }
      if (el && !el.__dpSeeded && initialTarget) {
        el.__dpSeeded = true;
        const isSvg = el.namespaceURI === "http://www.w3.org/2000/svg";
        const seeded = classify(initialTarget, isSvg);
        el.__dpMotion = {
          transform: { scale: 1, ...seeded.transform },
          style: { ...seeded.style },
          attr: { ...seeded.attr },
        };
        writeSnapshot(el, el.__dpMotion);
      }
    };

    useEffect(() => {
      const el = elRef.current;
      if (!el) return undefined;
      const cancelled = { current: false };

      const run = async () => {
        if (dpExiting) {
          if (exitStarted.current) return;
          exitStarted.current = true;
          if (exitTarget) await animateTo(el, exitTarget, { transition });
          if (!cancelled.current && dpOnExitComplete) dpOnExitComplete();
          return;
        }
        if (!didMount.current) {
          didMount.current = true;
          if (animateTarget) await animateTo(el, animateTarget, { transition });
          return;
        }
        if (animateTarget) await animateTo(el, animateTarget, { transition });
      };
      run();
      return () => {
        cancelled.current = true;
      };
    }, [
      dpExiting,
      JSON.stringify(animateTarget || null),
      JSON.stringify(exitTarget || null),
    ]);

    // whileHover: swap between the hover target and `animate` on pointer enter/leave.
    const handlers = {};
    if (hoverTarget || rest.onMouseEnter || rest.onMouseLeave) {
      handlers.onMouseEnter = (event) => {
        if (hoverTarget && elRef.current) animateTo(elRef.current, hoverTarget, { transition });
        if (rest.onMouseEnter) rest.onMouseEnter(event);
      };
      handlers.onMouseLeave = (event) => {
        if (hoverTarget && animateTarget && elRef.current) {
          animateTo(elRef.current, animateTarget, { transition });
        }
        if (rest.onMouseLeave) rest.onMouseLeave(event);
      };
    }

    // Motion values drive the element directly, like framer does.
    useEffect(() => {
      if (!motionValues) return undefined;
      const el = elRef.current;
      if (!el) return undefined;
      const state = motionState(el);
      const unsubs = motionValues.map(([key, value]) => {
        const channel = TRANSFORM_ALIAS[key] || key;
        const write = (raw) => {
          if (TRANSFORM_KEYS.includes(channel)) {
            state.transform[channel] = raw;
            el.style.transform = composeTransform(state);
            return;
          }
          state.style[key] = raw;
          el.style[key] = px(key, raw);
        };
        write(value.get());
        return value.on(write);
      });
      return () => unsubs.forEach((off) => off());
    }, [motionValues]);

    // layout: FLIP — play the position/size jump back instead of snapping.
    const layoutRect = useRef(null);
    useEffect(() => {
      if (!layout || !elRef.current) return;
      const el = elRef.current;
      const rect = el.getBoundingClientRect();
      const previous = layoutRect.current;
      layoutRect.current = rect;
      if (!previous) return;
      const dx = previous.left - rect.left;
      const dy = previous.top - rect.top;
      const sx = rect.width > 0 ? previous.width / rect.width : 1;
      const sy = rect.height > 0 ? previous.height / rect.height : 1;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) {
        return;
      }
      const state = motionState(el);
      state.transform.translateX = dx;
      state.transform.translateY = dy;
      state.transform.scaleX = sx;
      state.transform.scaleY = sy;
      writeSnapshot(el, state);
      requestAnimationFrame(() => {
        animateTo(el, { translateX: 0, translateY: 0, scaleX: 1, scaleY: 1 }, {
          transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] },
        });
      });
    });

    const forwarded = { ...rest, ...handlers, ref: attach, style: staticStyle, className };
    return React.createElement(tag, forwarded, children);
  };

  MotionComponent.displayName = `motion.${tag}`;
  motionCache.set(tag, MotionComponent);
  return MotionComponent;
}

export const motion = new Proxy(
  {},
  {
    get: (_target, tag) => (typeof tag === "string" ? createMotionComponent(tag) : undefined),
  }
);

// ------------------------------------------------------------ AnimatePresence

/**
 * Keeps removed children mounted until their `exit` animation finishes —
 * the modal never snaps away, the drawer slides back out. Exiting nodes are
 * rendered after the live ones, exactly where framer-motion puts them.
 */
export function AnimatePresence({ children }) {
  const [, force] = useState(0);
  const rendered = useRef([]);
  const exiting = useRef(new Map()); // id -> { node, done }

  const next = flattenChildren(children).filter(isVnode);
  const idOf = (node, index) => keyOf(node) ?? `#pos${index}`;
  const nextIds = new Set(next.map(idOf));

  // Children that vanished this render start their exit run.
  rendered.current.forEach((node, index) => {
    const id = idOf(node, index);
    if (nextIds.has(id)) return;
    if (exiting.current.has(id) || typeof node.type !== "function") return;
    const entry = { node };
    entry.done = () => {
      exiting.current.delete(id);
      force((n) => n + 1);
    };
    exiting.current.set(id, entry);
  });

  const live = next.map((node) => {
    // A child that came back mid-exit drops its pending exit run.
    const pending = [...exiting.current.entries()].find(([, entry]) => entry.node === node);
    if (pending) exiting.current.delete(pending[0]);
    return node;
  });

  const leaving = [...exiting.current.values()].map(({ node, done }) => ({
    ...node,
    props: { ...node.props, dpExiting: true, dpOnExitComplete: done },
  }));

  rendered.current = next;

  const merged = [...live, ...leaving];
  return merged.length === 1 ? merged[0] : merged;
}

export default motion;
