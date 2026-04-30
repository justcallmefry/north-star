// apps/aligned/lib/copy.ts
// Central microcopy. Use COPY.* in new code. Existing scattered strings
// will be migrated incrementally — do not bulk-replace in this PR.

export const COPY = {
  waiting: {
    forPartner: (name: string | null | undefined): string =>
      name
        ? `${name} hasn't answered yet — they'll get a nudge tonight.`
        : `They haven't answered yet — they'll get a nudge tonight.`,
    forYou: (name: string | null | undefined): string =>
      name ? `${name} answered. They're waiting on you.` : `They answered — your turn.`,
  },
  reveal: {
    pre: (name: string | null | undefined): string =>
      name ? `Ready to see what ${name} wrote?` : `Ready to see what they wrote?`,
    earned: "You both showed up.",
    novel: "First time you've heard this",
    saved: "Saved to memories.",
  },
  empty: {
    noPair: "Pair with someone to start your daily ritual.",
    noToday: "No question today — check back tomorrow.",
  },
  errors: {
    submit: "That didn't save. Try once more?",
    network: "We lost the connection. Pull to refresh.",
  },
  push: {
    daily: (name: string | null | undefined): string =>
      name ? `Today's question is up. Answer with ${name}.` : `Today's question is up.`,
    partnerDone: (name: string | null | undefined): string =>
      name ? `${name} answered — your turn.` : `They answered — your turn.`,
    bothDone: (_name: string | null | undefined): string =>
      `You're both in — ready to reveal?`,
  },
  throwback: {
    eyebrow: "Saturday — look back",
    ageLine: (months: number): string =>
      months <= 1
        ? "A few weeks ago, you both answered:"
        : months < 12
          ? `${months} months ago, you both answered:`
          : months < 24
            ? "A year ago, you both answered:"
            : `${Math.floor(months / 12)} years ago, you both answered:`,
    action: "Answer it again — see how you've grown",
    thenLabel: "Then",
    nowLabel: "Now",
  },
} as const;
