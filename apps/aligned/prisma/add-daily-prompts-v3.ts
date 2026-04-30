/**
 * v3 content batch.
 *
 * Idempotent — safe to run multiple times. Performs three jobs:
 *
 *   1. Backfills `partnerGuessEnabled = true` for 20 existing prompts that
 *      naturally invite a "guess what they wrote" pre-reveal flow.
 *   2. Retires 18 redundant V1/V2 prompts (sets `active = false`) that are
 *      superseded by stronger v3 content.
 *   3. Seeds 150 new daily prompts + 15 milestone prompts with the v3
 *      taxonomy fields (subcategory, depthLevel, funScore, etc.).
 *
 * Run with:  npx tsx prisma/add-daily-prompts-v3.ts
 */
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

type Subcategory =
  | "spark"
  | "warmth"
  | "today"
  | "us"
  | "future"
  | "know-you"
  | "depth"
  | "growth"
  | "playdate"
  | "milestone";

type V3Prompt = {
  text: string;
  momentText?: string;
  category: "gratitude" | "communication" | "reflection" | "fun" | "growth" | "other";
  subcategory: Subcategory;
  tone: "light" | "deep" | "playful" | "serious";
  depthLevel: number; // 1-5
  funScore: number; // 1-5
  emotionalIntensity: number; // 1-5
  partnerGuessEnabled?: boolean;
  isDateActivation?: boolean;
  isMilestone?: boolean;
  weekendOnly?: boolean;
  relationshipStage?: "new" | "established" | "long-term";
  tags?: string[];
  qualityScore?: number; // 1-15
};

// ---------------------------------------------------------------------------
// 1. Backfill: existing prompts that should opt into partner-guessing.
// ---------------------------------------------------------------------------
const PARTNER_GUESS_BACKFILL: string[] = [
  // V1
  "What's one thing about your partner you were glad for recently?",
  "What's something small that made you feel connected to your partner recently?",
  "What's a moment when you felt really heard this week?",
  "What's a question you've been curious to ask your partner?",
  "What felt easy between you two this week?",
  "What's a memory of the two of you that still makes you smile?",
  // V2
  "What's something your partner did this week that you didn't say thank you for?",
  "What's an everyday thing your partner does that quietly makes your life better?",
  "What's a way you wish your partner would ask about your day?",
  "What's a habit of yours your partner probably finds a little weird but never brings up?",
  "What's a compliment you've been meaning to give but haven't?",
  "What's something you'd want your partner to know about how you handle stress?",
  "What's a way your partner makes you feel safe?",
  "What's a sign — for you — that something's bothering you that your partner might miss?",
  "What's something kind you've been thinking about your partner lately and haven't said?",
  "What's a tiny daily thing your partner does that secretly delights you?",
  "What's a hobby or interest you'd love to share with your partner — even if they've never tried it?",
  "What's something you're working on in yourself that your partner might not know about?",
  "What's a kind of strength you see in your partner that you'd like to grow in yourself?",
  "What's a way you'd like your partner to challenge you, gently?",
];

// ---------------------------------------------------------------------------
// 2. Retire: redundant prompts to deactivate.
// ---------------------------------------------------------------------------
const RETIRE_TEXTS: string[] = [
  "What's one small thing that made you smile lately?",
  "What's something you're glad you have in your life right now?",
  "What's something simple you're thankful for right now?",
  "What's made you feel a little bit lighter lately?",
  "What's a silly or fun moment from your week?",
  "What's something that made you feel playful this week?",
  "What's something you'd love to do together just for fun?",
  "What's something you'd want to do more of as a couple?",
  "What felt easy between you two this week?",
  "What's been on repeat in your head?",
  "What's one way you've been kind to yourself lately?",
  "What's been feeling heavy or light lately?",
  "What's a question you've been curious to ask your partner?",
  "What's something you're still figuring out?",
  "What's a question you've been sitting with this week?",
  "What's something small you'd like to start doing this week?",
  "What's a place you'd love to go with your partner when you get the chance?",
  "What's one thing you're looking forward to that's just for you?",
];

