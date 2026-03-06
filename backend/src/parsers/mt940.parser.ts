import { Transaction, ParseResult } from './transaction.model';

/**
 * MT940 parser - handles :20:, :25:, :28C:, :60F/M, :61:, :86:, :62F/M tags
 */
export class Mt940Parser {
  parse(content: string): ParseResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const transactions: Transaction[] = [];

    const lines = content.split(/\r?\n/).map((l) => l.trim());
    let currency = 'EUR';
    let account = '';

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      if (line.startsWith(':20:')) {
        // Transaction reference - skip
        i++;
        continue;
      }

      if (line.startsWith(':25:')) {
        account = line.slice(4).trim();
        i++;
        continue;
      }

      if (line.startsWith(':28C:')) {
        i++;
        continue;
      }

      if (line.startsWith(':60F:') || line.startsWith(':60M:')) {
        const match = this.parse60(line);
        if (match) {
          currency = match.currency;
        }
        i++;
        continue;
      }

      if (line.startsWith(':61:')) {
        const txLine = line.slice(4);
        let fullTx = txLine;
        let j = i + 1;
        while (j < lines.length && lines[j].startsWith(':86:')) {
          fullTx += '\n' + lines[j].slice(4);
          j++;
        }

        try {
          const tx = this.parse61(fullTx, currency, account);
          if (tx) transactions.push(tx);
        } catch (e) {
          errors.push(`:61: parse error: ${(e as Error).message}`);
        }
        i = j;
        continue;
      }

      if (line.startsWith(':62F:') || line.startsWith(':62M:')) {
        i++;
        continue;
      }

      i++;
    }

    return { transactions, format: 'mt940', errors, warnings };
  }

  private parse60(
    line: string,
  ): { date: string; currency: string; amount: number } | null {
    const rest = line.slice(5).trim();
    const match = rest.match(/^(\d{6})([A-Z]{3})([0-9,]+)([DC])$/);
    if (!match) return null;
    const [, date, currency, amountStr, dc] = match;
    const amount = parseFloat(amountStr.replace(',', '.')) || 0;
    const signed = dc === 'D' ? -amount : amount;
    return { date: this.formatDate(date), currency, amount: signed };
  }

  private parse61(
    content: string,
    currency: string,
    account: string,
  ): Transaction | null {
    const firstLine = content.split('\n')[0] || '';
    // MT940 :61: format: YYMMDD[MMDD]C/D(amount)N...
    const match = firstLine.match(/^(\d{6})(\d{4})?([DC])([0-9,]+)([A-Z])?/);
    if (!match) return null;

    const [, dateStr, , dc, amountStr] = match;
    const amount = parseFloat(amountStr.replace(',', '.')) || 0;
    const signed = dc === 'D' ? -amount : amount;

    let description = '';
    const parts = content.split('\n').slice(1);
    if (parts.length) {
      description = parts
        .map((p) => p.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .join(' ');
    }

    return {
      date: this.formatDate(dateStr || ''),
      amount: signed,
      currency,
      description: description || 'Unknown',
      account,
      debitCredit: dc as 'D' | 'C',
    };
  }

  private formatDate(yymmdd: string): string {
    if (yymmdd.length !== 6) return yymmdd;
    const yy = yymmdd.slice(0, 2);
    const mm = yymmdd.slice(2, 4);
    const dd = yymmdd.slice(4, 6);
    const year = parseInt(yy, 10) < 50 ? `20${yy}` : `19${yy}`;
    return `${year}-${mm}-${dd}`;
  }
}
