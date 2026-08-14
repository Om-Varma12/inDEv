/**
 * Robustly parses JSON from LLM output. Handles reasoning-model output
 * (e.g. <think>...</think> blocks containing prose, code samples, and
 * stray braces), markdown fences, trailing commas, single-quoted
 * strings, unquoted keys, truncated JSON, comments, smart quotes,
 * invalid backslash escapes (e.g. \' from models that over-escape),
 * and more.
 *
 * Strategy: strip reasoning traces, then try increasingly aggressive
 * repair passes until one parses. Throws only if every strategy fails.
 */

export class JSONParseError extends Error {
  constructor(
    message: string,
    public readonly original: string,
    public readonly attempts: string[]
  ) {
    super(message);
    this.name = "JSONParseError";
  }
}

export function parseRobustJSON<T = unknown>(raw: string): T {
  console.log("parsing rule based")

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

  // 0. Strip reasoning/thinking traces up front — this is the #1 cause
  // of false-positive brace matches and fence matches in reasoning models
  // (Qwen, DeepSeek-R1, etc.) that emit <think>...</think> before the answer.
  let text = stripReasoningTraces(raw).trim();

  // 1. Straight parse
  let result = tryParse("raw", text);
  if (result !== undefined) return result;

  // 2. Strip markdown code fences, preferring the LAST fenced block
  // (reasoning models often show example code before the real answer)
  const fenceStripped = stripCodeFences(text);
  result = tryParse("stripped-fences", fenceStripped);
  if (result !== undefined) return result;

  // 2b. Fix invalid backslash escapes inside string literals BEFORE
  // brace-extraction. This is critical: a stray `\'` or `\_` anywhere in
  // the text makes JSON.parse throw immediately on that character, which
  // masks otherwise-valid structure and can also corrupt brace/bracket
  // scanning in the extraction step if it happens to occur near a quote.
  const escapesFixed = fixInvalidEscapes(fenceStripped);
  result = tryParse("escapes-fixed", escapesFixed);
  if (result !== undefined) return result;

  // 3. Extract the LAST balanced top-level JSON object/array.
  // The real answer, in reasoning models, is virtually always the
  // final structure emitted, not the first brace encountered.
  // Try extraction against the escape-fixed text first (most reliable
  // string-boundary detection), falling back to the raw variants.
  const extracted =
    extractLastJSONSpan(escapesFixed) ??
    extractLastJSONSpan(fenceStripped) ??
    extractLastJSONSpan(text);
  if (extracted) {
    result = tryParse("extracted-span", extracted);
    if (result !== undefined) return result;

    const repaired = repairJSONSyntax(extracted);
    result = tryParse("repaired-extracted", repaired);
    if (result !== undefined) return result;

    const closed = closeUnterminatedJSON(repaired);
    result = tryParse("closed-truncated", closed);
    if (result !== undefined) return result;

    // 3b. Belt-and-suspenders: re-run the escape fixer on the repaired/
    // closed variants too, in case repairJSONSyntax's quote conversion
    // introduced or exposed new invalid escapes.
    const repairedEscaped = fixInvalidEscapes(repaired);
    result = tryParse("repaired-extracted-escaped", repairedEscaped);
    if (result !== undefined) return result;

    const closedEscaped = closeUnterminatedJSON(repairedEscaped);
    result = tryParse("closed-truncated-escaped", closedEscaped);
    if (result !== undefined) return result;
  }

  // 4. Last resort: repair the whole (reasoning-stripped) text directly
  const repairedWhole = repairJSONSyntax(text);
  result = tryParse("repaired-whole", repairedWhole);
  if (result !== undefined) return result;

  const closedWhole = closeUnterminatedJSON(repairedWhole);
  result = tryParse("closed-whole", closedWhole);
  if (result !== undefined) return result;

  // 4b. Same escape-fixing safety net on the whole-text path.
  const repairedWholeEscaped = fixInvalidEscapes(repairedWhole);
  result = tryParse("repaired-whole-escaped", repairedWholeEscaped);
  if (result !== undefined) return result;

  const closedWholeEscaped = closeUnterminatedJSON(repairedWholeEscaped);
  result = tryParse("closed-whole-escaped", closedWholeEscaped);
  if (result !== undefined) return result;

  // 5. Absolute last resort: key-level salvage. Walk the text for
  // `"key": <value>` pairs at the top level and rebuild an object from
  // whichever ones are individually parseable, skipping the rest. This
  // sacrifices completeness for the guarantee that a slightly-malformed
  // response doesn't throw away an otherwise-usable payload entirely.
  const salvaged = salvageKeyValuePairs(escapesFixed) ?? salvageKeyValuePairs(text);
  if (salvaged && Object.keys(salvaged).length > 0) {
    attempts.push("salvaged-key-values");
    return salvaged as T;
  }

  throw new JSONParseError(
    `Failed to parse JSON after ${attempts.length} attempts: [${attempts.join(", ")}]`,
    raw,
    attempts
  );
}

