export const RESUME_URL = "/pdf/ramkumar_resume.pdf";

// Shown to visitors whenever the AI backend fails for any reason (rate
// limits, upstream/internal errors, context-length errors, missing config,
// network hiccups, etc). Deliberately one generic, professional message
// rather than surfacing raw provider errors to recruiters/visitors — the
// real error is still logged server-side for debugging.
export const AI_FALLBACK_MESSAGE =
  "My AI assistant is taking a short rest right now — a temporary hiccup on the backend, nothing more. While it's back on its feet, feel free to go straight to my resume for the full picture of my experience and skills, or try asking again in a moment.";
