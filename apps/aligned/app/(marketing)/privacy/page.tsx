import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy · Aligned",
  description: "What Aligned collects, why, who processes it, and how to delete it.",
};

const CONTACT = "support@alignedconnectingcouples.com";

const linkClass = "text-brand-600 hover:text-brand-700 underline underline-offset-2";

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: October 9, 2026</p>

        <div className="mt-8 space-y-8 text-base leading-relaxed text-slate-700">
          <section>
            <h2 className="text-lg font-semibold text-slate-900">1. The short version</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>What you write is for you and your partner. Your answer stays sealed until you&apos;ve both answered.</li>
              <li>We don&apos;t sell your data, show ads, or use what you write to build advertising profiles.</li>
              <li>We don&apos;t use what you write to train AI models.</li>
              <li>You can download your data or delete your account at any time from <strong>You → Account &amp; data</strong>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">2. What we collect</h2>

            <p className="font-medium text-slate-800">Your account</p>
            <p>
              Your email address and, if you add them, a display name and profile photo. If you sign up with a
              password, we store only a salted one-way hash of it, never the password itself. If you sign in with
              Apple, we receive the email address Apple shares with us (which may be a private relay address) and
              an identifier for your Apple account.
            </p>

            <p className="mt-3 font-medium text-slate-800">Your relationship</p>
            <p>
              Who you&apos;re paired with, when you paired, and the invite codes used to pair you.
            </p>

            <p className="mt-3 font-medium text-slate-800">What you create</p>
            <p>
              Your daily answers, reactions, reflections, weekly check-in notes, and dare photos you choose to
              take. These are shown to you and to your partner, and are used to produce features built from them,
              such as your weekly magazine and streaks.
            </p>

            <p className="mt-3 font-medium text-slate-800">Photos</p>
            <p>
              When you set a profile photo or complete a photo dare, the image you pick or take is uploaded. We
              never browse your photo library. Photos are stored at long, unguessable web addresses, so anyone who
              is given a photo&apos;s address could open it; we never publish those addresses anywhere.
            </p>

            <p className="mt-3 font-medium text-slate-800">Voice answers</p>
            <p>
              If you tap &ldquo;Speak answer,&rdquo; your device&apos;s own speech recognition turns your words
              into text. We receive only the text you choose to submit, never the audio.
            </p>

            <p className="mt-3 font-medium text-slate-800">Notifications</p>
            <p>
              If you allow notifications, we store a token for that device or browser so we can tell you when your
              partner answers, when a reveal is ready, and when the day&apos;s question is waiting. Signing out
              removes that device&apos;s token; turning notifications off in your device settings stops them.
            </p>

            <p className="mt-3 font-medium text-slate-800">Purchases</p>
            <p>
              If you subscribe, we keep a record of the subscription: its status, plan, and renewal dates. Apple or
              Stripe processes the payment; we never see or store your card details.
            </p>

            <p className="mt-3 font-medium text-slate-800">Usage and security</p>
            <p>
              We record product events (for example &ldquo;answered today&apos;s question&rdquo; or &ldquo;paired
              with a partner&rdquo;) tied to your account so we can understand what is working. We also use Vercel
              Web Analytics, which counts page views without cookies and without identifying you. To stop abuse we
              briefly keep your IP address and the email used in sign-in attempts, and delete those records within
              a few days. A sign-in cookie keeps you signed in.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">3. How we use it</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>To run Aligned: sign you in, pair you with your partner, show each of you what the other shared, and send the reminders you&apos;ve allowed</li>
              <li>To send emails you need, such as sign-in links</li>
              <li>To manage your subscription</li>
              <li>To understand and improve the product, using the events described above</li>
              <li>To keep the service secure and prevent abuse</li>
              <li>To meet legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">4. Who else processes it</h2>
            <p>
              We share data only with your partner, as the product is designed to do, and with the providers below,
              who process it on our behalf to run the service:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li><strong>Vercel</strong>: hosting, photo storage, and cookieless page analytics</li>
              <li><strong>Neon</strong>: our database</li>
              <li><strong>Resend</strong>: sending email</li>
              <li><strong>Apple</strong>: Sign in with Apple, push notifications on iPhone, and App Store purchases</li>
              <li><strong>RevenueCat</strong>: keeping App Store subscription status in sync</li>
              <li><strong>Stripe</strong>: payments made on our website</li>
            </ul>
            <p className="mt-3">
              We may also disclose information when required by law, or when we believe in good faith that it is
              necessary to protect someone&apos;s safety. If Aligned is ever sold or merged, your information would
              transfer under the protections of this policy, and we would tell you first.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">5. Deleting your account</h2>
            <p>
              Go to <strong>You → Account &amp; data → Delete my account</strong>. Deletion takes effect immediately:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Your name, email, password, and sign-in connections are removed, and you&apos;re signed out on every device.</li>
              <li>Your profile photo and dare photos are deleted.</li>
              <li>Your notification tokens are deleted.</li>
              <li>A subscription bought on our website is canceled.</li>
              <li>
                Answers you already shared with your partner stay in their history, with nothing identifying you
                attached, because that history is theirs too.
              </li>
            </ul>
            <p className="mt-3">
              Apple doesn&apos;t let apps cancel App Store subscriptions. If you subscribed through the App Store,
              cancel in your iPhone&apos;s <strong>Settings → [your name] → Subscriptions</strong>.
            </p>
            <p className="mt-3">
              Otherwise we keep your data while your account is open. Database backups held by our providers roll
              off within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">6. Your rights</h2>
            <p>
              You can download a copy of your data (as a JSON file) or delete your account yourself from{" "}
              <strong>You → Account &amp; data</strong>. Depending on where you live, you may also have the right to
              correct your data, restrict or object to how we use it, or appeal a decision we make about a request.
              Email us at the address below and we&apos;ll respond within 30 days. If you&apos;re in the EEA or UK,
              you can also complain to your local data protection authority. We don&apos;t sell or
              &ldquo;share&rdquo; personal information as California law defines those terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">7. Security</h2>
            <p>
              Data is encrypted in transit, passwords are hashed, and access to production systems is restricted.
              No system is perfectly secure; if a breach affects your personal information, we&apos;ll notify you as
              the law requires.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">8. Age</h2>
            <p>
              Aligned is for adults. You must be 18 or older to use it, and we don&apos;t knowingly collect
              information from anyone younger. If you believe someone under 18 has an account, tell us and
              we&apos;ll delete it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">9. Where your data is processed</h2>
            <p>
              Aligned runs in the United States. If you use it from elsewhere, your information is transferred to
              and processed in the US.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">10. Changes</h2>
            <p>
              If we change this policy we&apos;ll update the date above, and for significant changes we&apos;ll tell
              you in the app or by email before they take effect.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">Contact</h2>
            <p>
              Questions, requests, or concerns:{" "}
              <a href={`mailto:${CONTACT}`} className={linkClass}>
                {CONTACT}
              </a>
              . See also our{" "}
              <Link href="/terms" className={linkClass}>
                Terms of Service
              </Link>
              .
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
