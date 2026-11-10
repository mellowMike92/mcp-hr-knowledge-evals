import type { EvalCase } from '../src/types/index.js';

/**
 * 20 synthetic HR scenario test cases with ground-truth expectations.
 * `mustContain` strings are matched (case-insensitive) against the JSON tool
 * output; `expectedCitations` must all appear in the output.
 */
export const evalCases: EvalCase[] = [
  // ---- query_hr_policy (12) -------------------------------------------------
  {
    id: 'EVAL-01',
    scenario: 'What is the parental leave policy duration?',
    expectedTool: 'query_hr_policy',
    toolInput: { query: 'parental leave duration' },
    groundTruth: {
      mustContain: ['16 weeks', '6 weeks'],
      expectedCitations: ['HR-PL-001'],
      mustNotContain: ['PTO accrues', 'per-diem'],
    },
  },
  {
    id: 'EVAL-02',
    scenario: 'How many vacation days do I get per year?',
    expectedTool: 'query_hr_policy',
    toolInput: { query: 'vacation days per year accrual' },
    groundTruth: {
      mustContain: ['15', '20', '25'],
      expectedCitations: ['HR-PTO-001'],
    },
  },
  {
    id: 'EVAL-03',
    scenario: 'How much PTO can I carry over into next year?',
    expectedTool: 'query_hr_policy',
    toolInput: { query: 'pto carryover limit next year' },
    groundTruth: {
      mustContain: ['5', 'March 31'],
      expectedCitations: ['HR-PTO-001'],
    },
  },
  {
    id: 'EVAL-04',
    scenario: 'What is the home office stipend for new hires?',
    expectedTool: 'query_hr_policy',
    toolInput: { query: 'home office stipend new hire remote' },
    groundTruth: {
      mustContain: ['$750', '$50'],
      expectedCitations: ['HR-RW-001'],
    },
  },
  {
    id: 'EVAL-05',
    scenario: 'What is the hotel rate cap on business trips?',
    expectedTool: 'query_hr_policy',
    toolInput: { query: 'hotel rate cap business travel lodging' },
    groundTruth: {
      mustContain: ['$250', '$350'],
      expectedCitations: ['HR-TV-001'],
    },
  },
  {
    id: 'EVAL-06',
    scenario: 'What is the meal per-diem for international travel?',
    expectedTool: 'query_hr_policy',
    toolInput: { query: 'meal per diem international travel' },
    groundTruth: {
      mustContain: ['$95', '$75'],
      expectedCitations: ['HR-TV-001'],
    },
  },
  {
    id: 'EVAL-07',
    scenario: 'How far in advance must flights be booked?',
    expectedTool: 'query_hr_policy',
    toolInput: { query: 'airfare booking advance requirement' },
    groundTruth: {
      mustContain: ['14 days', 'economy'],
      expectedCitations: ['HR-TV-001'],
    },
  },
  {
    id: 'EVAL-08',
    scenario: 'When do travel expenses need to be submitted?',
    expectedTool: 'query_hr_policy',
    toolInput: { query: 'travel expense submission deadline reimbursement' },
    groundTruth: {
      mustContain: ['30 days', 'ExpenseHub'],
      expectedCitations: ['HR-TV-001'],
    },
  },
  {
    id: 'EVAL-09',
    scenario: 'Do health benefits continue during parental leave?',
    expectedTool: 'query_hr_policy',
    toolInput: { query: 'benefits continuation during parental leave' },
    groundTruth: {
      mustContain: ['benefits', 'vesting'],
      expectedCitations: ['HR-PL-001'],
    },
  },
  {
    id: 'EVAL-10',
    scenario: 'How many floating holidays do employees get?',
    expectedTool: 'query_hr_policy',
    toolInput: { query: 'floating holidays per year' },
    groundTruth: {
      mustContain: ['2 floating holidays'],
      expectedCitations: ['HR-PTO-001'],
    },
  },
  {
    id: 'EVAL-11',
    scenario: 'What are the core collaboration hours for remote staff?',
    expectedTool: 'query_hr_policy',
    toolInput: { query: 'core collaboration hours remote availability' },
    groundTruth: {
      mustContain: ['10:00 AM', '3:00 PM'],
      expectedCitations: ['HR-RW-001'],
    },
  },
  {
    id: 'EVAL-12',
    scenario: 'Can I return part-time after parental leave?',
    expectedTool: 'query_hr_policy',
    toolInput: { query: 'phased return to work after parental leave part time' },
    groundTruth: {
      mustContain: ['50%', '4 weeks'],
      expectedCitations: ['HR-PL-001'],
    },
  },

  // ---- get_onboarding_milestones (5) ---------------------------------------
  {
    id: 'EVAL-13',
    scenario: 'What should a new backend engineer complete in their first 30 days?',
    expectedTool: 'get_onboarding_milestones',
    toolInput: { role: 'backend engineer', tenure_days: 30 },
    groundTruth: {
      mustContain: ['dev environment', 'bugfix', 'Engineering'],
      expectedCitations: ['HR-ON-001'],
    },
  },
  {
    id: 'EVAL-14',
    scenario: 'What are the day-60 expectations for an account executive?',
    expectedTool: 'get_onboarding_milestones',
    toolInput: { role: 'account executive', tenure_days: 60 },
    groundTruth: {
      mustContain: ['discovery call', 'Sales'],
      expectedCitations: ['HR-ON-001'],
    },
  },
  {
    id: 'EVAL-15',
    scenario: 'What does day 90 look like for a new sales rep?',
    expectedTool: 'get_onboarding_milestones',
    toolInput: { role: 'sales development rep', tenure_days: 90 },
    groundTruth: {
      mustContain: ['pipeline', 'Sales'],
      expectedCitations: ['HR-ON-001'],
    },
  },
  {
    id: 'EVAL-16',
    scenario: 'What should an HR business partner have done by day 30?',
    expectedTool: 'get_onboarding_milestones',
    toolInput: { role: 'HR business partner', tenure_days: 30 },
    groundTruth: {
      mustContain: ['HRIS', 'HR'],
      expectedCitations: ['HR-ON-001'],
    },
  },
  {
    id: 'EVAL-17',
    scenario: 'What are the 60-day milestones for a marketing coordinator?',
    expectedTool: 'get_onboarding_milestones',
    toolInput: { role: 'marketing coordinator', tenure_days: 60 },
    groundTruth: {
      mustContain: ['small scoped project'],
      expectedCitations: ['HR-ON-001'],
    },
  },

  // ---- fetch_manager_coaching_rubric (3) -----------------------------------
  {
    id: 'EVAL-18',
    scenario: 'How do I coach a direct report who missed two sprint deadlines?',
    expectedTool: 'fetch_manager_coaching_rubric',
    toolInput: {
      scenario: 'missed two sprint deadlines',
      performance_rating: 'Needs_Improvement',
    },
    groundTruth: {
      mustContain: ['support plan', '2-week', 'SBI'],
      expectedCitations: ['HR-MGR-001'],
    },
  },
  {
    id: 'EVAL-19',
    scenario: 'What should I cover in a 1:1 with an Exceeds performer about career growth?',
    expectedTool: 'fetch_manager_coaching_rubric',
    toolInput: {
      scenario: 'career growth and promotion path',
      performance_rating: 'Exceeds',
    },
    groundTruth: {
      mustContain: ['growth scope', 'retention'],
      expectedCitations: ['HR-MGR-001'],
    },
  },
  {
    id: 'EVAL-20',
    scenario: 'How do I structure a check-in about teammate conflict for a solid performer?',
    expectedTool: 'fetch_manager_coaching_rubric',
    toolInput: {
      scenario: 'ongoing conflict with a teammate',
      performance_rating: 'Meets',
    },
    groundTruth: {
      mustContain: ['conflict', 'SBI'],
      expectedCitations: ['HR-MGR-001'],
    },
  },
];
