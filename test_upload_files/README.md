# Test upload files for Convert (MT940 & CAMT.053)

Use these files on the dashboard **Convert** page or in automated tests to verify detection, validation, and export.

## MT940 (SWIFT)

| File | Purpose |
|------|--------|
| **sample.mt940** | Valid MT940: one account, opening/closing balance, 2 transactions (`:61:`). Use for happy-path CSV/XLSX/QBO export. |
| **sample_multiple_accounts.mt940** | Valid MT940: two statements (two `:25:` accounts), multiple `:61:` transactions. Tests account/transaction counts. |
| **sample_empty_transactions.mt940** | Valid MT940 structure but **no** `:61:` lines. Expect “No transactions found in MT940” warning; job still completes. |
| **sample_invalid.mt940** | **Missing `:20:`** (only `:25:`, `:60F:`, `:62F:`). Detected as unsupported format → job **failed** with “Unsupported format: expected MT940 or CAMT.053”. |

## CAMT.053 (ISO 20022 XML)

| File | Purpose |
|------|--------|
| **sample_camt053.xml** | Full CAMT.053: one account, 2 entries (`<Ntry>`), balances, remittance info. Use for happy-path. |
| **sample_camt053_minimal.xml** | Minimal valid CAMT.053: one `<Acct>`, one `<Ntry>`. Tests minimal valid structure. |
| **sample_camt053_no_entries.xml** | Valid CAMT.053 with **no** `<Ntry>`. Expect “No entries found in CAMT.053” warning; job still completes. |
| **sample_camt053_multiple_accounts.xml** | Two `<Stmt>` blocks (two `<Acct>`), 3 `<Ntry>` total. Tests multiple accounts and entry count. |

## Backend behaviour (process-job)

- **MT940** is detected when the file contains both `:20:` and `:25:`.
- **CAMT.053** is detected when the file starts with `<?xml` or contains `<BkToCstmrStmt>`.
- Counts: MT940 → accounts = number of `:25:` lines (min 1), transactions = number of `:61:` lines. CAMT.053 → accounts = `<Acct>`, transactions = `<Ntry>`.
- Export is written to storage; job status is `completed` unless validation adds errors (e.g. unsupported format).
