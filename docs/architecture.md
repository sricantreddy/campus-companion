# Architecture

React + TypeScript + Vite render two screens. Tailwind CSS and repository-owned shadcn-style Button, Card, and Badge components provide the interface. `src/lib/agent.ts` owns routing, the tool catalog, attendance arithmetic, planning, reply formatting, and event traces. `data/records.ts` is the versioned synthetic university snapshot. `data/golden.v1.json` contains 80 individually authored messages and expected intent/tool pairs.

The browser either runs the deterministic demo locally or calls `convex/agent.ts`. Convex validates inputs, limits message size, applies safety routing first, optionally requests a JSON intent from OpenRouter, validates that intent and confidence, and calls a deterministic tool. Model output never writes dates, records, or answers. Low-confidence or invalid provider results trigger clarification. Privacy, prompt override, and explicit schedule conflicts bypass the provider.

Convex persists minimal execution metadata through an internal mutation. No public record mutation exists. Keys are read from deployment environment variables only. Provider errors return generic text without request headers or response bodies. Provider routes are globally limited to 120 requests per minute through an atomic reservation mutation.

The trace reports ordered operational events. Intermediate event timings are intentionally not measured; total tool/model execution and client round-trip latency are measured separately. Confidence is a routing score, not a calibrated probability of correctness. The deterministic candidate list reports matches rather than invented model scores.

Planning generates 112 dated CSV sessions at 18:00–20:00 IST, spanning 16 weeks and four next-semester courses. Since next-semester class slots are unavailable, the plan explicitly asks the student to confirm availability. Explicit conflicts return clarification without a downloadable timetable.

## Evaluation boundaries

The browser benchmark asserts exact intent and tool choice and reports measured latency. Unit tests separately verify attendance math, exact source dates, missing deadline refusal, privacy precedence over model output, injection handling, low-confidence routing, conflict handling, and 112 unique daily plan sessions. This is a small synthetic benchmark, not evidence of production readiness or general model quality.

Prompt p1 selects the first clear intent. Prompt p2 asks for clarification when a message contains multiple intents. The model configuration is an allowlist; clients cannot supply arbitrary endpoints or API credentials. Compare a second run to the previous configuration, or use the other deterministic prompt as the first-run reference.
