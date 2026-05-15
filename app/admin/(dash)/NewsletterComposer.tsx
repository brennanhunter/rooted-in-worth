"use client";

import { useState } from "react";
import {
  Loader2,
  Send,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  sendNewsletter,
  previewNewsletter,
  type SendResult,
} from "@/app/actions/admin";

export default function NewsletterComposer({
  activeCount,
}: {
  activeCount: number;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);

  async function togglePreview() {
    if (previewHtml) {
      setPreviewHtml(null);
      return;
    }
    setPreviewing(true);
    const r = await previewNewsletter(subject, body);
    if (r.ok) setPreviewHtml(r.html);
    setPreviewing(false);
  }

  async function doSend() {
    setBusy(true);
    setResult(null);
    const fd = new FormData();
    fd.append("subject", subject);
    fd.append("body", body);
    const r = await sendNewsletter(fd);
    setResult(r);
    setBusy(false);
    setConfirming(false);
    if (r.ok) {
      setSubject("");
      setBody("");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm text-bark/70">Subject</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={busy}
          className="w-full rounded-xl border border-bark/20 bg-cream px-4 py-2.5 text-bark focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/30 disabled:opacity-60"
          placeholder="A letter from the grove"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-bark/70">
          Body{" "}
          <span className="text-bark/40">
            (markdown: **bold**, [links](url), - lists, # headings)
          </span>
        </label>
        <textarea
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            if (previewHtml) setPreviewHtml(null);
          }}
          disabled={busy}
          rows={12}
          className="w-full resize-y rounded-xl border border-bark/20 bg-cream px-4 py-3 leading-relaxed text-bark focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/30 disabled:opacity-60"
          placeholder={"Friends,\n\nHere's what's been **taking root** this season…\n\n- A new family joined\n- The garden is in\n\nRead more at [our site](https://rootedinworth.info)."}
        />
      </div>

      <div>
        <button
          type="button"
          disabled={previewing || !body.trim()}
          onClick={togglePreview}
          className="inline-flex items-center gap-2 rounded-full border border-bark/20 px-4 py-2 text-sm text-bark transition-colors hover:bg-bark/5 disabled:opacity-50"
        >
          {previewing ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : previewHtml ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
          {previewHtml ? "Hide preview" : "Preview email"}
        </button>

        {previewHtml && (
          <iframe
            title="Email preview"
            srcDoc={previewHtml}
            className="mt-3 h-[520px] w-full rounded-xl border border-bark/15 bg-white"
          />
        )}
      </div>

      {!confirming ? (
        <button
          type="button"
          disabled={busy || !subject.trim() || !body.trim()}
          onClick={() => setConfirming(true)}
          className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-bark px-6 py-3 text-cream transition-colors hover:bg-bark/90 disabled:opacity-50"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          Send to {activeCount} subscriber{activeCount === 1 ? "" : "s"}
        </button>
      ) : (
        <div className="flex flex-col gap-3 rounded-xl border border-oak/30 bg-oak/10 p-4">
          <p className="text-sm text-bark">
            Send this to <strong>{activeCount}</strong> subscriber
            {activeCount === 1 ? "" : "s"}? This can&rsquo;t be undone.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={doSend}
              className="inline-flex items-center gap-2 rounded-full bg-bark px-5 py-2 text-sm text-cream transition-colors hover:bg-bark/90 disabled:opacity-60"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Sending…
                </>
              ) : (
                "Yes, send it"
              )}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirming(false)}
              className="rounded-full border border-bark/20 px-5 py-2 text-sm text-bark transition-colors hover:bg-bark/5 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
              result.ok
                ? "bg-sage/20 text-bark"
                : "bg-red-100 text-red-800"
            }`}
          >
            {result.ok ? (
              <>
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Sent to {result.sent} subscriber
                {result.sent === 1 ? "" : "s"}
                {result.failed > 0
                  ? ` · ${result.failed} failed (check logs)`
                  : "."}
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                {result.error}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
