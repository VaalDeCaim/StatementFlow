import {HelpCircle} from "lucide-react";

export default function SupportPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 py-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Support</h1>
        <HelpCircle className="h-5 w-5 text-primary" />
      </div>
      <p className="text-sm text-default-600">
        Need help with StatementFlow? Reach out to us at{" "}
        <a
          href="mailto:support@statementflow.app"
          className="font-medium text-primary hover:underline"
        >
          support@statementflow.app
        </a>
        .
      </p>
    </div>
  );
}
