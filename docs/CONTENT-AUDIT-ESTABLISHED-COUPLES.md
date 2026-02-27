# Content audit: Is this right for established couples? (Not a dating app)

Review of **daily prompts** (Today), **Daily Quiz** questions, and **Daily Agreement** statements, with an eye to: *Are we asking the right things for couples who have been together a while?*

---

## 1. Daily prompts (Today’s question)

**Source:** `prisma/update-daily-prompts.ts` / `prisma/seed.ts` (40 prompts)

**Verdict: ✅ Already well-suited for established couples.**

- Language is consistently **“your partner,” “us,” “this week,” “as a couple”** — no “your date” or “getting to know you” framing.
- Themes: gratitude, something you appreciated **about us**, feeling connected **to your partner**, what you’d want to do **more of as a couple**, moments when you felt heard, what you’re looking forward to **together**.
- Optional “moment” prompts lean on appreciation and checking in (“tell your partner one thing you appreciate,” “share something that’s been on your mind”) — good for ongoing partnership.
- **No change needed** for an “established couples, not dating” positioning.

---

## 2. Daily Quiz (5 questions per day × 30 days)

**Source:** `data/quiz-days.json`

**Verdict: ⚠️ Mixed. Many questions fit any stage; a meaningful subset reads “getting to know you” / early relationship.**

### What already works for established couples

- **Preferences & habits:** Saturday morning, comfort food, stress, movies, travel style, morning vs night, thermostat, karaoke, etc.
- **Conflict & communication:** How you resolve disagreement, how you like to apologize, how you handle bad news, communication style when upset.
- **Daily life:** Chores, finances, in-laws, pets in bed, date night, reconnecting after being apart, feeling taken for granted, division of mental load.
- **Love languages / support:** How you like to be cheered up, shown love on a random Tuesday, supported when sad or stressed, celebrated.

Those all work well for people who are already in a long-term relationship.

### Questions that skew “early relationship” / dating

These are the ones that can feel like a dating or “are we compatible?” app rather than “we’ve been together a while”:

| Day | Question / theme | Why it feels early |
|-----|------------------|--------------------|
| 3 | “How do I prefer to resolve a disagreement **between us**?” | Fine as-is; could stay. |
| 7 | “What’s my **biggest fear in a relationship**?” | Very “getting to know you.” |
| 9 | “What would make me feel **most loved on a random Tuesday**?” | Good for established; keep. |
| 12 | “What’s my **attachment style** in relationships?” | Therapy/dating vocab; can feel early. |
| 13 | “How do I feel about **meeting the family**?” | Classic early-relationship milestone. |
| 13 | “What’s my **ideal date night**?” | Can stay; “date night” is used by married couples too. |
| 16 | “What’s my take on **having kids (or more kids)**?” | Important for established too; keep. |
| 20 | “How do I feel about **public proposals or big gestures**?” | Proposal = early relationship. |
| 20 | “What’s my relationship with **my in-laws (or future in-laws)**?” | “Future” implies not yet married. |
| 22 | “How do I feel about **discussing the future (marriage, kids, etc.) early**?” | Explicitly “early” relationship. |
| 23 | “What would I want for a **proposal (if applicable)**?” | Proposal = not yet engaged. |
| 26 | “What would I want for **our first big trip together**?” | “First” = early relationship. |
| 26 | “What’s my take on **social media and our relationship status**?” | “Relationship status” = early/dating framing. |
| 30 | “What’s my **vision for us in 5 or 10 years**?” | Works for established; keep. |

### Suggested tweaks (optional)

- **Proposal questions (days 20, 23):** Either remove or rephrase for established couples, e.g. “What’s my take on big romantic gestures?” or “How do I like to celebrate big milestones (e.g. anniversaries)?”
- **“Meeting the family” (day 13):** Rephrase to something like “How do I feel about spending time with our families?” so it fits people already in the family dynamic.
- **“First big trip” (day 26):** Rephrase to “What’s my ideal kind of trip with my partner?” so it’s not “first.”
- **“Relationship status” / social media (day 26):** Rephrase to “How do I feel about sharing our relationship on social media?” (no “status”).
- **“Attachment style” (day 12):** Keep only if you want a slightly more “therapy” tone; otherwise replace with something like “How do I usually feel when we’re apart for a few days?”
- **“Biggest fear in a relationship” (day 7):** Softer option: “What’s something I need to feel secure in our relationship?”

You can do these as a **first pass** of edits in `data/quiz-days.json` and leave the rest of the quiz as-is; the majority already fits established couples.

---

## 3. Daily Agreement (5 statements per day × 30 days)

**Source:** `data/agreement-days.json`

**Verdict: ✅ Strong fit for established couples.**

- Statements assume **shared life:** “we argue,” “we divide household chores,” “our relationship,” “my partner’s friends,” “our investments,” “our work-life balance,” “our date nights,” “our parents/in-laws.”
- Topics: alone time, finances, conflict style, silence together, milestones vs daily gestures, separate hobbies, vacation planning, chores, intimacy, routine vs spontaneity, trust, jealousy, in-laws, politics, date nights, mental load, etc.
- Wording is “I believe…”, “I prefer…”, “I feel…” about **how we live together** — not “would you want kids someday” first-date style.
- **No change needed** for “established couples, not a dating app.” If anything, the agreements assume you’re already in it for the long haul.

---

## Summary

| Content set | Fit for established couples | Action |
|-------------|-----------------------------|--------|
| **Daily prompts (Today)** | ✅ Yes | None. |
| **Daily Agreement** | ✅ Yes | None. |
| **Daily Quiz** | ⚠️ Mostly yes; ~10–15% early/dating framing | Optional: reword proposal, “first trip,” “meeting the family,” “relationship status,” “biggest fear,” “attachment style” as above. |

**Update:** The suggested quiz rewrites have been applied in `data/quiz-days.json`. For ongoing updates, see **docs/CONTENT-UPDATES.md** (email reminder + AI draft script).