// ---------------------------------------------------------------------------
// 3a. New SPARK / FUNNY (25)
// ---------------------------------------------------------------------------
const SPARK_FUNNY: V3Prompt[] = [
  { text: "If our relationship were a movie genre, which one would it be, and who'd play us?", category: "fun", subcategory: "spark", tone: "playful", depthLevel: 1, funScore: 5, emotionalIntensity: 1, tags: ["absurd", "us"] },
  { text: "What's a noise your partner makes that you've never told them you've noticed?", category: "fun", subcategory: "spark", tone: "playful", depthLevel: 2, funScore: 5, emotionalIntensity: 1, partnerGuessEnabled: true, tags: ["observation", "fond"] },
  { text: "What's the most \"us\" thing we've ever done without realizing it was a thing?", category: "fun", subcategory: "spark", tone: "playful", depthLevel: 2, funScore: 4, emotionalIntensity: 1, tags: ["us", "patterns"] },
  { text: "If you had to describe your partner using only a food, what's the food and why?", category: "fun", subcategory: "spark", tone: "playful", depthLevel: 1, funScore: 5, emotionalIntensity: 1, tags: ["absurd"] },
  { text: "What's a word or phrase your partner uses constantly that you've started saying too, against your will?", category: "fun", subcategory: "spark", tone: "playful", depthLevel: 1, funScore: 5, emotionalIntensity: 1, partnerGuessEnabled: true, tags: ["language", "us"] },
  { text: "If we were a TV show, what would the episode title be for last week?", category: "fun", subcategory: "spark", tone: "playful", depthLevel: 1, funScore: 5, emotionalIntensity: 1, tags: ["absurd", "us"] },
  { text: "What's a strongly held food opinion your partner has that you secretly disagree with?", category: "fun", subcategory: "spark", tone: "playful", depthLevel: 2, funScore: 5, emotionalIntensity: 1, partnerGuessEnabled: true, tags: ["food"] },
  { text: "What's the thing your partner thinks they're great at that you find endearing but also...not so sure?", category: "fun", subcategory: "spark", tone: "playful", depthLevel: 2, funScore: 5, emotionalIntensity: 1, tags: ["fond", "teasing"] },
  { text: "If you had to swap lives with your partner for one week, what's the thing you're most nervous about?", category: "fun", subcategory: "spark", tone: "playful", depthLevel: 2, funScore: 4, emotionalIntensity: 1, tags: ["hypothetical"] },
  { text: "What's a small habit of yours that your partner has definitely noticed but hasn't mentioned?", category: "fun", subcategory: "spark", tone: "playful", depthLevel: 2, funScore: 4, emotionalIntensity: 2, partnerGuessEnabled: true, tags: ["self", "habits"] },
  { text: "If our relationship had a theme song, what would it be — and does your partner agree?", category: "fun", subcategory: "spark", tone: "playful", depthLevel: 1, funScore: 5, emotionalIntensity: 1, partnerGuessEnabled: true, tags: ["music", "us"] },
  { text: "What's the most chaotic decision we've made together that actually worked out fine?", category: "fun", subcategory: "spark", tone: "playful", depthLevel: 2, funScore: 4, emotionalIntensity: 1, tags: ["us", "memory"] },
  { text: "What's a wildly impractical thing you'd buy if money didn't exist — for yourself, not as a gift?", category: "fun", subcategory: "spark", tone: "playful", depthLevel: 1, funScore: 5, emotionalIntensity: 1, tags: ["hypothetical"] },
  { text: "If you had to cook your partner their \"perfect meal\" from scratch with no recipe, what would you make and how wrong would it go?", category: "fun", subcategory: "spark", tone: "playful", depthLevel: 1, funScore: 5, emotionalIntensity: 1, tags: ["food", "absurd"] },
  { text: "What's the pettiest hill you've ever (privately or openly) died on in this relationship?", category: "fun", subcategory: "spark", tone: "playful", depthLevel: 2, funScore: 5, emotionalIntensity: 2, tags: ["us", "honest"] },
  { text: "What's a movie or show you've pretended to like more than you do because your partner loves it?", category: "fun", subcategory: "spark", tone: "playful", depthLevel: 2, funScore: 5, emotionalIntensity: 1, tags: ["confession"] },
  { text: "What's something your partner owns that you genuinely do not understand why they own it?", category: "fun", subcategory: "spark", tone: "playful", depthLevel: 1, funScore: 5, emotionalIntensity: 1, partnerGuessEnabled: true, tags: ["objects", "fond"] },
  { text: "If we were both animals, what species would we each be — and do those animals even coexist?", category: "fun", subcategory: "spark", tone: "playful", depthLevel: 1, funScore: 5, emotionalIntensity: 1, tags: ["absurd"] },
  { text: "What's a very specific fictional scenario where you'd be surprised by which one of you takes charge?", category: "fun", subcategory: "spark", tone: "playful", depthLevel: 2, funScore: 4, emotionalIntensity: 1, tags: ["hypothetical", "us"] },
  { text: "What's one thing you'd make a rule about in your house if you were absolute dictator for a week?", category: "fun", subcategory: "spark", tone: "playful", depthLevel: 1, funScore: 5, emotionalIntensity: 1, tags: ["hypothetical"] },
  { text: "What's the most dramatic your partner has ever been about something objectively minor?", category: "fun", subcategory: "spark", tone: "playful", depthLevel: 1, funScore: 5, emotionalIntensity: 1, partnerGuessEnabled: true, tags: ["fond"] },
  { text: "What's a recurring \"couple argument\" you've had that you both know is never actually about the thing it's about?", category: "fun", subcategory: "spark", tone: "playful", depthLevel: 3, funScore: 3, emotionalIntensity: 3, tags: ["us", "honest"] },
  { text: "What's your go-to comfort meal, and does your partner know to make it for you without being asked?", category: "fun", subcategory: "spark", tone: "playful", depthLevel: 1, funScore: 4, emotionalIntensity: 1, partnerGuessEnabled: true, tags: ["food"] },
  { text: "What's a skill gap in your partner that you've gently accepted as permanent?", category: "fun", subcategory: "spark", tone: "playful", depthLevel: 2, funScore: 5, emotionalIntensity: 1, tags: ["fond", "teasing"] },
  { text: "If you and your partner competed in a talent show, what would your act be — and who'd be the reluctant backup?", category: "fun", subcategory: "spark", tone: "playful", depthLevel: 1, funScore: 5, emotionalIntensity: 1, tags: ["absurd", "us"] },
];

