# Café Linden agent

A TypeScript backend for a fictional café. The LLM selects between two tools:

- `search_cafe_knowledge` searches code-defined menu facts using embeddings and cosine similarity in an in-memory vector store.
- `get_cafe_info` returns a fixed string with opening hours, address, and contact details.

Each API request starts a separate conversation. A question can require either tool, both tools, or no tools for an unrelated request. Tool results go back to the LLM before it produces the final answer.

## Run locally

Use Node.js 22 or later and an OpenAI API key with access to `gpt-6-luna` and `text-embedding-3-small`.

```sh
npm ci
cp .env.example .env
```

Set `OPENAI_API_KEY` in `.env`. Keep that file local. Model names and port are set directly in `src/server.ts`. The application uses the OpenAI Responses API for function calling and the embeddings API for search.

```sh
npm run dev
```

The server listens at `http://127.0.0.1:3000`. Startup embeds the source text before accepting requests. Restart after changing the source facts.

Open `http://127.0.0.1:3000` for the café interface. It sends questions to the same API, displays answers and tool usage, and keeps a visible conversation until you clear or reload the page. The API still answers each question independently.

You can browse directly to:

- [Menu question](http://127.0.0.1:3000/ask?question=What%20vegan%20food%20do%20you%20serve%3F)
- [Opening hours](http://127.0.0.1:3000/ask?question=When%20do%20you%20open%3F)
- [Both tools](http://127.0.0.1:3000/ask?question=What%20does%20a%20cappuccino%20cost%20and%20when%20do%20you%20open%3F)
- [Missing information](http://127.0.0.1:3000/ask?question=Do%20you%20deliver%3F)

Or send JSON:

```sh
curl -X POST http://127.0.0.1:3000/ask \
  -H 'Content-Type: application/json' \
  -d '{"question":"What vegan food do you serve?"}'
```

Responses contain `answer` and `toolsUsed`. The latter records the functions actually executed, in order. It helps demonstrate tool selection during the interview.

`GET /health` reports whether the server is running. It does not check current provider availability.

## Verify

```sh
npm run typecheck
npm test
npm run build
npm start
```

The automated tests use simulated model responses and embeddings and do not need a key or incur API charges. They verify application behavior, not the live model's tool selection or answer accuracy. Use the example requests above to check those with the real model. Live requests and startup embeddings incur API usage.

## Code map

- `src/knowledge.ts`: fictional source facts and the fixed response.
- `src/vector-store.ts`: vector indexing and similarity search.
- `src/agent.ts`: tool schemas, instructions, execution, and bounded model loop.
- `src/app.ts`: HTTP routes, request validation, and error responses.
- `src/server.ts`: OpenAI integration and server startup.

The knowledge search returns the three nearest source passages. Relevance scores are similarity measures, not confidence that a passage answers the question. The agent instructions tell the model to acknowledge missing information and avoid inventing facts.

## API documentation

- [OpenAI function calling](https://developers.openai.com/api/docs/guides/function-calling)
- [OpenAI embeddings](https://developers.openai.com/api/docs/guides/embeddings)

## Shortcuts and future work

See [SHORTCUTS.md](SHORTCUTS.md).
