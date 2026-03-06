import { Mt940Parser } from './mt940.parser';

describe('Mt940Parser', () => {
  const parser = new Mt940Parser();

  it('should parse :61: transactions', () => {
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
});
