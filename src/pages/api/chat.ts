import type { APIRoute } from "astro";
import { streamChatCompletion, type ChatMessage } from "../../lib/openrouter";
import { buildSystemPrompt, resolveProjectCards } from "../../lib/systemPrompt";

export const prerender = false;

const MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "OPENROUTER_API_KEY is not configured on the server." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const { query, history } = (await request.json()) as {
    query: string;
    history?: ChatMessage[];
  };

  if (!query || typeof query !== "string") {
    return new Response(JSON.stringify({ error: "Missing query" }), { status: 400 });
  }

  const messages: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt() },
    ...(history ?? []),
    { role: "user", content: query },
  ];

  let modelStream: ReadableStream<Uint8Array>;
  try {
    modelStream = await streamChatCompletion(messages, { model: MODEL, apiKey });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 502 });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let fullReply = "";

  const sseStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = modelStream.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullReply += chunk;
        controller.enqueue(
          encoder.encode(`event: token\ndata: ${JSON.stringify({ text: chunk })}\n\n`)
        );
      }
      const cards = resolveProjectCards(fullReply);
      controller.enqueue(
        encoder.encode(`event: done\ndata: ${JSON.stringify({ cards })}\n\n`)
      );
      controller.close();
    },
  });

  return new Response(sseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
};
