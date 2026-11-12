# LiquidGlass integration notes

AIv2 uses the supplied Ybouane LiquidGlass 1.0.3 library and its `LiquidGlass.init({ root, glassElements })` API. The visual template is the demo's draggable Frosted Glass panel `#glass-fp2`, originally configured as `{ floating: true, cornerRadius: 40, blurAmount: 0.5 }`. AIv2 changes only `floating` to `false` and `cornerRadius` to `20`; blur remains `0.5`, and every other material value comes from the original defaults.

The original shader and rendering implementation is retained: `GlassRenderer.ts`, `shaders.ts`, `defaults.ts`, `HtmlCapture.ts`, and `index.ts` are byte-for-byte identical to the supplied archive. `LiquidGlass.ts` has three narrowly scoped lifecycle adaptations required by this app: (1) a helper to attach newly-created chat bubbles to the already-running instance without destroying/recreating WebGL, (2) targeted invalidation for root children added after initialization, and (3) an offscreen guard that preserves the last valid glass canvas until the element returns to the viewport. The shader code and material defaults are not modified.

Because Ybouane 1.0.3 does not automatically invalidate glass panels when a custom scroll root scrolls, AIv2 calls the public `instance.markChanged(element)` API for message panels currently visible in the root. Dropdowns are invalidated when opened or repositioned. This makes panels re-sample the shared fixed city background at their current screen positions.

The project imports `html-to-image` 1.11.13 from jsDelivr via an import map; an internet connection is needed for that dependency. The supplied demo and assets are retained under `site/`.