// ---------------------------------------------------------------------------
// 3b. WARMTH / ROMANTIC (25)
// ---------------------------------------------------------------------------
const WARMTH: V3Prompt[] = [
  { text: "What's a moment in the last month when you caught yourself thinking \"I really love this person\"?", category: "gratitude", subcategory: "warmth", tone: "light", depthLevel: 3, funScore: 2, emotionalIntensity: 4, tags: ["love", "moment"] },
  { text: "What's a quality your partner has that you didn't know you needed until you had it?", category: "gratitude", subcategory: "warmth", tone: "light", depthLevel: 3, funScore: 2, emotionalIntensity: 3, tags: ["love"] },
  { text: "What's a small thing your partner does that signals to you that you're safe?", category: "gratitude", subcategory: "warmth", tone: "light", depthLevel: 3, funScore: 2, emotionalIntensity: 4, partnerGuessEnabled: true, tags: ["safety", "love"] },
  { text: "When does your partner look most themselves to you?", category: "gratitude", subcategory: "warmth", tone: "light", depthLevel: 3, funScore: 2, emotionalIntensity: 3, partnerGuessEnabled: true, tags: ["observation"] },
  { text: "What's a version of your partner that only you get to see?", category: "gratitude", subcategory: "warmth", tone: "deep", depthLevel: 3, funScore: 2, emotionalIntensity: 4, tags: ["intimate"] },
  { text: "What's something you've done together that felt like exactly the two of you — not like it could have been with anyone else?", category: "gratitude", subcategory: "warmth", tone: "light", depthLevel: 3, funScore: 2, emotionalIntensity: 3, tags: ["us"] },
  { text: "What's a way your partner has made you braver?", category: "gratitude", subcategory: "warmth", tone: "deep", depthLevel: 3, funScore: 2, emotionalIntensity: 4, tags: ["growth", "love"] },
  { text: "What's the thing about your partner that still surprises you, even now?", category: "gratitude", subcategory: "warmth", tone: "light", depthLevel: 2, funScore: 3, emotionalIntensity: 3, tags: ["love"] },
  { text: "What's a time recently when you felt proud of your partner — not for an accomplishment, but for who they were?", category: "gratitude", subcategory: "warmth", tone: "light", depthLevel: 3, funScore: 2, emotionalIntensity: 3, tags: ["love"] },
  { text: "If you had to describe what loving your partner feels like in a single image or moment, what would it be?", category: "gratitude", subcategory: "warmth", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 4, tags: ["love", "imagery"] },
  { text: "What's something your partner does without thinking about it that quietly makes your life easier?", category: "gratitude", subcategory: "warmth", tone: "light", depthLevel: 2, funScore: 3, emotionalIntensity: 2, partnerGuessEnabled: true, tags: ["everyday"] },
  { text: "What's a part of your day you find yourself saving to tell them?", category: "gratitude", subcategory: "warmth", tone: "light", depthLevel: 2, funScore: 3, emotionalIntensity: 3, tags: ["everyday", "love"] },
  { text: "What's something about your relationship that you'd want to keep exactly as it is?", category: "gratitude", subcategory: "us", tone: "light", depthLevel: 3, funScore: 2, emotionalIntensity: 3, tags: ["us"] },
  { text: "What's a tradition or ritual — even a tiny one — you two have that you'd miss if it disappeared?", category: "gratitude", subcategory: "us", tone: "light", depthLevel: 2, funScore: 3, emotionalIntensity: 3, tags: ["us", "ritual"] },
  { text: "What's a way your partner has changed for the better since you met?", category: "gratitude", subcategory: "warmth", tone: "deep", depthLevel: 3, funScore: 2, emotionalIntensity: 3, tags: ["growth"] },
  { text: "What would you want your partner to know you appreciate about how they love you?", category: "gratitude", subcategory: "warmth", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 4, momentText: "If you'd like, tell them now.", tags: ["love"] },
  { text: "What's a compliment your partner gave you that you still think about?", category: "gratitude", subcategory: "warmth", tone: "light", depthLevel: 3, funScore: 2, emotionalIntensity: 3, tags: ["memory"] },
  { text: "When is a time your partner showed up for you that they probably didn't realize meant that much?", category: "gratitude", subcategory: "warmth", tone: "deep", depthLevel: 3, funScore: 2, emotionalIntensity: 4, momentText: "Worth telling them now.", tags: ["love", "memory"] },
  { text: "What's something your relationship has made you believe that you didn't used to?", category: "gratitude", subcategory: "us", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 4, tags: ["growth", "us"] },
  { text: "What would you want to be doing with your partner ten years from now on a random Tuesday?", category: "gratitude", subcategory: "future", tone: "light", depthLevel: 3, funScore: 3, emotionalIntensity: 3, tags: ["future", "us"] },
  { text: "What's a way your partner makes the hard stuff easier?", category: "gratitude", subcategory: "warmth", tone: "light", depthLevel: 3, funScore: 2, emotionalIntensity: 3, tags: ["love"] },
  { text: "What's a thing you and your partner don't even have to say — you just know?", category: "gratitude", subcategory: "us", tone: "light", depthLevel: 2, funScore: 3, emotionalIntensity: 3, tags: ["us"] },
  { text: "What's something about the way you two communicate that you'd want to keep forever?", category: "communication", subcategory: "us", tone: "light", depthLevel: 3, funScore: 2, emotionalIntensity: 3, tags: ["us"] },
  { text: "What's a quiet moment with your partner that you've kept?", category: "gratitude", subcategory: "warmth", tone: "deep", depthLevel: 3, funScore: 2, emotionalIntensity: 4, tags: ["memory"] },
  { text: "What's a word that describes your partner that you don't use often enough?", category: "gratitude", subcategory: "warmth", tone: "light", depthLevel: 2, funScore: 3, emotionalIntensity: 3, momentText: "Tell them.", tags: ["love"] },
];

