# Campus Companion

A higher-education student support agent built around a simple promise: every answer must come from an authorized record or a stated planning assumption.

The workspace pairs a mobile student chat with an operational inspector. Students check attendance, coursework deadlines, project teams, semester dates, and download a 16-week study timetable. The inspector exposes intent, confidence, tool input and result, model, prompt and dataset versions, execution latency, and client round-trip latency. It never displays private chain-of-thought.

The evaluation lab runs 80 versioned synthetic cases. Change the prompt or routing model, run again, and compare against the previous run. Export both the dataset and results. The default deterministic baseline works without an API key. Optional OpenRouter models select an intent; deterministic tools produce the final record-backed answer.

## Run locally

Requires Node 24.

```sh
npm ci
npm test
npm run dev
```

Without `VITE_CONVEX_URL`, the app runs a clearly labelled local demo. To use your own backend:

```sh
npx convex dev --configure new --dev-deployment cloud
```

Convex writes the public development URL to the ignored `.env.local`. Configure your own `OPENROUTER_API_KEY` in **Convex dashboard → deployment settings → environment variables**, separately for development and production. Never paste a key into chat, fixtures, Git, a `VITE_` variable, or Vercel client environment variables. The configuration UI shows only whether a key exists.

```sh
npx convex deploy
```

Set Vercel's public `VITE_CONVEX_URL` to your **production** Convex URL, then deploy the Vite app. GitHub Actions runs `npm ci`, all tests, and the production build on every push and pull request.

## What this demonstrates

- Ten explicit intents and tools, including authorization, injection rejection, conflict clarification, and low-confidence support.
- Correct attendance arithmetic as the class denominator grows, plus semester-end targets.
- Shared, testable routing and tool logic across the local demo and validated Convex actions.
- An 80-case golden dataset and 89 automated assertions for routing, tool choice, grounding, privacy, arithmetic, timetable generation, and measured latency.
- Dark and light themes, responsive layouts, accessible controls, downloadable plans, and version comparisons.

## Scope

All university data is fictional. Maya Rao, `demo-001`, is a fixed public demo identity, not a real authenticated student. The synthetic snapshot is 5 October 2026. Records are versioned source fixtures; Convex stores run metadata, not chat messages or provider keys. Conversation history lasts for the current browser session.

Privacy routing is a conservative demo policy, not production identity verification. A real university deployment needs SSO, server-enforced student authorization, institution-owned data integrations, audit retention rules, and broader adversarial evaluation. Provider requests have a 12-second timeout, bounded output, and a global 120-per-minute demo limit. Provider usage may incur costs on the operator's account.

See [architecture](docs/architecture.md) and [deployment](docs/deployment.md).
