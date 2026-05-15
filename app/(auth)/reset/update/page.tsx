import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ResetUpdateForm from "./ResetUpdateForm";

export const metadata = { title: "Set new password · Rooted in Worth" };

export default async function ResetUpdatePage() {
  // Reaching here requires the session minted by the reset link
  // (via /auth/callback). No session → send them to request one.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/reset");

  return (
    <section className="mx-auto flex w-full max-w-sm flex-col gap-6 px-6 py-20">
      <div className="text-center">
        <h1 className="text-4xl text-bark">Choose a new password</h1>
        <p className="mt-2 text-sm text-bark/65">
          Almost there. Pick something strong.
        </p>
      </div>
      <ResetUpdateForm />
    </section>
  );
}
