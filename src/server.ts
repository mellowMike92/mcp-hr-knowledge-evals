import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { hrPolicies, policiesById } from './data/hrPolicies.js';
import {
  fetchManagerCoachingRubric,
  getOnboardingMilestones,
  queryHrPolicy,
} from './tools/hrTools.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'query_hr_policy',
    description:
      'Search the HR policy handbook with keyword/semantic matching. Returns verified policy text with citation ids for grounded answers.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural-language HR policy question',
        },
        department: {
          type: 'string',
          enum: ['HR', 'Engineering', 'Sales'],
          description: 'Optional department scope filter',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_onboarding_milestones',
    description:
      'Get role-specific 30/60/90-day onboarding expectations and completion criteria.',
    inputSchema: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          description: 'Employee role or job title (e.g. "backend engineer")',
        },
        tenure_days: {
          type: 'number',
          enum: [30, 60, 90],
          description: 'Onboarding checkpoint: 30, 60, or 90 days',
        },
      },
      required: ['role', 'tenure_days'],
    },
  },
  {
    name: 'fetch_manager_coaching_rubric',
    description:
      'Synthesize a structured 1-on-1 agenda, coaching prompts, and feedback guidance for a scenario and performance rating.',
    inputSchema: {
      type: 'object',
      properties: {
        scenario: {
          type: 'string',
          description: 'The situation to discuss (e.g. "missed two sprint deadlines")',
        },
        performance_rating: {
          type: 'string',
          enum: ['Exceeds', 'Meets', 'Needs_Improvement'],
          description: 'Employee performance rating',
        },
      },
      required: ['scenario', 'performance_rating'],
    },
  },
] as const;

export type ToolName = (typeof TOOL_DEFINITIONS)[number]['name'];

/** Dispatch a tool call by name. Exported for the eval harness. */
export function dispatchTool(name: string, args: Record<string, unknown>) {
  switch (name) {
    case 'query_hr_policy':
      return queryHrPolicy(args);
    case 'get_onboarding_milestones':
      return getOnboardingMilestones(args);
    case 'fetch_manager_coaching_rubric':
      return fetchManagerCoachingRubric(args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

const PROMPTS = [
  {
    name: 'conduct_manager_1on1',
    description:
      'Formats HR policy parameters into a system prompt for conducting a policy-grounded manager 1-on-1.',
    arguments: [
      {
        name: 'employee_name',
        description: 'First name of the direct report',
        required: true,
      },
      {
        name: 'performance_rating',
        description: 'Exceeds | Meets | Needs_Improvement',
        required: true,
      },
      {
        name: 'scenario',
        description: 'Discussion topic for the 1-on-1',
        required: true,
      },
    ],
  },
];

function renderPolicyMarkdown(docId: string): string | undefined {
  const doc = policiesById.get(docId);
  if (!doc) return undefined;
  const body = doc.sections
    .map((s) => `## ${s.heading}\n\n${s.text}`)
    .join('\n\n');
  return `# ${doc.title}\n\n_Citation: ${doc.citationId}_\n\n${body}\n`;
}

export function createHrKnowledgeServer(): Server {
  const server = new Server(
    { name: 'hr-knowledge-mcp-server', version: '1.0.0' },
    { capabilities: { tools: {}, prompts: {}, resources: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [...TOOL_DEFINITIONS],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      const result = dispatchTool(name, args ?? {});
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Tool error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  });

  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: PROMPTS,
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (name !== 'conduct_manager_1on1') {
      throw new Error(`Unknown prompt: ${name}`);
    }
    const employee = args?.employee_name ?? 'the employee';
    const rating = args?.performance_rating ?? 'Meets';
    const scenario = args?.scenario ?? 'general check-in';

    return {
      description: 'Policy-grounded manager 1-on-1 system prompt',
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: [
              `You are preparing a manager 1-on-1 with ${employee} (rating: ${rating}).`,
              `Scenario: ${scenario}.`,
              '',
              'Ground every piece of guidance in the HR citations provided by the',
              'hr-knowledge-mcp-server tools. Use the SBI feedback model per HR-MGR-001.',
              'Structure the session: employee-led check-in, coaching discussion,',
              'then commitments documented in the HRIS within 24 hours.',
            ].join('\n'),
          },
        },
      ],
    };
  });

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: hrPolicies.map((doc) => ({
      uri: `hr://policies/${doc.id}`,
      name: doc.title,
      description: `${doc.title} (${doc.citationId})`,
      mimeType: 'text/markdown',
    })),
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    const match = /^hr:\/\/policies\/(.+)$/.exec(uri);
    const markdown = match ? renderPolicyMarkdown(match[1]) : undefined;
    if (!markdown) throw new Error(`Unknown resource: ${uri}`);
    return {
      contents: [{ uri, mimeType: 'text/markdown', text: markdown }],
    };
  });

  return server;
}
