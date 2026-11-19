"use client";

// Shown when a page can't load its data, most often because the Convex backend isn't running.
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main style={{ maxWidth: 560, margin: "80px auto", padding: "0 16px", fontFamily: "var(--sans)" }}>
      <h1 style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: 32 }}>Can&apos;t load the command center</h1>
      <p className="lede">
        The data backend didn&apos;t answer. In development, start it with <code>npm run convex</code> and
        load demo data with <code>npm run seed</code>, then try again.
      </p>
      <p style={{ marginTop: 20 }}><button className="btn btn-primary" onClick={reset}>Try again</button></p>
    </main>
  );
}
