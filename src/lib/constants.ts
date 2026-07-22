export const RESUME_URL = "/pdf/ramkumar_resume.pdf";

// Shown to visitors whenever the AI backend fails for any reason (rate
// limits, upstream/internal errors, context-length errors, missing config,
// network hiccups, etc). Deliberately one generic, professional message
// rather than surfacing raw provider errors to recruiters/visitors — the
// real error is still logged server-side for debugging.
export const AI_FALLBACK_MESSAGE =
  "My AI assistant is taking a short rest right now — a temporary hiccup on the backend, nothing more. While it's back on its feet, feel free to go straight to my resume for the full picture of my experience and skills, or try asking again in a moment.";

// Longest question we'll send to the model. Anything beyond this is almost
// never a genuine question and just burns tokens — rejected before any AI
// call, on both client and server.
export const MAX_QUERY_LENGTH = 500;

// Shown when a question exceeds MAX_QUERY_LENGTH.
export const QUERY_TOO_LONG_MESSAGE =
  "That's a lot to take in at once! Could you trim it down to a shorter, more focused question? I'm happy to walk through my experience, projects, or skills a piece at a time.";

// Shown when input looks like gibberish / keyboard-mashing rather than a
// real question — caught before any AI call to avoid wasting tokens.
export const QUERY_INVALID_MESSAGE =
  "Hmm, I couldn't quite make sense of that. Try asking me about my experience, projects, skills, or how to get in touch — or tap one of the chips below.";
