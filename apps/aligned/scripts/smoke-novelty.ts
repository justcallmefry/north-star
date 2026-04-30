// apps/aligned/scripts/smoke-novelty.ts
// Standalone smoke for findNovelTags. Run: npx tsx scripts/smoke-novelty.ts
import { findNovelTags } from "../lib/novelty";

function assertEq<T>(name: string, actual: T, expected: T) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.error(`FAIL ${name}\n  expected: ${e}\n  actual:   ${a}`);
    process.exit(1);
  }
  console.log(`PASS ${name}`);
}

// 1. Returns novel words when they appear in current but not past
assertEq(
  "novel words detected",
  findNovelTags(
    "I love watching the seabirds glide over those lighthouse cliffs",
    ["We had coffee on the porch", "I felt calm at the lake"],
    "Long enough user reply to satisfy the wordcount guard about feelings"
  ),
  ["watching", "seabirds", "glide"]
);

// 2. Combined wordcount guard suppresses on short content
assertEq(
  "wordcount guard",
  findNovelTags("seabirds", [], "tiny"),
  []
);

// 3. Stop words are ignored
assertEq(
  "stop words ignored",
  findNovelTags(
    "And the and that this just very really only also into",
    [],
    "Long enough user reply to satisfy the wordcount guard about feelings"
  ),
  []
);

// 4. Past words are excluded
assertEq(
  "past words excluded",
  findNovelTags(
    "lighthouse coffee porch sailing",
    ["coffee porch lighthouse"],
    "Long enough user reply to satisfy the wordcount guard about feelings"
  ),
  ["sailing"]
);

console.log("ALL PASS");
