import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service · Aligned",
  description: "The terms for using Aligned, including subscriptions and cancellation.",
};

const CONTACT = "support@alignedconnectingcouples.com";

const linkClass = "text-brand-600 hover:text-brand-700 underline underline-offset-2";

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
        <p className="mt-2 text-sm text-slate-500">Last updated: October 9, 2026</p>

        <div className="mt-8 space-y-8 text-base leading-relaxed text-slate-700">
          <section>
            <h2 className="text-lg font-semibold text-slate-900">1. Agreement</h2>
            <p>
              These Terms govern your use of Aligned, including our website and iPhone app (the
              &ldquo;Service&rdquo;). By creating an account or using the Service, you agree to them and to our{" "}
              <Link href="/privacy" className={linkClass}>
                Privacy Policy
              </Link>
              . If you don&apos;t agree, please don&apos;t use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">2. What Aligned is</h2>
            <p>
              Aligned is a private app for two partners. Each day you both answer the same question, and your
              answers are revealed to each other once you&apos;ve both answered. There is no public feed. Aligned
              is not therapy, counseling, or medical advice, and it is not a substitute for professional help. If
              you are in danger or experiencing abuse, contact local emergency services or a domestic violence
              hotline.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">3. Your account</h2>
            <p>
              You must be 18 or older. Give us accurate information, keep your sign-in details secure, and tell us
              if you think someone else has accessed your account. You&apos;re responsible for activity under your
              account. A relationship in Aligned has two members; pairing requires an invite that your partner
              chooses to accept.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">4. Subscriptions</h2>
            <p>
              Aligned is free to start. Aligned Premium is an auto-renewing yearly subscription, currently $29.99
              a year in the US (prices in other countries are shown before you buy). One subscription unlocks
              Premium for both partners in your relationship.
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>
                <strong>Free trial.</strong> New subscribers may get a 14-day free trial. Unless you cancel at least
                24 hours before the trial ends, the yearly subscription starts and you are charged.
              </li>
              <li>
                <strong>Auto-renewal.</strong> Your subscription renews automatically each year at the then-current
                price unless you cancel at least 24 hours before the end of the current period.
              </li>
              <li>
                <strong>Bought in the iPhone app:</strong> payment is charged to your Apple Account when you confirm
                the purchase. Manage or cancel in <strong>Settings → [your name] → Subscriptions</strong>. Refunds
                are handled by Apple under its policies.
              </li>
              <li>
                <strong>Bought on our website:</strong> payment is processed by Stripe. Cancel any time on the web
                from <strong>You → Manage subscription</strong>, or by emailing us. Cancellation takes effect at the end of the period you&apos;ve paid for, and
                we don&apos;t give partial refunds except where the law requires.
              </li>
              <li>
                If we change the price, we&apos;ll tell you in advance, and the new price applies from your next
                renewal.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">5. Your content</h2>
            <p>
              What you write and upload is yours. You give us only the permission we need to run the Service: to
              store it, show it to you and your partner, and produce features from it such as your weekly magazine.
              Once you share something with your partner, they can see it, and it stays in their history even if
              you later delete your account (with nothing identifying you attached). Don&apos;t upload anything you
              don&apos;t have the right to share.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">6. Acceptable use</h2>
            <p>You agree not to:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Use Aligned to harass, threaten, monitor, or control another person</li>
              <li>Upload illegal content, or images of anyone who hasn&apos;t agreed to share them</li>
              <li>Access accounts or data that aren&apos;t yours, or interfere with the Service</li>
              <li>Scrape, copy, resell, or reverse-engineer the Service</li>
            </ul>
            <p className="mt-3">
              We may suspend or close accounts that break these rules.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">7. Ending your use</h2>
            <p>
              You can delete your account at any time from <strong>You → Account &amp; data</strong>. Deleting your
              account doesn&apos;t cancel an App Store subscription; cancel that in your iPhone&apos;s settings. We
              may stop offering the Service; if we do, we&apos;ll give you reasonable notice and a chance to download
              your data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">8. Our property</h2>
            <p>
              The Aligned name, logo, questions, design, and software belong to us or our licensors. These Terms
              don&apos;t give you rights to them beyond using the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">9. Disclaimers</h2>
            <p>
              The Service is provided &ldquo;as is.&rdquo; We work to keep it running and your data safe, but we
              don&apos;t promise it will be uninterrupted or error-free. We aren&apos;t responsible for decisions
              you or your partner make based on using it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">10. Limitation of liability</h2>
            <p>
              To the extent the law allows, we aren&apos;t liable for indirect, incidental, special, or
              consequential damages, or for lost data or profits. Our total liability for any claim about the
              Service is limited to the greater of what you paid us in the 12 months before the claim or $100.
              Some places don&apos;t allow these limits, so they may not apply to you.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">11. Apple</h2>
            <p>
              If you use the iPhone app: these Terms are between you and us, not Apple. Apple isn&apos;t responsible
              for the app, its content, maintenance, support, or any claims about it, and has no obligation to
              provide support. If the app fails to meet any applicable warranty, you may notify Apple, which may
              refund the purchase price; Apple has no other warranty obligation to the extent the law allows. We,
              not Apple, handle any intellectual-property claims about the app. Apple and its subsidiaries are
              third-party beneficiaries of these Terms and may enforce them against you.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">12. Changes</h2>
            <p>
              If we change these Terms we&apos;ll update the date above and, for significant changes, tell you in
              the app or by email before they take effect. Continuing to use the Service after that means you accept
              the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">13. Governing law</h2>
            <p>
              These Terms are governed by the laws of the State of Delaware and the United States, without regard to
              conflict-of-law rules, except where the law where you live requires otherwise. Disputes will be
              resolved in the state or federal courts in Delaware.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">14. General</h2>
            <p>
              If part of these Terms can&apos;t be enforced, the rest still applies. Not enforcing a right
              doesn&apos;t waive it. You can&apos;t transfer these Terms; we may transfer them as part of a
              merger or sale. These Terms and the Privacy Policy are the whole agreement between us about the
              Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">Contact</h2>
            <p>
              Questions about these Terms:{" "}
              <a href={`mailto:${CONTACT}`} className={linkClass}>
                {CONTACT}
              </a>
              .
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