/**
 * Strips <think>...</think>, <thinking>...</thinking>, <reasoning>...</reasoning>
 * blocks (and other common reasoning-tag variants). Also handles the case
 * where the closing tag is missing because output was truncated mid-thought
 * (rare, but happens with tight token limits) — in that case everything
 * up to end-of-text would be reasoning, so we bail and return the original
 * text untouched rather than eating real content.
 */
function stripReasoningTraces(text: string): string {
  const tagNames = ["think", "thinking", "reasoning", "reflection", "scratchpad"];
  let out = text;

  for (const tag of tagNames) {
    const closedPattern = new RegExp(`<${tag}>[\\s\\S]*?<\\/${tag}>`, "gi");
    out = out.replace(closedPattern, "");

    // Unclosed opening tag with no matching close: only strip if there's
    // content AFTER what looks like a closing point is impossible to detect,
    // so only strip unclosed tags when nothing parseable would remain
    // otherwise. We handle this conservatively: leave unclosed tags alone
    // here; extractLastJSONSpan below will still find trailing JSON fine
    // since it scans from the end regardless of leading junk.
  }

  return out;
}

/** Removes ```json / ``` fences, preferring the LAST fenced block if multiple exist. */
function stripCodeFences(text: string): string {
  const fenceRegex = /```(?:json|javascript|js|jsonc|json5|typescript|ts)?\s*([\s\S]*?)```/gi;
  const matches = [...text.matchAll(fenceRegex)];
  if (matches.length > 0) {
    return matches[matches.length - 1][1].trim();
  }

  // Unclosed fence (truncated response): strip the opening fence only
  const openFence = text.match(/```(?:json|javascript|js|jsonc|json5|typescript|ts)?\s*([\s\S]*)$/i);
  if (openFence) return openFence[1].trim();

  return text;
}

/**
 * Scans double-quoted string literals and fixes backslash escapes that are
 * not valid JSON escapes. Valid JSON escapes after a backslash are:
 * " \ / b f n r t u(XXXX)
 *
 * LLMs very commonly over-escape — e.g. emitting `\'` for an apostrophe
 * (valid in JS/Python string literals, invalid in JSON), or `\_`, `\!`,
 * `\-` etc from models that treat JSON escaping like shell/regex escaping.
 * A single one of these anywhere in the payload makes strict JSON.parse
 * throw on the whole document, even though everything else is well-formed.
 *
 * For any invalid `\X`, we drop the backslash and keep the literal
 * character — this is almost always what was intended, since a real
 * literal backslash would itself need to have been escaped as `\\`.
 *
 * This function is string-boundary-aware (only touches text inside
 * double-quoted strings) so it never mangles actual JSON structure.
 * Single quotes are treated as ordinary characters here — quote-style
 * normalization is handled separately by repairJSONSyntax /
 * convertSingleQuotedStrings, which run on the whole (non-string-literal)
 * text and need to see raw single quotes to detect JS-style strings.
 */
function fixInvalidEscapes(text: string): string {
  const validEscapes = new Set(["\"", "\\", "/", "b", "f", "n", "r", "t", "u"]);
  let out = "";
  let inString = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (!inString) {
      if (ch === '"') inString = true;
      out += ch;
      continue;
    }

    // Inside a double-quoted string.
    if (ch === "\\") {
      const next = text[i + 1];
      if (next === undefined) {
        // Trailing lone backslash right at end of input; leave as-is,
        // later repair/closing passes will deal with truncation.
        out += ch;
        continue;
      }
      if (validEscapes.has(next)) {
        out += ch + next;
        i++;
        continue;
      }
      // Invalid escape (\', \_, \!, \-, etc). Drop the backslash, keep
      // the literal character that followed it.
      out += next;
      i++;
      continue;
    }

    if (ch === '"') {
      inString = false;
      out += ch;
      continue;
    }

    // Raw (unescaped) control characters inside a string are also
    // technically invalid JSON but common in sloppy LLM output
    // (literal newlines/tabs pasted into a "string" instead of \n/\t).
    // Escape them so the string stays well-formed.
    if (ch === "\n") {
      out += "\\n";
      continue;
    }
    if (ch === "\r") {
      out += "\\r";
      continue;
    }
    if (ch === "\t") {
      out += "\\t";
      continue;
    }

    out += ch;
  }

  return out;
}

/**
 * Finds the LAST balanced { ... } or [ ... ] span in the text, scanning
 * from the end backward for a valid starting brace/bracket and verifying
 * it balances forward. String-aware (ignores braces inside string literals).
 *
 * Candidate start positions are restricted to OUTERMOST brackets only
 * (nesting depth 0 relative to other candidates) — otherwise, for input
 * like `{"arr":[1,2,3]}`, the inner `[` would be picked as "the last
 * bracket found" and we'd silently return just `[1,2,3]`, discarding the
 * enclosing object. Tracking depth ensures "last" means "last independent
 * top-level JSON value", which is what this is meant to find (e.g. to
 * skip a leading example block before the real answer), not "last nested
 * bracket encountered".
 *
 * Falls back to "first balanced span" only if no valid span is found
 * scanning from the end.
 */
function extractLastJSONSpan(text: string): string | null {
  // Collect candidate start indices: only { or [ that occur while not
  // already inside another unclosed candidate bracket (i.e. outermost).
  const starts: number[] = [];
  let inString = false;
  let escaped = false;
  let quoteChar = "";
  let depth = 0;

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
      continue;
    }
    if (ch === "{" || ch === "[") {
      if (depth === 0) starts.push(i);
      depth++;
    } else if (ch === "}" || ch === "]") {
      if (depth > 0) depth--;
    }
  }

  // Try candidates from the LAST top-level one backward, returning the
  // first that yields a balanced (or truncated-but-substantial) span.
  for (let s = starts.length - 1; s >= 0; s--) {
    const span = balanceFrom(text, starts[s]);
    if (span && span.length > 2) return span;
  }

  return null;
}

