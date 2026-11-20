# Orbit Chat

A SvelteKit streaming chatbot powered by OpenRouter and deployed to Cloudflare Pages.

## Local development

Install dependencies, add your OpenRouter key to `.dev.vars`, and run the Pages
development server:

```sh
npm install
printf 'OPENROUTER_API_KEY=your-openrouter-api-key\n' > .dev.vars
npm run dev:pages
```

This builds the Svelte app and runs it with the Pages Function locally. Re-run
the command after changing frontend code. The chat endpoint uses the
`nvidia/nemotron-3.5-super-vl:free` model and streams responses from OpenRouter.

## Deploy to Cloudflare Pages

Create the Pages project once, set its production secret, then deploy:

```sh
npx wrangler pages project create codespaces-blank --production-branch main
npx wrangler pages secret put OPENROUTER_API_KEY --project-name codespaces-blank
npm run deploy
```

The deploy command builds the SvelteKit app and uploads the generated `build`
directory and Pages Function.
