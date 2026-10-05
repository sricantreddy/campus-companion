# Deployment

Public app: https://campus-companion-rouge.vercel.app

Repository: https://github.com/sricantreddy/campus-companion

Vercel is connected to GitHub. Production builds use the production Convex URL; preview and development use the separate development deployment. Only these public URLs are stored in Vercel environment variables.

Convex project: `sricantreddy/campus-companion`.

- Development: `savory-cricket-650`, https://savory-cricket-650.ap-southeast-2.convex.cloud
- Production: `fastidious-alpaca-634`, https://fastidious-alpaca-634.convex.cloud

Use `npx convex dev --once` to check and push development functions. Use `npx convex deploy` to push production functions after validation. Only the public production URL belongs in Vercel's `VITE_CONVEX_URL`.

The repository intentionally has no provider credentials or deployment tokens. Configure your own OpenRouter key in Convex, not Vercel. The demo remains usable with deterministic routing while provider configuration is absent. API routing has a global 120-request/minute limit; two consecutive large evaluation runs may require waiting for the next minute.

## Release checklist

```sh
npm ci
npm test
npm run build
npx convex dev --once
npx convex deploy
vercel --prod
```

GitHub Actions validates tests and the frontend build. Convex production deployment is an explicit operator action. Never commit `.env.local` or `.vercel`. All public records are synthetic; deploying this demo does not authorize connecting real university records.

## Verified release

On 5 October 2026, lint, 89 unit tests, the TypeScript production build, and GitHub Actions passed. The production Convex action passed all 80 golden routing/tool cases and produced a 112-session dated CSV. The public Vercel URL returned HTTP 200 without login. Desktop dark mode, light mode, student chat traces, the browser benchmark, and a 390-pixel mobile layout were checked locally. Live provider routing has not been exercised because no API key is configured.
