# mcp-hr-knowledge-evals

Enterprise-ready **Model Context Protocol (MCP) server** in TypeScript exposing structured HR policy tools, RAG-style context retrieval with citations, and an automated evaluation harness that benchmarks accuracy against 20 synthetic HR scenarios.

## Stack

- **Runtime:** Node.js >= 18 (ESM), TypeScript strict mode (`NodeNext`, `ES2022`)
- **MCP:** `@modelcontextprotocol/sdk` — tools, prompts, resources over stdio
- **Evals:** `vitest` harness with deterministic lexical scoring; optional Claude-as-judge scoring via `@anthropic-ai/sdk`
- **Validation:** `zod` input schemas on every tool

## Quickstart

```bash
npm install
npm run build      # compile TypeScript -> dist/
npm start          # run server on stdio
npm run dev        # watch mode via tsx
npm run inspector  # MCP Inspector: npx @modelcontextprotocol/inspector node dist/index.js
npm run eval       # vitest run evals/ — 20 scenario benchmarks
```

Optional: copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY` to enable the
Claude-as-judge scorer (`EVAL_MODEL` overrides the default `claude-3-5-sonnet-20241022`).
Without a key, evals use the deterministic scorer — all 20 cases still run and pass.

## Tools

### `query_hr_policy`

Keyword/semantic retrieval over the HR handbook. Returns the top matching policy
documents with full section text and citation ids.

| Param | Type | Required | Notes |
|---|---|---|---|
| `query` | string | yes | Natural-language HR question |
| `department` | `"HR" \| "Engineering" \| "Sales"` | no | Scope filter |

### `get_onboarding_milestones`

Role-specific onboarding expectations and completion criteria. Roles map to
Engineering / Sales / HR / General families.

| Param | Type | Required | Notes |
|---|---|---|---|
| `role` | string | yes | e.g. `"backend engineer"` |
| `tenure_days` | `30 \| 60 \| 90` | yes | Onboarding checkpoint |

### `fetch_manager_coaching_rubric`

Synthesizes a 1-on-1 agenda, coaching prompts, and SBI feedback guidance keyed
to the scenario topic (deadlines, growth, conflict, workload) and rating.

| Param | Type | Required | Notes |
|---|---|---|---|
| `scenario` | string | yes | e.g. `"missed two sprint deadlines"` |
| `performance_rating` | `"Exceeds" \| "Meets" \| "Needs_Improvement"` | yes | Rating tier |

## Prompts & resources

- **Prompt:** `conduct_manager_1on1` — formats employee name, rating, and scenario
  into a policy-grounded system prompt.
- **Resources:** every policy exposed at `hr://policies/<id>` (e.g.
  `hr://policies/parental-leave`) as markdown with its citation id.

## Eval harness

`npm run eval` executes 20 synthetic scenarios covering all three tools and reports:

```
----------------------------------------------------
  HR KNOWLEDGE EVAL BENCHMARK
----------------------------------------------------
  Cases evaluated .......... 20
  Judge .................... deterministic
  Tool selection accuracy .. 100.0%
  Policy retrieval precision 100.0%
  Hallucination rate ....... 0.0%  (goal 0.0%)
----------------------------------------------------
```

**Metrics**

- *Tool selection accuracy* — heuristic router picks the expected tool
- *Policy retrieval precision* — fraction of ground-truth facts present in output
- *Hallucination rate* — forbidden content, fabricated citation ids, or missing
  required citations (goal: 0.0%)

With `ANTHROPIC_API_KEY` set, each case additionally receives a Claude-as-judge
PASS/FAIL faithfulness verdict.

## Layout

```
src/
  index.ts            entry point — connects StdioServerTransport
  server.ts           MCP server: tools, prompts, resources
  tools/hrTools.ts    tool implementations (pure functions)
  data/hrPolicies.ts  mock HR handbook with citation ids
  types/index.ts      interfaces + zod schemas
evals/
  scenarios.ts        20 eval cases with ground truth
  scorer.ts           deterministic scorer + Claude judge + prompt router
  hrScenarioEval.test.ts
scripts/
  smoke-stdio.mjs     JSON-RPC handshake smoke test
```
