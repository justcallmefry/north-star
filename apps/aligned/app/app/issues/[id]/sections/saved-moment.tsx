type SavedMoment = { kind: "savedMoment"; photoUrl: string; caption: string; source: "dare" | "memory" };
type SavedMomentFallback = { kind: "savedMomentFallback"; quote: string; attribution: string };
type Props = SavedMoment | SavedMomentFallback;

export function SavedMomentSection(p: Props) {
  if (p.kind === "savedMomentFallback") {
    return (
      <section className="mag-section mag-reveal">
        <div className="mag-label">§ V — A Saved Moment</div>
        <blockquote className="mag-pullquote" style={{ margin: "12px 0 0", fontSize: "1.3rem" }}>
          &ldquo;{p.quote}&rdquo;
        </blockquote>
        <p className="mag-meta" style={{ marginTop: 16 }}>{p.attribution}</p>
      </section>
    );
  }
  return (
    <section className="mag-section mag-reveal">
      <div className="mag-label">§ V — A Saved Moment</div>
      <figure
        style={{
          aspectRatio: "4/5",
          backgroundImage: `linear-gradient(rgba(0,0,0,0),rgba(0,0,0,0.45)), url(${p.photoUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderRadius: 4,
          margin: "20px 0 0",
          display: "flex",
          alignItems: "flex-end",
          padding: 20,
        }}
      >
        <figcaption
          style={{
            color: "#faf7f2",
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
            fontSize: "0.85rem",
            lineHeight: 1.4,
          }}
        >
          {p.caption}
        </figcaption>
      </figure>
    </section>
  );
}
