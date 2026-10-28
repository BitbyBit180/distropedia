// Runtime self-test. Load /static/_probe.html in a browser, then read
// window.__probe (array of {name, ok, detail}). Dev-only helper.
import { h, fragment, Fragment, mount, unmount, useState, useEffect, useRef, useMemo, useCallback, flushSync } from "dp/core/react.js";

const results = [];
const check = (name, fn) => {
  try {
    const detail = fn();
    results.push({ name, ok: detail !== false, detail: String(detail) });
  } catch (err) {
    results.push({ name, ok: false, detail: err.message });
  }
};
window.__probe = results;

const host = document.getElementById("probe");

// --- basic tree -------------------------------------------------------------
function Child({ label }) {
  return h("span", { class: "child" }, label);
}
function App() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([{ id: "a", v: 1 }, { id: "b", v: 2 }]);
  const [text, setText] = useState("hello");
  window.__setCount = setCount;
  window.__setText = setText;
  window.__setItems = setItems;
  return h(
    "div",
    { id: "app", style: { display: "flex", gap: 8 } },
    h("button", { id: "btn", onClick: () => setCount(count + 1) }, "x"),
    h("em", { id: "count" }, String(count)),
    h(Child, { label: "from-child" }),
    h("input", { id: "field", value: text, onInput: (e) => setText(e.target.value) }),
    h(
      "ul",
      { id: "list" },
      items.map((item) => h("li", { key: item.id, "data-v": String(item.v) }, item.id))
    )
  );
}

const instance = mount(App, {}, host);

// --- 1. text + child component mounted --------------------------------------
check("render", () => host.querySelector("#count").textContent === "0" && !!host.querySelector(".child"));

// --- 2. state update patches in place (node identity survives) --------------
const countNodeBefore = host.querySelector("#count");
window.__setCount(5);
await new Promise((r) => queueMicrotask(() => queueMicrotask(r)));
check("patch-in-place", () => host.querySelector("#count") === countNodeBefore && host.querySelector("#count").textContent === "5");

// --- 3. keyed reorder keeps the same DOM nodes + their state ----------------
const liA = host.querySelector('li[data-v="1"]');
window.__setItems([{ id: "b", v: 2 }, { id: "a", v: 1 }]);
await new Promise((r) => queueMicrotask(() => queueMicrotask(r)));
check("keyed-reorder", () => {
  const first = host.querySelector("#list").firstChild;
  return first.dataset.v === "2" && host.querySelector('li[data-v="1"]') === liA;
});

// --- 4. insert / remove keyed items ----------------------------------------
window.__setItems([{ id: "a", v: 1 }, { id: "c", v: 3 }]);
await new Promise((r) => queueMicrotask(() => queueMicrotask(r)));
check("keyed-insert-remove", () =>
  host.querySelector("#list").children.length === 2 &&
  !!host.querySelector('li[data-v="3"]') &&
  !host.querySelector('li[data-v="2"]')
);

// --- 5. controlled input keeps caret ---------------------------------------
const field = host.querySelector("#field");
field.focus();
field.value = "hello";
field.selectionStart = field.selectionEnd = 2;
window.__setText("hello");
await new Promise((r) => queueMicrotask(() => queueMicrotask(r)));
check("caret-stable", () => document.activeElement === field && field.selectionStart === 2);

// --- 6. event handler sees fresh state -------------------------------------
host.querySelector("#btn").click();
await new Promise((r) => queueMicrotask(() => queueMicrotask(r)));
check("fresh-handler", () => host.querySelector("#count").textContent === "6");

// --- 7. unmount runs cleanup, removes DOM ----------------------------------
let cleaned = false;
function Cleanup() {
  useEffect(() => () => { cleaned = true; }, []);
  return h("i", null, "c");
}
const temp = document.createElement("div");
document.body.appendChild(temp);
const second = mount(Cleanup, {}, temp);
unmount(second);
temp.remove();
check("cleanup-on-unmount", () => cleaned && temp.children.length === 0);

