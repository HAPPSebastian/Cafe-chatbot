import assert from 'node:assert/strict';
import test from 'node:test';
import type { ResponseInputItem, ResponseFunctionToolCall } from 'openai/resources/responses/responses';
import { CafeAgent, type ModelReply, type Respond } from '../src/agent.js';
import { getCafeInfo } from '../src/knowledge.js';

function call(name: string, args: object, id = name): ResponseFunctionToolCall {
  return { type: 'function_call', name, arguments: JSON.stringify(args), call_id: id };
}
function scripted(...replies: ModelReply[]): { respond: Respond; inputs: ResponseInputItem[][] } {
  const inputs: ResponseInputItem[][] = [];
  return {
    inputs,
    respond: async input => {
      inputs.push(structuredClone(input));
      const reply = replies.shift();
      if (!reply) throw new Error('Unexpected model request.');
      return reply;
    },
  };
}
const neverSearch = { search: async () => { throw new Error('Search should not run.'); } };

test('executes the fixed tool requested by the model and supplies its result', async () => {
  const model = scripted(
    { output: [call('get_cafe_info', {})], output_text: '' },
    { output: [], output_text: 'We open at 08:00 on weekdays.' },
  );
  const result = await new CafeAgent(model.respond, neverSearch).answer('When do you open?');
  assert.deepEqual(result, { answer: 'We open at 08:00 on weekdays.', toolsUsed: ['get_cafe_info'] });
  assert.deepEqual(model.inputs[1]?.at(-1), {
    type: 'function_call_output', call_id: 'get_cafe_info', output: JSON.stringify(getCafeInfo()),
  });
});

test('executes both tools and preserves their call IDs and source passages', async () => {
  const passages = [{ id: 'lunch', text: 'A vegan sandwich costs 85 SEK.', score: 0.9 }];
  const model = scripted(
    { output: [call('search_cafe_knowledge', { query: 'vegan lunch' }, 'search-1'), call('get_cafe_info', {}, 'info-1')], output_text: '' },
    { output: [], output_text: 'A vegan sandwich costs 85 SEK. We open at 08:00 on weekdays.' },
  );
  const queries: string[] = [];
  const agent = new CafeAgent(model.respond, { search: async query => { queries.push(query); return passages; } });
  const result = await agent.answer('What vegan food do you have, and when do you open?');
  assert.deepEqual(queries, ['vegan lunch']);
  assert.deepEqual(result.toolsUsed, ['search_cafe_knowledge', 'get_cafe_info']);
  const outputs = model.inputs[1]?.filter(item => item.type === 'function_call_output');
  assert.deepEqual(outputs, [
    { type: 'function_call_output', call_id: 'search-1', output: JSON.stringify(passages) },
    { type: 'function_call_output', call_id: 'info-1', output: JSON.stringify(getCafeInfo()) },
  ]);
});

test('rejects unknown tools and invalid tool arguments', async () => {
  for (const tool of [call('delete_everything', {}), call('search_cafe_knowledge', { query: '' })]) {
    const model = scripted({ output: [tool], output_text: '' });
    await assert.rejects(new CafeAgent(model.respond, neverSearch).answer('Hello'), /Unknown tool or invalid/);
  }
});

test('limits repeated tool calls', async () => {
  let requests = 0;
  const agent = new CafeAgent(async () => {
    requests++;
    return { output: [call('get_cafe_info', {}, String(requests))], output_text: '' };
  }, neverSearch);
  await assert.rejects(agent.answer('Loop forever'), /limit reached/);
  assert.equal(requests, 7);
});

test('allows a direct refusal without tool calls', async () => {
  const model = scripted({ output: [], output_text: 'I can only help with this café.' });
  assert.deepEqual(await new CafeAgent(model.respond, neverSearch).answer('Explain astronomy'), {
    answer: 'I can only help with this café.', toolsUsed: [],
  });
});
