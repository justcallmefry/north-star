import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12 sm:px-8 min-h-screen bg-white text-slate-900">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        ← Back
      </Link>

      <article className="mt-8">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated: February 2026
        </p>

        <div className="mt-8 space-y-8 text-base leading-relaxed text-slate-700">
          <section>
            <h2 className="text-lg font-semibold text-slate-900">1. Agreement</h2>
            <p>
              These Terms of Service (“Terms”) govern your use of Aligned (“Service”), including our website and app. By creating an account or using the Service, you agree to these Terms. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">2. Description of Service</h2>
            <p>
              Aligned is a private, relationship-focused app. It lets you and a partner answer daily questions, capture moments, and share a record of your week. Content is private by design: you choose when to reveal answers to each other. We do not provide a public or social feed.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">3. Account and Eligibility</h2>
            <p>
              You must be at least 13 years old to use the Service. If you are under 18, you should have a parent or guardian’s permission. You are responsible for keeping your account credentials secure and for all activity under your account. You must provide accurate information when signing up.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">4. Acceptable Use</h2>
            <p>
              You agree to use the Service only for lawful purposes and in a way that does not infringe others’ rights or restrict their use. You may not:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Use the Service for harassment, abuse, or illegal activity</li>
              <li>Attempt to gain unauthorized access to our systems or other users’ accounts</li>
              <li>Scrape, copy, or resell the Service or its content</li>
              <li>Reverse-engineer or attempt to extract source code or data</li>
              <li>Use the Service in any way that could harm, overload, or impair it</li>
            </ul>
            <p className="mt-3">
              We may suspend or terminate your account if we reasonably believe you have violated these Terms or misused the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">5. Your Content and Privacy</h2>
            <p>
              You keep ownership of the content you submit (e.g., answers, notes). You grant us the limited rights we need to operate the Service (e.g., to store, display, and share your content with your partner as you choose). Our use of personal data is described in our{" "}
              <Link href="/privacy" className="text-brand-600 hover:text-brand-700 underline underline-offset-2">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">6. Our Intellectual Property</h2>
            <p>
              Aligned’s name, logo, design, and technology are owned by us or our licensors. You may not use them without our prior written permission, except as necessary to use the Service as intended.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">7. Disclaimers</h2>
            <p>
              The Service is provided “as is.” We do not promise that it will be error-free, secure, or uninterrupted. We are not liable for decisions you or your partner make based on use of the Service. Nothing here is professional (e.g., legal or therapeutic) advice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">8. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, we are not liable for any indirect, incidental, special, or consequential damages, or for loss of data or profits, arising from your use of the Service. Our total liability for any claims related to the Service is limited to the amount you paid us in the twelve months before the claim (or $100 if you have not paid us).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">9. Indemnity</h2>
            <p>
              You agree to indemnify and hold harmless Aligned and its affiliates, and their officers, directors, and employees, from any claims, damages, or expenses (including legal fees) arising from your use of the Service, your content, or your violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">10. Changes</h2>
            <p>
              We may update these Terms from time to time. We will post the revised Terms and update the “Last updated” date. Continued use of the Service after changes constitutes acceptance. If a change is material, we may notify you by email or in-app.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">11. Governing Law and Disputes</h2>
            <p>
              These Terms are governed by the laws of the United States and the State of Delaware, without regard to conflict of law principles. Any dispute will be resolved in the state or federal courts located in Delaware, and you consent to personal jurisdiction there.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">12. General</h2>
            <p>
              If any part of these Terms is found unenforceable, the rest remains in effect. Our failure to enforce a right does not waive it. You may not assign these Terms; we may assign them. These Terms are the entire agreement between you and Aligned regarding the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">Contact</h2>
            <p>
              For questions about these Terms, contact us at{" "}
              <a
                href="mailto:legal@northstar.app"
                className="text-brand-600 hover:text-brand-700 underline underline-offset-2"
              >
                legal@northstar.app
              </a>
              . (Replace with your actual legal or support contact.)
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
