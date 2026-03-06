import { Transaction } from '../parsers/transaction.model';

export function exportToCsv(transactions: Transaction[]): string {
  const headers = [
    'date',
    'amount',
    'currency',
    'description',
    'reference',
    'account',
  ];
  const rows = transactions.map((t) => [
    t.date,
    t.amount,
    t.currency,
    escapeCsv(t.description),
    t.reference ?? '',
    t.account ?? '',
  ]);
  const lines = [headers.join(','), ...rows.map((r) => r.join(','))];
  return lines.join('\n');
}

function escapeCsv(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}