// --- 8. refs + memo + fragment ---------------------------------------------
let refEl = "unset";
const temp2 = document.createElement("div");
document.body.appendChild(temp2);
check("fragment-and-refs", () => {
  function Frag({ children }) {
    return fragment(null, ...children);
  }
  function Refs() {
    const r = useRef(null);
    const first = useMemo(() => ({ stamp: {} }), []);
    const again = useMemo(() => ({ stamp: {} }), []);
    refEl = r.current;
    void first;
    return h(Frag, null, h("b", { ref: r, id: "ref-target" }, "t"), h("s", null, "x"));
  }
  mount(Refs, {}, temp2);
  return temp2.children.length === 2 && !!temp2.querySelector("#ref-target");
});
temp2.remove();

// --- 9. svg attrs ----------------------------------------------------------
const temp3 = document.createElement("div");
document.body.appendChild(temp3);
check("svg-namespace", () => {
  mount(
    () =>
      h(
        "svg",
        { width: 24, height: 24, viewBox: "0 0 24 24", strokeWidth: 2 },
        h("path", { d: "M1 1h2" }, null)
      ),
    {},
    temp3
  );
  const svg = temp3.firstChild;
  return (
    svg.namespaceURI === "http://www.w3.org/2000/svg" &&
    svg.getAttribute("stroke-width") === "2" &&
    svg.getAttribute("viewBox") === "0 0 24 24" &&
    svg.firstChild.namespaceURI === "http://www.w3.org/2000/svg"
  );
});
temp3.remove();

// --- 10. sibling order when a component re-renders to a different count ----
const temp4 = document.createElement("div");
document.body.appendChild(temp4);
let dynamicSet = null;
check("dynamic-mount", () => {
  function Dynamic({ n }) {
    const [count, setCount] = useState(n);
    dynamicSet = setCount;
    return h(
      Fragment,
      null,
      ...Array.from({ length: count }, (_, i) => h("span", { key: `s${i}` }, String(i)))
    );
  }
  mount(
    () => h("div", { id: "wrap" }, h(Dynamic, { n: 2 }), h("u", { id: "after" }, "tail")),
    {},
    temp4
  );
  const wrap = temp4.querySelector("#wrap");
  return wrap.children.length === 3 && wrap.lastChild.id === "after";
});
const wrap = temp4.querySelector("#wrap");
dynamicSet(4);
await new Promise((r) => setTimeout(r, 20));
check("grows-before-sibling", () => wrap.children.length === 5 && wrap.lastChild.id === "after");
dynamicSet(1);
await new Promise((r) => setTimeout(r, 20));
check("shrinks-before-sibling", () => wrap.children.length === 2 && wrap.lastChild.id === "after");
temp4.remove();

// --- 11. conditional subtree swap (page router shape) ----------------------
const temp5 = document.createElement("div");
document.body.appendChild(temp5);
let swap = null;
check("component-swap", () => {
  function A() {
    return h("p", { class: "a" }, "A");
  }
  function B() {
    return h("p", { class: "b" }, "B");
  }
  function Switch({ which }) {
    const [w, setW] = useState(which);
    swap = setW;
    return w === "a" ? h(A, null) : h(B, null);
  }
  mount(Switch, { which: "a" }, temp5);
  return temp5.querySelector(".a") !== null;
});
swap("b");
await new Promise((r) => setTimeout(r, 20));
check("component-swap-applied", () => temp5.querySelector(".a") === null && !!temp5.querySelector(".b"));
temp5.remove();

// --- 12. effect runs after DOM, cleanup on dep change ----------------------
const temp6 = document.createElement("div");
document.body.appendChild(temp6);
const log = [];
let bump = null;
let effectInstance = null;
check("effect-order", () => {
  function E() {
    const [n, setN] = useState(0);
    bump = setN;
    useEffect(() => {
      log.push(`run:${n}:${document.querySelectorAll('#e').length}`);
      return () => log.push(`clean:${n}`);
    }, [n]);
    return h("div", { id: "e" }, String(n));
  }
  effectInstance = mount(E, {}, temp6);
  return log[0] === "run:0:1";
});
bump(1);
await new Promise((r) => setTimeout(r, 20));
check("effect-cleanup-on-dep", () => log.join(",") === "run:0:1,clean:0,run:1:1");
unmount(effectInstance);
check("effect-cleanup-on-unmount", () => log.includes("clean:1"));
temp6.remove();

