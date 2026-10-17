import Fastify, { type FastifyError } from 'fastify';
import type { AgentResult } from './agent.js';
import { readFile } from 'node:fs/promises';

export function buildApp(agent: { answer(question: string): Promise<AgentResult> }, logger = false) {
  const app = Fastify({ logger, bodyLimit: 16 * 1024 });
  app.get('/health', async function getHealth() {
    return { status: 'ok' };
  });
  for (const [route, file, contentType] of [
    ['/', 'index.html', 'text/html; charset=utf-8'],
    ['/style.css', 'style.css', 'text/css; charset=utf-8'],
    ['/app.js', 'app.js', 'text/javascript; charset=utf-8'],
  ] as const) {
    app.get(route, async function serveFile(_request, reply) {
      const content = await readFile(new URL(`../public/${file}`, import.meta.url));
      return reply.type(contentType).send(content);
    });
  }
  const questionSchema = {
    type: 'object', required: ['question'], additionalProperties: false,
    properties: { question: { type: 'string', minLength: 1, maxLength: 2000, pattern: '\\S' } },
  };
  app.get<{ Querystring: { question: string } }>('/ask', {
    schema: { querystring: questionSchema },
  }, function answerGetQuestion(request) {
    return agent.answer(request.query.question.trim());
  });
  app.post<{ Body: { question: string } }>('/ask', {
    schema: { body: questionSchema },
  }, function answerPostQuestion(request) {
    return agent.answer(request.body.question.trim());
  });
  app.setErrorHandler<FastifyError>(function handleError(error, request, reply) {
    if (error.validation || error.statusCode === 400 || error.statusCode === 413 || error.statusCode === 415) {
      return reply.code(error.statusCode ?? 400).send({ error: 'Invalid request. Supply a question of 1–2000 characters.' });
    }
    request.log.error({ err: error }, 'Agent request failed');
    return reply.code(502).send({ error: 'The café assistant is temporarily unavailable. Please try again.' });
  });
  return app;
}
