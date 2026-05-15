"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

export default function FeedFilters({
  tag,
  person,
}: {
  tag: string;
  person: string;
}) {
  const router = useRouter();
  const [personInput, setPersonInput] = useState(person);

  function apply(next: { tag?: string; person?: string }) {
    const params = new URLSearchParams();
    const t = next.tag ?? tag;
    const p = next.person ?? personInput;
    if (t.trim()) params.set("tag", t.trim());
    if (p.trim()) params.set("person", p.trim());
    const qs = params.toString();
    router.push(qs ? `/feed?${qs}` : "/feed");
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    apply({});
  }

  const hasFilter = Boolean(tag || person);

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={onSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bark/40"
            aria-hidden="true"
          />
          <input
            value={personInput}
            onChange={(e) => setPersonInput(e.target.value)}
            placeholder="Find posts by name…"
            className="w-full rounded-full border border-bark/20 bg-cream py-2 pl-9 pr-4 text-sm text-bark placeholder:text-bark/40 focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/30"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-bark px-5 py-2 text-sm text-cream transition-colors hover:bg-bark/90"
        >
          Search
        </button>
      </form>

      {hasFilter && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-bark/70">
          <span>Filtering:</span>
          {tag && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sage/25 px-3 py-1 text-bark">
              #{tag}
            </span>
          )}
          {person && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sage/25 px-3 py-1 text-bark">
              name: {person}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setPersonInput("");
              router.push("/feed");
            }}
            className="inline-flex items-center gap-1 text-bark/55 underline-offset-4 hover:text-bark hover:underline"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
