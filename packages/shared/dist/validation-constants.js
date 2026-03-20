"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALIDATION_ACK_MAX_LENGTH = exports.VALIDATION_ALLOWED_EMOJIS = void 0;
exports.parseValidationReactions = parseValidationReactions;
/** Allowed emoji reactions (exact set). Max 2 per response per viewer. */
exports.VALIDATION_ALLOWED_EMOJIS = ["❤️", "🫶", "😌", "🥺", "😂"];
exports.VALIDATION_ACK_MAX_LENGTH = 100;
const ALLOWED_REACTION_SET = new Set(exports.VALIDATION_ALLOWED_EMOJIS);
/** Longest-first for prefix parsing (handles multi-codepoint emojis like ❤️). */
const EMOJIS_LONGEST_FIRST = [...exports.VALIDATION_ALLOWED_EMOJIS].sort((a, b) => b.length - a.length || [...b].length - [...a].length);
/**
 * Parse stored reaction string (concatenated emojis, no separator) into up to 2 allowed emojis.
 * Prefer longest-prefix matching first (matches how we save `emojiList.join("")`); some runtimes'
 * Intl.Segmenter splits codepoints in ways that no longer match our allowlist exactly, which
 * previously hid reactions in the UI.
 */
function parseValidationReactions(s) {
    if (!s)
        return [];
    const result = [];
    let rest = s.trim();
    while (rest.length > 0 && result.length < 2) {
        const found = EMOJIS_LONGEST_FIRST.find((e) => rest.startsWith(e));
        if (!found)
            break;
        result.push(found);
        rest = rest.slice(found.length);
    }
    if (result.length > 0)
        return result;
    if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
        try {
            const { Segmenter } = Intl;
            const seg = new Segmenter(undefined, { granularity: "grapheme" });
            const out = [];
            for (const { segment } of seg.segment(s)) {
                const g = segment.trim();
                if (!g)
                    continue;
                if (ALLOWED_REACTION_SET.has(g)) {
                    out.push(g);
                    if (out.length >= 2)
                        return out;
                }
            }
            if (out.length > 0)
                return out;
        }
        catch (_a) {
            // ignore
        }
    }
    return [];
}
