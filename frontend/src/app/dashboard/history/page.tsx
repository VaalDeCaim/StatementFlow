"use client";

import React from "react";
import {Download, MoreVertical, Eye, Copy, Trash2} from "lucide-react";
import {useDeleteJobMutation, useJobs} from "@/lib/queries";
import {realDownloadExport, realPreviewExport} from "@/lib/convert-api";
import {
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Spinner,
  Alert,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tooltip,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  addToast,
} from "@heroui/react";
import type {Job, ExportFormat} from "@/lib/api-types";
import {PreviewContent} from "@/app/dashboard/convert/page";

function formatDate(s: string) {
  return new Date(s).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

const statusBadgeColor: Record<
  Job["status"],
  "default" | "warning" | "success" | "danger"
> = {
  pending: "default",
  processing: "warning",
  completed: "success",
  failed: "danger",
};

function StatusBadge({status}: {status: Job["status"]}) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <Chip
      color={statusBadgeColor[status]}
      variant="flat"
      radius="full"
      size="sm"
      className="px-3 py-0.5 text-xs font-medium"
    >
      {label}
    </Chip>
  );
}

export default function HistoryPage() {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useJobs(20);
  const jobs = data?.pages.flatMap((page) => page.items) ?? [];
  const [showAllCaughtUp, setShowAllCaughtUp] = React.useState(false);
  const [previewJob, setPreviewJob] = React.useState<Job | null>(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewData, setPreviewData] = React.useState<
    string | ArrayBuffer | null
  >(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [previewError, setPreviewError] = React.useState<string | null>(null);
  const deleteJobMutation = useDeleteJobMutation();

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

  const handlePreview = async (job: Job) => {
    if (job.status !== "completed") return;
    setPreviewJob(job);
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewData(null);
    try {
      const data = await realPreviewExport(job.id, job.format);
      setPreviewData(data);
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCopyFilename = async (fileName: string) => {
    try {
      await navigator.clipboard.writeText(fileName);
      console.log("Filename copied to clipboard.");
      addToast({
        title: "Filename copied to clipboard.",
        timeout: 2000,
      });
    } catch {
      addToast({
        title: "Unable to copy filename.",
        color: "danger",
        timeout: 2000,
      });
    }
  };

  const handleDeleteJob = (job: Job) => {
    const confirmed = window.confirm(
      "Remove this conversion from your history? The underlying files will be deleted as well.",
    );
    if (!confirmed) return;

    deleteJobMutation.mutate(job.id, {
      onSuccess: () => {
        addToast({
          title: "Conversion removed from history.",
          timeout: 2000,
        });
      },
      onError: (err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Failed to remove job.";
        addToast({
          title: message,
          color: "danger",
          timeout: 2500,
        });
      },
    });
  };

  React.useEffect(() => {
    if (!jobs.length) {
      setShowAllCaughtUp(false);
      return;
    }

    if (!hasNextPage && !isFetchingNextPage) {
      setShowAllCaughtUp(true);
      const timeout = window.setTimeout(() => {
        setShowAllCaughtUp(false);
      }, 3000);
      return () => window.clearTimeout(timeout);
    }

    setShowAllCaughtUp(false);
  }, [jobs.length, hasNextPage, isFetchingNextPage]);

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
    <div className="flex h-full flex-col mx-auto max-w-5xl space-y-6">
      <div className="text-center flex-shrink-0">
        <h1 className="text-2xl font-semibold text-foreground">History</h1>
        <p className="mt-1 text-sm text-default-600">
          Review your past statement conversions and downloads.
        </p>
      </div>
      <div className="mt-4 flex-1 min-h-0 pb-4">
        <Table
          aria-label="Conversion history"
          isHeaderSticky
          bottomContent={
            jobs.length > 0 ? (
              <div className="flex items-center justify-center px-4 py-3 text-sm text-default-600">
                {isFetchingNextPage ? (
                  <div className="flex items-center gap-3">
                    <Spinner size="sm" color="default" />
                    <span>Loading more history…</span>
                  </div>
                ) : hasNextPage ? (
                  <Button
                    variant="flat"
                    size="sm"
                    className="px-4 py-1.5"
                    onPress={() => {
                      void fetchNextPage();
                    }}
                  >
                    Load more history
                  </Button>
                ) : (
                  <span
                    className={`text-center transition-opacity duration-[3000ms] ease-out ${
                      showAllCaughtUp ? "opacity-30" : "opacity-0"
                    }`}
                  >
                    You&apos;re all caught up. No more conversions to load.
                  </span>
                )}
              </div>
            ) : null
          }
          bottomContentPlacement="inside"
          classNames={{
            base: "min-w-0 table-fixed border border-default-200 rounded-2xl overflow-hidden h-full",
            wrapper: "min-w-0 h-full max-h-full overflow-y-auto",
          }}
        >
          <TableHeader>
            <TableColumn className="min-w-[250px] w-[40%] bg-default-100 font-medium text-default-700">
              File
            </TableColumn>
            <TableColumn className="min-w-[150px] w-[12%] bg-default-100 font-medium text-default-700">
              Format
            </TableColumn>
            <TableColumn className="w-[18%] bg-default-100 font-medium text-default-700 text-left">
              Status
            </TableColumn>
            <TableColumn className="min-w-[100px] w-[22%] bg-default-100 font-medium text-default-700">
              Date
            </TableColumn>
            <TableColumn className="w-[80px] bg-default-100 font-medium text-default-700">
              Actions
            </TableColumn>
          </TableHeader>
          <TableBody
            items={jobs}
            emptyContent={
              <div className="px-4 py-12 text-center text-sm text-default-500">
                You haven&apos;t converted any statements yet. Once you do,
                they&apos;ll show up here.
              </div>
            }
          >
            {(job) => (
              <TableRow key={job.id}>
                <TableCell
                  className="min-w-0 max-w-[250px] font-medium text-foreground"
                  style={{maxWidth: 250}}
                >
                  <div className="flex items-center gap-2">
                    <Tooltip content="Copy filename">
                      <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        className="min-w-0 flex-shrink-0"
                        onPress={() => {
                          handleCopyFilename(job.fileName);
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </Tooltip>
                    <Tooltip content={job.fileName} delay={300} closeDelay={0}>
                      <span className="block min-w-0 max-w-[250px] truncate">
                        {job.fileName}
                      </span>
                    </Tooltip>
                  </div>
                </TableCell>
                <TableCell className="min-w-[150px] w-[12%] text-default-600">
                  MT940 → {job.format.toUpperCase()}
                </TableCell>
                <TableCell className="text-left" style={{width: 80, maxWidth: 80}}>
                  <StatusBadge status={job.status} />
                </TableCell>
                <TableCell className="min-w-[100px] w-[22%] text-default-600">
                  {formatDate(job.createdAt)}
                </TableCell>
                <TableCell className="min-w-0 w-[18%]">
                  <Dropdown>
                    <DropdownTrigger>
                      <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        className="min-w-0"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Job actions">
                      <DropdownItem
                        key="download"
                        startContent={<Download className="h-4 w-4" />}
                        isDisabled={job.status !== "completed"}
                        onPress={() => handleDownload(job.id, job.format)}
                      >
                        Download
                      </DropdownItem>
                      <DropdownItem
                        key="preview"
                        startContent={<Eye className="h-4 w-4" />}
                        isDisabled={job.status !== "completed"}
                        onPress={() => handlePreview(job)}
                      >
                        Preview
                      </DropdownItem>
                      <DropdownItem
                        key="remove"
                        color="danger"
                        className="text-danger"
                        startContent={<Trash2 className="h-4 w-4" />}
                        onPress={() => handleDeleteJob(job)}
                      >
                        Remove from history
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Modal
        isOpen={previewOpen}
        onOpenChange={setPreviewOpen}
        size="5xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Preview — statement.{previewJob?.format ?? "export"}
          </ModalHeader>
          <ModalBody className="min-h-[300px] max-h-[80vh] pb-8">
            {previewLoading && (
              <div className="flex justify-center py-12">
                <Spinner size="lg" color="default" label="Loading preview…" />
              </div>
            )}
            {!previewLoading && previewError && (
              <p className="text-sm text-danger">{previewError}</p>
            )}
            {!previewLoading && !previewError && previewData && previewJob && (
              <PreviewContent data={previewData} format={previewJob.format} />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