// ---------------------------------------------------------------------------
// 3c. DEEPER (25)
// ---------------------------------------------------------------------------
const DEEPER: V3Prompt[] = [
  { text: "What's a belief you grew up with about relationships that turned out to be wrong?", category: "reflection", subcategory: "depth", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 4, tags: ["beliefs", "history"] },
  { text: "What's the version of yourself you're working hardest to become right now?", category: "growth", subcategory: "growth", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 3, tags: ["self", "growth"] },
  { text: "What's something you've needed to hear that no one's said to you yet?", category: "reflection", subcategory: "depth", tone: "deep", depthLevel: 5, funScore: 1, emotionalIntensity: 5, tags: ["self"] },
  { text: "What's a part of your past that still shapes how you move through the world today?", category: "reflection", subcategory: "depth", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 4, tags: ["history"] },
  { text: "What's a time you stayed when part of you wanted to leave — in anything, not just this relationship?", category: "reflection", subcategory: "depth", tone: "serious", depthLevel: 5, funScore: 1, emotionalIntensity: 5, tags: ["history"] },
  { text: "What's something you've been afraid to want because it felt too large?", category: "reflection", subcategory: "depth", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 4, tags: ["self", "future"] },
  { text: "What's a feeling you have trouble naming when it's happening?", category: "reflection", subcategory: "depth", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 4, tags: ["self"] },
  { text: "What's something about being in a relationship that's harder than you thought it would be?", category: "communication", subcategory: "us", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 4, tags: ["us", "honest"] },
  { text: "What's a way you've learned to ask for what you need?", category: "growth", subcategory: "growth", tone: "deep", depthLevel: 3, funScore: 1, emotionalIntensity: 3, tags: ["growth"] },
  { text: "What's a version of yourself from five years ago that you've had to let go of?", category: "growth", subcategory: "growth", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 4, tags: ["history", "growth"] },
  { text: "What's something you carry that your partner has helped make lighter?", category: "gratitude", subcategory: "warmth", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 4, tags: ["love"] },
  { text: "What's a boundary you've gotten better at holding?", category: "growth", subcategory: "growth", tone: "deep", depthLevel: 3, funScore: 1, emotionalIntensity: 3, tags: ["growth"] },
  { text: "What's something you've come to understand about yourself through this relationship?", category: "growth", subcategory: "us", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 3, tags: ["us", "growth"] },
  { text: "What's a way you protect yourself that sometimes gets in the way?", category: "reflection", subcategory: "depth", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 4, tags: ["self", "honest"] },
  { text: "What's something you wish you could tell your younger self about love?", category: "reflection", subcategory: "depth", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 4, tags: ["history", "love"] },
  { text: "What's an assumption about yourself that turned out to be wrong?", category: "growth", subcategory: "growth", tone: "deep", depthLevel: 3, funScore: 2, emotionalIntensity: 3, tags: ["self"] },
  { text: "What's the most honest thing you believe about what a good relationship requires?", category: "reflection", subcategory: "depth", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 3, tags: ["beliefs"] },
  { text: "What's something you've stopped needing external validation for?", category: "growth", subcategory: "growth", tone: "deep", depthLevel: 3, funScore: 1, emotionalIntensity: 3, tags: ["self"] },
  { text: "What's a hard conversation you had that you're glad you had?", category: "communication", subcategory: "us", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 4, tags: ["us"] },
  { text: "What's a way you've grown that cost you something?", category: "growth", subcategory: "growth", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 4, tags: ["growth"] },
  { text: "What's a fear about the future that you don't say out loud?", category: "reflection", subcategory: "depth", tone: "deep", depthLevel: 5, funScore: 1, emotionalIntensity: 5, tags: ["future", "honest"] },
  { text: "What's something you've learned to do for yourself that you used to need from others?", category: "growth", subcategory: "growth", tone: "deep", depthLevel: 3, funScore: 1, emotionalIntensity: 3, tags: ["growth"] },
  { text: "What's a thing you've forgiven that took longer than it should have?", category: "reflection", subcategory: "depth", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 4, tags: ["history"] },
  { text: "What's a place inside you that still has some healing left to do?", category: "reflection", subcategory: "depth", tone: "serious", depthLevel: 5, funScore: 1, emotionalIntensity: 5, tags: ["self"] },
  { text: "What's something you're more honest about now than you were two years ago?", category: "growth", subcategory: "growth", tone: "deep", depthLevel: 3, funScore: 2, emotionalIntensity: 3, tags: ["growth"] },
];

