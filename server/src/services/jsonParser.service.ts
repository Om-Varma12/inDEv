/**
 * Robustly parses JSON from LLM output, which is often malformed in
 * predictable ways: wrapped in markdown fences, trailing commas,
 * single-quoted strings, unquoted keys, truncated output, stray
 * commentary before/after the JSON, smart quotes, etc.
 *
 * Strategy: try increasingly aggressive repair passes until one parses.
 * Throws only if every strategy fails.
 */

export class JSONParseError extends Error {
  constructor(
    message: string,
    public readonly original: string,
    public readonly attempts: string[],
  ) {
    super(message);
    this.name = "JSONParseError";
  }
}

export function parseJSON<T = unknown>(raw: string): T {
  if (raw == null) {
    throw new JSONParseError("Input is null/undefined", String(raw), []);
  }

  const attempts: string[] = [];
  const tryParse = (label: string, text: string): T | undefined => {
    attempts.push(label);
    try {
      return JSON.parse(text) as T;
    } catch {
      return undefined;
    }
  };

  let text = raw.trim();

  // 1. Straight parse
  let result = tryParse("raw", text);
  if (result !== undefined) return result;

  // 2. Strip markdown code fences (```json ... ``` or ``` ... ```)
  text = stripCodeFences(text);
  result = tryParse("stripped-fences", text);
  if (result !== undefined) return result;

  // 3. Extract the outermost JSON object/array (ignores leading/trailing prose)
  const extracted = extractJSONSpan(text);
  if (extracted) {
    result = tryParse("extracted-span", extracted);
    if (result !== undefined) return result;

    // 4. Apply syntax repairs to the extracted span
    const repaired = repairJSONSyntax(extracted);
    result = tryParse("repaired-extracted", repaired);
    if (result !== undefined) return result;

    // 5. Handle truncated JSON (LLM got cut off mid-generation)
    const closed = closeUnterminatedJSON(repaired);
    result = tryParse("closed-truncated", closed);
    if (result !== undefined) return result;
  }

  // 6. Last resort: repair the whole trimmed text directly
  const repairedWhole = repairJSONSyntax(text);
  result = tryParse("repaired-whole", repairedWhole);
  if (result !== undefined) return result;

  const closedWhole = closeUnterminatedJSON(repairedWhole);
  result = tryParse("closed-whole", closedWhole);
  if (result !== undefined) return result;

  throw new JSONParseError(
    `Failed to parse JSON after ${attempts.length} attempts: [${attempts.join(", ")}]`,
    raw,
    attempts,
  );
}

