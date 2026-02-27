import path from "path";
import fs from "fs";
import type { AgreementQuestion } from "@/lib/agreement-shared";

export type { AgreementQuestion } from "@/lib/agreement-shared";
export type AgreementDayContent = { day: number; questions: AgreementQuestion[] };

let agreementDaysCache: AgreementDayContent[] | null = null;

export function loadAgreementDays(): AgreementDayContent[] {
  if (agreementDaysCache) return agreementDaysCache;
  const filePath = path.join(process.cwd(), "data", "agreement-days.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  agreementDaysCache = JSON.parse(raw) as AgreementDayContent[];
  return agreementDaysCache;
}

/** Day of year 1–366 (UTC) mapped to agreement day index 1–30 (cycles). Uses UTC for consistency with session dates. */
export function getAgreementDayIndex(date: Date): number {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const oneDay = 24 * 60 * 60 * 1000;
  const dayOfYear = Math.floor((end.getTime() - start.getTime()) / oneDay);
  return (dayOfYear % 30) + 1;
}

export function getAgreementQuestions(dayIndex: number): AgreementQuestion[] {
  const days = loadAgreementDays();
  const day = days.find((d) => d.day === dayIndex) ?? days[0];
  return day.questions;
}
