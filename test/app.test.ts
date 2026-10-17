import assert from 'node:assert/strict';
import test from 'node:test';
import { buildApp } from '../src/app.js';

test('GET and POST expose the same agent', async t => {
  const questions: string[] = [];
  const app = buildApp({ answer: async question => {
    questions.push(question);
    return { answer: 'Hello', toolsUsed: ['get_cafe_info'] };
  } });
  t.after(() => app.close());
  for (const request of [
    { method: 'GET' as const, url: '/ask?question=When%20do%20you%20open%3F' },
    { method: 'POST' as const, url: '/ask', payload: { question: '  What do you serve?  ' } },
  ]) {
    const response = await app.inject(request);
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), { answer: 'Hello', toolsUsed: ['get_cafe_info'] });
  }
  assert.deepEqual(questions, ['When do you open?', 'What do you serve?']);
});

test('rejects invalid input before invoking the agent', async t => {
  const app = buildApp({ answer: async () => { throw new Error('Must not be called'); } });
  t.after(() => app.close());
  for (const payload of [{}, { question: '' }, { question: '   ' }, { question: 'x'.repeat(2001) }]) {
    assert.equal((await app.inject({ method: 'POST', url: '/ask', payload })).statusCode, 400);
  }
  assert.equal((await app.inject('/ask')).statusCode, 400);
});

test('returns a safe error when the model provider fails', async t => {
  const app = buildApp({ answer: async () => { throw new Error('Sensitive provider detail'); } });
  t.after(() => app.close());
  const response = await app.inject('/ask?question=hello');
  assert.equal(response.statusCode, 502);
  assert.doesNotMatch(response.body, /Sensitive/);
});
