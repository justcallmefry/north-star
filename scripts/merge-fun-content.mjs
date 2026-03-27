/**
 * Merges scripts/fun-append.json into all app data copies (and root data/).
 * Run from repo root: node scripts/merge-fun-content.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const appendPath = path.join(__dirname, "fun-append.json");

const targets = [
  path.join(root, "data", "quiz-days.json"),
  path.join(root, "data", "agreement-days.json"),
  path.join(root, "apps", "aligned", "data", "quiz-days.json"),
  path.join(root, "apps", "aligned", "data", "agreement-days.json"),
  path.join(root, "apps", "friends", "data", "quiz-days.json"),
  path.join(root, "apps", "friends", "data", "agreement-days.json"),
  path.join(root, "apps", "parent-teen", "data", "quiz-days.json"),
  path.join(root, "apps", "parent-teen", "data", "agreement-days.json"),
];

const { quizExtra, agreementExtra } = JSON.parse(fs.readFileSync(appendPath, "utf8"));

function signature(dayBundle) {
  return dayBundle.questions?.[0]?.text ?? "";
}

function mergeFile(filePath, extra, name) {
  const base = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const existingSig = new Set(base.map(signature));
  const toAdd = extra.filter((d) => signature(d) && !existingSig.has(signature(d)));
  if (toAdd.length === 0) {
    console.log(`${name}: ${filePath} — already merged, skip`);
    return;
  }
  let nextDay = Math.max(0, ...base.map((d) => d.day));
  const additions = toAdd.map((d) => {
    nextDay += 1;
    return { day: nextDay, questions: d.questions };
  });
  const out = [...base, ...additions].sort((a, b) => a.day - b.day);
  fs.writeFileSync(filePath, JSON.stringify(out));
  console.log(`${name}: ${filePath} → ${out.length} days (+${additions.length})`);
}

for (const p of targets) {
  if (!p.includes("agreement")) {
    mergeFile(p, quizExtra, "quiz");
  } else {
    mergeFile(p, agreementExtra, "agreement");
  }
}
