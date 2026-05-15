export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-2xl px-6 py-16">
      <h1 className="text-4xl text-bark md:text-5xl">{title}</h1>
      <p className="mt-2 text-sm text-bark/55">Last updated: {updated}</p>
      <div className="legal mt-10 flex flex-col gap-6 text-bark/80">
        {children}
      </div>
    </section>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-2xl text-bark">{heading}</h2>
      <div className="flex flex-col gap-3 text-base leading-relaxed">
        {children}
      </div>
    </div>
  );
}