// ---------------------------------------------------------------------------
// 3d. KNOW YOU / partner-guessing (20)
// ---------------------------------------------------------------------------
const KNOW_YOU: V3Prompt[] = [
  { text: "What do you think your partner would say is the best decision they've made in the last year?", category: "fun", subcategory: "know-you", tone: "light", depthLevel: 2, funScore: 4, emotionalIntensity: 2, partnerGuessEnabled: true, tags: ["guess"] },
  { text: "What do you think your partner would say was the hardest part of last week?", category: "communication", subcategory: "know-you", tone: "light", depthLevel: 3, funScore: 2, emotionalIntensity: 3, partnerGuessEnabled: true, tags: ["guess", "this-week"] },
  { text: "What's a food your partner secretly loves that they'd never order in front of other people?", category: "fun", subcategory: "know-you", tone: "playful", depthLevel: 1, funScore: 5, emotionalIntensity: 1, partnerGuessEnabled: true, tags: ["guess", "food"] },
  { text: "What's a thing your partner does when they're nervous that they probably don't realize they do?", category: "fun", subcategory: "know-you", tone: "playful", depthLevel: 2, funScore: 4, emotionalIntensity: 2, partnerGuessEnabled: true, tags: ["guess", "observation"] },
  { text: "What do you think your partner would name as the thing they're proudest of in your relationship?", category: "communication", subcategory: "know-you", tone: "light", depthLevel: 3, funScore: 2, emotionalIntensity: 3, partnerGuessEnabled: true, tags: ["guess", "us"] },
  { text: "What's a compliment your partner wants to hear more of — do you know what it is?", category: "communication", subcategory: "know-you", tone: "light", depthLevel: 3, funScore: 2, emotionalIntensity: 3, partnerGuessEnabled: true, tags: ["guess"] },
  { text: "If your partner had to pick the best memory of the two of you, what would they pick?", category: "fun", subcategory: "know-you", tone: "light", depthLevel: 2, funScore: 3, emotionalIntensity: 3, partnerGuessEnabled: true, tags: ["guess", "memory"] },
  { text: "What's your partner's most reliable mood-lifter — the thing that almost always works?", category: "fun", subcategory: "know-you", tone: "light", depthLevel: 2, funScore: 4, emotionalIntensity: 2, partnerGuessEnabled: true, tags: ["guess"] },
  { text: "What do you think your partner would say is their biggest personal challenge right now?", category: "communication", subcategory: "know-you", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 4, partnerGuessEnabled: true, tags: ["guess"] },
  { text: "What's your partner's relationship with sleep? (Morning person, night owl, or a chaotic third option?)", category: "fun", subcategory: "know-you", tone: "playful", depthLevel: 1, funScore: 5, emotionalIntensity: 1, partnerGuessEnabled: true, tags: ["guess"] },
  { text: "What's a dream or goal your partner has that they've mentioned more than once?", category: "communication", subcategory: "know-you", tone: "light", depthLevel: 3, funScore: 2, emotionalIntensity: 3, partnerGuessEnabled: true, tags: ["guess", "future"] },
  { text: "What song do you think is on your partner's most-played list right now?", category: "fun", subcategory: "know-you", tone: "playful", depthLevel: 1, funScore: 5, emotionalIntensity: 1, partnerGuessEnabled: true, tags: ["guess", "music"] },
  { text: "What's your partner most likely to spend a free hour doing?", category: "fun", subcategory: "know-you", tone: "playful", depthLevel: 1, funScore: 4, emotionalIntensity: 1, partnerGuessEnabled: true, tags: ["guess"] },
  { text: "What's something your partner is better at than most people, that doesn't get enough recognition?", category: "gratitude", subcategory: "know-you", tone: "light", depthLevel: 2, funScore: 3, emotionalIntensity: 2, partnerGuessEnabled: true, tags: ["guess"] },
  { text: "What's the thing your partner would want most if they had a completely free day?", category: "fun", subcategory: "know-you", tone: "playful", depthLevel: 1, funScore: 4, emotionalIntensity: 1, partnerGuessEnabled: true, tags: ["guess"] },
  { text: "What would your partner say their \"love language\" is — and do you agree with their self-assessment?", category: "communication", subcategory: "know-you", tone: "light", depthLevel: 3, funScore: 2, emotionalIntensity: 3, partnerGuessEnabled: true, tags: ["guess", "love"] },
  { text: "What's a small annoyance your partner hasn't mentioned but you can tell is bothering them?", category: "communication", subcategory: "know-you", tone: "light", depthLevel: 3, funScore: 2, emotionalIntensity: 3, partnerGuessEnabled: true, tags: ["guess", "observation"] },
  { text: "If your partner could change one thing about your day-to-day life together, what do you think it would be?", category: "communication", subcategory: "know-you", tone: "deep", depthLevel: 3, funScore: 2, emotionalIntensity: 3, partnerGuessEnabled: true, tags: ["guess", "us"] },
  { text: "What's a childhood memory your partner has shared that you think shaped who they are?", category: "communication", subcategory: "know-you", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 4, partnerGuessEnabled: true, tags: ["guess", "history"] },
  { text: "What do you think your partner would say to: \"What's one thing you want more of this year?\"", category: "communication", subcategory: "know-you", tone: "light", depthLevel: 3, funScore: 2, emotionalIntensity: 3, partnerGuessEnabled: true, tags: ["guess", "future"] },
];

