import { z } from 'zod';

// ---------------------------------------------------------------------------
// Departments & shared enums
// ---------------------------------------------------------------------------

export const DepartmentSchema = z.enum(['HR', 'Engineering', 'Sales']);
export type Department = z.infer<typeof DepartmentSchema>;

export const PerformanceRatingSchema = z.enum([
  'Exceeds',
  'Meets',
  'Needs_Improvement',
]);
export type PerformanceRating = z.infer<typeof PerformanceRatingSchema>;

// ---------------------------------------------------------------------------
// Policy knowledge base models
// ---------------------------------------------------------------------------

export interface PolicySection {
  heading: string;
  text: string;
}

export interface PolicyDocument {
  /** Stable document id, e.g. "parental-leave". */
  id: string;
  /** Public citation id surfaced to clients, e.g. "HR-PL-001". */
  citationId: string;
  title: string;
  category: 'leave' | 'time_off' | 'remote_work' | 'onboarding' | 'management';
  departments: Department[] | 'all';
  keywords: string[];
  sections: PolicySection[];
}

// ---------------------------------------------------------------------------
// Tool input schemas (zod)
// ---------------------------------------------------------------------------

export const QueryHrPolicyInputSchema = z.object({
  query: z.string().min(1),
  department: DepartmentSchema.optional(),
});
export type QueryHrPolicyInput = z.infer<typeof QueryHrPolicyInputSchema>;

export const GetOnboardingMilestonesInputSchema = z.object({
  role: z.string().min(1),
  tenure_days: z.union([z.literal(30), z.literal(60), z.literal(90)]),
});
export type GetOnboardingMilestonesInput = z.infer<
  typeof GetOnboardingMilestonesInputSchema
>;

export const FetchManagerCoachingRubricInputSchema = z.object({
  scenario: z.string().min(1),
  performance_rating: PerformanceRatingSchema,
});
export type FetchManagerCoachingRubricInput = z.infer<
  typeof FetchManagerCoachingRubricInputSchema
>;

// ---------------------------------------------------------------------------
// Tool output models
// ---------------------------------------------------------------------------

export interface PolicyMatch {
  citationId: string;
  title: string;
  score: number;
  sections: PolicySection[];
}

export interface QueryHrPolicyResult {
  query: string;
  matches: PolicyMatch[];
  /** True when no policy met the minimum relevance threshold. */
  noMatch: boolean;
}

export interface OnboardingMilestone {
  roleFamily: string;
  tenureDays: 30 | 60 | 90;
  expectations: string[];
  completionCriteria: string[];
  citationId: string;
}

export interface CoachingRubric {
  scenario: string;
  performanceRating: PerformanceRating;
  framework: string;
  agenda: string[];
  coachingPrompts: string[];
  feedbackGuidance: string[];
  citationId: string;
}

// ---------------------------------------------------------------------------
// Evaluation models
// ---------------------------------------------------------------------------

export interface EvalCase {
  id: string;
  /** Natural-language prompt a user would ask. */
  scenario: string;
  /** The tool a correct router should select. */
  expectedTool:
    | 'query_hr_policy'
    | 'get_onboarding_milestones'
    | 'fetch_manager_coaching_rubric';
  /** Arguments forwarded to the tool under test. */
  toolInput: Record<string, unknown>;
  groundTruth: {
    /** Facts/keywords that must appear in the tool output. */
    mustContain: string[];
    /** Citation ids expected in the response, when applicable. */
    expectedCitations?: string[];
    /** Strings that indicate a hallucination or wrong policy if present. */
    mustNotContain?: string[];
  };
}

export interface EvalMetrics {
  totalCases: number;
  toolSelectionAccuracy: number;
  policyRetrievalPrecision: number;
  hallucinationRate: number;
  judge: 'claude' | 'deterministic';
}
