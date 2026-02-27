"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.todayUTC = todayUTC;
/** Today at midnight UTC (date only). Use for consistent "one per day" session/quiz/agreement. */
function todayUTC() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
