import type { PolicyDocument } from '../types/index.js';

/**
 * Mock enterprise HR handbook. Each document carries a stable citationId that
 * tools return alongside policy text so downstream LLM answers can be grounded
 * and checked for hallucination.
 */
export const hrPolicies: PolicyDocument[] = [
  {
    id: 'parental-leave',
    citationId: 'HR-PL-001',
    title: 'Parental Leave Policy',
    category: 'leave',
    departments: 'all',
    keywords: [
      'parental', 'leave', 'maternity', 'paternity', 'birth', 'adoption',
      'bonding', 'new child', 'caregiver', 'family leave', 'baby',
    ],
    sections: [
      {
        heading: 'Leave Duration',
        text: 'Primary caregivers receive 16 weeks of fully paid parental leave. Secondary caregivers receive 6 weeks of fully paid parental leave. Leave must be taken within 12 months of the birth or adoption placement.',
      },
      {
        heading: 'Eligibility',
        text: 'Employees become eligible after 12 months of continuous employment. Eligibility covers birth, adoption, and foster-care placement.',
      },
      {
        heading: 'Benefits Continuation',
        text: 'Health, dental, and vision benefits continue unchanged during approved parental leave. Equity vesting continues per the standard vesting schedule.',
      },
      {
        heading: 'Return to Work',
        text: 'Employees may elect a phased return-to-work schedule of 50% time for up to 4 weeks at full pay, subject to manager approval.',
      },
    ],
  },
  {
    id: 'pto-policy',
    citationId: 'HR-PTO-001',
    title: 'Paid Time Off (PTO) Policy',
    category: 'time_off',
    departments: 'all',
    keywords: [
      'pto', 'vacation', 'time off', 'holiday', 'accrual', 'carryover',
      'sick', 'personal day', 'floating holiday', 'days off',
    ],
    sections: [
      {
        heading: 'Accrual Schedule',
        text: 'Employees accrue 15 PTO days per year during years 0-3, 20 days per year during years 3-6, and 25 days per year after 6 years of service. PTO accrues semi-monthly.',
      },
      {
        heading: 'Carryover',
        text: 'A maximum of 5 unused PTO days carries over into the next calendar year. Carryover days must be used by March 31 or they expire.',
      },
      {
        heading: 'Floating Holidays',
        text: 'Employees receive 2 floating holidays per calendar year in addition to company-observed holidays.',
      },
      {
        heading: 'Request Process',
        text: 'PTO requests over 5 consecutive days require manager approval at least 2 weeks in advance. Sales team members should avoid PTO during the final week of each fiscal quarter.',
      },
    ],
  },
  {
    id: 'remote-work',
    citationId: 'HR-RW-001',
    title: 'Remote Work & Hybrid Policy',
    category: 'remote_work',
    departments: 'all',
    keywords: [
      'remote', 'work from home', 'wfh', 'hybrid', 'office', 'stipend',
      'internet', 'home office', 'distributed', 'core hours',
    ],
    sections: [
      {
        heading: 'Hybrid Schedule',
        text: 'Employees in hybrid roles work from their assigned office at least 3 days per week. Fully remote roles are designated in the offer letter.',
      },
      {
        heading: 'Home Office Stipend',
        text: 'New hires receive a one-time $750 home office stipend. All remote and hybrid employees receive a $50 monthly internet reimbursement.',
      },
      {
        heading: 'Core Collaboration Hours',
        text: 'All employees must be available during core collaboration hours of 10:00 AM - 3:00 PM in their local time zone, Monday through Friday.',
      },
    ],
  },
  {
    id: 'travel-budget',
    citationId: 'HR-TV-001',
    title: 'Travel & Expense Budget Policy',
    category: 'remote_work',
    departments: 'all',
    keywords: [
      'travel', 'expense', 'per diem', 'hotel', 'flight', 'airfare',
      'reimbursement', 'meals', 'budget', 'conference', 'trip',
    ],
    sections: [
      {
        heading: 'Meal Per-Diem',
        text: 'The meal per-diem is $75 per day for domestic travel and $95 per day for international travel. Itemized receipts are not required for per-diem claims.',
      },
      {
        heading: 'Lodging Caps',
        text: 'Hotel rates are capped at $250 per night in standard markets and $350 per night in designated high-cost cities (New York, San Francisco, London, Tokyo).',
      },
      {
        heading: 'Airfare',
        text: 'Flights must be booked at least 14 days in advance in economy class. Business class is permitted only for flights over 8 hours for Director level and above.',
      },
      {
        heading: 'Expense Submission',
        text: 'All expenses must be submitted through ExpenseHub within 30 days of the trip end date. Late submissions require VP approval.',
      },
    ],
  },
  {
    id: 'onboarding-framework',
    citationId: 'HR-ON-001',
    title: 'Onboarding Framework (30/60/90)',
    category: 'onboarding',
    departments: 'all',
    keywords: [
      'onboarding', 'new hire', '30 days', '60 days', '90 days', 'ramp',
      'milestone', 'first week', 'orientation', 'probation',
    ],
    sections: [
      {
        heading: 'Day 30 — Learn',
        text: 'Complete security and compliance training, meet all immediate stakeholders, and shadow at least 3 team workflows. Engineers must have a working dev environment and have shipped one small bugfix; Sales hires must complete CRM certification and shadow 5 customer calls; HR hires must complete HRIS training.',
      },
      {
        heading: 'Day 60 — Contribute',
        text: 'Own a small scoped project end-to-end and participate fully in team ceremonies. Engineers join the on-call shadow rotation; Sales hires run their first customer discovery call; HR hires process cases independently.',
      },
      {
        heading: 'Day 90 — Own',
        text: 'Deliver independent work streams, present outcomes at a team review, and co-author the next-quarter plan with your manager. Full ramp productivity is expected by day 90.',
      },
    ],
  },
  {
    id: 'manager-1on1',
    citationId: 'HR-MGR-001',
    title: 'Manager 1-on-1 Guidelines',
    category: 'management',
    departments: 'all',
    keywords: [
      '1:1', '1-on-1', 'one on one', 'manager', 'coaching', 'feedback',
      'performance', 'check-in', 'career growth', 'rubric', 'sbi',
    ],
    sections: [
      {
        heading: 'Cadence & Format',
        text: 'Managers hold 30-minute 1-on-1s weekly or 60-minute sessions biweekly. The agenda is employee-driven; managers should not treat the meeting as a status report.',
      },
      {
        heading: 'Feedback Model',
        text: 'Feedback follows the SBI model: Situation, Behavior, Impact. Document commitments and action items in the HRIS within 24 hours.',
      },
      {
        heading: 'Performance Conversations',
        text: 'For employees rated Needs_Improvement, use a written support plan with 2-week checkpoints. For Exceeds performers, dedicate the conversation to growth scope and retention risk.',
      },
      {
        heading: 'Skip-Level Reviews',
        text: 'Skip-level 1-on-1s occur quarterly and focus on team health, blockers, and manager effectiveness.',
      },
    ],
  },
];

export const policiesById = new Map(hrPolicies.map((p) => [p.id, p]));
export const policiesByCitation = new Map(
  hrPolicies.map((p) => [p.citationId, p]),
);
