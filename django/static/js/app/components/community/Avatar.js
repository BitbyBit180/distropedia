import React from "dp/core/react.js";
import { Globe } from "dp/core/icons.js";
import DistroIcon from "../DistroIcon.js";
import { THEME, MONO } from "../../theme/designTokens.js";
const hueFromName = (name) => {
  let h = 0;
  const s = String(name || "?");
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
};
function UserAvatar({ name, size = 32 }) {
  const hue = hueFromName(name);
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "flex items-center justify-center shrink-0 select-none",
      style: {
        width: size,
        height: size,
        borderRadius: 9999,
        background: `hsl(${hue}, 42%, 38%)`,
        border: "1px solid rgba(255,255,255,0.18)",
        fontFamily: MONO,
        fontSize: size * 0.42,
        fontWeight: 800,
        color: "#fff"
      },
      title: name
    },
    String(name || "?")[0].toUpperCase()
  );
}
function ChannelAvatar({ channel, distro, size = 32 }) {
  const isGeneral = channel === "general";
  const accent = isGeneral ? THEME.accent : distro?.accent || THEME.silver;
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "flex items-center justify-center shrink-0",
      style: {
        width: size,
        height: size,
        borderRadius: 9999,
        background: `${accent}22`,
        border: `1px solid ${accent}66`
      },
      title: isGeneral ? "General" : distro?.name || channel
    },
    isGeneral ? /* @__PURE__ */ React.createElement(Globe, { size: size * 0.52, style: { color: accent } }) : /* @__PURE__ */ React.createElement(DistroIcon, { name: distro?.name || channel, accent, size: size * 0.58 })
  );
}
export {
  ChannelAvatar,
  UserAvatar
};
