import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

const child = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'inherit'],
});

const rl = createInterface({ input: child.stdout });
const pending = new Map();
let nextId = 1;

rl.on('line', (line) => {
  const msg = JSON.parse(line);
  if (msg.id !== undefined && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
});

function request(method, params = {}) {
  const id = nextId++;
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  return new Promise((resolve) => pending.set(id, resolve));
}

const notify = (method, params = {}) =>
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');

const init = await request('initialize', {
  protocolVersion: '2024-11-05',
  capabilities: {},
  clientInfo: { name: 'smoke-test', version: '0.0.1' },
});
console.log('initialize ->', JSON.stringify(init.result.serverInfo));

notify('notifications/initialized');

const tools = await request('tools/list');
console.log('tools/list ->', tools.result.tools.map((t) => t.name).join(', '));

const call = await request('tools/call', {
  name: 'query_hr_policy',
  arguments: { query: 'parental leave' },
});
console.log('tools/call query_hr_policy ->', call.result.content[0].text.slice(0, 160), '…');

const prompts = await request('prompts/list');
console.log('prompts/list ->', prompts.result.prompts.map((p) => p.name).join(', '));

const resources = await request('resources/list');
console.log('resources/list ->', `${resources.result.resources.length} resources`);

child.kill();
process.exit(0);
