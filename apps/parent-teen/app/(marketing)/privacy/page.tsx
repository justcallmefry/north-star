import Link from "next/link";

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
        <p className="mt-2 text-sm text-slate-500">
          Last updated: February 2026
        </p>

        <div className="mt-8 space-y-8 text-base leading-relaxed text-slate-700">
          <section>
            <h2 className="text-lg font-semibold text-slate-900">1. Introduction</h2>
            <p>
              Aligned (“we,” “our,” or “Aligned”) is built to be private by design. This Privacy Policy explains what information we collect, how we use it, and your choices. We do not sell your personal information or use your content for advertising.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">2. Information We Collect</h2>
            <p className="font-medium text-slate-800">Account and profile</p>
            <p>
              When you sign up, we collect your email address (and, if you add it later, a display name or similar). We use magic-link sign-in, so we do not store a password unless you set one in a separate flow. We store your account and relationship data (e.g., that you are linked with a partner) as needed to run the Service.
            </p>
            <p className="mt-3 font-medium text-slate-800">Content you create</p>
            <p>
              We store the content you create in the app: daily answers, meeting notes, reflections, and any text or data you choose to save. This is used only to provide the Service (e.g., to show your partner after you choose to reveal) and to display your history to you.
            </p>
            <p className="mt-3 font-medium text-slate-800">Usage and device</p>
            <p>
              We may collect information about how you use the Service (e.g., pages or screens you open, actions you take) and basic device or browser data (e.g., type, language) to operate, secure, and improve the Service. We may use cookies or similar technologies for authentication and preferences.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Provide, maintain, and improve the Service</li>
              <li>Authenticate you and manage your account</li>
              <li>Show your content to you and, when you choose, to your partner</li>
              <li>Send you necessary service messages (e.g., sign-in links, important notices)</li>
              <li>Protect against abuse, fraud, and security issues</li>
              <li>Comply with law and enforce our Terms of Service</li>
            </ul>
            <p className="mt-3">
              We do not use your content or personal information for advertising or to build advertising profiles.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">4. Sharing of Information</h2>
            <p>
              We do not sell your personal information. We share data only in these limited cases:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li><strong>With your partner:</strong> When you choose to reveal answers or share content, we show it to the partner(s) in your relationship as intended by the product.</li>
              <li><strong>Service providers:</strong> We may use vendors (e.g., hosting, email delivery, databases) that process data on our behalf under strict confidentiality and only to operate the Service.</li>
              <li><strong>Legal:</strong> We may disclose information if required by law, court order, or government request, or when we believe in good faith it is necessary to protect rights, safety, or property.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">5. Data Security and Retention</h2>
            <p>
              We use industry-standard measures to protect your data (e.g., encryption in transit, access controls). No system is completely secure; we will notify you if we become aware of a breach that affects your personal information where required by law.
            </p>
            <p className="mt-3">
              We retain your account and content for as long as your account is active or as needed to provide the Service and comply with law. If you delete your account, we will delete or anonymize your personal data in line with our retention policy, except where we must keep it for legal or safety reasons.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">6. Your Rights and Choices</h2>
            <p>Depending on where you live, you may have the right to:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Access or receive a copy of the personal information we hold about you</li>
              <li>Correct or update your information</li>
              <li>Request deletion of your personal information or account</li>
              <li>Object to or restrict certain processing</li>
              <li>Data portability (e.g., a copy of your data in a usable format)</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, contact us at the email below. You can also delete your account or adjust in-app settings where available. If you are in the EEA or UK, you may have the right to lodge a complaint with your local data protection authority.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">7. Children</h2>
            <p>
              The Service is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you learn that a child has provided us with personal information, please contact us and we will delete it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">8. International Transfers</h2>
            <p>
              Your information may be processed in the United States or other countries where our service providers operate. By using the Service, you consent to such transfer. We take steps to ensure your data receives an adequate level of protection where required by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will post the revised policy and update the “Last updated” date. If changes are significant, we may notify you by email or in the app. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">Contact</h2>
            <p>
              For privacy questions, requests, or to exercise your rights, contact us at{" "}
              <a
                href="mailto:privacy@northstar.app"
                className="text-brand-600 hover:text-brand-700 underline underline-offset-2"
              >
                privacy@northstar.app
              </a>
              . (Replace with your actual privacy or support contact.)
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
