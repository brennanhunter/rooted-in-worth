import Image from "next/image";
import LoginButton from "./LoginButton";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-bark/10 bg-cream/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Rooted in Worth"
            width={48}
            height={48}
            className="h-12 w-12"
            priority
          />
          <span className="text-xl text-bark">Rooted in Worth</span>
        </div>
        <LoginButton />
      </div>
    </header>
  );
}
