/**
 * Canonical daily question bank for Aligned — positive, playful, couple-forward.
 * Tone: warm rituals, not therapy homework. Answerable in under ~3 minutes.
 * Used by seed.ts, update-daily-prompts.ts, and append-extra-daily-prompts.ts.
 */

export type DailyPromptSeed = {
  text: string;
  momentText?: string | null;
  category: "gratitude" | "communication" | "reflection" | "fun" | "growth" | "other";
  tone: "light" | "deep" | "playful" | "serious";
};

export const DAILY_PROMPTS: DailyPromptSeed[] = [
  // —— Fun & playful ——
  {
    text: "What made you laugh today—or almost laugh?",
    category: "fun",
    tone: "playful",
  },
  {
    text: "If you could order takeout with zero guilt tonight, what are you getting—and would you share?",
    category: "fun",
    tone: "playful",
  },
  {
    text: "What song, podcast, or video has been stuck in your head in a good way?",
    category: "fun",
    tone: "light",
  },
  {
    text: "What tiny adventure would you say yes to this month—nothing huge, just fun?",
    category: "fun",
    tone: "playful",
  },
  {
    text: "What memory of the two of you still makes you grin?",
    category: "fun",
    tone: "light",
  },
  {
    text: "If we had a lazy Saturday together, what would make it feel like a win?",
    category: "fun",
    tone: "playful",
  },
  {
    text: "What are you geeking out about lately—even a little?",
    category: "fun",
    tone: "light",
  },
  {
    text: "Picture a perfect low-key date night this week—what’s on the menu?",
    category: "fun",
    tone: "playful",
  },
  {
    text: "What’s something you used to do for fun that you’d like to try again together?",
    category: "fun",
    tone: "playful",
  },
  {
    text: "What show, movie, or game mood are you in—cozy, funny, or something new?",
    category: "fun",
    tone: "light",
  },

  // —— Gratitude & appreciation ——
  {
    text: "What’s one small thing about your partner you’re glad is true today?",
    category: "gratitude",
    tone: "light",
    momentText: "If you want, name one specific moment—not only a trait.",
  },
  {
    text: "What surprised you in a good way lately?",
    category: "gratitude",
    tone: "light",
  },
  {
    text: "Who or what felt like a little gift lately?",
    category: "gratitude",
    tone: "light",
  },
  {
    text: "What’s something ordinary today that felt good anyway?",
    category: "gratitude",
    tone: "light",
  },
  {
    text: "What’s a detail you noticed today that you might otherwise forget?",
    category: "gratitude",
    tone: "light",
  },
  {
    text: "What’s giving you good energy right now—coffee, sunshine, a plan, them?",
    category: "gratitude",
    tone: "light",
  },
  {
    text: "What’s a kindness you noticed—given, received, or overheard?",
    category: "gratitude",
    tone: "light",
  },
  {
    text: "What went a little better than you expected recently?",
    category: "gratitude",
    tone: "light",
  },

  // —— Connection & emotional closeness (positive frame) ——
  {
    text: "What’s one thing you’re looking forward to doing together?",
    category: "communication",
    tone: "light",
  },
  {
    text: "What’s a small way your partner made your day brighter recently?",
    category: "communication",
    tone: "light",
  },
  {
    text: "When did you feel most like yourself around them lately?",
    category: "communication",
    tone: "light",
  },
  {
    text: "What kind of attention feels best lately—words, humor, touch, time, or acts of kindness?",
    category: "communication",
    tone: "deep",
  },
  {
    text: "What felt easy between you two lately?",
    category: "communication",
    tone: "light",
  },
  {
    text: "What’s something you appreciate about *us* right now—not fixing, just noticing?",
    category: "communication",
    tone: "light",
  },
  {
    text: "What’s one upbeat thing you’d want your partner to know about your day?",
    category: "communication",
    tone: "light",
    momentText: "Totally optional: one sentence is enough.",
  },
  {
    text: "What’s your favorite way to reconnect after a busy day?",
    category: "communication",
    tone: "light",
  },
  {
    text: "What’s something you’re excited to tell them the next time you’re face-to-face?",
    category: "communication",
    tone: "light",
  },
  {
    text: "What’s an inside joke that still gets you?",
    category: "communication",
    tone: "playful",
  },
  {
    text: "What’s something you’d love more of as a couple—fun, rest, adventure, or cozy time?",
    category: "communication",
    tone: "light",
  },

  // —— Warm romance & attraction (playful, PG) ——
  {
    text: "What’s something about your partner that caught your attention lately—in a sweet or silly way?",
    category: "other",
    tone: "playful",
  },
  {
    text: "When did you feel a little spark in an everyday moment with them?",
    category: "other",
    tone: "light",
  },
  {
    text: "What’s a flirty compliment you almost sent today?",
    category: "other",
    tone: "playful",
  },
  {
    text: "What’s a non-obvious thing you find attractive about them right now—habit, laugh, brain?",
    category: "other",
    tone: "light",
  },
  {
    text: "What would make tonight feel 10% more romantic without a big production?",
    category: "other",
    tone: "playful",
  },

  // —— Reflection & meaning (gentle, not heavy) ——
  {
    text: "What’s a small win lately that no one else might notice?",
    category: "reflection",
    tone: "light",
  },
  {
    text: "What moment from the last few days do you want to remember on purpose?",
    category: "reflection",
    tone: "light",
  },
  {
    text: "What’s one way you’ve been kind to yourself lately?",
    category: "reflection",
    tone: "light",
  },
  {
    text: "What are you glad you said yes to lately?",
    category: "reflection",
    tone: "light",
  },
  {
    text: "When did you slow down long enough to notice something good?",
    category: "reflection",
    tone: "light",
  },
  {
    text: "What’s something that felt meaningful—even if it looked ordinary?",
    category: "reflection",
    tone: "deep",
  },
  {
    text: "What would past-you from a year ago cheer about in your life today?",
    category: "reflection",
    tone: "light",
  },

  // —— Growth, dreams, future (hope-forward) ——
  {
    text: "What are you quietly hoping for soon—big or small?",
    category: "growth",
    tone: "light",
  },
  {
    text: "What’s a trip, outing, or day trip you’d love us to plan when we can?",
    category: "growth",
    tone: "light",
  },
  {
    text: "What fun thing do you want to try together—not someday, but in the next month or two?",
    category: "growth",
    tone: "playful",
  },
  {
    text: "What tiny tradition would you love us to keep—coffee on Sundays, a walk, movie night?",
    category: "growth",
    tone: "light",
  },
  {
    text: "What’s something you’re curious to learn together—a skill, recipe, game, or class?",
    category: "growth",
    tone: "playful",
  },
  {
    text: "What does “a good month together” look like for you—in one concrete thing?",
    category: "growth",
    tone: "light",
  },
  {
    text: "What’s a photo you wish you’d taken this week—what would it have captured?",
    category: "growth",
    tone: "playful",
  },

  // —— Soft “us” skills (positive, not conflict-mining) ——
  {
    text: "What helps you switch into relax mode—so your partner can cheer you on, not guess?",
    category: "communication",
    tone: "light",
  },
  {
    text: "What’s a small request that would make this week feel smoother?",
    category: "communication",
    tone: "light",
    momentText: "Keep it friendly—one doable thing.",
  },
  {
    text: "What’s something you’re proud of about how you two show up for each other?",
    category: "communication",
    tone: "light",
  },

  // —— Mix: sensory & delight ——
  {
    text: "What’s a sound, smell, taste, or view that pleasantly surprised you today?",
    category: "fun",
    tone: "light",
  },
  {
    text: "What part of your routine actually feels good right now?",
    category: "reflection",
    tone: "light",
  },
  {
    text: "What’s a place—near or far—you’d love to visit together when the stars align?",
    category: "growth",
    tone: "light",
  },
];
