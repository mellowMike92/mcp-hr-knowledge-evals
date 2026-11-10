import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { policiesByCitation } from '../src/data/hrPolicies.js';
import type { EvalCase } from '../src/types/index.js';

export interface CaseScore {
  /** Fraction of ground-truth facts present in output (0..1). */
  precision: number;
  /** True if output contains forbidden content or invalid citations. */
  hallucinated: boolean;
  missingFacts: string[];
  invalidCitations: string[];
  /** Optional Claude judge verdict when an API key is configured. */
  judgeVerdict?: 'PASS' | 'FAIL';
}

const CITATION_RE = /HR-[A-Z]{2,3}-\d{3}/g;

/**
 * Deterministic lexical scorer — always runs, no API key required.
 * Checks fact coverage, forbidden content, and citation validity.
 */
export function scoreDeterministic(
  outputText: string,
  groundTruth: EvalCase['groundTruth'],
): CaseScore {
  const lower = outputText.toLowerCase();

  const missingFacts = groundTruth.mustContain.filter(
    (fact) => !lower.includes(fact.toLowerCase()),
  );
  const precision =
    groundTruth.mustContain.length === 0
      ? 1
      : (groundTruth.mustContain.length - missingFacts.length) /
        groundTruth.mustContain.length;

  const forbiddenHits = (groundTruth.mustNotContain ?? []).filter((s) =>
    lower.includes(s.toLowerCase()),
  );

  // Every citation id the tool emitted must exist in the knowledge base;
  // fabricated citation ids are treated as hallucinations.
  const emittedCitations = outputText.match(CITATION_RE) ?? [];
  const invalidCitations = [...new Set(emittedCitations)].filter(
    (c) => !policiesByCitation.has(c),
  );

  const missingCitations = (groundTruth.expectedCitations ?? []).filter(
    (c) => !emittedCitations.includes(c),
  );

  return {
    precision,
    hallucinated:
      forbiddenHits.length > 0 ||
      invalidCitations.length > 0 ||
      missingCitations.length > 0,
    missingFacts: [...missingFacts, ...missingCitations.map((c) => `cite:${c}`)],
    invalidCitations,
  };
}

/**
 * Claude-as-judge scorer. Only invoked when ANTHROPIC_API_KEY is set;
 * supplements the deterministic scorer with a semantic faithfulness check.
 */
export async function judgeWithClaude(
  evalCase: EvalCase,
  outputText: string,
): Promise<'PASS' | 'FAIL' | undefined> {
  if (!process.env.ANTHROPIC_API_KEY) return undefined;

  const client = new Anthropic();
  const model = process.env.EVAL_MODEL ?? 'claude-3-5-sonnet-20241022';

  const response = await client.messages.create({
    model,
    max_tokens: 8,
    messages: [
      {
        role: 'user',
        content: [
          'You are grading an HR assistant tool call for factual grounding.',
          `User scenario: "${evalCase.scenario}"`,
          `Required facts: ${evalCase.groundTruth.mustContain.join('; ')}`,
          `Tool output: ${outputText}`,
          '',
          'Reply with exactly one word — PASS if the output is faithful to the',
          'required facts and contains no invented policy details, else FAIL.',
        ].join('\n'),
      },
    ],
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim()
    .toUpperCase();
  return text.startsWith('PASS') ? 'PASS' : 'FAIL';
}

/**
 * Heuristic prompt → tool router used to measure Tool Selection Accuracy.
 * Mirrors what an LLM client would do when choosing among tool definitions.
 */
export function routePrompt(scenario: string): EvalCase['expectedTool'] {
  if (
    /onboard|first \d+ days|day[- ]?\d+|30 days|60 days|90 days|ramp|milestone|tenure/i.test(
      scenario,
    )
  ) {
    return 'get_onboarding_milestones';
  }
  if (
    /1:1|1-on-1|one on one|coach|feedback|direct report|performance|check-in|performer/i.test(
      scenario,
    )
  ) {
    return 'fetch_manager_coaching_rubric';
  }
  return 'query_hr_policy';
}
