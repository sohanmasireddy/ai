# Orbit Chat

A SvelteKit streaming chatbot powered by OpenRouter and deployed to Cloudflare Pages.
The model picker is limited to Nemotron 3 Nano Omni (the default), 3.5 Lightning,
3 Ultra, and 3.5 Super VL. The composer also lets you choose low, medium, or high
thinking effort.

The composer accepts JPEG, PNG, and WebP images, plus TXT, MD, CSV, JSON, and
LOG files. Up to five files can be attached per message (16 MB total; 8 MB
maximum per file), and text files are limited to 80,000 characters and 256 KB.
Nano Omni compresses images to a maximum 1600-pixel dimension when that reduces
their size. Image input is available with
Nano Omni and Super VL; Lightning and Ultra accept text inputs. Use **Search
web** to include DuckDuckGo results and source links with a text question.

## Local development

Install dependencies, add your OpenRouter key to `.dev.vars`, and run the Pages
development server:

```sh
npm install
printf 'OPENROUTER_API_KEY=your-openrouter-api-key\n' > .dev.vars
npm run dev:pages
```

This builds the Svelte app and runs it with the Pages Function locally. Re-run
the command after changing frontend code. The chat endpoint streams responses
from OpenRouter using the selected model.

## Deploy to Cloudflare Pages

Create the Pages project once, set its production secret, then deploy:

```sh
npx wrangler pages project create codespaces-blank --production-branch main
npx wrangler pages secret put OPENROUTER_API_KEY --project-name codespaces-blank
npm run deploy
```

The deploy command builds the SvelteKit app and uploads the generated `build`
directory and Pages Function.
