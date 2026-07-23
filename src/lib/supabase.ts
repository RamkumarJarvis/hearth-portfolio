import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Server-only. This uses the publishable/anon key, but it's never sent to
// the browser — it's read from a server env var and only ever called from
// the API route (src/pages/api/chat.ts). The `chat_prompts` table's RLS
// policy grants that key INSERT only (no SELECT/UPDATE/DELETE for anon),
// so even if it leaked, nobody could read back what visitors asked.
let client: ReturnType<typeof createClient<Database>> | null = null;

function getClient() {
  const url = import.meta.env.SUPABASE_URL;
  const key = import.meta.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!client) client = createClient<Database>(url, key);
  return client;
}

// Logs a visitor's question for later analysis (what people ask, to
// improve the resume/portfolio). Never stores AI responses. Failures are
// logged server-side and swallowed — a logging outage must never break
// the chat feature itself.
export async function logPrompt(prompt: string): Promise<void> {
  const supabase = getClient();
  if (!supabase) {
    console.error("Supabase is not configured — skipping prompt log.");
    return;
  }
  const { error } = await supabase.from("chat_prompts").insert({ prompt });
  if (error) {
    console.error("Failed to log prompt to Supabase:", error.message);
  }
}
