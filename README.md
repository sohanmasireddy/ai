# AIv2 — WebGL2 Liquid Glass build

This project is based on the supplied `AIv2-main.zip` chatbot project and the supplied `liquidglass-main.zip` (`@ybouane/liquidglass` 1.0.3) source.

## Liquid glass implementation

The original CSS/SVG glass implementation has been removed from the frontend. The composer, model dropdown, reasoning dropdown, and every dynamically-created chat message use the supplied LiquidGlass renderer. Its shaders were adapted to GLSL ES 3.00 and its renderer requests a `webgl2` context explicitly.

The library requires each glass host to be a direct child of its root. The frontend uses `document.body` as the render root, keeps messages and the composer at that level, and portals the two dropdown menus to the body while positioning them beside their triggers. The glass canvases are inserted behind the normal DOM content, so text, selection, keyboard controls, and links remain ordinary HTML.

The scene compositor uses the page's actual background colour, city image, and a real 2D-canvas shade layer instead of the library's original white scene fill. The city image is decoded before the initial glass capture. The renderer also fixes the original shared-canvas crop region, redraws samples after scrolling, and registers new chat bubbles after they are appended.

## Browser support

The full refraction effect requires WebGL2. Current Chrome, Edge, Firefox, and Safari versions that expose WebGL2 are supported by the browser APIs used here. Browsers/devices without WebGL2 keep the chatbot usable with a simple translucent fallback; they cannot show the shader refraction.

The DOM capture helper (`html-to-image` 1.11.13) is lazy-loaded from jsDelivr as an ES module. This is needed to capture HTML content behind/inside glass panels. The rest of the LiquidGlass source and compiled JavaScript are included locally in this project. An internet connection is therefore needed for the capture helper; if that import is blocked, background-image refraction still initializes where possible, but HTML-layer capture is reduced.

## Build the modified renderer

From `frontend/glass/liquidglass` run:

```bash
npm install
npm run build
```

The generated ES modules are in `dist/` and are imported directly by `frontend/index.html`.

## App

The Python backend (`app.py`) and `requirements.txt` are retained from the supplied chatbot project. Run it using the original project's Streamlit setup and configuration.
