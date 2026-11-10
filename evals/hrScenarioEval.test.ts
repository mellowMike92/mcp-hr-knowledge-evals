import { afterAll, describe, expect, it } from 'vitest';
import { dispatchTool } from '../src/server.js';
import { evalCases } from './scenarios.js';
import {
  judgeWithClaude,
  routePrompt,
  scoreDeterministic,
  type CaseScore,
} from './scorer.js';

const results: Array<{
  id: string;
  correctTool: boolean;
  score: CaseScore;
}> = [];

describe('HR scenario evals (20 cases)', () => {
  for (const evalCase of evalCases) {
    it.concurrent(
      `${evalCase.id}: ${evalCase.scenario}`,
      async () => {
        // 1) Tool selection accuracy — does the router pick the right tool?
        const routedTool = routePrompt(evalCase.scenario);
        const correctTool = routedTool === evalCase.expectedTool;
        expect(correctTool).toBe(true);

        // 2) Execute the tool under test.
        const output = dispatchTool(evalCase.expectedTool, evalCase.toolInput);
        const outputText = JSON.stringify(output);

        // 3) Deterministic scoring: precision + hallucination.
        const score = scoreDeterministic(outputText, evalCase.groundTruth);

        // 4) Optional Claude-as-judge semantic check (needs ANTHROPIC_API_KEY).
        score.judgeVerdict = await judgeWithClaude(evalCase, outputText);
        if (score.judgeVerdict !== undefined) {
          expect(score.judgeVerdict).toBe('PASS');
        }

        results.push({ id: evalCase.id, correctTool, score });

        // 5) Assertions: full fact coverage, zero hallucinations.
        expect(score.missingFacts).toEqual([]);
        expect(score.hallucinated).toBe(false);
      },
      30_000,
    );
  }
});

afterAll(() => {
  const total = results.length;
  const toolAccuracy =
    results.filter((r) => r.correctTool).length / total;
  const meanPrecision =
    results.reduce((sum, r) => sum + r.score.precision, 0) / total;
  const hallucinationRate =
    results.filter((r) => r.score.hallucinated).length / total;
  const judged = results.filter((r) => r.score.judgeVerdict !== undefined);
  const judgeLabel = judged.length > 0 ? 'claude' : 'deterministic';

  const line = '-'.repeat(52);
  console.log(
    [
      '',
      line,
      '  HR KNOWLEDGE EVAL BENCHMARK',
      line,
      `  Cases evaluated .......... ${total}`,
      `  Judge .................... ${judgeLabel}`,
      `  Tool selection accuracy .. ${(toolAccuracy * 100).toFixed(1)}%`,
      `  Policy retrieval precision ${(meanPrecision * 100).toFixed(1)}%`,
      `  Hallucination rate ....... ${(hallucinationRate * 100).toFixed(1)}%  (goal 0.0%)`,
      line,
      '',
    ].join('\n'),
  );
});