/** Given a start index, returns the balanced bracket span, or the
 *  remainder of the string if unbalanced (truncated). */
function balanceFrom(text: string, startIdx: number): string | null {
  const openChar = text[startIdx];
  const closeChar = openChar === "{" ? "}" : "]";

  let depth = 0;
  let inString = false;
  let escaped = false;
  let quoteChar = "";

  for (let i = startIdx; i < text.length; i++) {
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
      continue;
    }

    if (ch === openChar) depth++;
    else if (ch === closeChar) {
      depth--;
      if (depth === 0) return text.slice(startIdx, i + 1);
    }
  }

  // Unbalanced — likely truncated; return from start to end so the
  // truncation-closer can attempt repair.
  return text.slice(startIdx);
}

/** Fixes common LLM JSON syntax mistakes that a strict JSON.parse rejects. */
function repairJSONSyntax(text: string): string {
  let out = text;

  out = out.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
  out = stripCommentsOutsideStrings(out);
  out = out.replace(/,(\s*[}\]])/g, "$1");
  out = convertSingleQuotedStrings(out);
  out = out.replace(/([{,]\s*)([A-Za-z_$][A-Za-z0-9_$]*)(\s*:)/g, '$1"$2"$3');
  out = out.replace(/\bNaN\b/g, "null");
  out = out.replace(/\b-?Infinity\b/g, "null");
  out = out.replace(/\bundefined\b/g, "null");
  out = out.replace(/,\s*,/g, ",");
  // Two double-quoted strings separated only by whitespace/newlines where a
  // comma was dropped between array elements or object values, e.g.
  // ["a" "b"] -> ["a","b"]. Conservative: only fires between a closing
  // quote and an opening quote with nothing but whitespace between.
  out = out.replace(/"(\s+)"/g, (match, ws) => (ws.includes("\n") || ws.length > 0 ? '",\n"' : match));
  // Missing comma between a closing } or ] and the next key/value.
  out = out.replace(/([}\]])(\s*)("(?:[^"\\]|\\.)*"\s*:)/g, "$1,$2$3");
  out = out.replace(/([}\]])(\s*)([{\[])/g, "$1,$2$3");

  return out;
}

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
      i++;
      continue;
    }

    out += ch;
  }

  return out;
}

