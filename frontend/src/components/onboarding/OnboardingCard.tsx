"use client";

import { Card, CardBody } from "@heroui/react";
import { FileText, Sparkles, Upload } from "lucide-react";
import { OnboardingNavButtons } from "./OnboardingNavButtons";

export function OnboardingCard() {
  return (
    <Card shadow="sm" className="mt-10 border border-default-200">
      <CardBody className="gap-6">
        <ul className="space-y-6">
          <li className="flex gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-default-100">
              <Upload className="size-5 text-default-600" aria-hidden />
            </div>
            <div>
              <p className="font-medium text-foreground">Upload a statement</p>
              <p className="mt-0.5 text-sm text-default-600">
                Go to Convert and upload an MT940 or CAMT.053 file.
              </p>
            </div>
          </li>
          <li className="flex gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-default-100">
              <Sparkles className="size-5 text-default-600" aria-hidden />
            </div>
            <div>
              <p className="font-medium text-foreground">We parse it</p>
              <p className="mt-0.5 text-sm text-default-600">
                We extract transactions and balances and validate the file.
              </p>
            </div>
          </li>
          <li className="flex gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-default-100">
              <FileText className="size-5 text-default-600" aria-hidden />
            </div>
            <div>
              <p className="font-medium text-foreground">Export when you need it</p>
              <p className="mt-0.5 text-sm text-default-600">
                Download as CSV, XLSX, or QBO from your dashboard.
              </p>
            </div>
          </li>
        </ul>
        <OnboardingNavButtons />
      </CardBody>
    </Card>
  );
}
