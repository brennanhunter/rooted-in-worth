import "server-only";

const ENDPOINT = "https://api.openai.com/v1/moderations";

export type ModerationOutcome =
  | { ok: true }
  | { ok: false; reason: "rejected" | "error" };

// Categories we hard-reject for, beyond OpenAI's own `flagged` verdict.
// Stricter than default because avatars are public and the audience
// includes minors.
const BLOCK_CATEGORIES = [
  "sexual",
  "sexual/minors",
  "violence/graphic",
  "self-harm",
  "self-harm/intent",
  "self-harm/instructions",
];

/**
 * Run an image (as a base64 data URL) through OpenAI omni-moderation.
 * Fails CLOSED: any error / missing key → treat as not-ok so an
 * unscreened image never becomes public.
 */
export async function moderateImageDataUrl(
  dataUrl: string,
): Promise<ModerationOutcome> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("moderateImageDataUrl(): OPENAI_API_KEY not set");
    return { ok: false, reason: "error" };
  }

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "omni-moderation-latest",
        input: [{ type: "image_url", image_url: { url: dataUrl } }],
      }),
    });
  } catch (err) {
    console.error("moderateImageDataUrl(): request failed", err);
    return { ok: false, reason: "error" };
  }

  if (!res.ok) {
    console.error(
      "moderateImageDataUrl(): non-200",
      res.status,
      await res.text().catch(() => ""),
    );
    return { ok: false, reason: "error" };
  }

  let json: {
    results?: Array<{
      flagged?: boolean;
      categories?: Record<string, boolean>;
    }>;
  };
  try {
    json = await res.json();
  } catch {
    return { ok: false, reason: "error" };
  }

  const result = json.results?.[0];
  if (!result) return { ok: false, reason: "error" };

  if (result.flagged) return { ok: false, reason: "rejected" };

  const cats = result.categories ?? {};
  for (const c of BLOCK_CATEGORIES) {
    if (cats[c]) return { ok: false, reason: "rejected" };
  }

  return { ok: true };
}
