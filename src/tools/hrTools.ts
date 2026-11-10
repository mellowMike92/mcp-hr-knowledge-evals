import { hrPolicies } from '../data/hrPolicies.js';
import {
  FetchManagerCoachingRubricInputSchema,
  GetOnboardingMilestonesInputSchema,
  QueryHrPolicyInputSchema,
  type CoachingRubric,
  type OnboardingMilestone,
  type PolicyDocument,
  type PolicyMatch,
  type QueryHrPolicyResult,
} from '../types/index.js';

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'do', 'does', 'i', 'my', 'me', 'what',
  'how', 'where', 'when', 'can', 'for', 'to', 'of', 'in', 'on', 'and',
  'or', 'much', 'many', 'get', 'find', 'policy', 'our', 'we',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

function scorePolicy(doc: PolicyDocument, tokens: string[]): number {
  const haystack = `${doc.title} ${doc.sections
    .map((s) => `${s.heading} ${s.text}`)
    .join(' ')}`.toLowerCase();

  let score = 0;
  for (const token of tokens) {
    // Exact keyword list hits weigh the most — this is the "index".
    if (doc.keywords.some((k) => k.toLowerCase().includes(token))) score += 3;
    // Then title hits, then body term frequency.
    if (doc.title.toLowerCase().includes(token)) score += 2;
    const occurrences = haystack.split(token).length - 1;
    score += Math.min(occurrences, 3);
  }
  return score;
}

/**
 * Tool: query_hr_policy
 * Keyword/semantic-style retrieval over the HR handbook with citation ids.
 */
export function queryHrPolicy(rawInput: unknown): QueryHrPolicyResult {
  const input = QueryHrPolicyInputSchema.parse(rawInput);
  const tokens = tokenize(input.query);

  const ranked: PolicyMatch[] = hrPolicies
    .filter(
      (doc) =>
        doc.departments === 'all' ||
        (input.department !== undefined &&
          doc.departments.includes(input.department)),
    )
    .map((doc) => ({
      citationId: doc.citationId,
      title: doc.title,
      score: scorePolicy(doc, tokens),
      sections: doc.sections,
    }))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return { query: input.query, matches: ranked, noMatch: ranked.length === 0 };
}

// ---------------------------------------------------------------------------

type RoleFamily = 'Engineering' | 'Sales' | 'HR' | 'General';

const ROLE_FAMILY_KEYWORDS: Record<RoleFamily, RegExp> = {
  Engineering: /engineer|developer|devops|sre|frontend|backend|fullstack|software/i,
  Sales: /sales|account|ae|sdr|bdr|customer|revenue/i,
  HR: /\bhr\b|people|recruit|talent|hrbp|human resources/i,
  General: /.*/,
};

const ROLE_SPECIFIC_CRITERIA: Record<RoleFamily, Record<30 | 60 | 90, string[]>> = {
  Engineering: {
    30: ['Working dev environment', 'Shipped one small bugfix'],
    60: ['Joined on-call shadow rotation'],
    90: ['Independent feature delivery', 'Presented at team review'],
  },
  Sales: {
    30: ['CRM certification complete', 'Shadowed 5 customer calls'],
    60: ['Ran first customer discovery call'],
    90: ['Owns a book of pipeline', 'Forecast submitted independently'],
  },
  HR: {
    30: ['HRIS training complete'],
    60: ['Processing cases independently'],
    90: ['Owns an HR program area end-to-end'],
  },
  General: {
    30: ['Security & compliance training complete', 'Met all immediate stakeholders'],
    60: ['Owns a small scoped project end-to-end'],
    90: ['Delivering independent work streams'],
  },
};

/**
 * Tool: get_onboarding_milestones
 * Returns role-family specific 30/60/90 expectations and completion criteria.
 */
