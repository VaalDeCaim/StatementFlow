"use client";

import { Download, ChevronDown } from "lucide-react";
import { useJobs } from "@/lib/queries";
import { realDownloadExport } from "@/lib/convert-api";
import {
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Badge,
  Spinner,
  Alert,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tooltip,
} from "@heroui/react";
import type { Job, ExportFormat } from "@/lib/api-types";

const EXPORT_FORMATS: { key: ExportFormat; label: string }[] = [
  { key: "csv", label: "Download CSV" },
  { key: "xlsx", label: "Download XLSX" },
  { key: "qbo", label: "Download QBO" },
];

function formatDate(s: string) {
  return new Date(s).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

const statusBadgeColor: Record<Job["status"], "default" | "warning" | "success" | "danger"> = {
  pending: "default",
  processing: "warning",
  completed: "success",
  failed: "danger",
};

function StatusBadge({ status }: { status: Job["status"] }) {
  return (
    <Badge color={statusBadgeColor[status]} variant="flat" size="sm">
      {status}
    </Badge>
  );
}

export default function HistoryPage() {
  const { data: jobs, isLoading, error } = useJobs();

  const handleDownload = async (jobId: string, format: ExportFormat) => {
    try {
      const url = await realDownloadExport(jobId, format);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export.${format}`;
      a.rel = "noopener noreferrer";
      a.target = "_blank";
      a.click();
    } catch {
      // show error (e.g. toast) if needed
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <Spinner size="lg" color="default" label="Loading jobs…" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        color="danger"
        title="Error"
        description="Failed to load jobs."
        className="max-w-xl"
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-foreground">History</h1>
        <p className="mt-1 text-sm text-default-600">
          Past conversion jobs and exports.
        </p>
      </div>

      <Table
        aria-label="Conversion history"
        classNames={{
          base: "min-w-0 table-fixed border border-default-200 rounded-2xl overflow-hidden",
          wrapper: "min-w-0 overflow-hidden",
        }}
      >
        <TableHeader>
          <TableColumn className="w-[30%] bg-default-100 font-medium text-default-700">File</TableColumn>
          <TableColumn className="w-[12%] bg-default-100 font-medium text-default-700">Format</TableColumn>
          <TableColumn className="w-[18%] bg-default-100 font-medium text-default-700">Status</TableColumn>
          <TableColumn className="w-[22%] bg-default-100 font-medium text-default-700">Date</TableColumn>
          <TableColumn className="w-[18%] bg-default-100 font-medium text-default-700">Actions</TableColumn>
        </TableHeader>
        <TableBody
          items={jobs ?? []}
          emptyContent={
            <div className="px-4 py-12 text-center text-sm text-default-500">
              No jobs yet. Start with a conversion.
            </div>
          }
        >
          {(job) => (
            <TableRow key={job.id}>
              <TableCell className="min-w-0 w-[30%] font-medium text-foreground">
                <Tooltip content={job.fileName} delay={300} closeDelay={0}>
                  <span className="block min-w-0 truncate">{job.fileName}</span>
                </Tooltip>
              </TableCell>
              <TableCell className="min-w-0 w-[12%] uppercase text-default-600">{job.format}</TableCell>
              <TableCell className="min-w-0 w-[18%]">
                <StatusBadge status={job.status} />
              </TableCell>
              <TableCell className="min-w-0 w-[22%] text-default-600">{formatDate(job.createdAt)}</TableCell>
              <TableCell className="min-w-0 w-[18%]">
                {job.status === "completed" && (
                  <Dropdown>
                    <DropdownTrigger>
                      <Button
                        variant="flat"
                        size="sm"
                        endContent={<ChevronDown className="h-4 w-4" />}
                        startContent={<Download className="h-4 w-4" />}
                      >
                        Download
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu
                      aria-label="Export format"
                      onAction={(key) => handleDownload(job.id, key as ExportFormat)}
                    >
                      {EXPORT_FORMATS.map(({ key, label }) => (
                        <DropdownItem key={key}>{label}</DropdownItem>
                      ))}
                    </DropdownMenu>
                  </Dropdown>
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
