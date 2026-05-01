type Props = { source: "wyr" | "quiz"; chosen: string; day: string; totalMatches: number };

export function AlignedOnSection({ chosen, day, totalMatches }: Props) {
  return (
    <section className="mag-section mag-reveal">
      <div className="mag-label">§ IV — Where You Aligned</div>
      <p className="mag-display" style={{ fontSize: "1.6rem", marginBottom: 12 }}>
        You both picked <em style={{ fontStyle: "italic" }}>&ldquo;{chosen}&rdquo;</em> on {day}&apos;s Would You Rather.
      </p>
      <p className="mag-body">
        {totalMatches} {totalMatches === 1 ? "match" : "matches"} this week. The rest? You see things differently. That&apos;s the point.
      </p>
    </section>
  );
}
