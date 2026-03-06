import { Camt053Parser } from './camt053.parser';

describe('Camt053Parser', () => {
  const parser = new Camt053Parser();

  it('should parse CAMT.053 XML with Stmt', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document>
  <Stmt>
    <Acct><Id><IBAN>NL91ABNA0417164300</IBAN></Id><Ccy>EUR</Ccy></Acct>
    <Ntry>
        <Amt>-50.00</Amt>
      <CdtDbtInd>DBIT</CdtDbtInd>
      <ValDt><Dt>2024-01-15</Dt></ValDt>
      <NtryDtls>
        <TxDtls>
          <RltdPties><Dbtr><Nm>ACME Corp</Nm></Dbtr></RltdPties>
        </TxDtls>
      </NtryDtls>
    </Ntry>
  </Stmt>
</Document>`;
    const result = parser.parse(xml);
    expect(result.format).toBe('camt053');
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].amount).toBe(-50);
    expect(result.transactions[0].currency).toBe('EUR');
    expect(result.transactions[0].description).toBeDefined();
  });

  it('should return errors when no statements found', () => {
    const xml = '<?xml version="1.0"?><Document><Other/></Document>';
    const result = parser.parse(xml);
    expect(result.transactions).toHaveLength(0);
    expect(result.errors).toContain('No CAMT.053 statements found');
  });

  it('should handle invalid XML', () => {
    const result = parser.parse('not valid xml <<<');
    expect(result.transactions).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