export function getOnboardingMilestones(
  rawInput: unknown,
): OnboardingMilestone {
  const input = GetOnboardingMilestonesInputSchema.parse(rawInput);
  const tenure = input.tenure_days;

  const roleFamily = (Object.keys(ROLE_FAMILY_KEYWORDS) as RoleFamily[]).find(
    (family) => ROLE_FAMILY_KEYWORDS[family].test(input.role),
  ) as RoleFamily;

  const doc = hrPolicies.find((p) => p.id === 'onboarding-framework')!;
  const section = doc.sections.find((s) =>
    s.heading.startsWith(`Day ${tenure}`),
  )!;

  const roleCriteria = ROLE_SPECIFIC_CRITERIA[roleFamily][tenure];

  return {
    roleFamily,
    tenureDays: tenure,
    expectations: [section.text],
    completionCriteria: roleCriteria,
    citationId: doc.citationId,
  };
}

// ---------------------------------------------------------------------------

interface ScenarioRubric {
  match: RegExp;
  topic: string;
  coachingPrompts: string[];
}

const SCENARIO_RUBRICS: ScenarioRubric[] = [
  {
    match: /deadline|missed|late|deliver|commit|slip/i,
    topic: 'Missed commitments',
    coachingPrompts: [
      'Walk me through what got in the way of the commitment.',
      'Which signals did we miss early, and what would you flag sooner next time?',
      'What support or scope change would have changed the outcome?',
    ],
  },
  {
    match: /career|growth|promotion|develop|skill|advance/i,
    topic: 'Career growth',
    coachingPrompts: [
      'Which skills do you want to be known for in 12 months?',
      'What scope or project would stretch you right now?',
      'Who else should be advocating for your next step?',
    ],
  },
  {
    match: /conflict|disagree|tension|peer|teammate|friction/i,
    topic: 'Interpersonal conflict',
    coachingPrompts: [
      'What outcome does each side actually want?',
      'What part of this is structural vs personal?',
      'What would a repair conversation look like this week?',
    ],
  },
  {
    match: /burnout|workload|overwhelm|stress|balance/i,
    topic: 'Workload & burnout',
    coachingPrompts: [
      'What is consuming energy that should not be on your plate?',
      'What can we deprioritize, delegate, or delete this sprint?',
      'When did you last take a real break, and what is blocking one?',
    ],
  },
];

const DEFAULT_RUBRIC: ScenarioRubric = {
  match: /.*/,
  topic: 'General check-in',
  coachingPrompts: [
    'What is on your mind this week?',
    'What is going well that we should double down on?',
    'Where do you need more support or clarity from me?',
  ],
};

const RATING_GUIDANCE: Record<string, string[]> = {
  Exceeds: [
    'Focus the session on growth scope, visibility, and retention risk — not status.',
    'Stretch: delegate a decision you would normally make yourself.',
    'Watch for plateau signals; top performers disengage before they underperform.',
  ],
  Meets: [
    'Balance recognition of solid delivery with one concrete growth edge.',
    'Reinforce commitments using SBI: name the Situation, Behavior, and Impact.',
    'Agree on one measurable stretch item before the next 1-on-1.',
  ],
  Needs_Improvement: [
    'Open a written support plan with explicit expectations and 2-week checkpoints.',
    'Use SBI language for every gap — observable behavior, not character.',
    'Document all commitments in the HRIS within 24 hours.',
  ],
};

/**
 * Tool: fetch_manager_coaching_rubric
 * Synthesizes a structured 1-on-1 agenda, coaching prompts, and feedback
 * guidance keyed to scenario topic and performance rating.
 */
export function fetchManagerCoachingRubric(
  rawInput: unknown,
): CoachingRubric {
  const input = FetchManagerCoachingRubricInputSchema.parse(rawInput);
  const rubric =
    SCENARIO_RUBRICS.find((r) => r.match.test(input.scenario)) ??
    DEFAULT_RUBRIC;

  return {
    scenario: input.scenario,
    performanceRating: input.performance_rating,
    framework: 'SBI (Situation-Behavior-Impact)',
    agenda: [
      `Topic: ${rubric.topic}`,
      'Employee-led check-in (10 min)',
      'Coaching discussion using prompts below (15 min)',
      'Commitments & documentation in HRIS (5 min)',
    ],
    coachingPrompts: rubric.coachingPrompts,
    feedbackGuidance: RATING_GUIDANCE[input.performance_rating],
    citationId: 'HR-MGR-001',
  };
}
