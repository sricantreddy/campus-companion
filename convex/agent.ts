import { action, internalMutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { runAgent, route, intents, systemPrompt } from "../src/lib/agent";
import type { Intent } from "../src/lib/agent";
export const status = query({
  args: {},
  handler: async () => ({
    providerConfigured: Boolean(process.env.OPENROUTER_API_KEY),
    models: [
      "deterministic-v1",
      "openai/gpt-4.1-mini",
      "google/gemini-2.5-flash",
    ],
    datasetVersion: "northbridge-2026.1",
  }),
});
export const record = internalMutation({
  args: {
    sessionId: v.string(),
    createdAt: v.number(),
    intent: v.string(),
    tool: v.string(),
    latencyMs: v.number(),
    model: v.string(),
    promptVersion: v.string(),
    datasetVersion: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("runs", args);
  },
});
export const reserve = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const recent = await ctx.db
      .query("requests")
      .withIndex("by_time", (q) => q.gt("at", now - 60000))
      .take(121);
    if (recent.length >= 120)
      throw new Error("Demo rate limit reached. Try again in a minute.");
    await ctx.db.insert("requests", { at: now });
    const old = await ctx.db
      .query("requests")
      .withIndex("by_time", (q) => q.lt("at", now - 60000))
      .take(100);
    for (const row of old) await ctx.db.delete(row._id);
  },
});
export const chat = action({
  args: {
    message: v.string(),
    sessionId: v.string(),
    promptVersion: v.union(v.literal("p1"), v.literal("p2")),
    model: v.union(
      v.literal("deterministic-v1"),
      v.literal("openai/gpt-4.1-mini"),
      v.literal("google/gemini-2.5-flash"),
    ),
  },
  handler: async (ctx, args) => {
    if (args.message.length > 2000 || args.sessionId.length > 100)
      throw new Error("Request exceeds demo limits.");
    const started = performance.now();
    const policy = route(args.message, args.promptVersion);
    let selected: { intent: Intent; confidence: number } | undefined;
    const safe = ["privacy", "injection", "conflict"].includes(policy.intent);
    if (args.model !== "deterministic-v1" && !safe) {
      await ctx.runMutation(internal.agent.reserve, {});
      const key = process.env.OPENROUTER_API_KEY;
      if (!key)
        throw new Error(
          "Provider is not configured. Choose the deterministic demo.",
        );
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: args.model,
            temperature: 0,
            max_tokens: 120,
            messages: [
              { role: "system", content: systemPrompt(args.promptVersion) },
              { role: "user", content: args.message },
            ],
            response_format: { type: "json_object" },
          }),
          signal: AbortSignal.timeout(12000),
        },
      );
      if (!response.ok)
        throw new Error(
          "Provider request failed. Choose the deterministic demo or retry.",
        );
      try {
        const body = await response.json();
        const result = JSON.parse(body.choices[0].message.content);
        if (
          intents.includes(result.intent) &&
          typeof result.confidence === "number" &&
          result.confidence >= 0 &&
          result.confidence <= 1
        )
          selected = result;
        else selected = { intent: "clarify", confidence: 0 };
      } catch {
        selected = { intent: "clarify", confidence: 0 };
      }
    }
    const run = runAgent(
      args.message,
      args.promptVersion,
      selected,
      safe ? "deterministic-v1" : args.model,
      started,
    );
    await ctx.runMutation(internal.agent.record, {
      sessionId: args.sessionId,
      createdAt: Date.now(),
      intent: run.intent,
      tool: run.tool,
      latencyMs: run.latencyMs,
      model: run.model,
      promptVersion: run.promptVersion,
      datasetVersion: run.datasetVersion,
    });
    return run;
  },
});
