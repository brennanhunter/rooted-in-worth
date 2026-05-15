import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type GoogleAccountEmailProps = {
  siteUrl: string;
};

export default function GoogleAccountEmail({
  siteUrl,
}: GoogleAccountEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your Rooted in Worth account uses Google sign-in</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img
              src={`${siteUrl}/logo.png`}
              width="120"
              height="120"
              alt="Rooted in Worth"
              style={{ margin: "0 auto" }}
            />
          </Section>

          <Heading style={heading}>No password needed</Heading>

          <Text style={paragraph}>
            Someone (hopefully you) asked to reset the password for this
            email at Rooted in Worth.
          </Text>
          <Text style={paragraph}>
            Your account doesn&rsquo;t have a password &mdash; it&rsquo;s
            connected to <strong>Google</strong>. To sign in, just use the
            &ldquo;Continue with Google&rdquo; button.
          </Text>

          <Section style={{ textAlign: "center", margin: "28px 0" }}>
            <Link href={`${siteUrl}/signin`} style={button}>
              Sign in with Google
            </Link>
          </Section>

          <Text style={small}>
            If you didn&rsquo;t request this, you can safely ignore this
            email &mdash; nothing has changed and no one can reset a
            password that doesn&rsquo;t exist.
          </Text>

          <Hr style={hr} />

          <Text style={small}>
            Rooted in Worth &middot;{" "}
            <Link href={siteUrl} style={link}>
              rootedinworth.info
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#fbf5ef",
  fontFamily: "Georgia, 'Times New Roman', serif",
  margin: 0,
  padding: 0,
};
const container = { maxWidth: "560px", margin: "0 auto", padding: "40px 24px" };
const logoSection = { textAlign: "center" as const, padding: "16px 0 8px" };
const heading = {
  color: "#5c3a2a",
  fontSize: "32px",
  fontWeight: "normal",
  lineHeight: "1.2",
  margin: "24px 0 16px",
  textAlign: "center" as const,
};
const paragraph = {
  color: "#5c3a2a",
  fontSize: "16px",
  lineHeight: "1.7",
  margin: "0 0 18px",
};
const button = {
  backgroundColor: "#5c3a2a",
  color: "#fbf5ef",
  padding: "12px 28px",
  borderRadius: "9999px",
  textDecoration: "none",
  fontSize: "15px",
};
const hr = {
  border: "none",
  borderTop: "1px solid rgba(92, 58, 42, 0.18)",
  margin: "32px 0 18px",
};
const small = {
  color: "rgba(92, 58, 42, 0.65)",
  fontSize: "13px",
  lineHeight: "1.55",
  textAlign: "center" as const,
};
const link = { color: "#6b7a5c", textDecoration: "underline" };
