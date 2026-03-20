/** Allowed emoji reactions (exact set). Max 2 per response per viewer. */
export declare const VALIDATION_ALLOWED_EMOJIS: readonly ["❤️", "🫶", "😌", "🥺", "😂"];
export declare const VALIDATION_ACK_MAX_LENGTH = 100;
export type ResponseValidationData = {
    reactions: string | null;
    acknowledgment: string | null;
};
/**
 * Parse stored reaction string (concatenated emojis, no separator) into up to 2 allowed emojis.
 * Uses grapheme segmentation when available so DB / font normalization quirks don’t clip emojis.
 */
export declare function parseValidationReactions(s: string | null): string[];
//# sourceMappingURL=validation-constants.d.ts.map