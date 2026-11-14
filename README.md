# AIv2

LINK: https://aiv2gl.streamlit.app/

Uses Streamlit Community Cloud and the Cloudflare Workers AI API.

Uses Gemma 4, IBM Granite 4, and GPT-OSS. Has image uploads, Whisper voice recognition, image compression, and DuckDuckGo-powered web search.

Only works in Chromium-based browsers.

## LiquidGlass UI + retained NaughtyDuk LiquidGL 2.0 scrolling support

The visible chat messages, composer, settings button, and settings panel are rendered with the supplied `@ybouane/liquidglass` 1.0.3 library. The supplied library source, metadata, and original demo site are included under `frontend/vendor/liquidglass/`.

The UI surfaces use the original video-controls demo's `.glass-video-ctrl` / `.label` structure and its exact `data-config` values:

```js
{
  cornerRadius: 20,
  zRadius: 20,
  blurAmount: 0.4,
  brightness: -0.1
}
```

The `search-bubble.mp4` animated orb from the previously supplied NaughtyDuk AI Search demo remains in the composer. The original video-controls demo is preserved at `frontend/vendor/liquidglass/site/index.html` for reference.

The application imports the same published ESM build used by the library's own demo from jsDelivr:

```js
import { LiquidGlass } from "https://cdn.jsdelivr.net/npm/@ybouane/liquidglass@1.0.3/dist/index.js";
```

The source archive does not contain a prebuilt `dist/` directory, so the page needs access to jsDelivr when it loads. This avoids substituting a separately written renderer for the library's own implementation.

The original NaughtyDuk LiquidGL v2.0.0 source and its `html2canvas.min.js` dependency remain in `frontend/scripts/`. Its `syncWith()` rendering/scroll synchronization helper is initialized on a 2px invisible sentinel; it is kept separate from the visible LiquidGlass surfaces. The existing chat scrolling area remains the scroll container.

`app.py`, `requirements.txt`, and the Cloudflare/AI backend logic are unchanged from the original AIv2 project. Configure `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` in Streamlit Secrets before using the AI features.
