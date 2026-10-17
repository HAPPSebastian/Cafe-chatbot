import assert from 'node:assert/strict';
import test from 'node:test';
import { VectorStore } from '../src/vector-store.js';

test('ranks source passages by cosine similarity, independent of magnitude', async () => {
  const store = await VectorStore.create([
    { id: 'coffee', text: 'Coffee costs 35 SEK.' },
    { id: 'vegan', text: 'Our hummus sandwich is vegan.' },
    { id: 'cake', text: 'Cake contains milk.' },
  ], async texts => texts.length === 3 ? [[10, 0], [0, 2], [1, 1]] : [[0, 100]]);
  const results = await store.search('vegan food');
  assert.deepEqual(results.map(result => result.id), ['vegan', 'cake', 'coffee']);
  assert.equal(results[0]?.score, 1);
});

test('rejects missing, invalid and mismatched embeddings', async () => {
  const documents = [{ id: 'a', text: 'One fact' }, { id: 'b', text: 'Another fact' }];
  for (const vectors of [[], [[0, 0], [1, 0]], [[1, 0], [1]], [[NaN, 1], [1, 0]]]) {
    await assert.rejects(VectorStore.create(documents, async () => vectors));
  }
  const store = await VectorStore.create(documents, async texts => texts.length === 2 ? [[1, 0], [0, 1]] : [[1]]);
  await assert.rejects(store.search('query'), /dimensions differ/);
});
