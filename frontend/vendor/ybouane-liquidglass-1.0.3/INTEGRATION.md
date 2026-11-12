# Integration notes

The frontend loads the pinned published package `@ybouane/liquidglass@1.0.3` and calls its documented `LiquidGlass.init()` API. The `src/` files in this folder are the original files from the user-supplied ZIP and are included unchanged for reference.

There is exactly one LiquidGlass instance with `#glass-root` as its root. The city image and shade are direct-child scene layers, followed in stacking order by message bubbles, the composer, and dropdown menus. Each registered glass element is a direct child of that same root.

The upstream renderer caches the scene behind each panel and does not subscribe to scrolling of a custom root. The app therefore calls the documented `instance.markChanged()` API on `#glass-root` scroll. This causes panels to sample the city image at their current screen coordinates instead of keeping a stale crop attached to a bubble that has moved.

The only material adjustment is `defaults: { blurAmount: 0.5 }`, matching the Frosted Glass panel in the library's demo. All other material properties use the library's built-in defaults. No shader, renderer, or WebGL implementation has been modified.
