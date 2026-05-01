"use client";

import { useState } from "react";

type Props = {
  issueId: string;
  initialSaved: boolean;
  issueNumber: number;
  volumeNumber: number;
  publishedAt: Date;
  onSaveToggle: (issueId: string, next: boolean) => Promise<void>;
};

export function ColophonSection({ issueId, initialSaved, issueNumber, volumeNumber, publishedAt, onSaveToggle }: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);

  async function handleSave() {
    if (pending) return;
    setPending(true);
    const next = !saved;
    setSaved(next);
    try {
      await onSaveToggle(issueId, next);
    } catch {
      setSaved(!next);
    } finally {
      setPending(false);
    }
  }

  const month = publishedAt.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <footer className="mag-section mag-reveal" style={{ textAlign: "center", paddingTop: 32, paddingBottom: 48 }}>
      <p className="mag-display" style={{ fontStyle: "italic", fontSize: "0.9rem", color: "#888" }}>
        — End of issue —
      </p>
      <p className="mag-meta" style={{ marginTop: 8 }}>
        Issue {issueNumber} · Vol. {volumeNumber} · {month}
      </p>
      <button
        type="button"
        onClick={handleSave}
        disabled={pending}
        className="mag-meta"
        style={{
          marginTop: 24,
          background: saved ? "#faf7f2" : "#2d2d2d",
          color: saved ? "#2d2d2d" : "#faf7f2",
          border: saved ? "1px solid #2d2d2d" : "none",
          padding: "14px 24px",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          borderRadius: 2,
          cursor: pending ? "default" : "pointer",
          opacity: pending ? 0.6 : 1,
        }}
      >
        {saved ? "Saved" : "Save This Issue"}
      </button>
    </footer>
  );
}
