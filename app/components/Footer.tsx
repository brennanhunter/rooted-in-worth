import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-bark/10 bg-bark text-cream">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 py-12 text-center md:flex-row md:justify-between md:text-left">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Rooted in Worth"
            width={40}
            height={40}
            className="h-10 w-10"
          />
          <span className="text-lg">Rooted in Worth</span>
        </div>

        <nav className="flex items-center gap-5 text-sm text-cream/80">
          <Link
            href="/privacy"
            className="underline-offset-4 transition-colors hover:text-cream hover:underline"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="underline-offset-4 transition-colors hover:text-cream hover:underline"
          >
            Terms
          </Link>
        </nav>

        <p className="text-sm text-cream/70">
          © {new Date().getFullYear()} Rooted in Worth · Growing slowly, on purpose.
        </p>
      </div>
    </footer>
  );
}
