/**
 * @heroui/react v2.8 stand-in (Card / Chip / HeroUIProvider).
 *
 * Only HeroSection uses these, and the app's own `style` props already carry
 * every visual property. The class strings below are copied from
 * @heroui/theme's `card` / `chip` slots (`slots.base` + the size/variant/radius
 * that the call sites select), because tailwind.config.js scans
 * @heroui/theme/dist — those utilities are part of the compiled stylesheet, so
 * dropping them would change layout (`h-7`, `px-1`, `overflow-hidden`,
 * `rounded-full`). The theme-colour classes (`bg-content1`, `border-medium`,
 * `text-small`, …) are inert in the shipped CSS but are kept verbatim so the
 * DOM matches the React build node for node.
 */
import React from "dp/core/react.js";

const CARD_BASE =
  "flex flex-col relative overflow-hidden h-auto outline-solid outline-transparent text-foreground box-border bg-content1 rounded-none";

const CHIP_BASE =
  "relative max-w-fit min-w-min inline-flex items-center justify-between box-border whitespace-nowrap";

const CHIP_SIZES = {
  sm: { base: "px-1 h-6 text-tiny", content: "px-1" },
  md: { base: "px-1 h-7 text-small", content: "px-2" },
  lg: { base: "px-2 h-8 text-medium", content: "px-2" },
};

const CHIP_VARIANTS = {
  solid: "",
  bordered: "border-medium bg-transparent",
  light: "bg-transparent",
  flat: "",
  faded: "border-medium",
  shadow: "",
  dot: "border-medium border-default text-foreground bg-transparent",
};

/** `data-slot` attributes are what HeroUI's own CSS selectors key on. */
export const Card = ({ children, className = "", ...props }) =>
  React.createElement("div", { ...props, "data-slot": "card", className: `${CARD_BASE} ${className}`.trim() }, children);

export const Chip = ({ children, className = "", variant = "solid", size = "md", color = "default", ...props }) => {
  const dimensions = CHIP_SIZES[size] || CHIP_SIZES.md;
  const wrapper = [
    CHIP_BASE,
    CHIP_VARIANTS[variant] || "",
    dimensions.base,
    "rounded-full",
    `${CHIP_VARIANTS[variant] ? "border-default" : ""}`,
    variant === "bordered" || variant === "dot" ? "text-foreground" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ");
  return React.createElement(
    "div",
    { ...props, "data-slot": "chip", className: wrapper },
    React.createElement(
      "span",
      { "data-slot": "chip-content", className: `flex-1 text-inherit font-normal ${dimensions.content}` },
      children
    )
  );
};

export const Button = ({ children, className = "", ...props }) =>
  React.createElement("button", { type: "button", ...props, "data-slot": "button", className }, children);

/** HeroUIProvider only supplied theme context + ripple styles. */
export const HeroUIProvider = ({ children }) => children;

export default { Card, Chip, Button, HeroUIProvider };
