"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export type LikerView = {
  id: string;
  name: string;
  avatar: string | null;
};

function Avatar({ liker, ring }: { liker: LikerView; ring?: boolean }) {
  return (
    <span
      className={`relative block h-6 w-6 overflow-hidden rounded-full bg-sage/25 ${
        ring ? "ring-2 ring-cream" : ""
      }`}
    >
      {liker.avatar ? (
        <Image
          src={liker.avatar}
          alt=""
          fill
          sizes="24px"
          className="object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[10px] text-moss">
          {liker.name.charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );
}

export default function Likers({ likers }: { likers: LikerView[] }) {
  const [open, setOpen] = useState(false);

  if (likers.length === 0) return null;

  const faces = likers.slice(0, 5);
  const first = likers[0]!.name;
  const summary =
    likers.length === 1
      ? `Liked by ${first}`
      : likers.length === 2
        ? `Liked by ${first} and ${likers[1]!.name}`
        : `Liked by ${first} and ${likers.length - 1} others`;

  return (
    <div className="text-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 text-bark/60 transition-colors hover:text-bark"
      >
        <span className="flex -space-x-2">
          {faces.map((l) => (
            <Avatar key={l.id} liker={l} ring />
          ))}
        </span>
        <span className="underline-offset-4 hover:underline">{summary}</span>
      </button>

      {open && (
        <ul className="mt-3 flex flex-col gap-2 border-l-2 border-bark/10 pl-4">
          {likers.map((l) => (
            <li key={l.id}>
              <Link
                href={`/u/${l.id}`}
                className="inline-flex items-center gap-2 text-bark/80 hover:underline"
              >
                <Avatar liker={l} />
                {l.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
