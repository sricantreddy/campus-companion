import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
export default defineSchema({
  requests: defineTable({ at: v.number() }).index("by_time", ["at"]),
  runs: defineTable({
    sessionId: v.string(),
    createdAt: v.number(),
    intent: v.string(),
    tool: v.string(),
    latencyMs: v.number(),
    model: v.string(),
    promptVersion: v.string(),
    datasetVersion: v.string(),
  }).index("by_session", ["sessionId"]),
});