// ---------------------------------------------------------------------------
// 3e. PLAYDATE / date-night activation (15)
// ---------------------------------------------------------------------------
const PLAYDATE: V3Prompt[] = [
  { text: "What's one thing you'd want to do together this week, even if it's tiny?", category: "fun", subcategory: "playdate", tone: "playful", depthLevel: 1, funScore: 4, emotionalIntensity: 1, isDateActivation: true, tags: ["plan"] },
  { text: "If you had three hours and nowhere to be, how would you both spend it?", category: "fun", subcategory: "playdate", tone: "playful", depthLevel: 1, funScore: 5, emotionalIntensity: 1, isDateActivation: true, tags: ["plan"], momentText: "Compare answers — then do it." },
  { text: "What's a restaurant or meal you've been wanting to try together?", category: "fun", subcategory: "playdate", tone: "playful", depthLevel: 1, funScore: 4, emotionalIntensity: 1, isDateActivation: true, tags: ["plan", "food"] },
  { text: "What's something you've been wanting to show your partner — a place, a song, a thing you love?", category: "fun", subcategory: "playdate", tone: "light", depthLevel: 2, funScore: 4, emotionalIntensity: 2, isDateActivation: true, tags: ["plan"] },
  { text: "Is there something you've been meaning to plan together but haven't yet?", category: "fun", subcategory: "playdate", tone: "light", depthLevel: 2, funScore: 3, emotionalIntensity: 2, isDateActivation: true, tags: ["plan"] },
  { text: "What's the most recent thing that made you think \"we should do that together\"?", category: "fun", subcategory: "playdate", tone: "light", depthLevel: 1, funScore: 4, emotionalIntensity: 1, isDateActivation: true, tags: ["plan"] },
  { text: "What's a date you've talked about that never happened — could this week be the week?", category: "fun", subcategory: "playdate", tone: "light", depthLevel: 2, funScore: 4, emotionalIntensity: 2, isDateActivation: true, tags: ["plan"] },
  { text: "What's an activity your partner introduced you to that you'd want to do again?", category: "gratitude", subcategory: "playdate", tone: "light", depthLevel: 1, funScore: 4, emotionalIntensity: 2, isDateActivation: true, tags: ["plan"] },
  { text: "What's a way you'd want to celebrate the next small win — theirs or yours?", category: "fun", subcategory: "playdate", tone: "light", depthLevel: 2, funScore: 4, emotionalIntensity: 2, isDateActivation: true, tags: ["plan"] },
  { text: "What's something you'd want to do just the two of you, no phones, before the month's over?", category: "fun", subcategory: "playdate", tone: "light", depthLevel: 2, funScore: 4, emotionalIntensity: 2, isDateActivation: true, tags: ["plan"] },
  { text: "What's a book, show, or film you want to experience together right now?", category: "fun", subcategory: "playdate", tone: "playful", depthLevel: 1, funScore: 4, emotionalIntensity: 1, isDateActivation: true, tags: ["plan", "media"] },
  { text: "What's something you've been curious about or wanted to learn — and could you learn it together?", category: "growth", subcategory: "playdate", tone: "light", depthLevel: 2, funScore: 3, emotionalIntensity: 2, isDateActivation: true, tags: ["plan", "growth"] },
  { text: "What's the smallest possible thing you could do today to make your partner's day better?", category: "fun", subcategory: "playdate", tone: "light", depthLevel: 1, funScore: 4, emotionalIntensity: 2, isDateActivation: true, tags: ["plan", "today"] },
  { text: "What's a \"yes\" you've been putting off? (A trip, a reservation, a plan.)", category: "fun", subcategory: "playdate", tone: "light", depthLevel: 2, funScore: 4, emotionalIntensity: 2, isDateActivation: true, tags: ["plan"] },
  { text: "What's a routine you'd want to turn into a ritual?", category: "fun", subcategory: "playdate", tone: "light", depthLevel: 2, funScore: 3, emotionalIntensity: 2, isDateActivation: true, tags: ["plan", "ritual"] },
];

// ---------------------------------------------------------------------------
// 3f. REFLECTION (15)
// ---------------------------------------------------------------------------
const REFLECTION_NEW: V3Prompt[] = [
  { text: "What's a version of a conversation you wish you'd had differently?", category: "reflection", subcategory: "depth", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 4, tags: ["self"] },
  { text: "What does rest actually look like for you right now — is it what you expected?", category: "reflection", subcategory: "today", tone: "light", depthLevel: 2, funScore: 2, emotionalIntensity: 2, tags: ["self"] },
  { text: "What's something you've been waiting to feel ready for?", category: "reflection", subcategory: "depth", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 4, tags: ["self"] },
  { text: "What's a part of your day where you feel most like yourself?", category: "reflection", subcategory: "today", tone: "light", depthLevel: 2, funScore: 2, emotionalIntensity: 2, tags: ["self"] },
  { text: "What's something you've been holding loosely lately?", category: "reflection", subcategory: "today", tone: "light", depthLevel: 2, funScore: 2, emotionalIntensity: 2, tags: ["self"] },
  { text: "What's a thought you keep coming back to but haven't turned into words yet?", category: "reflection", subcategory: "depth", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 4, tags: ["self"] },
  { text: "What's a small thing you did this week that you'd quietly call brave?", category: "reflection", subcategory: "today", tone: "light", depthLevel: 2, funScore: 2, emotionalIntensity: 2, tags: ["self", "this-week"] },
  { text: "What's something in your life that's better than you give it credit for?", category: "reflection", subcategory: "today", tone: "light", depthLevel: 2, funScore: 2, emotionalIntensity: 2, tags: ["gratitude"] },
  { text: "What's a way you're different in private than you are in public?", category: "reflection", subcategory: "depth", tone: "deep", depthLevel: 3, funScore: 2, emotionalIntensity: 3, tags: ["self"] },
  { text: "What's a place — physical, mental, emotional — where you've found unexpected peace lately?", category: "reflection", subcategory: "today", tone: "light", depthLevel: 2, funScore: 2, emotionalIntensity: 3, tags: ["self"] },
  { text: "What's something you've accepted this year that you were fighting before?", category: "growth", subcategory: "growth", tone: "deep", depthLevel: 3, funScore: 1, emotionalIntensity: 3, tags: ["growth"] },
  { text: "What's a habit you've broken — not because you tried to, but because you grew out of it?", category: "growth", subcategory: "growth", tone: "light", depthLevel: 2, funScore: 2, emotionalIntensity: 2, tags: ["growth"] },
  { text: "What's a part of yourself that's easier to be around someone safe?", category: "reflection", subcategory: "us", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 4, tags: ["us", "self"] },
  { text: "What's something you don't say about yourself that's actually true?", category: "reflection", subcategory: "depth", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 4, tags: ["self"] },
  { text: "What's a feeling you had recently that you didn't have a name for at the time?", category: "reflection", subcategory: "today", tone: "deep", depthLevel: 3, funScore: 1, emotionalIntensity: 3, tags: ["self"] },
];

