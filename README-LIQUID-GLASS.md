# AIv2 — Ybouane LiquidGlass integration

This build starts from the original `AIv2-main.zip` chatbot and integrates the supplied `@ybouane/liquidglass` 1.0.3 library through its published `LiquidGlass.init()` API.

## Shared scene and scrolling

- There is one `#glass-root` and one `LiquidGlass` instance for the entire chat.
- The city image is one fixed, viewport-aligned direct-child image layer. A single dark shade layer sits above it, matching the stacking order in Ybouane's demo.
- The message bubbles, composer, model menu, and reasoning menu are registered as direct children of that same root.
- Every root scroll calls the library's documented `instance.markChanged()` method. This is important because the upstream 1.0.3 renderer does not itself subscribe to scrolling of a custom root; without invalidation, the previous sampled crop stays attached to a moving bubble.
- Dropdowns stay mounted off-screen while closed so the library can capture their real HTML content at initialization. They move next to their trigger when opened.
- Messages use content-sized widths (`fit-content`) and a maximum width; they do not stretch across the chat.

## Frosted material

The library's raw defaults set `blurAmount` to `0.00`, which is clear rather than frosted. This app uses only the library demo's Frosted Glass preview blur value (`blurAmount: 0.5`). Every other material property remains at the library's original defaults. No per-element custom configurations are added.

## Source and dependency

- The supplied `src/` files are stored under `frontend/vendor/ybouane-liquidglass-1.0.3/` and verified unchanged against the original library ZIP.
- The frontend imports the pinned published package `@ybouane/liquidglass@1.0.3` from jsDelivr, as the library's own demo does. Internet access is required for the runtime package.
- No shader, renderer, or WebGL code from Ybouane's package has been modified. Version 1.0.3 requests WebGL 1 in its own source; this build preserves that renderer instead of converting it.
- The former `frontend/glass/liquid-glass.css` and `liquid-glass.js` renderer are removed.
