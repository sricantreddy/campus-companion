# Deployment

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
