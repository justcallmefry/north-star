type Props = { title: string; description: string; duration: string };

export function NextDareSection({ title, description, duration }: Props) {
  return (
    <section className="mag-section mag-reveal">
      <div className="mag-label">§ VI — On the Cover Next Week</div>
      <p className="mag-display" style={{ fontSize: "1.4rem", marginBottom: 12 }}>
        Your next dare: <em style={{ fontStyle: "italic" }}>{title}</em>
      </p>
      <p className="mag-body">{description}</p>
      <p className="mag-meta" style={{ marginTop: 12 }}>{duration}</p>
    </section>
  );
}
