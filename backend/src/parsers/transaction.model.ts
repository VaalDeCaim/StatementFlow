export interface Transaction {
  date: string;
  amount: number;
  currency: string;
  description: string;
  reference?: string;
  account?: string;
  counterpartyAccount?: string;
  counterpartyName?: string;
  valueDate?: string;
  debitCredit?: 'D' | 'C';
}

export interface ParseResult {
  transactions: Transaction[];
  format: 'mt940' | 'camt053';
  errors: string[];
  warnings: string[];
}
