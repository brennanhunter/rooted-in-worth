import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Hero from "./components/Hero";
import Vision from "./components/Vision";
import Pillars from "./components/Pillars";
import Roadmap from "./components/Roadmap";

export default async function Home() {
  // Signed-in members land in the community feed, not the marketing
  // intro. Logged-out visitors still get the landing page.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/feed");

  return (
    <>
      <Hero />
      <Vision />
      <Pillars />
      <Roadmap />
    </>
  );
}
