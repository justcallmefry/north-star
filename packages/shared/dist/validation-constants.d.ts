/** Allowed emoji reactions (exact set). Max 2 per response per viewer. */
export declare const VALIDATION_ALLOWED_EMOJIS: readonly ["❤️", "🫶", "😌", "🥺", "😂"];
export declare const VALIDATION_ACK_MAX_LENGTH = 100;
export type ResponseValidationData = {
    reactions: string | null;
    acknowledgment: string | null;
};
//# sourceMappingURL=validation-constants.d.ts.map