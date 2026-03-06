import { Mt940Parser } from './mt940.parser';

describe('Mt940Parser', () => {
  const parser = new Mt940Parser();

  it('should parse :61: transactions with :86: description', () => {
    const content = `
:20:REF123
:25:NL12RABO0123456789
:60F:240101EUR100,00C
:61:2401020102D50,00NTRFNONREF
:86:Payment for services
:62F:240102EUR50,00
`;
    const result = parser.parse(content);
    expect(result.format).toBe('mt940');
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].amount).toBe(-50);
    expect(result.transactions[0].currency).toBe('EUR');
    expect(result.transactions[0].description).toContain('Payment');
  });

  it('should parse credit transaction', () => {
    const content = `
:25:NL12RABO0123456789
:60F:240101EUR0,00C
:61:240115C100,00NTRF
:62F:240115EUR100,00
`;
    const result = parser.parse(content);
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].amount).toBe(100);
    expect(result.transactions[0].debitCredit).toBe('C');
  });

  it('should extract account from :25:', () => {
    const content = `
:25:DE89370400440532013000
:60F:240101EUR0,00C
:61:240101D10,00NTRF
`;
    const result = parser.parse(content);
    expect(result.transactions[0].account).toBe('DE89370400440532013000');
  });
});
