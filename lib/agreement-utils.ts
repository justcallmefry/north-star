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

export function getAgreementDayIndex(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  const dayOfYear = Math.floor(diff / oneDay);
  return (dayOfYear % 30) + 1;
}

export function getAgreementQuestions(dayIndex: number): AgreementQuestion[] {
  const days = loadAgreementDays();
  const day = days.find((d) => d.day === dayIndex) ?? days[0];
  return day.questions;
}
