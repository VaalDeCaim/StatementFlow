import { detectFormat } from './format-detector';
import { JobFormat } from '../entities/job.entity';

describe('detectFormat', () => {
  it('should detect CAMT.053 from XML declaration', () => {
    expect(detectFormat('<?xml version="1.0"?><Document>')).toBe(
      JobFormat.CAMT053,
    );
  });

  it('should detect CAMT.053 from Document tag', () => {
    expect(detectFormat('<Document>')).toBe(JobFormat.CAMT053);
  });

  it('should detect CAMT.053 from BkToCstmrStmt', () => {
    expect(detectFormat('  <BkToCstmrStmt>  ')).toBe(JobFormat.CAMT053);
  });

  it('should detect MT940 from :20: tag', () => {
    expect(detectFormat(':20:REF123')).toBe(JobFormat.MT940);
  });

  it('should detect MT940 from :61: tag', () => {
    expect(detectFormat('some text :61:240102D50,00')).toBe(JobFormat.MT940);
  });

  it('should detect MT940 from :86: tag', () => {
    expect(detectFormat(':86:Payment details')).toBe(JobFormat.MT940);
  });

  it('should throw for unknown format', () => {
    expect(() => detectFormat('plain text')).toThrow(
      'Unable to detect format: expected MT940 or CAMT.053',
    );
  });
});
