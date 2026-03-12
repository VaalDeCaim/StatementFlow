"use client";

import {useState, useCallback} from "react";
import Link from "next/link";
import {
  FileUp,
  Download,
  AlertCircle,
  CheckCircle2,
  Eye,
  Coins,
  Sparkles,
} from "lucide-react";
import {
  useUploadInit,
  useUploadToStorage,
  useCreateJob,
  usePollJobStatus,
  useBalance,
} from "@/lib/queries";
import {realDownloadExport, realPreviewExport} from "@/lib/convert-api";
import {
  Button,
  Card,
  CardBody,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Spinner,
} from "@heroui/react";
import type {ExportFormat, Job} from "@/lib/api-types";
import * as XLSX from "xlsx";

const PREVIEW_MAX_LINES = 2000;
const PREVIEW_MAX_CHARS = 200 * 1024;
const XLSX_PREVIEW_ROWS = 200;
const XLSX_PREVIEW_COLS = 20;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const CONVERSION_COST_COINS = 1;

function parseCsvToRows(text: string): string[][] {
  const capped = text.slice(0, PREVIEW_MAX_CHARS);
  const lines = capped.split(/\r?\n/).slice(0, PREVIEW_MAX_LINES);
  return lines.map((line) => {
    const row: string[] = [];
    let cell = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if ((c === "," && !inQuotes) || c === "\t") {
        row.push(cell.trim());
        cell = "";
      } else {
        cell += c;
      }
    }
    row.push(cell.trim());
    return row;
  });
}

