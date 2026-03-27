/** Snapshot of a session row used to avoid repeating the same content bundle for a relationship. */
export type ContentSessionSnapshot = {
    sessionDate: Date;
    contentDayIndex: number | null;
};
/**
 * Which 1-based index into quiz-days.json / agreement-days.json this session uses.
 * Legacy rows use `fallbackFromDate(sessionDate)` when `contentDayIndex` is null.
 */
export declare function resolveContentDayIndex(sessionDate: Date, stored: number | null | undefined, maxDay: number, fallbackFromDate: (d: Date) => number): number;
/**
 * Picks the next content bundle for a new session: prefer any day 1..maxDay not yet used
 * by this relationship; if all are used, pick the bundle whose last use was longest ago (LRU).
 */
export declare function pickNextContentDayIndex(params: {
    maxDay: number;
    sessions: ContentSessionSnapshot[];
    fallbackFromDate: (d: Date) => number;
}): number;
//# sourceMappingURL=content-day-pick.d.ts.map