/** Removes ```json / ``` fences, keeping only the inner content. */
function stripCodeFences(text: string): string {
  const fenceMatch = text.match(/```(?:json|javascript|js)?\s*([\s\S]*?)```/i);
  if (fenceMatch) return fenceMatch[1].trim();

  // Unclosed fence (truncated response): strip the opening fence only
  const openFence = text.match(/^```(?:json|javascript|js)?\s*([\s\S]*)$/i);
  if (openFence) return openFence[1].trim();

  return text;
}

/**
 * Finds the first balanced { ... } or [ ... ] span in the text,
 * correctly tracking string boundaries/escapes so braces inside
 * strings don't confuse the scan. Handles unbalanced/truncated
 * input by returning everything from the start point onward.
 */
function extractJSONSpan(text: string): string | null {
  const startIdx = text.search(/[{[]/);
  if (startIdx === -1) return null;

  const openChar = text[startIdx];
  const closeChar = openChar === "{" ? "}" : "]";

  let depth = 0;
  let inString = false;
  let escaped = false;
  let quoteChar = "";

  for (let i = startIdx; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === quoteChar) {
        inString = false;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      quoteChar = ch;
      continue;
    }

    if (ch === openChar) depth++;
    else if (ch === closeChar) {
      depth--;
      if (depth === 0) {
        return text.slice(startIdx, i + 1);
      }
    }
  }

  // Unbalanced (truncated) — return from start to end, let the
  // truncation-closer handle it.
  return text.slice(startIdx);
}

/**
 * Fixes common LLM JSON syntax mistakes that a strict JSON.parse rejects.
 */
function repairJSONSyntax(text: string): string {
  let out = text;

  // Normalize smart/curly quotes to straight quotes
  out = out.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");

  // Strip JS-style comments (// line, /* block */) outside strings
  out = stripCommentsOutsideStrings(out);

  // Remove trailing commas before } or ]
  out = out.replace(/,(\s*[}\]])/g, "$1");

  // Convert single-quoted strings to double-quoted (best-effort, string-aware)
  out = convertSingleQuotedStrings(out);

  // Quote unquoted object keys: { key: 1 } -> { "key": 1 }
  out = out.replace(/([{,]\s*)([A-Za-z_$][A-Za-z0-9_$]*)(\s*:)/g, '$1"$2"$3');

  // Replace bare NaN/Infinity/undefined with null
  out = out.replace(/\bNaN\b/g, "null");
  out = out.replace(/\b-?Infinity\b/g, "null");
  out = out.replace(/\bundefined\b/g, "null");

  // Collapse accidental double commas
  out = out.replace(/,\s*,/g, ",");

  return out;
}

/** Strips // and /* *‍/ comments while respecting string literals. */
function stripCommentsOutsideStrings(text: string): string {
  let out = "";
  let inString = false;
  let quoteChar = "";
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inString) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quoteChar) inString = false;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      quoteChar = ch;
      out += ch;
      continue;
    }

    if (ch === "/" && next === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      continue;
    }

    if (ch === "/" && next === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i++; // skip trailing '/'
      continue;
    }

    out += ch;
  }

  return out;
}

/** Best-effort conversion of 'single quoted' strings to "double quoted". */
function convertSingleQuotedStrings(text: string): string {
  let out = "";
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (ch === '"') {
      // Skip existing double-quoted string untouched
      out += ch;
      i++;
      while (i < text.length) {
        out += text[i];
        if (text[i] === "\\") {
          i++;
          if (i < text.length) out += text[i];
        } else if (text[i] === '"') {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    if (ch === "'") {
      // Convert single-quoted string to double-quoted
      let buf = '"';
      i++;
      while (i < text.length && text[i] !== "'") {
        if (text[i] === "\\") {
          buf += text[i];
          i++;
          if (i < text.length) buf += text[i];
        } else if (text[i] === '"') {
          buf += '\\"'; // escape embedded double quotes
        } else {
          buf += text[i];
        }
        i++;
      }
      buf += '"';
      i++; // skip closing '
      out += buf;
      continue;
    }

    out += ch;
    i++;
  }

  return out;
}

/**
 * Attempts to close truncated JSON (e.g., the LLM hit a token limit
 * mid-object) by tracking open brackets/strings and appending the
 * necessary closers.
 */
function closeUnterminatedJSON(text: string): string {
  let inString = false;
  let escaped = false;
  let quoteChar = "";
  const stack: string[] = [];
  let lastNonSpaceIdx = -1;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quoteChar) inString = false;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      quoteChar = ch;
      lastNonSpaceIdx = i;
      continue;
    }

    if (ch === "{" || ch === "[") stack.push(ch);
    else if (ch === "}" || ch === "]") stack.pop();

    if (!/\s/.test(ch)) lastNonSpaceIdx = i;
  }

  let out = text;

  // Close an unterminated string
  if (inString) {
    out += quoteChar;
  }

  // Remove a dangling trailing comma/colon before closing
  out = out.replace(/,\s*$/, "");
  out = out.replace(/:\s*$/, ": null");

  // Close remaining open brackets in reverse order
  for (let i = stack.length - 1; i >= 0; i--) {
    out += stack[i] === "{" ? "}" : "]";
  }

  return out;
}
