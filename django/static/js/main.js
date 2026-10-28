/**
 * Entry point — what main.jsx did: mount the shell into the `<main>` the SPA
 * template already rendered. HeroUIProvider is gone; its job (the CSS-variable
 * theme and the ripple/context) is covered by the compiled `--heroui` tokens and
 * by static/js/core/heroui.js, which renders the same DOM.
 */
import { mount } from "./core/react.js";
import App from "./core/router.js";

const container = document.querySelector("#root main");

mount(App, {}, container);
