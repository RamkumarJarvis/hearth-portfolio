import { useEffect, useRef, useState } from "preact/hooks";
import Icon from "./Icon";
import ProjectCard from "./ProjectCard";
import SkillTags from "./SkillTags";
import profile from "../data/profile.json";

interface Turn {
  role: "user" | "assistant";
  content: string;
  cards?: typeof profile.projects;
  streaming?: boolean;
  showSkills?: boolean;
}

const CHIPS: { label: string; icon: string; query: string }[] = [
  { label: "Me", icon: "user", query: "Tell me about yourself." },
  { label: "Projects", icon: "briefcase", query: "What projects have you worked on?" },
  { label: "Skills", icon: "layers", query: "What are your technical skills?" },
  { label: "Fun", icon: "sparkles", query: "Tell me something fun about your journey and goals." },
  { label: "Contact", icon: "mail", query: "How can I get in touch with you?" },
];

const initials = profile.name
  .split(" ")
  .map((w) => w[0])
  .join("");

export default function ChatApp({ initialQuery }: { initialQuery?: string }) {
  const [view, setView] = useState<"hero" | "chat">(initialQuery ? "chat" : "hero");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const firedInitial = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  useEffect(() => {
    if (initialQuery && !firedInitial.current) {
      firedInitial.current = true;
      send(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  async function send(query: string) {
    if (!query.trim() || busy) return;
    setView("chat");
    setBusy(true);
    setInput("");

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("query", query);
      window.history.pushState(null, "", url.toString());
    }

    const history = turns.map((t) => ({ role: t.role, content: t.content }));
    const showSkills = /\bskills?\b/i.test(query);
    setTurns((prev) => [
      ...prev,
      { role: "user", content: query },
      { role: "assistant", content: "", streaming: true, showSkills },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, history }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Something went wrong." }));
        setTurns((prev) => updateLastAssistant(prev, err.error ?? "Something went wrong.", []));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const evt of events) {
          const lines = evt.split("\n");
          const eventLine = lines.find((l) => l.startsWith("event:"));
          const dataLine = lines.find((l) => l.startsWith("data:"));
          if (!dataLine) continue;
          const data = JSON.parse(dataLine.slice(5).trim());
          const eventType = eventLine?.slice(6).trim();

          if (eventType === "token") {
            text += data.text;
            setTurns((prev) => updateLastAssistant(prev, text, undefined, true));
          } else if (eventType === "done") {
            setTurns((prev) => updateLastAssistant(prev, text, data.cards, false));
          }
        }
      }
    } catch {
      setTurns((prev) => updateLastAssistant(prev, "I couldn't reach the model just now — try again in a moment.", []));
    } finally {
      setBusy(false);
    }
  }

  function updateLastAssistant(
    prev: Turn[],
    content: string,
    cards: typeof profile.projects | undefined,
    streaming?: boolean
  ): Turn[] {
    const next = [...prev];
    const idx = next.length - 1;
    if (next[idx]?.role === "assistant") {
      next[idx] = { ...next[idx], content, cards: cards ?? next[idx].cards, streaming: !!streaming };
    }
    return next;
  }

  function renderAssistantText(content: string) {
    const clean = content.replace(/\[project:[a-z0-9-]+\]/g, "").trim();
    return clean.split("\n\n").map((para, i) => <p key={i}>{para}</p>);
  }

  return (
    <div class="page">
      <div class="page-header">
        <div class="brand-mark">{initials[0]}</div>
        <div class="info-icon" title="This is an AI assistant answering from Ram's resume data.">
          <Icon name="info" size={18} />
        </div>
      </div>

      {view === "hero" ? (
        <div class="hero">
          <div class="hero__avatar">{initials}</div>
          <div>
            <div class="hero__greeting">Hey, I'm {profile.name}</div>
            <h1 class="hero__title">{profile.title}</h1>
          </div>
          <p class="hero__subtitle">{profile.summary}</p>

          <form
            class="ask-input"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              value={input}
              onInput={(e) => setInput((e.target as HTMLInputElement).value)}
              placeholder="Ask me anything…"
              autofocus
            />
            <button class="ask-input__send" type="submit" disabled={!input.trim()}>
              <Icon name="send" size={18} />
            </button>
          </form>

          <div class="chip-row">
            {CHIPS.map((chip) => (
              <button class="chip" key={chip.label} onClick={() => send(chip.query)}>
                <Icon name={chip.icon as any} size={14} />
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div class="chat">
          {turns.map((turn, i) =>
            turn.role === "user" ? (
              <div class="chat__turn chat__turn--user" key={i}>
                <div class="chat__bubble--user">{turn.content}</div>
              </div>
            ) : (
              <div class="chat__turn chat__turn--assistant" key={i}>
                <div class="chat__bubble--assistant">
                  {turn.content ? (
                    renderAssistantText(turn.content)
                  ) : turn.streaming ? (
                    <span class="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </span>
                  ) : null}
                </div>
                {turn.showSkills && !turn.streaming && <SkillTags skills={profile.skills} />}
                {turn.cards && turn.cards.length > 0 && (
                  <div class="chat__cards">
                    {turn.cards.map((p) => (
                      <ProjectCard project={p} key={p.slug} />
                    ))}
                  </div>
                )}
              </div>
            )
          )}
          <div ref={bottomRef} />

          <div class="chat__composer">
            <form
              class="ask-input"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <input
                value={input}
                onInput={(e) => setInput((e.target as HTMLInputElement).value)}
                placeholder="Ask me anything…"
              />
              <button class="ask-input__send" type="submit" disabled={!input.trim() || busy}>
                <Icon name="send" size={18} />
              </button>
            </form>
            <div class="chip-row" style={{ marginTop: "12px" }}>
              {CHIPS.map((chip) => (
                <button class="chip" key={chip.label} onClick={() => send(chip.query)} disabled={busy}>
                  <Icon name={chip.icon as any} size={14} />
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
