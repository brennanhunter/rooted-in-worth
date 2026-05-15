"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, AlertCircle, Camera } from "lucide-react";
import { motion } from "motion/react";
import { saveProfileSetup, skipProfileSetup } from "@/app/actions/profile";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024; // 2MB — matches the bucket limit

export default function ProfileSetupForm({
  defaultName,
  defaultAvatarUrl,
}: {
  defaultName: string;
  defaultAvatarUrl: string | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  // avatarUrl is the clean URL persisted to the DB; previewUrl carries
  // a cache-bust only for immediate in-session display.
  const [avatarUrl, setAvatarUrl] = useState<string | null>(defaultAvatarUrl);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    defaultAvatarUrl,
  );
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState<"save" | "skip" | null>(null);
  const [error, setError] = useState<string | null>(null);

  function done() {
    router.push("/");
    router.refresh();
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!ALLOWED.includes(file.type)) {
      setError("Use a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be 2MB or smaller.");
      return;
    }

    setUploading(true);
    // Send to the server, which moderates the image BEFORE it's ever
    // written to public storage, then returns the stored URL.
    const fd = new FormData();
    fd.append("file", file);

    let res: Response;
    try {
      res = await fetch("/api/avatar", { method: "POST", body: fd });
    } catch {
      setError("Upload failed. Check your connection and try again.");
      setUploading(false);
      return;
    }

    const data = (await res.json().catch(() => ({}))) as {
      url?: string;
      error?: string;
    };

    if (!res.ok || !data.url) {
      setError(data.error ?? "Upload failed. Try again.");
      setUploading(false);
      return;
    }

    setAvatarUrl(data.url);
    // Cache-bust the preview only — a re-upload to the same path
    // would otherwise show the stale CDN copy.
    setPreviewUrl(`${data.url}?v=${Date.now()}`);
    setUploading(false);
  }

  async function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy("save");
    setError(null);
    const result = await saveProfileSetup(new FormData(e.currentTarget));
    if (result.ok) done();
    else {
      setError(result.error);
      setBusy(null);
    }
  }

  async function onSkip() {
    setBusy("skip");
    setError(null);
    const result = await skipProfileSetup();
    if (result.ok) done();
    else {
      setError(result.error);
      setBusy(null);
    }
  }

  const field =
    "w-full rounded-xl border border-bark/20 bg-cream px-4 py-2.5 text-bark placeholder:text-bark/40 focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/30 disabled:opacity-60";
  const label = "mb-1 block text-sm text-bark/70";
  const disabled = busy !== null || uploading;

  return (
    <form onSubmit={onSave} className="flex flex-col gap-5">
      <input type="hidden" name="avatar_url" value={avatarUrl ?? ""} />

      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-sage/25">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt=""
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-2xl text-moss">
              {(defaultName || "?").trim().charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={disabled}
            className="inline-flex items-center gap-2 rounded-full border border-bark/20 px-4 py-2 text-sm text-bark transition-colors hover:bg-bark/5 disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Camera className="h-4 w-4" aria-hidden="true" />
            )}
            {avatarUrl ? "Change photo" : "Upload photo"}
          </button>
          <p className="mt-1 text-xs text-bark/50">JPEG, PNG, or WebP · max 2MB</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onPickFile}
          className="hidden"
        />
      </div>

      <div>
        <label htmlFor="display_name" className={label}>
          Display name
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          defaultValue={defaultName}
          maxLength={80}
          placeholder="What should the community call you?"
          disabled={disabled}
          className={field}
        />
      </div>

      <div>
        <label htmlFor="bio" className={label}>
          A little about you <span className="text-bark/40">(optional)</span>
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          maxLength={600}
          placeholder="Your story, what brought you here — only what you want to share."
          disabled={disabled}
          className={`${field} resize-y`}
        />
      </div>

      <div>
        <label htmlFor="skills" className={label}>
          Skills &amp; gifts{" "}
          <span className="text-bark/40">(comma-separated)</span>
        </label>
        <input
          id="skills"
          name="skills"
          type="text"
          placeholder="gardening, carpentry, childcare, cooking"
          disabled={disabled}
          className={field}
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="family_size" className={label}>
            Household size
          </label>
          <input
            id="family_size"
            name="family_size"
            type="number"
            min={1}
            max={50}
            placeholder="e.g. 4"
            disabled={disabled}
            className={field}
          />
        </div>
        <div className="flex-[2]">
          <label htmlFor="location_preference" className={label}>
            Location / where you&rsquo;d like to land
          </label>
          <input
            id="location_preference"
            name="location_preference"
            type="text"
            maxLength={200}
            placeholder="Pacific NW, open to relocating"
            disabled={disabled}
            className={field}
          />
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="inline-flex items-center gap-2 text-sm text-red-700"
        >
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          {error}
        </p>
      )}

      <div className="mt-2 flex items-center gap-3">
        <motion.button
          type="submit"
          disabled={disabled}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-bark px-6 py-3 text-cream transition-colors hover:bg-bark/90 disabled:opacity-60"
        >
          {busy === "save" && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          Save &amp; continue
        </motion.button>
        <button
          type="button"
          onClick={onSkip}
          disabled={disabled}
          className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm text-bark/60 transition-colors hover:text-bark disabled:opacity-60"
        >
          {busy === "skip" && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          Skip for now
        </button>
      </div>
      <p className="text-xs text-bark/50">
        Everything here is optional and editable later. Skipping won&rsquo;t
        ask you again.
      </p>
    </form>
  );
}
