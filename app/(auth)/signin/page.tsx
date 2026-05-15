import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AuthForm from "../AuthForm";

export const metadata = { title: "Sign in · Rooted in Worth" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/");

  const { error } = await searchParams;

  return (
    <section className="mx-auto flex w-full max-w-sm flex-col gap-6 px-6 py-20">
      <div className="text-center">
        <h1 className="text-4xl text-bark">Welcome back</h1>
        <p className="mt-2 text-sm text-bark/65">
          Sign in to your Rooted in Worth account.
        </p>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-100 px-4 py-2 text-center text-sm text-red-800"
        >
          {error === "callback"
            ? "That sign-in link didn't work. Try again."
            : "Google sign-in failed. Try again."}
        </p>
      )}
      <AuthForm mode="signin" />
    </section>
  );
}
