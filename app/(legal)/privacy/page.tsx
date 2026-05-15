import Link from "next/link";
import { LegalShell, LegalSection } from "../LegalPage";

// NOTE (not rendered): contains placeholders that MUST be set before
// launch — legal entity, governing-law state, a working privacy contact
// inbox. Have a lawyer review before relying on this, especially the
// children/COPPA section, since the audience includes minors.
export const metadata = {
  title: "Privacy Policy · Rooted in Worth",
  description: "How Rooted in Worth collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="May 15, 2026">
      <p>
        Rooted in Worth (&ldquo;we,&rdquo; &ldquo;us&rdquo;) is a
        healing-centered community project. This policy explains what we
        collect, why, and the choices you have. We collect as little as we
        can and never sell your data.
      </p>

      <LegalSection heading="What we collect">
        <p>
          <strong>Newsletter:</strong> your email address, where you signed
          up from, and the dates you subscribed or unsubscribed.
        </p>
        <p>
          <strong>Accounts:</strong> your email, a display name (optional),
          and either a securely hashed password or, if you use Google
          sign-in, basic Google profile information (name, email).
        </p>
        <p>
          <strong>Profile (optional):</strong> anything you choose to add
          &mdash; avatar, bio, skills, household size, location preferences.
          All optional; a blank profile is fine. Some of these fields are
          publicly visible (see below).
        </p>
        <p>
          <strong>Technical:</strong> IP address and request metadata, used
          only to prevent abuse and rate-limit forms, and essential session
          cookies to keep you signed in. We do not use third-party
          advertising or tracking cookies.
        </p>
      </LegalSection>

      <LegalSection heading="How we use it">
        <p>
          To run your account, send the newsletter (every email has a
          one-click unsubscribe), provide community features, protect the
          site and its members from abuse, and meet legal obligations.
        </p>
      </LegalSection>

      <LegalSection heading="Service providers">
        <p>
          We share data only with the vendors that operate the service:
          Supabase (database and authentication), Resend (email delivery),
          Vercel (hosting), Upstash (abuse rate-limiting), and Google (only
          if you choose Google sign-in). Each processes data on our behalf.
        </p>
      </LegalSection>

      <LegalSection heading="Public content">
        <p>
          When community features launch, your profile and posts will be
          <strong> publicly visible</strong>, including to people without an
          account. Please don&rsquo;t share information you wouldn&rsquo;t
          want public &mdash; home address, a child&rsquo;s identifying
          details, case information, or anything that could put you or
          someone in your care at risk.
        </p>
      </LegalSection>

      <LegalSection heading="Children">
        <p>
          You must be at least <strong>13 years old</strong> to create an
          account or subscribe. We do not knowingly collect personal
          information from anyone under 13. If you believe a child under 13
          has given us information, contact us and we will delete it
          promptly. People aged 13&ndash;17 should have a parent or
          guardian&rsquo;s permission to use Rooted in Worth.
        </p>
      </LegalSection>

      <LegalSection heading="Your choices and rights">
        <p>
          You can unsubscribe from the newsletter at any time via the link
          in any email. If you have an account, you can update your details
          or <strong>permanently delete your account and profile</strong>{" "}
          from your account settings. You may also request a copy of your
          data or its deletion by contacting us.
        </p>
      </LegalSection>

      <LegalSection heading="Security &amp; retention">
        <p>
          Passwords are hashed, data is encrypted in transit, and database
          access is restricted by row-level security. No system is perfectly
          secure, so we can&rsquo;t guarantee absolute security. We keep
          data only as long as needed to provide the service; deleting your
          account removes your profile, and unsubscribing removes you from
          the mailing list.
        </p>
      </LegalSection>

      <LegalSection heading="Changes">
        <p>
          We may update this policy. We&rsquo;ll change the date above and,
          for significant changes, give notice through the site or email.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions or requests:{" "}
          <Link
            href="mailto:privacy@rootedinworth.info"
            className="text-moss underline-offset-4 hover:underline"
          >
            privacy@rootedinworth.info
          </Link>
          . See also our{" "}
          <Link
            href="/terms"
            className="text-moss underline-offset-4 hover:underline"
          >
            Terms of Service
          </Link>
          .
        </p>
      </LegalSection>
    </LegalShell>
  );
}
