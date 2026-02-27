# Updating Aligned content (prompts, quiz, agreement)

How to refresh or add to **daily prompts**, **quiz questions**, and **agreement statements**, plus optional **email reminders** and **AI-generated drafts**.

---

## 1. Where the content lives

| Content | Source | Notes |
|--------|--------|------|
| **Daily prompts** (Today’s question) | `prisma/seed.ts` (initial), `prisma/update-daily-prompts.ts` (wording updates) | 40 prompts; DB table `Prompt`. Run `npx tsx prisma/update-daily-prompts.ts` after editing the list in the script. |
| **Quiz questions** | `data/quiz-days.json` | 30 days × 5 questions (each has 5 options). Edit JSON and deploy. |
| **Agreement statements** | `data/agreement-days.json` | 30 days × 5 statements (same 5-point scale). Edit JSON and deploy. |

See **docs/CONTENT-AUDIT-ESTABLISHED-COUPLES.md** for guidelines (audience: established couples, not a dating app).

---

## 2. Email reminder: “Time to review content”

You can get a **monthly email** reminding you to review and refresh this content.

### Setup

1. **Vercel**
   - In the project, go to **Settings → Environment Variables**.
   - Add:
     - `CONTENT_REVIEW_EMAIL` — email address to receive the reminder (e.g. your own).
     - `CRON_SECRET` — random string (e.g. `openssl rand -hex 32`). Vercel will send this when calling the cron.

2. **Cron schedule**
   - The reminder is triggered by a Vercel Cron job defined in **vercel.json**:
   - Schedule: **9:00 AM UTC on the 1st of every month** (`0 9 1 * *`).
   - Endpoint: `GET /api/cron/content-review`.

3. **Resend**
   - The route uses **Resend** (same as magic links). Ensure `RESEND_API_KEY` and `EMAIL_FROM` are set so the reminder can send.

After the next production deploy, the cron will run on that schedule and send the reminder to `CONTENT_REVIEW_EMAIL`.

### Manual trigger

You can trigger the same reminder on demand (e.g. for testing) by calling:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" "https://alignedconnectingcouples.com/api/cron/content-review"
```

Use the same `CRON_SECRET` value you set in Vercel.

---

## 3. Auto-generate draft quiz questions (AI)

A script can generate **draft** quiz questions using OpenAI so you can paste or merge them into `data/quiz-days.json` after review.

### Setup

- **OPENAI_API_KEY** in `.env` (or environment). Get a key from [platform.openai.com](https://platform.openai.com/api-keys).

### Run

```bash
# Generate one random day (1–30)
npx tsx scripts/generate-quiz-draft.ts

# Generate a specific day (e.g. day 7)
npx tsx scripts/generate-quiz-draft.ts 7
```

- Output is written to **`data/quiz-days-draft.json`** (one day’s worth of 5 questions + options).
- The prompt instructs the model to write for **established couples** (no dating/proposal/first-trip framing).
- **Always review** the draft before copying into `data/quiz-days.json`. Replace or edit the matching `day` entry, then deploy.

### Using the draft

1. Open `data/quiz-days-draft.json` and check the questions and options.
2. Copy the `questions` array (or the whole day object) into `data/quiz-days.json` for the desired `day`.
3. Save and run the app locally to confirm, then commit and deploy.

You can run the script multiple times (e.g. for different days) and merge results manually into `quiz-days.json`. The script overwrites `quiz-days-draft.json` each run.

---

## 4. Summary

| Goal | Action |
|------|--------|
| Get a monthly “review content” email | Set `CONTENT_REVIEW_EMAIL` and `CRON_SECRET` (and Resend) on Vercel; cron in vercel.json is already set. |
| Generate new quiz questions with AI | Set `OPENAI_API_KEY`, run `npx tsx scripts/generate-quiz-draft.ts [day]`, then review `data/quiz-days-draft.json` and merge into `data/quiz-days.json`. |
| Update daily prompts | Edit the list in `prisma/update-daily-prompts.ts`, then run `npx tsx prisma/update-daily-prompts.ts` (and ensure DB has prompts from seed). |
| Update quiz or agreement content | Edit `data/quiz-days.json` or `data/agreement-days.json` and deploy. |
