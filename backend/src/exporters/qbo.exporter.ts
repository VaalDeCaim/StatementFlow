import { Transaction } from '../parsers/transaction.model';

/**
 * QBO (QuickBooks Online) format - IIF style for bank transactions
 */
export function exportToQbo(transactions: Transaction[]): string {
  const lines: string[] = [
    '!TRNS	TRNSID	TRNSTYPE	DATE	ACCNT	NAME	CLASS	AMOUNT	DOCNUM	MEMO',
    '!SPL	SPLID	TRNSTYPE	DATE	ACCNT	NAME	CLASS	AMOUNT	DOCNUM	MEMO',
    '!ENDTRNS',
  ];

  for (const t of transactions) {
    const trnsType = t.amount >= 0 ? 'DEPOSIT' : 'CHECK';
    lines.push(
      `TRNS		${trnsType}	${t.date}	Bank		${t.amount.toFixed(2)}		${t.description}`,
    );
    lines.push(
      `SPL		${trnsType}	${t.date}	Bank		${(-t.amount).toFixed(2)}		${t.description}`,
    );
    lines.push('ENDTRNS');
  }

  return lines.join('\n');
}
