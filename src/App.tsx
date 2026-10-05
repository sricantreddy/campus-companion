import { useEffect, useRef, useState } from "react";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import {
  ArrowUp,
  ArrowUpRight,
  Check,
  ChevronRight,
  Download,
  FlaskConical,
  GraduationCap,
  MessageSquare,
  Moon,
  Plus,
  Sun,
  Terminal,
  X,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { catalog, runAgent, systemPrompt } from "./lib/agent";
import type { AgentRun } from "./lib/agent";
import { evaluate, evaluateRun } from "./lib/evaluate";
import golden from "../data/golden.v1.json";
const client = import.meta.env.VITE_CONVEX_URL
  ? new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL)
  : null;
const chatRef = makeFunctionReference<"action">("agent:chat");
const statusRef = makeFunctionReference<"query">("agent:status");
const suggestions = [
  "How is my attendance?",
  "What deadlines are coming up?",
  "Who is on my project team?",
  "When does next semester start?",
  "Build a two-hour daily study plan",
];
const sessionId = crypto.randomUUID();
const now = () => performance.now();
function download(content: string, name: string, type = "text/csv") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function App() {
  const [page, setPage] = useState("workspace");
  const [theme, setTheme] = useState(
    () => localStorage.getItem("campus-theme") || "dark",
  );
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [active, setActive] = useState<AgentRun | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [prompt, setPrompt] = useState("p1");
  const [model, setModel] = useState("deterministic-v1");
  const [provider, setProvider] = useState(false);
  const [backend, setBackend] = useState(client ? "Connecting" : "Local demo");
  const [results, setResults] = useState<ReturnType<typeof evaluate>>([]);
  const [comparison, setComparison] = useState<ReturnType<typeof evaluate>>([]);
  const [evalBusy, setEvalBusy] = useState(false);
  const [evalProgress, setEvalProgress] = useState(0);
  const [resultLabel, setResultLabel] = useState("");
  const [comparisonLabel, setComparisonLabel] = useState(
    "Other prompt · deterministic baseline",
  );
  const [tab, setTab] = useState("trace");
  const [filter, setFilter] = useState("all");
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("campus-theme", theme);
  }, [theme]);
  useEffect(() => {
    if (client)
      client
        .query(statusRef, {})
        .then((s) => {
          setProvider(s.providerConfigured);
          setBackend("Convex connected");
        })
        .catch(() => setBackend("Backend unavailable"));
  }, []);
  useEffect(() => {
    if (runs.length || busy)
      bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [runs, busy]);
  async function send(message: string) {
    if (!message.trim() || busy) return;
    setBusy(true);
    setInput("");
    setError("");
    try {
      const start = now();
      const run: AgentRun = client
        ? await client.action(chatRef, {
            message: message.trim(),
            sessionId,
            promptVersion: prompt,
            model,
          })
        : runAgent(message.trim(), prompt);
      run.trace.push({
        name: "Client round trip",
        elapsedMs: now() - start,
        detail: { transport: client ? "Convex HTTPS" : "local execution" },
      });
      setRuns((prev) => [...prev, run]);
      setActive(run);
    } catch {
      setError(
        "The request could not complete. Try again or select the deterministic demo.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function runEvaluation() {
    setEvalBusy(true);
    setEvalProgress(0);
    setError("");
    const output: ReturnType<typeof evaluate> = [];
    try {
      for (const test of golden.cases) {
        const run: AgentRun =
          client && model !== "deterministic-v1"
            ? await client.action(chatRef, {
                message: test.message,
                sessionId,
                promptVersion: prompt,
                model,
              })
            : runAgent(test.message, prompt);
        output.push(evaluateRun(test, run));
        setEvalProgress(output.length);
      }
      if (results.length) {
        setComparison(results);
        setComparisonLabel(resultLabel);
      } else {
        setComparison(evaluate(prompt === "p1" ? "p2" : "p1"));
        setComparisonLabel(
          `${prompt === "p1" ? "p2" : "p1"} · deterministic baseline`,
        );
      }
      setResults(output);
      setResultLabel(`${prompt} · ${model}`);
    } catch {
      setError(
        "Evaluation stopped after a provider failure. Partial results are shown.",
      );
      setResults(output);
    } finally {
      setEvalBusy(false);
    }
  }
  const passed = results.filter((r) => r.passed).length;
  return (
    <div className="app-shell">
      <header>
        <a className="brand" href="#" onClick={() => setPage("workspace")}>
          <span className="brand-icon">
            <GraduationCap size={20} />
          </span>
          Campus<span className="muted">Companion</span>
        </a>
        <nav aria-label="Main navigation">
          <Button
            variant={page === "workspace" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setPage("workspace")}
          >
            <MessageSquare />
            Workspace
          </Button>
          <Button
            variant={page === "lab" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setPage("lab")}
          >
            <FlaskConical />
            Evaluation lab
          </Button>
        </nav>
        <div className="header-end">
          <Badge className="demo-badge">Synthetic data only</Badge>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Switch theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </Button>
          <div className="avatar small">MR</div>
        </div>
      </header>
      <main>
        <div className="eyebrow">
          <span className="status-dot" />
          {backend.toUpperCase()}{" "}
          <span className="muted">/ NORTHBRIDGE UNIVERSITY</span>
        </div>
        <div className="page-heading">
          <div>
            <h1>
              {page === "workspace"
                ? "Student support, with receipts."
                : "Test the agent. Inspect the evidence."}
            </h1>
            <p>
              {page === "workspace"
                ? "A student conversation on the left. Every routing decision and tool result on the right."
                : "A versioned benchmark for useful answers, safe access, and honest uncertainty."}
            </p>
          </div>
          <Badge>
            Portfolio demo <ArrowUpRight size={12} />
          </Badge>
        </div>
        {error && (
          <div role="alert" className="error">
            {error}
            <Button
              size="icon"
              variant="ghost"
              aria-label="Dismiss error"
              onClick={() => setError("")}
            >
              <X />
            </Button>
          </div>
        )}
        {page === "workspace" ? (
          <>
            <div className="workspace-grid">
              <section className="student-side">
                <div className="section-caption">
                  <span>01 / STUDENT EXPERIENCE</span>
                  <span>LIVE CONVERSATION</span>
                </div>
                <Card className="phone">
                  <div className="phone-status">
                    <span>9:41</span>
                    <span>● ● ▰</span>
                  </div>
                  <div className="chat-heading">
                    <span className="brand-icon">
                      <GraduationCap size={22} />
                    </span>
                    <div>
                      <strong>Campus Companion</strong>
                      <small>Your semester, in one place</small>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="New conversation"
                      onClick={() => {
                        setRuns([]);
                        setActive(null);
                      }}
                    >
                      <Plus />
                    </Button>
                  </div>
                  <div className="student-context">
                    <div className="avatar">MR</div>
                    <div>
                      <strong>Maya Rao</strong>
                      <small>BSc Computer Science · Semester 3</small>
                    </div>
                    <Badge>Demo</Badge>
                  </div>
                  <div className="chat-scroll" aria-live="polite">
                    {runs.length === 0 ? (
                      <div className="welcome">
                        <div className="welcome-icon">
                          <MessageSquare size={25} />
                        </div>
                        <h2>
                          A little clarity for
                          <br />
                          your busy semester.
                        </h2>
                        <p>
                          Hi Maya. Ask about your classes, upcoming work, or
                          your next semester.
                        </p>
                        <div className="suggestions">
                          {suggestions.map((s) => (
                            <button
                              key={s}
                              onClick={() => send(s)}
                              disabled={busy}
                            >
                              {s}
                              <ArrowUpRight size={14} />
                            </button>
                          ))}
                        </div>
                        <small className="muted">
                          Grounded in synthetic university records
                          <br />
                          Snapshot · 5 October 2026 · IST
                        </small>
                      </div>
                    ) : (
                      runs.map((r) => (
                        <div key={r.id} className="conversation">
                          <div className="user-bubble">{r.message}</div>
                          <div className="assistant-label">
                            <GraduationCap size={14} />
                            Campus Companion
                          </div>
                          <div className="assistant-bubble">
                            {r.reply}
                            {r.download && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  download(
                                    r.download!,
                                    "maya-semester-4-timetable.csv",
                                  )
                                }
                              >
                                <Download />
                                Download timetable
                              </Button>
                            )}
                          </div>
                          <button
                            className="receipt"
                            onClick={() => {
                              setActive(r);
                              setTab("trace");
                            }}
                          >
                            <Check size={12} />
                            {r.tool} · {r.latencyMs.toFixed(1)} ms
                            <ChevronRight size={12} />
                          </button>
                        </div>
                      ))
                    )}
                    {busy && <div className="thinking">Checking records…</div>}
                    <div ref={bottom} />
                  </div>
                  <form
                    className="composer"
                    onSubmit={(e) => {
                      e.preventDefault();
                      send(input);
                    }}
                  >
                    <label className="sr-only" htmlFor="message">
                      Your message
                    </label>
                    <input
                      id="message"
                      maxLength={2000}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask about your semester…"
                      disabled={busy}
                    />
                    <Button
                      size="icon"
                      type="submit"
                      disabled={busy || !input.trim()}
                      aria-label="Send message"
                    >
                      <ArrowUp />
                    </Button>
                  </form>
                  <div className="phone-footer">
                    Your demo identity is fixed. Only your records are
                    accessible.
                  </div>
                </Card>
              </section>
              <section className="inspector-side">
                <div className="section-caption">
                  <span>02 / AGENT INSPECTOR</span>
                  <span>STRUCTURED TRACE</span>
                </div>
                <Card className="inspector">
                  <div className="inspector-heading">
                    <div>
                      <Terminal size={19} />
                      <strong>Behind the reply</strong>
                    </div>
                    <Badge>{active ? "Complete" : "Awaiting message"}</Badge>
                  </div>
                  <div className="inspector-meta">
                    <div>
                      <small>MODEL</small>
                      <span>{active?.model || model}</span>
                    </div>
                    <div>
                      <small>PROMPT / DATASET</small>
                      <span>{active?.promptVersion || prompt} / 2026.1</span>
                    </div>
                    <div>
                      <small>EXECUTION</small>
                      <span>
                        {active ? `${active.latencyMs.toFixed(1)} ms` : "—"}
                      </span>
                    </div>
                  </div>
                  <div className="inspector-tabs">
                    <button
                      className={tab === "trace" ? "selected" : ""}
                      onClick={() => setTab("trace")}
                    >
                      Event trace
                    </button>
                    <button
                      className={tab === "result" ? "selected" : ""}
                      onClick={() => setTab("result")}
                    >
                      Tool result
                    </button>
                    <button
                      className={tab === "history" ? "selected" : ""}
                      onClick={() => setTab("history")}
                    >
                      Run history <span>{runs.length}</span>
                    </button>
                  </div>
                  {!active ? (
                    <div className="inspector-empty">
                      <div className="empty-diagram">
                        <span>Message</span>
                        <ChevronRight />
                        <span>Tool</span>
                        <ChevronRight />
                        <span>Reply</span>
                      </div>
                      <h3>Every answer has a trail.</h3>
                      <p>
                        Send a message to see the selected intent, tool inputs,
                        source records, and response.
                      </p>
                      <small>
                        Operational events only. No private chain-of-thought.
                      </small>
                      <div className="example-route">
                        <small>TRY AN ATTENDANCE QUESTION</small>
                        <code>
                          getAttendance → threshold calculation → reply
                        </code>
                      </div>
                    </div>
                  ) : tab === "trace" ? (
                    <div className="trace-list">
                      {active.trace.map((s, i) => (
                        <details key={s.name} open={i === 3}>
                          <summary>
                            <span className="step-index">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span>{s.name}</span>
                            <small>
                              {s.elapsedMs > 0
                                ? `${s.elapsedMs.toFixed(1)} ms`
                                : "event"}
                            </small>
                            <ChevronRight size={13} />
                          </summary>
                          <pre>{JSON.stringify(s.detail, null, 2)}</pre>
                        </details>
                      ))}
                      <p className="trace-note">
                        Confidence {(active.confidence * 100).toFixed(0)}% ·{" "}
                        {active.mode}. Intermediate events are ordered; only
                        total execution and round-trip latency are timed.
                      </p>
                    </div>
                  ) : tab === "result" ? (
                    <div className="result-panel">
                      <Badge>{active.tool}</Badge>
                      <pre>{JSON.stringify(active.result, null, 2)}</pre>
                    </div>
                  ) : (
                    <div className="history">
                      {runs
                        .slice()
                        .reverse()
                        .map((r) => (
                          <button
                            key={r.id}
                            onClick={() => {
                              setActive(r);
                              setTab("trace");
                            }}
                          >
                            <span>{r.message}</span>
                            <small>
                              {r.intent} · {r.latencyMs.toFixed(1)} ms
                            </small>
                          </button>
                        ))}
                    </div>
                  )}
                </Card>
                <div className="trust-note">
                  <Check size={16} />
                  <p>
                    Records first. Replies cite the synthetic source. Access
                    checks run before model routing.
                  </p>
                </div>
              </section>
            </div>
            <div className="bottom-strip">
              <span>
                <GraduationCap size={16} />
                Built for the questions students actually ask.
              </span>
              <button onClick={() => setPage("lab")}>
                Explore the evaluation lab <ArrowUpRight size={15} />
              </button>
            </div>
          </>
        ) : (
          <div className="lab">
            <div className="lab-top">
              <Card className="goal">
                <Badge>PRODUCT GOAL</Badge>
                <h2>
                  Help students act on
                  <br />
                  reliable academic information.
                </h2>
                <p>
                  Answer routine questions from authorized records, explain
                  attendance targets, and turn next-semester goals into a usable
                  study timetable.
                </p>
                <div className="goal-stats">
                  <div>
                    <strong>80</strong>
                    <small>Golden cases</small>
                  </div>
                  <div>
                    <strong>10</strong>
                    <small>Intents & tools</small>
                  </div>
                  <div>
                    <strong>32</strong>
                    <small>Safety & uncertainty cases</small>
                  </div>
                </div>
              </Card>
              <Card className="config">
                <div className="card-title">
                  <h3>Run configuration</h3>
                  <Badge>
                    {provider ? "Provider configured" : "No provider key"}
                  </Badge>
                </div>
                <label htmlFor="prompt">Prompt version</label>
                <select
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                >
                  <option value="p1">p1 · Direct routing</option>
                  <option value="p2">p2 · Clarify multiple intents</option>
                </select>
                <label htmlFor="model">Routing model</label>
                <select
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                >
                  <option value="deterministic-v1">
                    Deterministic baseline · no API required
                  </option>
                  <option disabled={!provider} value="openai/gpt-4.1-mini">
                    OpenRouter · GPT-4.1 mini
                  </option>
                  <option disabled={!provider} value="google/gemini-2.5-flash">
                    OpenRouter · Gemini 2.5 Flash
                  </option>
                </select>
                <small>
                  Keys stay in Convex. Run a second configuration to compare it
                  with your previous results. Model routing is optional; replies
                  always come from tool records.
                </small>
                <Button onClick={runEvaluation} disabled={evalBusy}>
                  <FlaskConical />
                  {evalBusy
                    ? `Testing ${evalProgress}/80…`
                    : "Run 80-case benchmark"}
                </Button>
              </Card>
            </div>
            <div className="evaluation-heading">
              <div>
                <h2>Golden benchmark</h2>
                <p>
                  golden-1.0.0 · northbridge-2026.1 · Intent and tool assertions
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  download(
                    JSON.stringify(golden, null, 2),
                    "golden-1.0.0.json",
                    "application/json",
                  )
                }
              >
                <Download />
                Dataset
              </Button>
            </div>
            <Card className="evaluation-card">
              <div className="evaluation-summary">
                <div>
                  <strong>
                    {results.length ? `${passed}/${results.length}` : "—"}
                  </strong>
                  <small>
                    {results.length
                      ? `Passed · ${resultLabel}`
                      : "Run the benchmark to see results"}
                  </small>
                </div>
                <div>
                  <strong>
                    {results.length
                      ? `${(results.reduce((n, r) => n + r.latencyMs, 0) / results.length).toFixed(1)} ms`
                      : "—"}
                  </strong>
                  <small>Mean execution latency</small>
                </div>
                <div>
                  <strong>
                    {comparison.length
                      ? `${comparison.filter((r) => r.passed).length}/80`
                      : "—"}
                  </strong>
                  <small>{comparisonLabel}</small>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!results.length}
                  onClick={() =>
                    download(
                      JSON.stringify(
                        { label: resultLabel, results, comparison },
                        null,
                        2,
                      ),
                      "evaluation-results.json",
                      "application/json",
                    )
                  }
                >
                  <Download />
                  Export results
                </Button>
              </div>
              <div className="table-controls">
                <span>80 fixed synthetic cases</span>
                <select
                  aria-label="Filter test cases"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All cases</option>
                  <option value="safety">Safety & uncertainty</option>
                  <option value="functional">Functional</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Case</th>
                      <th>Student message</th>
                      <th>Expected intent / tool</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {golden.cases
                      .filter(
                        (c) =>
                          filter === "all" ||
                          filter === c.category ||
                          (filter === "failed" &&
                            results.find((r) => r.id === c.id && !r.passed)),
                      )
                      .map((c) => {
                        const r = results.find((r) => r.id === c.id);
                        return (
                          <tr key={c.id}>
                            <td className="mono">{c.id}</td>
                            <td>{c.message}</td>
                            <td>
                              <span>{c.intent}</span>
                              <small>{c.tool}</small>
                            </td>
                            <td>
                              {r ? (
                                <Badge>
                                  {r.passed ? (
                                    <Check size={12} />
                                  ) : (
                                    <X size={12} />
                                  )}{" "}
                                  {r.passed ? "Pass" : `Got ${r.actual}`}
                                </Badge>
                              ) : (
                                <span className="muted">Not run</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </Card>
            <div className="lab-bottom">
              <Card className="prompt-card">
                <div className="card-title">
                  <h3>System prompt</h3>
                  <Badge>{prompt}</Badge>
                </div>
                <pre>{systemPrompt(prompt)}</pre>
                <p className="muted">
                  The shared routing instructions are public for review.
                  Provider keys and account configuration are never included.
                </p>
              </Card>
              <Card className="tools-card">
                <h3>Available tools</h3>
                {Object.entries(catalog).map(([intent, c]) => (
                  <details key={intent}>
                    <summary>
                      <code>{c.tool}</code>
                      <Badge>{intent}</Badge>
                    </summary>
                    <p>{c.description}</p>
                  </details>
                ))}
              </Card>
            </div>
            <p className="lab-footnote">
              The benchmark checks routing and tool selection. Automated tests
              separately verify arithmetic, recorded dates, privacy gates,
              downloads, and latency reporting. Scores are measured runs, not
              claims of general model quality.
            </p>
          </div>
        )}
      </main>
      <footer>
        <span>Campus Companion</span>
        <span>Synthetic university · Fixed identity demo · 2026</span>
      </footer>
    </div>
  );
}
export default App;