export function PreviewContent({
  data,
  format,
}: {
  data: string | ArrayBuffer;
  format: ExportFormat;
}) {
  if (format === "xlsx") {
    try {
      const wb = XLSX.read(data as ArrayBuffer, {type: "array"});
      const sheetName = wb.SheetNames[0];
      if (!sheetName)
        return <p className="text-sm text-default-500">No sheets</p>;
      const ws = wb.Sheets[sheetName];
      const arr = XLSX.utils.sheet_to_json<string[]>(ws, {
        header: 1,
      }) as string[][];
      const rows = arr
        .slice(0, XLSX_PREVIEW_ROWS)
        .map((row) =>
          (Array.isArray(row) ? row : [row]).slice(0, XLSX_PREVIEW_COLS),
        );
      const colCount = Math.max(...rows.map((r) => r.length), 1);
      return (
        <div className="overflow-auto max-h-[70vh]">
          <table className="w-full text-left text-sm border-collapse">
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-default-200">
                  {Array.from({length: colCount}, (_, j) => (
                    <td key={j} className="px-2 py-1.5 whitespace-nowrap">
                      {row[j] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } catch {
      return <p className="text-sm text-danger">Failed to parse XLSX</p>;
    }
  }
  if (format === "qbo") {
    const raw = typeof data === "string" ? data : "";
    const capped = raw.slice(0, PREVIEW_MAX_CHARS);
    const lines = capped.split(/\r?\n/).slice(0, PREVIEW_MAX_LINES);
    const text = lines.join("\n");
    return (
      <div className="overflow-auto max-h-[70vh] rounded-lg bg-default-100 p-3">
        <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">
          {text || "No content"}
        </pre>
      </div>
    );
  }
  // csv
  const text = data as string;
  const rows = parseCsvToRows(text);
  if (rows.length === 0)
    return <p className="text-sm text-default-500">Empty file</p>;
  const colCount = Math.max(...rows.map((r) => r.length), 1);
  return (
    <div className="overflow-auto max-h-[70vh]">
      <table className="w-full text-left text-sm border-collapse">
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-default-200">
              {Array.from({length: colCount}, (_, j) => (
                <td key={j} className="px-2 py-1.5 whitespace-nowrap">
                  {row[j] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ConvertPage() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [jobId, setJobId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<string | ArrayBuffer | null>(
    null,
  );
  const [isDragOver, setIsDragOver] = useState(false);

  const {data: balanceData} = useBalance();
  const hasBalance = (balanceData?.coins ?? 0) > 0;

  const uploadInit = useUploadInit();
  const uploadToStorage = useUploadToStorage();
  const createJob = useCreateJob();
  const {data: jobData, isLoading: jobLoading} = usePollJobStatus(jobId);
  const job: Job | null | undefined = jobData;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (!f) return;

    if (f.size > MAX_FILE_SIZE_BYTES) {
      setFile(null);
      setJobId(null);
      setSubmitError("File is too large. Maximum size is 10 MB.");
      return;
    }

    if (
      f.name.endsWith(".mt940") ||
      f.name.endsWith(".xml") ||
      f.name.endsWith(".camt")
    ) {
      setFile(f);
      setJobId(null);
      setSubmitError(null);
    }
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;

      if (f.size > MAX_FILE_SIZE_BYTES) {
        setFile(null);
        setJobId(null);
        setSubmitError("File is too large. Maximum size is 10 MB.");
        return;
      }

      setFile(f);
      setJobId(null);
      setSubmitError(null);
    },
    [],
  );

  const handleSubmit = async () => {
    if (!file) return;
    setSubmitError(null);
    try {
      const init = await uploadInit.mutateAsync({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
      });
      await uploadToStorage.mutateAsync({
        key: init.key,
        token: init.presignedUrl,
        file,
      });
      const {jobId: id} = await createJob.mutateAsync({key: init.key, format});
      setJobId(id);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Upload failed");
    }
  };

  const handleDownload = async () => {
    if (!job?.id) return;
    const fmt = job.format;
    try {
      const url = await realDownloadExport(job.id, fmt);
      const a = document.createElement("a");
      a.href = url;
      a.download = `statement.${fmt}`;
      a.rel = "noopener noreferrer";
      a.target = "_blank";
      a.click();
    } catch (e) {
      console.error(JSON.stringify(e, null, 2));
      setSubmitError(e instanceof Error ? e.message : "Download failed");
    }
  };

  const handlePreview = useCallback(async () => {
    if (!job?.id || job.status !== "completed") return;
    setIsPreviewOpen(true);
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
  }, [job?.id, job?.status, job?.format]);

  const isUploading =
    uploadInit.isPending || uploadToStorage.isPending || createJob.isPending;
  const isProcessing = jobLoading && job?.status === "processing";
  const isDone = Boolean(
    job && (job.status === "completed" || job.status === "failed"),
  );

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-foreground">Convert</h1>
        <p className="mt-1 text-sm text-default-600">
          Upload MT940 or CAMT.053 and export to CSV, XLSX, or QBO.
        </p>
      </div>

      {hasBalance && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragOver(false);
          }}
          onDrop={(e) => {
            setIsDragOver(false);
            handleDrop(e);
          }}
          className={`group rounded-2xl border-2 border-dashed bg-default-50/50 px-10 py-16 text-center transition-all duration-200 ease-out hover:border-primary hover:bg-primary/5 hover:shadow-md hover:scale-[1.01] ${
            isDragOver
              ? "border-primary bg-primary/5 shadow-md scale-[1.01]"
              : "border-default-200"
          }`}
        >
          <input
            type="file"
            accept=".mt940,.xml,.cam,.camt.053"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <FileUp
              className={`mx-auto h-12 w-12 transition-colors ${
                isDragOver
                  ? "text-primary"
                  : "text-default-400 group-hover:text-primary"
              }`}
            />
            <p className="mt-3 text-sm font-medium text-default-700">
              {file ? file.name : "Drag and drop or click to select"}
            </p>
            <p className="mt-1 text-xs text-default-500">
              MT940, CAMT.053 (XML)
            </p>
          </label>
        </div>
      )}

      {!hasBalance && (
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-warning/5 dark:from-primary/25 dark:via-primary/10 dark:to-warning/20 p-8 text-center border border-primary/20 shadow-lg">
          {/* Particle-style floating elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-primary/30 dark:bg-primary/40 animate-float"
                style={{
                  width: 6 + (i % 3) * 4,
                  height: 6 + (i % 3) * 4,
                  left: `${10 + ((i * 7) % 80)}%`,
                  top: `${15 + ((i * 11) % 70)}%`,
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: `${15 + (i % 2)}s`,
                }}
              />
            ))}
          </div>
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="flex items-center justify-center gap-2 rounded-full bg-primary/20 dark:bg-primary/30 px-4 py-2">
              <Sparkles className="h-4 w-4 text-warning animate-pulse" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              Top up your balance
            </h2>
            <p className="max-w-sm text-sm text-default-600 dark:text-default-500">
              You need coins to convert statements. Add a bundle to continue.
            </p>
            <Button
              as={Link}
              href="/dashboard/topup"
              color="primary"
              size="lg"
              className="font-medium shadow-md"
              startContent={<Coins className="h-5 w-5" />}
            >
              Go to Top Up
            </Button>
          </div>
        </section>
      )}

      {hasBalance && file && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Output format
            </label>
            <div className="mt-2 flex gap-2">
              {(["csv", "xlsx", "qbo"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={`rounded-full px-4 py-2 text-sm font-medium uppercase transition-colors ${
                    format === f
                      ? "bg-foreground text-background"
                      : "border border-default-200 bg-default text-default-600 hover:bg-default-100"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <p className="text-xs text-default-500">
              Price per conversion:{" "}
              <span className="font-medium text-foreground">
                {CONVERSION_COST_COINS} coin
                {CONVERSION_COST_COINS !== 1 ? "s" : ""}
              </span>
              {typeof balanceData?.coins === "number" && (
                <>
                  {" "}
                  · You have{" "}
                  <span className="font-medium text-foreground">
                    {balanceData.coins} coin
                    {balanceData.coins !== 1 ? "s" : ""}
                  </span>
                </>
              )}
            </p>
          </div>
          {submitError && <p className="text-sm text-danger">{submitError}</p>}
          {!jobId ? (
            <Button
              color="primary"
              onPress={handleSubmit}
              isDisabled={isUploading || !hasBalance}
              isLoading={isUploading}
            >
              {isUploading ? "Uploading…" : "Convert"}
            </Button>
          ) : null}
        </div>
      )}

      {jobId && (
        <Card shadow="sm" className="border border-default-200">
          <CardBody>
            {isProcessing && (
              <p className="text-sm text-default-600">Processing…</p>
            )}
            {isDone && job?.validationReport && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {job.status === "completed" ? (
                    <CheckCircle2 className="h-5 w-5 text-success-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-warning-500" />
                  )}
                  <span className="font-medium">
                    {job.status === "completed"
                      ? "Conversion complete"
                      : "Conversion failed"}
                  </span>
                </div>
                <div className="text-sm text-default-600">
                  <p>Accounts: {job.validationReport.accounts}</p>
                  <p>Transactions: {job.validationReport.transactions}</p>
                  {job.validationReport.warnings.length > 0 && (
                    <ul className="mt-2 list-disc pl-4">
                      {job.validationReport.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  )}
                  {job.validationReport.errors.length > 0 && (
                    <ul className="mt-2 list-disc pl-4 text-warning-600">
                      {job.validationReport.errors.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  )}
                </div>
                {job.status === "completed" && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="bordered"
                      startContent={<Download className="h-4 w-4" />}
                      onPress={() => handleDownload()}
                    >
                      Download {job.format.toUpperCase()}
                    </Button>
                    <Button
                      variant="bordered"
                      startContent={<Eye className="h-4 w-4" />}
                      onPress={handlePreview}
                    >
                      Preview
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      <Modal
        isOpen={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        size="5xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Preview — statement.{job?.format ?? "export"}
          </ModalHeader>
          <ModalBody className="min-h-[300px] max-h-[80vh]">
            {previewLoading && (
              <div className="flex justify-center py-12">
                <Spinner size="lg" color="default" label="Loading preview…" />
              </div>
            )}
            {!previewLoading && previewError && (
              <p className="text-sm text-danger">{previewError}</p>
            )}
            {!previewLoading && !previewError && previewData && job && (
              <PreviewContent data={previewData} format={job.format} />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
