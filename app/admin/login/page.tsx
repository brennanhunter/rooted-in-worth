import { Lock } from "lucide-react";
import { redirect } from "next/navigation";
import { adminLogin } from "@/app/actions/admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const metadata = {
  title: "Admin · Rooted in Worth",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAdminAuthenticated()) {
    redirect("/admin");
  }

  const { error } = await searchParams;

  return (
    <section className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 px-6 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage/25">
        <Lock className="h-7 w-7 text-moss" aria-hidden="true" />
      </div>
      <h1 className="text-3xl text-bark md:text-4xl">Admin</h1>
      <p className="text-sm text-bark/70">
        Enter the password to manage the newsletter.
      </p>

      <form action={adminLogin} className="flex w-full flex-col gap-3">
        <input
          type="password"
          name="password"
          required
          autoFocus
          autoComplete="current-password"
          placeholder="Password"
          className="w-full rounded-full border border-bark/20 bg-cream px-5 py-3 text-base text-bark placeholder:text-bark/40 focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/30"
        />
        <button
          type="submit"
          className="rounded-full bg-bark px-6 py-3 text-base text-cream transition-colors hover:bg-bark/90"
        >
          Enter
        </button>
      </form>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          Incorrect password.
        </p>
      )}
    </section>
  );
}
