"use client";

import {useState, useCallback} from "react";
import {FileUp, Download, AlertCircle, CheckCircle2} from "lucide-react";
import {
  useUploadInit,
  useUploadToStorage,
  useCreateJob,
  usePollJobStatus,
} from "@/lib/queries";
import {realDownloadExport} from "@/lib/convert-api";
import {Button, Card, CardBody} from "@heroui/react";
import type {ExportFormat, Job} from "@/lib/api-types";

export default function ConvertPage() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [jobId, setJobId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const uploadInit = useUploadInit();
  const uploadToStorage = useUploadToStorage();
  const createJob = useCreateJob();
  const {data: jobData, isLoading: jobLoading} = usePollJobStatus(jobId);
  const job: Job | null | undefined = jobData;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (
      f &&
      (f.name.endsWith(".mt940") ||
        f.name.endsWith(".xml") ||
        f.name.endsWith(".camt"))
    ) {
      setFile(f);
      setJobId(null);
      setSubmitError(null);
    }
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) {
        setFile(f);
        setJobId(null);
        setSubmitError(null);
      }
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

  const handleDownload = async (fmt: ExportFormat) => {
    if (!job?.id) return;
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

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="rounded-2xl border-2 border-dashed border-default-200 bg-default-50/50 p-10 text-center"
      >
        <input
          type="file"
          accept=".mt940,.xml,.cam,.camt.053"
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <FileUp className="mx-auto h-12 w-12 text-default-400" />
          <p className="mt-3 text-sm font-medium text-default-700">
            {file ? file.name : "Drag and drop or click to select"}
          </p>
          <p className="mt-1 text-xs text-default-500">MT940, CAMT.053 (XML)</p>
        </label>
      </div>

      {file && (
        <div className="space-y-4">
          <div>
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
          </div>
          {submitError && <p className="text-sm text-danger">{submitError}</p>}
          {!jobId ? (
            <Button
              color="primary"
              onPress={handleSubmit}
              isDisabled={isUploading}
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
                    {(["csv", "xlsx", "qbo"] as const).map((fmt) => (
                      <Button
                        key={fmt}
                        variant="bordered"
                        startContent={<Download className="h-4 w-4" />}
                        onPress={() => handleDownload(fmt)}
                      >
                        Download {fmt.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
