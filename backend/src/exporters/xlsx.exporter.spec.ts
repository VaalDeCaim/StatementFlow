import { exportToXlsx } from './xlsx.exporter';
import { Transaction } from '../parsers/transaction.model';

describe('exportToXlsx', () => {
  const sampleTransactions: Transaction[] = [
    {
      date: '2024-01-15',
      amount: -50,
      currency: 'EUR',
      description: 'Payment',
      account: 'NL123',
    },
  ];

  it('should export transactions to XLSX buffer', async () => {
    const buffer = await exportToXlsx(sampleTransactions);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 4).toString('hex')).toBe('504b0304'); // ZIP/XLSX magic
  });

  it('should handle empty list', async () => {
    const buffer = await exportToXlsx([]);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });
});
