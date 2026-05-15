import Link from "next/link";
import ResetRequestForm from "./ResetRequestForm";

export const metadata = { title: "Reset password · Rooted in Worth" };

export default function ResetPage() {
  return (
    <section className="mx-auto flex w-full max-w-sm flex-col gap-6 px-6 py-20">
      <div className="text-center">
        <h1 className="text-4xl text-bark">Reset password</h1>
        <p className="mt-2 text-sm text-bark/65">
          Enter your email and we&rsquo;ll send a link to set a new one.
        </p>
      </div>
      <ResetRequestForm />
      <Link
        href="/signin"
        className="text-center text-sm text-moss underline-offset-4 hover:underline"
      >
        Back to sign in
      </Link>
    </section>
  );
}
