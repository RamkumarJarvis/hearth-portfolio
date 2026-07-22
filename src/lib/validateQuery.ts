import {
  MAX_QUERY_LENGTH,
  QUERY_TOO_LONG_MESSAGE,
  QUERY_INVALID_MESSAGE,
} from "./constants";

export interface ValidationResult {
  ok: boolean;
  // User-facing message to show when ok is false. Undefined when ok.
  message?: string;
}

const VOWELS = new Set(["a", "e", "i", "o", "u", "y"]);
const KEYBOARD_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

function keyboardRowOf(ch: string): number {
  for (let i = 0; i < KEYBOARD_ROWS.length; i++) {
    if (KEYBOARD_ROWS[i].includes(ch)) return i;
  }
  return -1;
}

// Cheap, dictionary-free heuristics to reject junk before spending any AI
// tokens. Shared by the client (skips the network request) and the API
// route (defense-in-depth for direct callers). Tuned to catch obvious
// keyboard-mashing / noise while staying conservative enough not to reject
// real questions — off-topic-but-coherent prompts are NOT handled here;
// those are refused by the system prompt instead.
export function validateQuery(raw: string): ValidationResult {
  const query = (raw ?? "").trim();

  if (!query) {
    return { ok: false, message: QUERY_INVALID_MESSAGE };
  }

  if (query.length > MAX_QUERY_LENGTH) {
    return { ok: false, message: QUERY_TOO_LONG_MESSAGE };
  }

  const letters = query.toLowerCase().replace(/[^a-z]/g, "");

  // A real question has at least a couple of letters — pure numbers or
  // punctuation ("12345", "!!!", "???") aren't questions we can answer.
  if (letters.length < 2) {
    return { ok: false, message: QUERY_INVALID_MESSAGE };
  }

  // The same character repeated 5+ times ("aaaaa", "!!!!!", "soooooo").
  if (/(.)\1{4,}/.test(query)) {
    return { ok: false, message: QUERY_INVALID_MESSAGE };
  }

  // Several letters with no vowel at all → consonant mash ("bcdfg", "hjkl").
  const vowelCount = [...letters].filter((c) => VOWELS.has(c)).length;
  if (letters.length >= 4 && vowelCount === 0) {
    return { ok: false, message: QUERY_INVALID_MESSAGE };
  }

  // 6+ consonants in a row — no English word runs that long.
  if (/[bcdfghjklmnpqrstvwxz]{6,}/.test(letters)) {
    return { ok: false, message: QUERY_INVALID_MESSAGE };
  }

  // Keyboard-row mashing: any 7+ letter token drawn entirely from a single
  // QWERTY row ("asdfadsfas", "qwertyui"). Real English words essentially
  // never stay on one row that long, so the length gate keeps false
  // positives (e.g. short words like "salad") out.
  for (const token of query.toLowerCase().split(/\s+/)) {
    const tokenLetters = token.replace(/[^a-z]/g, "");
    if (tokenLetters.length >= 7) {
      const rows = new Set([...tokenLetters].map(keyboardRowOf));
      rows.delete(-1);
      if (rows.size === 1) {
        return { ok: false, message: QUERY_INVALID_MESSAGE };
      }
    }
  }

  return { ok: true };
}
