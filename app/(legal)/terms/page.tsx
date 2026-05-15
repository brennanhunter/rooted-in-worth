import Link from "next/link";
import { LegalShell, LegalSection } from "../LegalPage";

// NOTE (not rendered): legal entity = Xtremery LLC, governing law =
// Florida (both set 2026-05-15). Still outstanding: a lawyer review
// before relying on this, especially eligibility (minors) and the
// liability/disclaimer sections.
export const metadata = {
  title: "Terms of Service · Rooted in Worth",
  description: "The terms for using Rooted in Worth.",
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" updated="May 15, 2026">
      <p>
        These terms govern your use of Rooted in Worth, operated by
        Xtremery LLC (&ldquo;we,&rdquo; &ldquo;us&rdquo;). By using the
        site or creating an account, you agree to them. If you
        don&rsquo;t agree, please don&rsquo;t use the service.
      </p>

      <LegalSection heading="Who can use it">
        <p>
          You must be at least <strong>13 years old</strong>. If you are
          13&ndash;17, you must have permission from a parent or guardian.
          You&rsquo;re responsible for keeping your account credentials
          secure and for activity under your account.
        </p>
      </LegalSection>

      <LegalSection heading="Community conduct">
        <p>
          This is a space for people navigating hard things. Don&rsquo;t
          harass, threaten, demean, or impersonate others. Don&rsquo;t post
          hateful, illegal, or sexually exploitative content, and don&rsquo;t
          share other people&rsquo;s private or identifying information
          &mdash; including details about children or anyone in foster care.
          We may remove content and suspend or terminate accounts to keep
          the community safe, at our discretion.
        </p>
      </LegalSection>

      <LegalSection heading="Your content">
        <p>
          You keep ownership of what you post. You grant us a limited
          license to store and display it for the purpose of operating the
          community. You&rsquo;re responsible for what you share and confirm
          you have the right to share it.
        </p>
      </LegalSection>

      <LegalSection heading="Not professional or crisis care">
        <p>
          Rooted in Worth is a peer community, not a substitute for
          professional medical, mental-health, legal, or social-work
          advice, and it is <strong>not an emergency service</strong>. If
          you or someone you know is in crisis, contact local emergency
          services or, in the US, call or text <strong>988</strong> (Suicide
          &amp; Crisis Lifeline).
        </p>
      </LegalSection>

      <LegalSection heading="Availability &amp; disclaimers">
        <p>
          The service is provided &ldquo;as is&rdquo; without warranties of
          any kind. We don&rsquo;t guarantee it will always be available,
          secure, or error-free.
        </p>
      </LegalSection>

      <LegalSection heading="Limitation of liability">
        <p>
          To the fullest extent permitted by law, Xtremery LLC and the
          people who run Rooted in Worth are not liable for indirect,
          incidental, or consequential damages arising from your use of
          the service.
        </p>
      </LegalSection>

      <LegalSection heading="Changes &amp; governing law">
        <p>
          We may update these terms; we&rsquo;ll change the date above and
          give notice of significant changes. These terms are governed by
          the laws of the State of Florida, without regard to
          conflict-of-law rules.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions:{" "}
          <Link
            href="mailto:hello@rootedinworth.info"
            className="text-moss underline-offset-4 hover:underline"
          >
            hello@rootedinworth.info
          </Link>
          . See also our{" "}
          <Link
            href="/privacy"
            className="text-moss underline-offset-4 hover:underline"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>
    </LegalShell>
  );
}
