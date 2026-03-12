import type {ReactNode} from "react";

type AuthLayoutProps = {
  title: string;
  subtitle?: string;
  /** When provided, left and right columns use equal width and this is shown on the left. */
  leftContent?: ReactNode;
  children: ReactNode;
};

export function AuthLayout({
  title,
  subtitle,
  leftContent,
  children,
}: AuthLayoutProps) {
  const left = leftContent ?? (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {subtitle ? <p className="text-sm text-default-600">{subtitle}</p> : null}
    </div>
  );

  return (
    <div className="bg-background text-foreground">
      <main className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 pb-10 pt-16 md:grid-cols-2 md:gap-12">
        <section className="min-w-0">{left}</section>
        <section className="min-w-0">{children}</section>
      </main>
    </div>
  );
}
