import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { moderateImageDataUrl } from "@/lib/moderation";

const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const MAX_BYTES = 2 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file." }, { status: 400 });
  }

  const ext = ALLOWED.get(file.type);
  if (!ext) {
    return NextResponse.json(
      { error: "Use a JPEG, PNG, or WebP image." },
      { status: 415 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image must be 2MB or smaller." },
      { status: 413 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${bytes.toString("base64")}`;

  // Moderate BEFORE the image is ever written to public storage.
  const verdict = await moderateImageDataUrl(dataUrl);
  if (!verdict.ok) {
    if (verdict.reason === "rejected") {
      return NextResponse.json(
        {
          error:
            "That image didn't pass our content check. Please choose a different one.",
        },
        { status: 422 },
      );
    }
    // Fail closed: a moderation outage must not let unscreened images through.
    return NextResponse.json(
      {
        error:
          "We couldn't verify that image right now. Please try again in a moment.",
      },
      { status: 503 },
    );
  }

  // Clean: store it. Upload runs under the user's session, so storage
  // RLS still enforces the per-user folder (defense in depth).
  const path = `${user.id}/avatar.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("avatars")
    .upload(path, bytes, { upsert: true, contentType: file.type });

  if (upErr) {
    console.error("api/avatar: upload failed", upErr.message);
    return NextResponse.json(
      { error: "Upload failed. Try again." },
      { status: 500 },
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
