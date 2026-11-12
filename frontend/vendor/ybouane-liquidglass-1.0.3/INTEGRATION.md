# Ybouane LiquidGlass integration

The frontend imports the exact published package version used by the official demo:

`https://cdn.jsdelivr.net/npm/@ybouane/liquidglass@1.0.3/dist/index.js`

The source in `src/` is copied unchanged from the supplied `liquidglass-main.zip`.
The project deliberately does not rewrite the shaders, WebGL setup, capture pipeline,
lighting, refraction, or material defaults. The library's official renderer requests
WebGL 1.0 (`getContext("webgl")`); it is not converted to WebGL2 because doing so
would no longer be the exact Ybouane demo renderer.

The app uses one positioned root. Its background image and shade are direct children,
and the composer, messages, and dropdown panels are also direct children, as required
by `LiquidGlass.init({ root, glassElements })`. New messages rebuild that single
instance so the app uses one WebGL context rather than one context per message.
