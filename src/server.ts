import OpenAI from 'openai';
import { CafeAgent, instructions, tools } from './agent.js';
import { buildApp } from './app.js';
import { cafeKnowledge } from './knowledge.js';
import { VectorStore } from './vector-store.js';
import type { ResponseInputItem } from 'openai/resources/responses/responses';

async function embed(client: OpenAI, texts: string[]): Promise<number[][]> {
  const response = await client.embeddings.create({
    model: 'text-embedding-3-small', input: texts,
  });
  const sortedEmbeddings = response.data.sort(function compareIndices(a, b) {
    return a.index - b.index;
  });
  return sortedEmbeddings.map(function getVector(item) {
    return item.embedding;
  });
}

async function respond(client: OpenAI, input: ResponseInputItem[]) {
  return client.responses.create({
    model: 'gpt-6-luna',
    reasoning: { effort: 'none' },
    instructions: instructions,
    input: input,
    tools: tools,
    store: false,
    max_output_tokens: 800,
  });
}

async function main() {
  if (!process.env.OPENAI_API_KEY?.trim()) throw new Error('Set OPENAI_API_KEY in .env before starting.');
  const client = new OpenAI({ timeout: 20_000, maxRetries: 0 });

  const knowledge = await VectorStore.create(cafeKnowledge, embed.bind(null, client));


  const agent = new CafeAgent(respond.bind(null, client), knowledge);
  const app = buildApp(agent, true);
  await app.listen({ port: 3000, host: '127.0.0.1' });
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, async function closeServer() {
      try {
        await app.close();
      } catch {
        process.exitCode = 1;
      }
    });
  }
}

main().catch(function handleStartupError(error) {
  console.error(error instanceof Error ? error.message : 'Startup failed.');
  process.exitCode = 1;
});
