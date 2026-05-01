type Props = { words: string[] };

export function ThemesSection({ words }: Props) {
  if (words.length === 0) return null;
  return (
    <section className="mag-section mag-reveal">
      <div className="mag-label">§ II — Recurring Themes</div>
      <p className="mag-body" style={{ marginBottom: 8 }}>
        Across both your answers this week, these kept surfacing:
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
        {words.map((w, i) => (
          <span key={w} style={{ display: "inline-flex", alignItems: "baseline", gap: 10 }}>
            <span
              className="mag-display"
              style={{ fontStyle: "italic", fontSize: "1.4rem", fontWeight: 400 }}
            >
              {w}
            </span>
            {i < words.length - 1 && <span style={{ color: "#c9c2b1", fontSize: "1.4rem" }}>·</span>}
          </span>
        ))}
      </div>
    </section>
  );
}
