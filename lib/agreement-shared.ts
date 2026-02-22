/** Fixed 5-point scale for all agreement questions. Safe to import from client. */
export const AGREEMENT_OPTIONS = [
  "Strongly agree",
  "Somewhat agree",
  "Neutral",
  "Somewhat disagree",
  "Strongly disagree",
] as const;

export type AgreementQuestion = { text: string };

export type AgreementForTodayResult = {
  agreementSessionId: string;
  sessionDate: string;
  dayIndex: number;
  questions: AgreementQuestion[];
  state: "open" | "revealed";
  myParticipation: { answerIndices: number[]; guessIndices: number[] } | null;
  partnerSubmitted: boolean;
  partnerName: string | null;
  myImage: string | null;
  partnerImage: string | null;
  reveal?: {
    myScore: number;
    partnerScore: number;
    myAnswers: number[];
    myGuesses: number[];
    partnerAnswers: number[];
    partnerGuesses: number[];
    partnerName: string | null;
    overallMyScore: number;
    overallPartnerScore: number;
    overallTotal: number;
  };
};
