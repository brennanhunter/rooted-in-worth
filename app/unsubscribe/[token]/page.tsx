import Link from "next/link";
import { Leaf, MailX, Sprout } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import UnsubscribeForm from "./UnsubscribeForm";

export const metadata = {
  title: "Unsubscribe · Rooted in Worth",
  robots: { index: false, follow: false },
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function UnsubscribePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!UUID_RE.test(token)) {
    return <Invalid />;
  }

  const { data: subscriber } = await supabaseAdmin
    .from("subscribers")
    .select("email, status")
    .eq("unsubscribe_token", token)
    .maybeSingle();

  if (!subscriber) {
    return <Invalid />;
  }

  if (subscriber.status === "unsubscribed") {
    return <AlreadyUnsubscribed email={subscriber.email} />;
  }

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 px-6 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage/25">
        <MailX className="h-7 w-7 text-moss" aria-hidden="true" />
      </div>

      <h1 className="text-4xl text-bark md:text-5xl">Before you go</h1>
      <p className="max-w-md text-base leading-relaxed text-bark/75">
        You&rsquo;re about to unsubscribe{" "}
        <span className="text-bark">{subscriber.email}</span> from Rooted in
        Worth letters. We&rsquo;ll be sorry to see you go &mdash; but we
        won&rsquo;t take it personally.
      </p>

      <UnsubscribeForm token={token} />

      <Link
        href="/"
        className="mt-2 text-sm text-bark/60 underline-offset-4 hover:underline"
      >
        Or head back home
      </Link>
    </section>
  );
}

function AlreadyUnsubscribed({ email }: { email: string }) {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 px-6 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage/25">
        <Sprout className="h-7 w-7 text-moss" aria-hidden="true" />
      </div>
      <h1 className="text-4xl text-bark md:text-5xl">You&rsquo;re unsubscribed</h1>
      <p className="max-w-md text-base leading-relaxed text-bark/75">
        We&rsquo;ve removed{" "}
        <span className="text-bark">{email}</span> from the list. No more
        letters from the grove will land in your inbox. Take good care of
        yourself.
      </p>
      <Link
        href="/"
        className="text-sm text-bark/60 underline-offset-4 hover:underline"
      >
        Head back home
      </Link>
    </section>
  );
}

function Invalid() {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 px-6 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-bark/10">
        <Leaf className="h-7 w-7 text-bark/60" aria-hidden="true" />
      </div>
      <h1 className="text-4xl text-bark md:text-5xl">
        This link doesn&rsquo;t look right
      </h1>
      <p className="max-w-md text-base leading-relaxed text-bark/75">
        It may have expired, been mistyped, or already been used. If you
        meant to unsubscribe, reply to any of our letters and we&rsquo;ll
        take care of it by hand.
      </p>
      <Link
        href="/"
        className="text-sm text-bark/60 underline-offset-4 hover:underline"
      >
        Head back home
      </Link>
    </section>
  );
}
