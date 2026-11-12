# AIv2 — Ybouane LiquidGlass integration

This version uses the exact published `@ybouane/liquidglass@1.0.3` package import used by Ybouane's own demo. The supplied source archive is preserved under `frontend/vendor/ybouane-liquidglass-1.0.3/src/`.

## Run

Install the Python requirements as usual and run `app.py`. The browser must be online to load the pinned LiquidGlass package from jsDelivr. If the package cannot load, the chatbot remains usable but the glass effect is unavailable.

## Integration notes

- CSS only positions and sizes the UI; it does not simulate liquid glass.
- The composer, each message bubble, and both dropdowns are registered with the actual Ybouane WebGL renderer.
- They are direct children of `#glass-root`, which also contains the background image used for refraction.
- Message bubbles use content-hugging widths with an 85% / 680px cap.
- Shader source and package defaults are not modified. The official library requests WebGL 1.0, as does the author's demo; this is intentionally not rewritten to WebGL2.
