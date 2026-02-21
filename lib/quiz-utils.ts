import path from "path";
import fs from "fs";

export type QuizQuestion = { text: string; options: string[] };
export type QuizDayContent = { day: number; questions: QuizQuestion[] };

let quizDaysCache: QuizDayContent[] | null = null;

export function loadQuizDays(): QuizDayContent[] {
  if (quizDaysCache) return quizDaysCache;
  const filePath = path.join(process.cwd(), "data", "quiz-days.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  quizDaysCache = JSON.parse(raw) as QuizDayContent[];
  return quizDaysCache;
}

/** Day of year 1–366 mapped to quiz day index 1–30 (cycles). */
export function getQuizDayIndex(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  const dayOfYear = Math.floor(diff / oneDay);
  return (dayOfYear % 30) + 1;
}

export function getQuizQuestions(dayIndex: number): QuizQuestion[] {
  const days = loadQuizDays();
  const day = days.find((d) => d.day === dayIndex) ?? days[0];
  return day.questions;
}