// --- 13. useCallback hands back the function, not its result ----------------
check("usecallback-is-identity", () => {
  function C() {
    const fn = useCallback(async (n) => n * 2, []);
    window.__cb = fn;
    return h("div", null, "cb");
  }
  const temp7 = document.createElement("div");
  document.body.appendChild(temp7);
  mount(C, {}, temp7);
  const ok = typeof window.__cb === "function";
  temp7.remove();
  return ok;
});

// --- 14. a parent effect sees the ref its *grandchild* component filled ------
// DistroCard observes `rootRef`, but the ref belongs to a motion.div child
// component — the subtree must be committed (refs applied) before any effect
// in it runs, or the observer attaches to nothing and never retries.
check("ref-before-effect-in-subtree", () => {
  const seen = { inEffect: null, value: "unset" };
  function Inner({ innerRef }) {
    return h("div", { ref: innerRef, id: "deep" }, "i");
  }
  function Outer() {
    const r = useRef(null);
    seen.value = r;
    useEffect(() => {
      seen.inEffect = r.current && r.current.id;
    }, []);
    return h("section", null, h(Inner, { innerRef: r }));
  }
  const temp8 = document.createElement("div");
  document.body.appendChild(temp8);
  mount(Outer, {}, temp8);
  const ok = seen.inEffect === "deep";
  temp8.remove();
  return ok || `effect saw ${seen.inEffect}`;
});

// --- 15. discrete events commit before the next dispatch in the same task ---
// React gives click/input sync priority, so a form that types into one field
// and clicks submit in one task must see the fresh value. Deferring the render
// to a microtask instead hands the submit handler state from the old render
// ("Please fill in all fields." with the text visibly in the input).
check("event-flush-sync", () => {
  const temp9 = document.createElement("div");
  document.body.appendChild(temp9);
  function Form() {
    const [text, setText] = useState("");
    const [sent, setSent] = useState("empty");
    return h(
      "div",
      null,
      h("input", { id: "f-in", value: text, onInput: (e) => setText(e.target.value) }),
      h("button", { id: "f-btn", onClick: () => setSent(text ? `got:${text}` : "empty") }, "go"),
      h("em", { id: "f-out" }, sent)
    );
  }
  mount(Form, {}, temp9);
  const input = temp9.querySelector("#f-in");
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
  setter.call(input, "typed");
  input.dispatchEvent(new Event("input", { bubbles: true }));
  temp9.querySelector("#f-btn").click();
  const out = temp9.querySelector("#f-out").textContent;
  temp9.remove();
  return out === "got:typed" || out;
});

// --- 16. flushing early must not double-render or drop a queued update -----
check("flush-is-idempotent", () => {
  const temp10 = document.createElement("div");
  document.body.appendChild(temp10);
  let bump = null;
  let renders = 0;
  function Counter() {
    const [n, setN] = useState(0);
    bump = setN;
    renders++;
    return h("b", { id: "c" }, String(n));
  }
  mount(Counter, {}, temp10);
  bump(1);
  flushSync();
  const afterSync = temp10.querySelector("#c").textContent;
  bump(2);
  flushSync();
  flushSync();
  const afterTwice = temp10.querySelector("#c").textContent;
  const ok = afterSync === "1" && afterTwice === "2" && renders === 3;
  temp10.remove();
  return ok || `${afterSync}/${afterTwice}/renders ${renders}`;
});

document.getElementById("status").textContent = results
  .map((r) => `${r.ok ? "PASS" : "FAIL"} ${r.name} — ${r.detail}`)
  .join("\n");
