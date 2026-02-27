/** Allowed emoji reactions (exact set). Max 2 per response per viewer. */
export const VALIDATION_ALLOWED_EMOJIS = ["❤️", "🫶", "😌", "🥺", "😂"] as const;

export const VALIDATION_ACK_MAX_LENGTH = 100;

export type ResponseValidationData = {
  reactions: string | null;
  acknowledgment: string | null;
};
