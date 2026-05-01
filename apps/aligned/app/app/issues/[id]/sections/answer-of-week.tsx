type Props = {
  quote: string;
  attributedTo: "a" | "b";
  promptText: string;
  partnerNames: { a: string; b: string };
};

export function AnswerOfWeekSection({ quote, attributedTo, promptText, partnerNames }: Props) {
  const who = attributedTo === "a" ? partnerNames.a : partnerNames.b;
  return (
    <section className="mag-section mag-reveal" style={{ background: "#f3ede0" }}>
      <div className="mag-label">§ III — Answer of the Week</div>
      <blockquote className="mag-pullquote" style={{ margin: "12px 0 0" }}>
        &ldquo;{quote}&rdquo;
      </blockquote>
      <p className="mag-meta" style={{ marginTop: 16 }}>
        — {who}, on &ldquo;{truncate(promptText, 60)}&rdquo;
      </p>
    </section>
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}