// ---------------------------------------------------------------------------
// 3g. SILLY / absurd (10)
// ---------------------------------------------------------------------------
const SILLY: V3Prompt[] = [
  { text: "If your partner was a character in a video game, what would their stats be?", category: "fun", subcategory: "spark", tone: "playful", depthLevel: 1, funScore: 5, emotionalIntensity: 1, partnerGuessEnabled: true, tags: ["absurd"] },
  { text: "What's a completely made-up word that describes a specific thing your partner does?", category: "fun", subcategory: "spark", tone: "playful", depthLevel: 1, funScore: 5, emotionalIntensity: 1, tags: ["absurd"] },
  { text: "If a stranger watched us for an hour, what's the first thing they'd notice about us?", category: "fun", subcategory: "us", tone: "playful", depthLevel: 1, funScore: 4, emotionalIntensity: 1, tags: ["us", "absurd"] },
  { text: "What's the most \"chaos gremlin\" thing your partner has done in the last month?", category: "fun", subcategory: "spark", tone: "playful", depthLevel: 1, funScore: 5, emotionalIntensity: 1, tags: ["fond", "teasing"] },
  { text: "If our relationship had a Yelp review, what would a generous but honest 3.5-star review say?", category: "fun", subcategory: "us", tone: "playful", depthLevel: 1, funScore: 5, emotionalIntensity: 1, tags: ["absurd", "us"] },
  { text: "What's something your partner does while cooking, driving, or doing chores that reveals something about their personality?", category: "fun", subcategory: "spark", tone: "playful", depthLevel: 2, funScore: 4, emotionalIntensity: 1, partnerGuessEnabled: true, tags: ["observation"] },
  { text: "What's a sound, smell, or texture that immediately makes you think of your partner?", category: "gratitude", subcategory: "warmth", tone: "playful", depthLevel: 2, funScore: 3, emotionalIntensity: 3, tags: ["sense", "love"] },
  { text: "If you had to describe the energy of your relationship in a weather forecast, what's today's forecast?", category: "fun", subcategory: "us", tone: "playful", depthLevel: 1, funScore: 5, emotionalIntensity: 1, tags: ["absurd", "us", "today"] },
  { text: "What's the most dramatic way you've ever reacted to something that turned out to be fine?", category: "fun", subcategory: "spark", tone: "playful", depthLevel: 1, funScore: 5, emotionalIntensity: 1, tags: ["self", "absurd"] },
  { text: "If you could outsource one responsibility in your relationship to a fictional character, who handles it and why?", category: "fun", subcategory: "us", tone: "playful", depthLevel: 1, funScore: 5, emotionalIntensity: 1, tags: ["absurd", "us"] },
];

// ---------------------------------------------------------------------------
// 3h. BONUS — fills to 150 (15 mixed)
// ---------------------------------------------------------------------------
const BONUS: V3Prompt[] = [
  { text: "What's your partner's relationship with punctuality — and what do you think it says about them?", category: "fun", subcategory: "know-you", tone: "playful", depthLevel: 1, funScore: 4, emotionalIntensity: 1, partnerGuessEnabled: true, tags: ["guess"] },
  { text: "What's the last thing you looked up because your partner mentioned it?", category: "fun", subcategory: "us", tone: "playful", depthLevel: 1, funScore: 4, emotionalIntensity: 1, tags: ["everyday"] },
  { text: "What's a tiny thing your partner added to your vocabulary or habits?", category: "gratitude", subcategory: "warmth", tone: "light", depthLevel: 2, funScore: 3, emotionalIntensity: 2, tags: ["us"] },
  { text: "What's a way your childhood showed up in your relationship this week without you planning for it?", category: "reflection", subcategory: "depth", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 4, tags: ["history", "us"] },
  { text: "What's something your partner said once that you've thought about more than once since?", category: "gratitude", subcategory: "warmth", tone: "light", depthLevel: 3, funScore: 2, emotionalIntensity: 3, tags: ["memory"] },
  { text: "What's a ritual you've let go of that you'd bring back if you could?", category: "reflection", subcategory: "us", tone: "light", depthLevel: 3, funScore: 2, emotionalIntensity: 3, tags: ["us", "ritual"] },
  { text: "What's the most romantic thing you've done together that wasn't planned?", category: "fun", subcategory: "us", tone: "light", depthLevel: 2, funScore: 3, emotionalIntensity: 3, tags: ["memory", "love"] },
  { text: "What's something that scared you about this relationship early on that no longer scares you?", category: "growth", subcategory: "us", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 4, tags: ["us", "growth"] },
  { text: "What's a text you almost sent but didn't?", category: "communication", subcategory: "today", tone: "playful", depthLevel: 2, funScore: 3, emotionalIntensity: 2, tags: ["today"], momentText: "You don't have to share what — just whether it was sweet, real, or dumb." },
  { text: "What's a skill your partner has that you genuinely admire?", category: "gratitude", subcategory: "warmth", tone: "light", depthLevel: 2, funScore: 3, emotionalIntensity: 2, partnerGuessEnabled: true, tags: ["love"] },
  { text: "What's a day from the last year you'd want to have again, exactly as it was?", category: "gratitude", subcategory: "warmth", tone: "light", depthLevel: 3, funScore: 2, emotionalIntensity: 3, tags: ["memory"] },
  { text: "What's something that's gotten easier between you two with time?", category: "gratitude", subcategory: "us", tone: "light", depthLevel: 3, funScore: 2, emotionalIntensity: 3, tags: ["us", "growth"] },
  { text: "What's a moment you both laughed at the same thing at the same time?", category: "fun", subcategory: "us", tone: "playful", depthLevel: 1, funScore: 4, emotionalIntensity: 2, tags: ["us", "memory"] },
  { text: "What's a quality you share with your partner that you're glad you share?", category: "gratitude", subcategory: "us", tone: "light", depthLevel: 2, funScore: 3, emotionalIntensity: 3, tags: ["us"] },
  { text: "What's something you want your partner to know you notice, even when you don't say it?", category: "communication", subcategory: "warmth", tone: "deep", depthLevel: 3, funScore: 2, emotionalIntensity: 4, momentText: "Tell them now if you'd like.", tags: ["love"] },
];

