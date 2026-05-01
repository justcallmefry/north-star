type Props = { text: string };

export function QuestionToSitWithSection({ text }: Props) {
  return (
    <section className="mag-section mag-reveal">
      <div className="mag-label">§ VII — A Question to Sit With</div>
      <blockquote className="mag-pullquote" style={{ fontSize: "1.3rem", margin: "12px 0 0" }}>
        &ldquo;{text}&rdquo;
      </blockquote>
      <p className="mag-meta" style={{ marginTop: 16 }}>From your reflections this week.</p>
    </section>
  );
}