function convertSingleQuotedStrings(text: string): string {
  let out = "";
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (ch === '"') {
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
      let buf = '"';
      i++;
      while (i < text.length && text[i] !== "'") {
        if (text[i] === "\\") {
          buf += text[i];
          i++;
          if (i < text.length) buf += text[i];
        } else if (text[i] === '"') {
          buf += '\\"';
        } else {
          buf += text[i];
        }
        i++;
      }
      buf += '"';
      i++;
      out += buf;
      continue;
    }

    out += ch;
    i++;
  }

  return out;
}

function closeUnterminatedJSON(text: string): string {
  let inString = false;
  let escaped = false;
  let quoteChar = "";
  const stack: string[] = [];

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
      continue;
    }

    if (ch === "{" || ch === "[") stack.push(ch);
    else if (ch === "}" || ch === "]") stack.pop();
  }

  let out = text;
  if (inString) out += quoteChar;
  out = out.replace(/,\s*$/, "");
  out = out.replace(/:\s*$/, ": null");

  for (let i = stack.length - 1; i >= 0; i--) {
    out += stack[i] === "{" ? "}" : "]";
  }

  return out;
}

/**
 * Last-resort salvage pass for top-level objects. Scans for
 * `"key"` followed by `:` followed by a value, at the outermost nesting
 * level, and tries to parse each `key: value` pair independently
 * (wrapping the value in `{"key": <value>}` and parsing that). Pairs
 * that parse are kept; pairs that don't are dropped. This never throws —
 * it returns null if it can't find at least one top-level key, or an
 * object with whatever it could salvage otherwise.
 *
 * This exists because a single malformed field (e.g. a code string with
 * unrepairable stray control characters) can otherwise make the entire
 * response unusable, even when every other field is perfectly fine.
 */
function salvageKeyValuePairs(text: string): Record<string, unknown> | null {
  // Find the outermost { ... } to bound the scan.
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;
  const body = text.slice(firstBrace + 1, lastBrace);

  const result: Record<string, unknown> = {};
  const keyPattern = /"((?:[^"\\]|\\.)*)"\s*:/g;
  let match: RegExpExecArray | null;
  const keyPositions: { key: string; start: number; valueStart: number }[] = [];

  while ((match = keyPattern.exec(body)) !== null) {
    keyPositions.push({
      key: match[1],
      start: match.index,
      valueStart: match.index + match[0].length,
    });
  }

  if (keyPositions.length === 0) return null;

  for (let k = 0; k < keyPositions.length; k++) {
    const { key, valueStart } = keyPositions[k];
    const valueEnd = k + 1 < keyPositions.length ? keyPositions[k + 1].start : body.length;
    let rawValue = body.slice(valueStart, valueEnd).trim();
    // Trim a single trailing comma left over from slicing between pairs.
    rawValue = rawValue.replace(/,\s*$/, "");

    const candidates = [
      rawValue,
      fixInvalidEscapes(rawValue),
      closeUnterminatedJSON(repairJSONSyntax(rawValue)),
      closeUnterminatedJSON(fixInvalidEscapes(repairJSONSyntax(rawValue))),
    ];

    for (const candidate of candidates) {
      try {
        const wrapped = JSON.parse(`{"v":${candidate}}`) as { v: unknown };
        result[key] = wrapped.v;
        break;
      } catch {
        // try next candidate
      }
    }
  }

  return result;
}