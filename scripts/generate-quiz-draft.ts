/**
 * Generate draft quiz questions for Aligned using OpenAI.
 * Output: data/quiz-days-draft.json (review before replacing data/quiz-days.json).
 *
 * Usage:
 *   Set OPENAI_API_KEY in .env, then:
 *   npx tsx scripts/generate-quiz-draft.ts [dayNumber]
 *
 * If dayNumber is omitted, generates one new day (random 1-30).
 * Audience: Established couples (not dating). No proposal/first-date framing.
 */

import * as fs from "fs";
import * as path from "path";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DAY = process.argv[2] ? parseInt(process.argv[2], 10) : Math.floor(Math.random() * 30) + 1;

const SYSTEM_PROMPT = `You are writing "Daily Quiz" questions for the Aligned app. The app is for established couples (married, long-term partners), not a dating app.

Each quiz day has exactly 5 questions. Each question has:
- "text": A question that starts with "What is my..." or "How do I..." so one partner answers and the other guesses. Use "my".
- "options": An array of exactly 5 short answer choices (strings).

Rules:
- No dating/proposal/first-date framing. No "meeting the family", "first trip together", "relationship status".
- Do reference life together: "our", "we", "my partner".
- Keep options concise. Output valid JSON only: { "day": number, "questions": [ { "text": "...", "options": ["...", ...] }, ... ] } with exactly 5 questions.`;

async function generate(): Promise<void> {
  if (!OPENAI_API_KEY) {
    console.error("Set OPENAI_API_KEY in .env to run this script.");
    process.exit(1);
  }
  if (DAY < 1 || DAY > 30) {
    console.error("Day must be 1-30.");
    process.exit(1);
  }

  const userPrompt = `Generate quiz content for day ${DAY}. Return only the JSON object, no markdown.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("OpenAI API error:", response.status, err);
    process.exit(1);
  }

  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    console.error("No content in OpenAI response.");
    process.exit(1);
  }

  const jsonStr = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  let parsed: { day: number; questions: { text: string; options: string[] }[] };
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    console.error("Invalid JSON from model. Raw output:\n", jsonStr);
    process.exit(1);
  }

  if (!parsed.questions || parsed.questions.length !== 5) {
    console.error("Expected 5 questions, got", parsed.questions?.length ?? 0);
    process.exit(1);
  }

  const outPath = path.join(process.cwd(), "data", "quiz-days-draft.json");
  fs.writeFileSync(outPath, JSON.stringify([parsed], null, 2), "utf-8");
  console.log("Wrote draft to data/quiz-days-draft.json. Review before replacing data/quiz-days.json.");
}

generate().catch((e) => {
  console.error(e);
  process.exit(1);
});
