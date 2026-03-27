import { prisma } from "@/lib/prisma";

let quizContentDayColumn: boolean | undefined;
let agreementContentDayColumn: boolean | undefined;

/** Whether `QuizSession.contentDayIndex` exists (migration applied). Cached per server runtime. */
export async function useQuizContentDayIndexColumn(): Promise<boolean> {
  if (quizContentDayColumn !== undefined) return quizContentDayColumn;
  try {
    await prisma.$queryRawUnsafe(
      `SELECT "contentDayIndex" FROM "QuizSession" WHERE false`
    );
    quizContentDayColumn = true;
  } catch {
    quizContentDayColumn = false;
  }
  return quizContentDayColumn;
}

/** Whether `AgreementSession.contentDayIndex` exists. Cached per server runtime. */
export async function useAgreementContentDayIndexColumn(): Promise<boolean> {
  if (agreementContentDayColumn !== undefined) return agreementContentDayColumn;
  try {
    await prisma.$queryRawUnsafe(
      `SELECT "contentDayIndex" FROM "AgreementSession" WHERE false`
    );
    agreementContentDayColumn = true;
  } catch {
    agreementContentDayColumn = false;
  }
  return agreementContentDayColumn;
}
