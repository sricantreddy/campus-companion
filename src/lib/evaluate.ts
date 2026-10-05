import golden from "../../data/golden.v1.json";
import { runAgent } from "./agent";
import type { AgentRun } from "./agent";
export function evaluateRun(
  test: (typeof golden.cases)[number],
  run: AgentRun,
) {
  return {
    id: test.id,
    message: test.message,
    expected: test.intent,
    actual: run.intent,
    passed: run.intent === test.intent && run.tool === test.tool,
    latencyMs: run.latencyMs,
  };
}
export function evaluate(version = "p1") {
  return golden.cases.map((test) =>
    evaluateRun(test, runAgent(test.message, version)),
  );
}
