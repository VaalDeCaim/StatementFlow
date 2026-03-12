"use client";

import React from "react";
import {Download, MoreVertical, Eye, Copy, Trash2, History} from "lucide-react";
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
  type RowItem = Job | {id: string; footer: true};
  const rowItems: RowItem[] =
    jobs.length > 0 ? [...jobs, {id: "footer", footer: true}] : [];
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
        color: "primary",
      });
    } catch {
      addToast({
        title: "Unable to copy filename.",
        color: "danger",
        timeout: 2000,
      });
    }
  };

  const [jobToDelete, setJobToDelete] = React.useState<Job | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const handleDeleteJob = (job: Job) => {
    setJobToDelete(job);
    setDeleteOpen(true);
  };

  const confirmDeleteJob = () => {
    if (!jobToDelete) return;

    deleteJobMutation.mutate(jobToDelete.id, {
      onSuccess: () => {
        addToast({
          title: "Conversion removed from history.",
          timeout: 2000,
          color: "success",
        });
        setDeleteOpen(false);
        setJobToDelete(null);
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
            items={rowItems}
            emptyContent={
              <div className="flex flex-col items-center justify-center gap-4 px-4 py-16 min-h-[280px]">
                <div className="rounded-full bg-default-100 p-4">
                  <History className="h-10 w-10 text-default-400" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-default-500 text-center max-w-sm">
                  You haven&apos;t converted any statements yet. Once you do,
                  they&apos;ll show up here.
                </p>
              </div>
            }
          >
            {(item) =>
              "footer" in item ? (
                <TableRow key={item.id}>
                  <TableCell colSpan={5}>
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
                        <span className="text-center">
                          You&apos;re all caught up. No more conversions to
                          load.
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow key={item.id}>
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
                            handleCopyFilename(item.fileName);
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </Tooltip>
                      <Tooltip
                        content={item.fileName}
                        delay={300}
                        closeDelay={0}
                      >
                        <span className="block min-w-0 max-w-[250px] truncate">
                          {item.fileName}
                        </span>
                      </Tooltip>
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[150px] w-[12%] text-default-600">
                    MT940 → {item.format.toUpperCase()}
                  </TableCell>
                  <TableCell
                    className="text-left"
                    style={{width: 80, maxWidth: 80}}
                  >
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="min-w-[100px] w-[22%] text-default-600">
                    {formatDate(item.createdAt)}
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
                          isDisabled={item.status !== "completed"}
                          onPress={() =>
                            handleDownload(item.id, item.format)
                          }
                        >
                          Download
                        </DropdownItem>
                        <DropdownItem
                          key="preview"
                          startContent={<Eye className="h-4 w-4" />}
                          isDisabled={item.status !== "completed"}
                          onPress={() => handlePreview(item)}
                        >
                          Preview
                        </DropdownItem>
                        <DropdownItem
                          key="remove"
                          color="danger"
                          className="text-danger"
                          startContent={<Trash2 className="h-4 w-4" />}
                          onPress={() => handleDeleteJob(item)}
                        >
                          Remove from history
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </TableCell>
                </TableRow>
              )
            }
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

      <Modal
        isOpen={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) {
            setJobToDelete(null);
          }
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Remove conversion from history?
          </ModalHeader>
          <ModalBody className="space-y-4 pb-6">
            <p className="text-sm text-default-600">
              This will permanently remove this conversion from your history.
            </p>
            <ul className="list-disc space-y-1 pl-5 text-xs text-default-500">
              <li>
                Any associated source and export files in cloud storage may be
                deleted.
              </li>
              <li>Coins used for this conversion are not refunded.</li>
              <li>
                Files you already downloaded to your computer will not be
                affected.
              </li>
            </ul>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="flat"
                size="sm"
                onPress={() => {
                  setDeleteOpen(false);
                  setJobToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                color="danger"
                size="sm"
                onPress={confirmDeleteJob}
                isLoading={deleteJobMutation.isPending}
              >
                Remove
              </Button>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
