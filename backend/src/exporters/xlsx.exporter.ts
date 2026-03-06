import ExcelJS from 'exceljs';
import { Transaction } from '../parsers/transaction.model';

export async function exportToXlsx(
  transactions: Transaction[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Transactions');

  sheet.columns = [
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Amount', key: 'amount', width: 14 },
    { header: 'Currency', key: 'currency', width: 10 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Reference', key: 'reference', width: 20 },
    { header: 'Account', key: 'account', width: 24 },
  ];

  sheet.addRows(
    transactions.map((t) => ({
      date: t.date,
      amount: t.amount,
      currency: t.currency,
      description: t.description,
      reference: t.reference ?? '',
      account: t.account ?? '',
    })),
  );

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
