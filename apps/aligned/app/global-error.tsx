"use client";

/**
 * Last resort: an error in the root layout itself, where no other boundary
 * can render. Must supply its own <html> and <body>, and cannot rely on the
 * app's fonts or Tailwind build, so it is styled inline.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAF6F0",
          color: "#2b2620",
          fontFamily: "Georgia, serif",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 360 }}>
          <h1 style={{ fontSize: 26, fontWeight: 600, margin: "0 0 12px" }}>Aligned couldn&rsquo;t load.</h1>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 15, lineHeight: 1.6, color: "#5b5348", margin: 0 }}>
            Nothing you wrote has been lost. Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              border: 0,
              borderRadius: 999,
              background: "#1F4E73",
              color: "#FAF6F0",
              padding: "14px 28px",
              fontSize: 15,
              fontWeight: 600,
              fontFamily: "system-ui, sans-serif",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