// ---------------------------------------------------------------------------
// 4. MILESTONE prompts (15) — surfaced only on anniversary / streak hooks.
// ---------------------------------------------------------------------------
const MILESTONE: V3Prompt[] = [
  { text: "What's something you remember thinking when you first realized this was going somewhere?", category: "gratitude", subcategory: "milestone", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 4, isMilestone: true, tags: ["origin"] },
  { text: "What's a moment from the early days of us that you'd put in a frame?", category: "gratitude", subcategory: "milestone", tone: "light", depthLevel: 3, funScore: 2, emotionalIntensity: 3, isMilestone: true, tags: ["origin", "memory"] },
  { text: "What's something you'd want to thank past-you for choosing?", category: "gratitude", subcategory: "milestone", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 4, isMilestone: true, tags: ["origin"] },
  { text: "What's the bravest thing about saying yes to this — to us?", category: "gratitude", subcategory: "milestone", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 4, isMilestone: true, tags: ["us"] },
  { text: "What's a way you've grown in this relationship that surprises you?", category: "growth", subcategory: "milestone", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 4, isMilestone: true, tags: ["us", "growth"] },
  { text: "What's a season of us that you didn't appreciate until later?", category: "reflection", subcategory: "milestone", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 4, isMilestone: true, tags: ["us", "history"] },
  { text: "If you wrote a chapter title for the year we just had together, what would it be?", category: "fun", subcategory: "milestone", tone: "light", depthLevel: 2, funScore: 3, emotionalIntensity: 3, isMilestone: true, tags: ["us"] },
  { text: "What's a promise — not a vow, just a promise — you'd want to make for the year ahead?", category: "communication", subcategory: "milestone", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 4, isMilestone: true, tags: ["future", "us"] },
  { text: "What's something we built together this year that we should be proud of?", category: "gratitude", subcategory: "milestone", tone: "light", depthLevel: 3, funScore: 2, emotionalIntensity: 3, isMilestone: true, tags: ["us"] },
  { text: "What's an old hurt that doesn't have the same weight anymore?", category: "growth", subcategory: "milestone", tone: "deep", depthLevel: 5, funScore: 1, emotionalIntensity: 5, isMilestone: true, tags: ["us", "history"] },
  { text: "What's a part of us that's only gotten better with time?", category: "gratitude", subcategory: "milestone", tone: "light", depthLevel: 3, funScore: 2, emotionalIntensity: 3, isMilestone: true, tags: ["us", "growth"] },
  { text: "What's a thing you'd want our future selves to remember about right now?", category: "reflection", subcategory: "milestone", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 4, isMilestone: true, tags: ["future", "us"] },
  { text: "What's a small ritual we should keep for as long as we're us?", category: "gratitude", subcategory: "milestone", tone: "light", depthLevel: 3, funScore: 2, emotionalIntensity: 3, isMilestone: true, tags: ["us", "ritual"] },
  { text: "What's a memory of us that you'd tell someone about, just to brag a little?", category: "fun", subcategory: "milestone", tone: "playful", depthLevel: 2, funScore: 4, emotionalIntensity: 2, isMilestone: true, tags: ["us", "memory"] },
  { text: "What's the next chapter of us you'd want to write — together?", category: "communication", subcategory: "milestone", tone: "deep", depthLevel: 4, funScore: 1, emotionalIntensity: 4, isMilestone: true, tags: ["future", "us"] },
];

const ALL_NEW: V3Prompt[] = [
  ...SPARK_FUNNY,
  ...WARMTH,
  ...DEEPER,
  ...KNOW_YOU,
  ...PLAYDATE,
  ...REFLECTION_NEW,
  ...SILLY,
  ...BONUS,
  ...MILESTONE,
];

async function main() {
  // ---- 1. Backfill partnerGuessEnabled on existing prompts ----
  let backfilled = 0;
  for (const text of PARTNER_GUESS_BACKFILL) {
    const r = await prisma.prompt.updateMany({
      where: { text, type: "daily" },
      data: { partnerGuessEnabled: true },
    });
    backfilled += r.count;
  }

  // ---- 2. Retire redundant prompts ----
  let retired = 0;
  for (const text of RETIRE_TEXTS) {
    const r = await prisma.prompt.updateMany({
      where: { text, type: "daily", active: true },
      data: { active: false },
    });
    retired += r.count;
  }

  // ---- 3. Seed new prompts (idempotent by text) ----
  let added = 0;
  let skipped = 0;
  for (const p of ALL_NEW) {
    const existing = await prisma.prompt.findFirst({
      where: { text: p.text, type: "daily" },
      select: { id: true },
    });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.prompt.create({
      data: {
        text: p.text,
        momentText: p.momentText ?? null,
        type: "daily",
        category: p.category,
        tone: p.tone,
        subcategory: p.subcategory,
        depthLevel: p.depthLevel,
        funScore: p.funScore,
        emotionalIntensity: p.emotionalIntensity,
        partnerGuessEnabled: p.partnerGuessEnabled ?? false,
        isDateActivation: p.isDateActivation ?? false,
        isMilestone: p.isMilestone ?? false,
        weekendOnly: p.weekendOnly ?? false,
        relationshipStage: p.relationshipStage ?? null,
        tags: p.tags ?? [],
        qualityScore: p.qualityScore ?? null,
        sourceVersion: 3,
        isPremium: false,
        active: true,
      },
    });
    added++;
  }

  console.log(
    `v3 content batch complete:\n` +
      `  partnerGuessEnabled backfilled: ${backfilled}\n` +
      `  redundant prompts retired:      ${retired}\n` +
      `  new prompts added:              ${added}\n` +
      `  new prompts skipped (existed):  ${skipped}`
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
