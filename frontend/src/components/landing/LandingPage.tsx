"use client";

import {
  BarChart3,
  Building2,
  Calculator,
  Download,
  FileText,
  HelpCircle,
  ScanLine,
  ScanSearch,
  FileJson,
  Upload,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { Button, Card, CardBody, CardHeader } from "@heroui/react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";

const iconClass = "size-5 shrink-0 text-default-500";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main>
        <ScrollReveal>
          <section className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-16 pt-16 md:flex-row md:items-center md:gap-16 md:pb-24 md:pt-20">
          <div className="max-w-xl space-y-6">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-default-500">
              <FileText className={iconClass} aria-hidden />
              MT940 / CAMT.053 → CSV / XLSX / QBO
            </p>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Convert bank statement formats for your finance stack.
            </h1>
            <p className="text-sm leading-relaxed text-default-600">
              StatementFlow converts MT940 and CAMT.053 bank statements into
              CSV, XLSX, or QBO. Get clean, structured data for accounting,
              reporting, and integrations—no manual reformatting.
            </p>
            <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center">
              <Button color="primary" as={Link} href="/signup">
                Get started in minutes
              </Button>
              <Button variant="bordered" as={Link} href="#how-it-works">
                See how it works
              </Button>
            </div>
            <p className="text-xs text-default-500">
              Ideal for accountants, founders, and finance teams who need
              MT940/CAMT.053 converted to CSV, XLSX, or QuickBooks (QBO).
            </p>
          </div>
          <Card className="w-full max-w-md border border-default-200" shadow="sm">
            <CardHeader className="flex gap-2 pb-2">
              <BarChart3 className={iconClass} aria-hidden />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-default-500">
                Sample summary
              </p>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-default-500">Statements parsed</span>
                  <AnimatedCounter
                    value={248}
                    className="font-medium text-foreground"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-default-500">Accounts detected</span>
                  <AnimatedCounter
                    value={12}
                    className="font-medium text-foreground"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-default-500">Avg. processing time</span>
                  <AnimatedCounter
                    value={3.2}
                    decimals={1}
                    suffix="s"
                    className="font-medium text-foreground"
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        </section>
        </ScrollReveal>

        <section
          id="features"
          className="border-t border-default-200 bg-default-50 py-14"
        >
          <ScrollReveal>
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-xl font-semibold tracking-tight">
              Built for high‑volume statement conversion.
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-default-600">
              StatementFlow parses MT940 and CAMT.053, validates data, and
              exports to CSV, XLSX, or QBO—ready for your ledger, ERP, or BI
              tools.
            </p>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              <FeatureCard
                icon={<ScanSearch className={iconClass} aria-hidden />}
                title="MT940 & CAMT.053 parsing"
                body="Parse SWIFT MT940 and ISO 20022 CAMT.053 statements with validated transactions, balances, and metadata."
              />
              <FeatureCard
                icon={<FileJson className={iconClass} aria-hidden />}
                title="CSV, XLSX & QBO export"
                body="Export to CSV, XLSX, or QuickBooks (QBO) with consistent schemas for accounting and integrations."
              />
              <FeatureCard
                icon={<ShieldCheck className={iconClass} aria-hidden />}
                title="Validated & reliable"
                body="Parsed transactions and balances are validated so you get consistent, trustworthy output for your ledger and reports."
              />
            </div>
          </div>
          </ScrollReveal>
        </section>

        <section
          id="how-it-works"
          className="border-t border-default-200 bg-background py-14"
        >
          <ScrollReveal>
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-xl font-semibold tracking-tight">
              How StatementFlow works.
            </h2>
            <ol className="mt-6 grid gap-6 text-sm md:grid-cols-3">
              <li className="flex flex-col gap-2">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-default-500">
                  <Upload className={iconClass} aria-hidden />
                  Step 1
                </span>
                <h3 className="text-sm font-semibold text-foreground">
                  Upload statements
                </h3>
                <p className="text-default-600">
                  Upload MT940 or CAMT.053 files from your bank or upload in
                  bulk from secure storage.
                </p>
              </li>
              <li className="flex flex-col gap-2">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-default-500">
                  <ScanLine className={iconClass} aria-hidden />
                  Step 2
                </span>
                <h3 className="text-sm font-semibold text-foreground">
                  Parse & normalize
                </h3>
                <p className="text-default-600">
                  We parse MT940/CAMT.053, validate transactions and balances,
                  and normalize data for export.
                </p>
              </li>
              <li className="flex flex-col gap-2">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-default-500">
                  <Download className={iconClass} aria-hidden />
                  Step 3
                </span>
                <h3 className="text-sm font-semibold text-foreground">
                  Export to your tools
                </h3>
                <p className="text-default-600">
                  Download CSV, XLSX, or QBO and import into your ledger, ERP,
                  or QuickBooks with consistent schemas.
                </p>
              </li>
            </ol>
          </div>
          </ScrollReveal>
        </section>

        <section
          id="use-cases"
          className="border-t border-default-200 bg-default-50 py-14"
        >
          <ScrollReveal>
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-xl font-semibold tracking-tight">
              Built for modern finance teams.
            </h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              <FeatureCard
                icon={<Calculator className={iconClass} aria-hidden />}
                title="Accountants"
                body="Automate statement entry for monthly closes and keep full auditability of every import."
              />
              <FeatureCard
                icon={<BarChart3 className={iconClass} aria-hidden />}
                title="Founders & operators"
                body="See cash runway and burn quickly without hand‑maintained spreadsheets."
              />
              <FeatureCard
                icon={<Building2 className={iconClass} aria-hidden />}
                title="Fintech products"
                body="Embed statement parsing into your onboarding or underwriting flows with consistent outputs."
              />
            </div>
          </div>
          </ScrollReveal>
        </section>

        <section
          id="faq"
          className="border-t border-default-200 bg-background py-14"
        >
          <ScrollReveal>
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
              <HelpCircle className={iconClass} aria-hidden />
              Frequently asked questions.
            </h2>
            <div className="mt-6 space-y-5 text-sm">
              <FaqItem
                question="What formats does StatementFlow support?"
                answer="We accept MT940 (SWIFT) and CAMT.053 (ISO 20022) as input. You can export to CSV, XLSX, or QuickBooks (QBO). Each export uses a stable schema for accounting and integrations."
              />
              <FaqItem
                question="Which banks or systems use MT940 and CAMT.053?"
                answer="MT940 is common in European banking; CAMT.053 is the ISO 20022 bank-to-customer statement. Many banks and ERP systems can produce or consume these formats—StatementFlow converts between them and CSV, XLSX, and QBO."
              />
              <FaqItem
                question="Can I try StatementFlow without real data?"
                answer="Yes. You can upload sample statements or use redacted files to validate parsing quality before connecting production workflows."
              />
            </div>
          </div>
          </ScrollReveal>
        </section>
      </main>
    </div>
  );
}

type FeatureCardProps = {
  icon?: React.ReactNode;
  title: string;
  body: string;
};

function FeatureCard({ icon, title, body }: FeatureCardProps) {
  return (
    <Card className="border border-default-200" shadow="sm">
      <CardBody className="gap-0">
        {icon ? (
          <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-default-100">
            {icon}
          </div>
        ) : null}
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-default-600">{body}</p>
      </CardBody>
    </Card>
  );
}

type FaqItemProps = {
  question: string;
  answer: string;
};

function FaqItem({ question, answer }: FaqItemProps) {
  return (
    <article>
      <h3 className="text-sm font-semibold text-foreground">{question}</h3>
      <p className="mt-1 text-sm text-default-600">{answer}</p>
    </article>
  );
}

