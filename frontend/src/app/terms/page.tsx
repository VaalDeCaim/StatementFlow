export default function TermsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-10 px-4">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">
          Terms &amp; Conditions
        </h1>
        <p className="text-xs text-default-500">
          Last updated: March 12, 2026
        </p>
      </header>

      <section className="space-y-3 text-sm leading-relaxed text-default-600">
        <p>
          These Terms &amp; Conditions (&quot;Terms&quot;) explain how you may use
          StatementFlow (&quot;StatementFlow&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) and what we
          expect from you when you do. By creating an account, accessing the
          dashboard, or using any part of StatementFlow, you are agreeing to
          these Terms. If you do not agree to these Terms, you must not use
          StatementFlow.
        </p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-default-600">
        <h2 className="text-base font-semibold text-foreground">
          1. What StatementFlow Does
        </h2>
        <p>
          StatementFlow is a tool that helps you convert bank statements and
          similar financial files into structured data. The service is provided
          for convenience and internal use only. StatementFlow is not an
          accounting platform, tax advisor, financial advisor, or a system of
          record for legal, regulatory, or compliance purposes.
        </p>
        <p>
          You remain solely responsible for verifying the accuracy of all
          outputs and for complying with any legal, tax, accounting, or
          regulatory obligations that apply to you or your organization.
        </p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-default-600">
        <h2 className="text-base font-semibold text-foreground">
          2. Sandbox Environment &amp; Coins
        </h2>
        <p>
          Unless we explicitly state otherwise, StatementFlow is provided in a
          sandbox or demo environment. Within this environment, &quot;coins&quot; are
          virtual usage units that may be consumed when you run conversions or
          other operations.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Coins are not money, deposits, or stored value.</li>
          <li>
            Coins do not represent a right to receive cash or any other
            monetary compensation.
          </li>
          <li>
            We may add, remove, reset, or adjust coin balances at any time
            (including during maintenance, testing, or account changes).
          </li>
        </ul>
        <p>
          To the fullest extent permitted by law, we do not provide refunds or
          compensation for lost, expired, misapplied, or incorrectly credited
          coins, including where such loss results from bugs, outages, or
          changes to the service.
        </p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-default-600">
        <h2 className="text-base font-semibold text-foreground">
          3. Data Quality &amp; Accuracy
        </h2>
        <p>
          Conversions performed by StatementFlow may contain errors, omissions,
          or inaccuracies, and may not reflect your underlying financial
          records. The service is not designed to be, and should not be relied
          on as, the sole source of truth for financial reporting or decision
          making.
        </p>
        <p>
          You must carefully review all converted data against your original
          statements before using it for any purpose, including but not limited
          to reporting, reconciliation, analytics, or decision making. You are
          solely responsible for any decisions or actions you take based on the
          outputs of the service.
        </p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-default-600">
        <h2 className="text-base font-semibold text-foreground">
          4. Availability &amp; Changes to the Service
        </h2>
        <p>
          We may modify, suspend, or discontinue any part of StatementFlow at
          any time, with or without notice. This includes changes to features,
          limits, pricing, or access to particular environments (such as the
          sandbox).
        </p>
        <p>
          We are not liable for any harm or loss arising from modifications,
          downtime, data loss within the sandbox environment, or discontinuation
          of the service.
        </p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-default-600">
        <h2 className="text-base font-semibold text-foreground">
          5. Your Responsibilities
        </h2>
        <p>When using StatementFlow, you agree that you will:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Only upload files and content that you have the legal right and
            authority to use.
          </li>
          <li>
            Not use the service for any unlawful, harmful, or abusive purpose.
          </li>
          <li>
            Not attempt to circumvent security, probe for vulnerabilities, or
            disrupt the service.
          </li>
        </ul>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-default-600">
        <h2 className="text-base font-semibold text-foreground">
          6. Privacy
        </h2>
        <p>
          We may process certain information about you and the files you upload
          in order to operate StatementFlow. Any personal data is handled in
          accordance with our privacy practices. If a separate Privacy Policy is
          provided, that document will govern how we collect, use, and store
          personal data.
        </p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-default-600">
        <h2 className="text-base font-semibold text-foreground">
          7. Third-Party Services
        </h2>
        <p>
          StatementFlow may rely on third-party services such as hosting
          providers or payment processors (including Stripe) to operate the
          product. Your use of those services may be subject to separate terms
          and policies provided by the relevant third party.
        </p>
        <p>
          We are not responsible for acts or omissions of third-party service
          providers, including service outages, security incidents, or billing
          issues originating from those providers.
        </p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-default-600">
        <h2 className="text-base font-semibold text-foreground">
          8. Warranty Disclaimer
        </h2>
        <p>
          StatementFlow is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis,
          without warranties of any kind, whether express, implied, or
          statutory. Without limiting the foregoing, we specifically disclaim
          any implied warranties of merchantability, fitness for a particular
          purpose, non-infringement, and any warranties arising out of course of
          dealing or usage of trade.
        </p>
        <p>
          We do not warrant that the service will be accurate, error-free,
          secure, or uninterrupted.
        </p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-default-600">
        <h2 className="text-base font-semibold text-foreground">
          9. Limitation of Liability
        </h2>
        <p>
          To the maximum extent permitted by law, in no event will
          StatementFlow, its creators, or contributors be liable for any
          indirect, incidental, special, consequential, or punitive damages, or
          for any loss of profits, revenue, data, or use, arising out of or
          related to your use of the service.
        </p>
        <p>
          Without limiting the foregoing, we are not liable for any loss,
          damage, or claims arising from (a) inaccurate or incomplete
          conversions, (b) decisions made or actions taken based on converted
          data, or (c) loss, expiration, or miscalculation of coins.
        </p>
        <p>
          If, despite these Terms, we are found to be liable to you, our total
          aggregate liability for all claims arising out of or relating to the
          service will be limited to the greater of (i) the amount you paid (if
          any) for access to the service in the three (3) months preceding the
          claim, or (ii) one hundred (100) USD.
        </p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-default-600">
        <h2 className="text-base font-semibold text-foreground">
          10. Termination
        </h2>
        <p>
          We may suspend or terminate your access to StatementFlow at any time,
          with or without cause or notice, including where we believe you have
          violated these Terms or misused the service.
        </p>
        <p>
          Upon termination, your access to the service may cease immediately,
          and any remaining coins or data stored in the sandbox environment may
          be deleted or become inaccessible. To the maximum extent permitted by
          law, we will have no obligation to provide refunds or compensation in
          connection with such termination.
        </p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-default-600">
        <h2 className="text-base font-semibold text-foreground">
          11. Governing Law &amp; Disputes
        </h2>
        <p>
          These Terms are governed by and construed in accordance with the laws
          of your primary place of business or residence, unless another
          jurisdiction is expressly specified in a separate agreement. Any
          disputes arising out of or relating to these Terms or the service will
          be subject to the exclusive jurisdiction of the courts located in that
          jurisdiction.
        </p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-default-600">
        <h2 className="text-base font-semibold text-foreground">
          12. Changes to These Terms
        </h2>
        <p>
          We may update these Terms from time to time. When we do, we will
          revise the &quot;Last updated&quot; date at the top of this page. Your
          continued use of StatementFlow after any changes take effect
          constitutes your acceptance of the updated Terms.
        </p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-default-600">
        <h2 className="text-base font-semibold text-foreground">13. Contact</h2>
        <p>
          If you have any questions about these Terms, please contact us at{" "}
          <a
            href="mailto:support@statementflow.app"
            className="font-medium text-primary hover:underline"
          >
            support@statementflow.app
          </a>
          .
        </p>
      </section>
    </div>
  );
}

