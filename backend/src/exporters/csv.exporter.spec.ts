import { exportToCsv } from './csv.exporter';
import { Transaction } from '../parsers/transaction.model';

describe('exportToCsv', () => {
  const sampleTransactions: Transaction[] = [
    {
      date: '2024-01-15',
      amount: -50,
      currency: 'EUR',
      description: 'Payment',
      reference: 'REF1',
      account: 'NL123',
    },
    {
      date: '2024-01-16',
      amount: 100,
      currency: 'EUR',
      description: 'Deposit with, comma',
      account: 'NL456',
    },
  ];

  it('should export transactions to CSV', () => {
    const csv = exportToCsv(sampleTransactions);
    expect(csv).toContain('date,amount,currency,description,reference,account');
    expect(csv).toContain('2024-01-15,-50,EUR,Payment,REF1,NL123');
    expect(csv).toContain('2024-01-16,100,EUR');
  });

  it('should escape commas in description', () => {
    const csv = exportToCsv(sampleTransactions);
    expect(csv).toContain('"Deposit with, comma"');
  });

  it('should handle empty list', () => {
    const csv = exportToCsv([]);
    expect(csv).toBe('date,amount,currency,description,reference,account');
  });
});
