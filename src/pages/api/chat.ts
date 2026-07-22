import type { APIRoute } from "astro";
import { streamChatCompletion, type ChatMessage } from "../../lib/openrouter";
import { buildSystemPrompt, resolveProjectCards } from "../../lib/systemPrompt";
import { AI_FALLBACK_MESSAGE } from "../../lib/constants";

export const prerender = false;

const MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("OPENROUTER_API_KEY is not configured on the server.");
    return new Response(
      JSON.stringify({ error: AI_FALLBACK_MESSAGE, resumeFallback: true }),
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
    // Covers rate limits, quota/context-length errors, and upstream 5xxs —
    // OpenRouter's free tier fails these at the initial request, before any
    // streaming starts. Log the real cause, but never show it to visitors.
    console.error("OpenRouter request failed:", err);
    return new Response(
      JSON.stringify({ error: AI_FALLBACK_MESSAGE, resumeFallback: true }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let fullReply = "";

  const sseStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = modelStream.getReader();
      try {
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
      } catch (err) {
        // Rarer: the connection drops mid-stream after tokens already
        // started. Replace whatever partial text rendered so far.
        console.error("OpenRouter stream failed:", err);
        controller.enqueue(
          encoder.encode(`event: fallback\ndata: ${JSON.stringify({ text: AI_FALLBACK_MESSAGE })}\n\n`)
        );
      } finally {
        controller.close();
      }
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
