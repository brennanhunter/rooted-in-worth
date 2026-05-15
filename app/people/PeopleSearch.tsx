"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

export default function PeopleSearch({ q }: { q: string }) {
  const router = useRouter();
  const [value, setValue] = useState(q);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const term = value.trim();
    router.push(term ? `/people?q=${encodeURIComponent(term)}` : "/people");
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bark/40"
          aria-hidden="true"
        />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search people by name…"
          className="w-full rounded-full border border-bark/20 bg-cream py-2 pl-9 pr-4 text-sm text-bark placeholder:text-bark/40 focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/30"
        />
      </div>
      {q && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            router.push("/people");
          }}
          className="inline-flex items-center gap-1 rounded-full border border-bark/20 px-4 py-2 text-sm text-bark/70 transition-colors hover:bg-bark/5"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Clear
        </button>
      )}
      <button
        type="submit"
        className="rounded-full bg-bark px-5 py-2 text-sm text-cream transition-colors hover:bg-bark/90"
      >
        Search
      </button>
    </form>
  );
}
