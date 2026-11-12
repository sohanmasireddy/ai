# AIv2 — Ybouane LiquidGlass integration

This build uses the supplied `@ybouane/liquidglass` 1.0.3 library for the chat composer, chat-message bubbles, model menu, and reasoning menu. The original AIv2 backend and frontend behavior are retained.

The visual template is the demo's draggable **Frosted Glass** panel (`#glass-fp2` in `site/index.html`), whose original per-element settings are:

```js
{ floating: true, cornerRadius: 40, blurAmount: 0.5 }
```

The only material changes requested for AIv2 are `floating: false` and `cornerRadius: 20`; `blurAmount: 0.5` and all other library defaults are preserved. Elements are sized by the chatbot layout.

The library's original rendering pipeline uses WebGL 1.0. This build deliberately preserves that implementation rather than converting the shaders or changing the effect. The supplied original demo and assets are under `frontend/vendor/ybouane-liquidglass/site/`.

## Runtime dependency

The original library uses `html-to-image` 1.11.13. The browser import map loads it from jsDelivr, so the browser needs network access to that CDN.
