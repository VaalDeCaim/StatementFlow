import { JobFormat } from '../entities/job.entity';

export function detectFormat(content: string): JobFormat {
  const trimmed = content.trim();
  if (
    trimmed.startsWith('<?xml') ||
    trimmed.startsWith('<Document') ||
    trimmed.includes('BkToCstmrStmt')
  ) {
    return JobFormat.CAMT053;
  }
  if (
    trimmed.startsWith(':20:') ||
    trimmed.includes(':61:') ||
    trimmed.includes(':86:')
  ) {
    return JobFormat.MT940;
  }
  throw new Error('Unable to detect format: expected MT940 or CAMT.053');
}
