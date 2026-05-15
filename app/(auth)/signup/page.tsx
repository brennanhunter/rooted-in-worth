import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AuthForm from "../AuthForm";

export const metadata = { title: "Create account · Rooted in Worth" };

export default async function SignUpPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/");

  return (
    <section className="mx-auto flex w-full max-w-sm flex-col gap-6 px-6 py-20">
      <div className="text-center">
        <h1 className="text-4xl text-bark">Join the grove</h1>
        <p className="mt-2 text-sm text-bark/65">
          Create an account to take part in the community.
        </p>
      </div>
      <AuthForm mode="signup" />
    </section>
  );
}
