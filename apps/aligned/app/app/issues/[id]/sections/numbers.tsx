type Props = { daysAnswered: number; totalDays: number; streak: number; matches: number };

export function NumbersSection({ daysAnswered, totalDays, streak, matches }: Props) {
  return (
    <section className="mag-section mag-reveal">
      <div className="mag-label">§ I — The Week in Numbers</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginTop: 18 }}>
        <Stat num={`${daysAnswered}`} sub={`/${totalDays}`} label="Days Answered" />
        <Stat num={`${streak}`} label="Day Streak" />
        <Stat num={`${matches}`} label="Matched Picks" />
      </div>
    </section>
  );
}

function Stat({ num, sub, label }: { num: string; sub?: string; label: string }) {
  return (
    <div>
      <div className="mag-display" style={{ fontSize: "2.4rem" }}>
        {num}
        {sub && <span style={{ fontSize: "1.2rem", color: "#999" }}>{sub}</span>}
      </div>
      <div className="mag-meta" style={{ marginTop: 4 }}>{label}</div>
    </div>
  );
}
