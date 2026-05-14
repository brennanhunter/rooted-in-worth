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

type WelcomeEmailProps = {
  siteUrl: string;
  unsubscribeUrl: string;
};

export default function WelcomeEmail({
  siteUrl,
  unsubscribeUrl,
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You&rsquo;re rooted in. Welcome to the grove.</Preview>
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

          <Heading style={heading}>You&rsquo;re rooted in.</Heading>

          <Text style={paragraph}>
            Welcome to the grove. We&rsquo;re glad you&rsquo;re here.
          </Text>

          <Text style={paragraph}>
            Rooted in Worth is a small, slow project &mdash; a healing-centered
            community taking shape around the conviction that every person
            carries inherent worth. The long dream is shared land, water, and
            neighbors. The plan is to grow into it together.
          </Text>

          <Text style={paragraph}>
            We don&rsquo;t write often. When we do, it&rsquo;s because
            something is worth sharing &mdash; what we&rsquo;re learning, who
            we&rsquo;re meeting, and how the work is taking root.
          </Text>

          <Text style={signoff}>
            With care,
            <br />
            The Rooted in Worth family
          </Text>

          <Hr style={hr} />

          <Text style={small}>
            You&rsquo;re getting this because you signed up at{" "}
            <Link href={siteUrl} style={link}>
              Rooted in Worth
            </Link>
            . Changed your mind?{" "}
            <Link href={unsubscribeUrl} style={link}>
              Unsubscribe here
            </Link>
            .
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

const container = {
  maxWidth: "560px",
  margin: "0 auto",
  padding: "40px 24px",
};

const logoSection = {
  textAlign: "center" as const,
  padding: "16px 0 8px",
};

const heading = {
  color: "#5c3a2a",
  fontSize: "34px",
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

const signoff = {
  color: "#5c3a2a",
  fontSize: "16px",
  lineHeight: "1.7",
  fontStyle: "italic" as const,
  margin: "28px 0 0",
};

const hr = {
  border: "none",
  borderTop: "1px solid rgba(92, 58, 42, 0.18)",
  margin: "36px 0 20px",
};

const small = {
  color: "rgba(92, 58, 42, 0.65)",
  fontSize: "13px",
  lineHeight: "1.55",
  textAlign: "center" as const,
};

const link = {
  color: "#6b7a5c",
  textDecoration: "underline",
};
