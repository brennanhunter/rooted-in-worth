import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AccountForms from "./AccountForms";

export const metadata = {
  title: "Account · Rooted in Worth",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin?next=/account");

  return (
    <section className="mx-auto w-full max-w-xl px-6 py-16">
      <h1 className="mb-10 text-4xl text-bark">Account</h1>
      <AccountForms email={user.email ?? ""} />
    </section>
  );
}
