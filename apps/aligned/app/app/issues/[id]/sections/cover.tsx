import type { CoverGradient } from "@/lib/issues/types";

type Props = {
  headline: string;
  issueNumber: number;
  volumeNumber: number;
  windowStart: Date;
  windowEnd: Date;
  coverPhotoUrl: string | null;
  coverGradient: CoverGradient | null;
  partnerNames: { a: string; b: string };
};

function fmtRange(start: Date, _end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: "long", day: "numeric" };
  const startStr = start.toLocaleDateString("en-US", opts);
  return `Week of ${startStr}`;
}

export function CoverSection(p: Props) {
  const bg =
    p.coverPhotoUrl
      ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.05),rgba(0,0,0,0.45)), url(${p.coverPhotoUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
      : p.coverGradient
        ? { background: `linear-gradient(160deg, ${p.coverGradient.primary} 0%, ${p.coverGradient.secondary} 100%)` }
        : { background: "#faf7f2" };

  const onPhoto = !!p.coverPhotoUrl;

  return (
    <header
      className="mag-section"
      style={{ ...bg, color: onPhoto ? "#faf7f2" : "#2d2d2d", paddingTop: 56, paddingBottom: 56 }}
    >
      <div className="mag-meta" style={{ color: onPhoto ? "rgba(250,247,242,0.75)" : "#888" }}>
        Aligned · The Magazine
      </div>
      <div className="mag-meta" style={{ marginTop: 6, color: onPhoto ? "rgba(250,247,242,0.65)" : "#999" }}>
        Issue {p.issueNumber} / Vol. {p.volumeNumber} · {fmtRange(p.windowStart, p.windowEnd)}
      </div>
      <h1 className="mag-display" style={{ fontSize: "2.4rem", margin: "40px 0 16px" }}>
        {p.headline}
      </h1>
      <div className="mag-divider" style={{ background: onPhoto ? "rgba(250,247,242,0.85)" : "#2d2d2d" }} />
      <p className="mag-meta" style={{ marginTop: 16, color: onPhoto ? "rgba(250,247,242,0.85)" : "#888" }}>
        For {p.partnerNames.a} &amp; {p.partnerNames.b}
      </p>
    </header>
  );
}
