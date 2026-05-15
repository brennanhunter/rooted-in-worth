import { Users, LogOut } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { adminLogout } from "@/app/actions/admin";
import NewsletterComposer from "./NewsletterComposer";

export const metadata = {
  title: "Admin · Rooted in Worth",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const { count } = await supabaseAdmin
    .from("subscribers")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const activeCount = count ?? 0;

  return (
    <section className="mx-auto w-full max-w-2xl px-6 py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl text-bark md:text-4xl">Newsletter</h1>
        <form action={adminLogout}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full border border-bark/20 px-4 py-2 text-sm text-bark transition-colors hover:bg-bark/5"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </form>
      </div>

      <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-sage/20 px-4 py-2 text-sm text-bark">
        <Users className="h-4 w-4 text-moss" aria-hidden="true" />
        {activeCount} active subscriber{activeCount === 1 ? "" : "s"}
      </div>

      <NewsletterComposer activeCount={activeCount} />
    </section>
  );
}
