import { XMLParser } from 'fast-xml-parser';
import { Transaction, ParseResult } from './transaction.model';

export class Camt053Parser {
  private readonly parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });

  parse(xml: string): ParseResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const transactions: Transaction[] = [];

    try {
      const doc = this.parser.parse(xml) as Record<string, unknown> | undefined;
      const root = (doc?.Document ?? doc?.BkToCstmrStmt ?? doc) as unknown;

      const statements = this.findStatements(root);
      if (!statements?.length) {
        errors.push('No CAMT.053 statements found');
        return { transactions: [], format: 'camt053', errors, warnings };
      }

      for (const stmt of statements) {
        const entries = this.getEntries(stmt);
        if (!entries?.length) {
          warnings.push('Statement has no entries');
          continue;
        }

        const currency = this.getCurrency(stmt);
        const account = this.getAccount(stmt);

        for (const entry of entries) {
          try {
            const tx = this.mapEntryToTransaction(entry, currency, account);
            if (tx) transactions.push(tx);
          } catch (e) {
            errors.push(`Entry parse error: ${(e as Error).message}`);
          }
        }
      }
    } catch (e) {
      errors.push(`XML parse error: ${(e as Error).message}`);
    }

    return { transactions, format: 'camt053', errors, warnings };
  }

  private findStatements(root: unknown): unknown[] {
    if (!root || typeof root !== 'object') return [];
    const r = root as Record<string, unknown>;
    const stmt = r.BkToCstmrStmtRpt || r.Stmt || r.Statement;
    if (Array.isArray(stmt)) return stmt;
    if (stmt) return [stmt];
    const stmts = r.BkToCstmrStmtRpt || r.Statement;
    if (Array.isArray(stmts)) return stmts;
    return [];
  }

  private getEntries(stmt: unknown): unknown[] {
    if (!stmt || typeof stmt !== 'object') return [];
    const s = stmt as Record<string, unknown>;
    const ntry = s.Ntry || s.Entry;
    if (Array.isArray(ntry)) return ntry;
    if (ntry) return [ntry];
    return [];
  }

  private getCurrency(stmt: unknown): string {
    if (!stmt || typeof stmt !== 'object') return 'EUR';
    const s = stmt as Record<string, unknown>;
    const acct = s.Acct as Record<string, unknown>;
    const ccy = (acct?.Ccy as string) || (s.Ccy as string);
    return ccy || 'EUR';
  }

  private getAccount(stmt: unknown): string {
    if (!stmt || typeof stmt !== 'object') return '';
    const s = stmt as Record<string, unknown>;
    const acct = s.Acct as Record<string, unknown>;
    const id = acct?.Id as Record<string, unknown>;
    const iban =
      (id?.IBAN as string) ||
      ((id?.Othr as Record<string, unknown>)?.['@_Id'] as string);
    return iban || '';
  }

  private mapEntryToTransaction(
    entry: unknown,
    currency: string,
    account: string,
  ): Transaction | null {
    if (!entry || typeof entry !== 'object') return null;
    const e = entry as Record<string, unknown>;

    const amt = e.Amt;
    let amount = 0;
    if (typeof amt === 'number') {
      amount = amt;
    } else if (amt && typeof amt === 'object') {
      const amtObj = amt as Record<string, unknown>;
      const val = amtObj.value ?? amtObj;
      if (typeof val === 'number') {
        amount = val;
      } else if (typeof val === 'string') {
        amount = parseFloat(val) || 0;
      }
    }

    const cdtDbtInd = (e.CdtDbtInd as string) || '';
    if (cdtDbtInd === 'DBIT' || cdtDbtInd === 'DB') {
      amount = -Math.abs(amount);
    } else {
      amount = Math.abs(amount);
    }

    const dt = e.ValDt || e.BookgDt;
    let date = '';
    if (dt && typeof dt === 'object') {
      const d = dt as Record<string, unknown>;
      date = (d.Dt as string) || (d['@_Dt'] as string) || '';
    } else if (typeof dt === 'string') {
      date = dt;
    }

    const ntry = e.NtryDtls as Record<string, unknown>;
    const txDtls = ntry?.TxDtls;
    let description = '';
    let ref = '';
    if (txDtls && Array.isArray(txDtls) && txDtls[0]) {
      const d = txDtls[0] as Record<string, unknown>;
      const refs = d.RfrdDocInf as Record<string, unknown>;
      ref = (refs?.Nb as string) || '';
      const rltd = d.RltdPties as Record<string, unknown> | undefined;
      const dbtr = rltd?.Dbtr as Record<string, unknown> | undefined;
      const cdtr = rltd?.Cdtr as Record<string, unknown> | undefined;
      description = (dbtr?.Nm as string) || (cdtr?.Nm as string) || '';
    }
    const addtl = e.AddtlNtryInf as string;
    if (addtl) description = description ? `${description} - ${addtl}` : addtl;

    return {
      date,
      amount,
      currency,
      description: description || 'Unknown',
      reference: ref || undefined,
      account,
    };
  }
}
