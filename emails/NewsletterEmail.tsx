import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Markdown,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type NewsletterEmailProps = {
  subject: string;
  body: string;
  siteUrl: string;
  unsubscribeUrl: string;
};

export default function NewsletterEmail({
  subject,
  body,
  siteUrl,
  unsubscribeUrl,
}: NewsletterEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={body_}>
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

          <Heading style={heading}>{subject}</Heading>

          <Markdown markdownCustomStyles={markdownStyles}>{body}</Markdown>

          <Text style={signoff}>
            With care,
            <br />
            The Rooted in Worth family
          </Text>

          <Hr style={hr} />

          <Text style={small}>
            You&rsquo;re receiving this because you subscribed at{" "}
            <Link href={siteUrl} style={link}>
              Rooted in Worth
            </Link>
            .{" "}
            <Link href={unsubscribeUrl} style={link}>
              Unsubscribe
            </Link>
            .
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body_ = {
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

const markdownStyles = {
  p: {
    color: "#5c3a2a",
    fontSize: "16px",
    lineHeight: "1.7",
    margin: "0 0 18px",
  },
  link: {
    color: "#6b7a5c",
    textDecoration: "underline",
  },
  bold: {
    color: "#5c3a2a",
    fontWeight: "bold",
  },
  italic: {
    fontStyle: "italic",
  },
  h1: {
    color: "#5c3a2a",
    fontSize: "26px",
    fontWeight: "normal",
    margin: "28px 0 12px",
  },
  h2: {
    color: "#5c3a2a",
    fontSize: "22px",
    fontWeight: "normal",
    margin: "24px 0 10px",
  },
  h3: {
    color: "#5c3a2a",
    fontSize: "18px",
    fontWeight: "bold",
    margin: "20px 0 8px",
  },
  ul: {
    color: "#5c3a2a",
    fontSize: "16px",
    lineHeight: "1.7",
    margin: "0 0 18px",
    paddingLeft: "22px",
  },
  ol: {
    color: "#5c3a2a",
    fontSize: "16px",
    lineHeight: "1.7",
    margin: "0 0 18px",
    paddingLeft: "22px",
  },
  li: {
    margin: "0 0 6px",
  },
  blockQuote: {
    borderLeft: "3px solid rgba(92, 58, 42, 0.25)",
    paddingLeft: "16px",
    margin: "0 0 18px",
    color: "rgba(92, 58, 42, 0.8)",
    fontStyle: "italic",
  },
};
