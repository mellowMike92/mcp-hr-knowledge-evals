#!/usr/bin/env node
import 'dotenv/config';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createHrKnowledgeServer } from './server.js';

async function main() {
  const server = createHrKnowledgeServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('hr-knowledge-mcp-server v1.0.0 running on stdio');
}

main().catch((error) => {
  console.error('Fatal error starting MCP server:', error);
  process.exit(1);
});
