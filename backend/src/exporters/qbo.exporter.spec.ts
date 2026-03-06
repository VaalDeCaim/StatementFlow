import { exportToQbo } from './qbo.exporter';
import { Transaction } from '../parsers/transaction.model';

describe('exportToQbo', () => {
  const sampleTransactions: Transaction[] = [
    {
      date: '2024-01-15',
      amount: -50,
      currency: 'EUR',
      description: 'Payment',
    },
    {
      date: '2024-01-16',
      amount: 100,
      currency: 'EUR',
      description: 'Deposit',
    },
  ];

  it('should export debit as CHECK', () => {
    const qbo = exportToQbo(sampleTransactions);
    expect(qbo).toContain('CHECK');
    expect(qbo).toContain('-50.00');
  });

  it('should export credit as DEPOSIT', () => {
    const qbo = exportToQbo(sampleTransactions);
    expect(qbo).toContain('DEPOSIT');
    expect(qbo).toContain('100.00');
  });

  it('should include header lines', () => {
    const qbo = exportToQbo(sampleTransactions);
    expect(qbo).toContain('!TRNS');
    expect(qbo).toContain('!SPL');
    expect(qbo).toContain('!ENDTRNS');
  });

  it('should handle empty list', () => {
    const qbo = exportToQbo([]);
    expect(qbo).toContain('!TRNS');
    expect(qbo).not.toContain('TRNS\t\t');
  });
});
