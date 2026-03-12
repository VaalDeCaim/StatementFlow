export type ParsedEntry = {
  // Common, per-entry
  sourceFormat: "mt940" | "camt053";
  date: string; // booking date
  valueDate: string;
  amount: number;
  currency: string;
  creditDebit: "CRDT" | "DBIT" | "C" | "D" | "";
  description: string;
  reference: string;
  entryStatus?: string;
  endToEndId?: string;
  // MT940 :61 extended
  transactionTypeCode?: string; // e.g. NTRF, NMSC, S103
  isReversal?: boolean; // RC/RD in :61:
  entryDate?: string; // optional MMDD from :61:
  bankReference?: string; // account servicing institution ref :61: /16x
  supplementaryDetails?: string; // :61: 34x
  // Structured :86 / field 86 (ISO 20022–style labels)
  creditorRef?: string; // /EREF/
  remittanceInfo?: string; // /REMI/
  orderingPartyName?: string; // /ORDP//NAME/
  orderingPartyId?: string; // /ORDP//ID/
  instructionId?: string; // /IREF/
  bankRef86?: string; // /RREF/ (bank reference in 86)
  charges?: string; // /CHRG/
  receivedAmount?: string; // /RCMT/
  returnReasonCode?: string; // /RTRN/
  beneficiaryName?: string; // /BENM//NAME/
  exchangeRate?: string; // /XCRT/
  // Statement- / account-level (repeated on each row so all fields are visible)
  statementReference?: string; // MT940 :20
  accountId?: string; // MT940 :25 or CAMT IBAN (without BIC prefix)
  accountBic?: string; // BIC when :25: is BIC/account
  sequenceNumber?: string; // MT940 :28C
  openingBalanceDate?: string;
  openingBalanceCurrency?: string;
  openingBalanceAmount?: number;
  closingBalanceDate?: string;
  closingBalanceCurrency?: string;
  closingBalanceAmount?: number;
  valueBalanceDate?: string; // :64: date / CAMT CLAV
  valueBalanceCurrency?: string;
  valueBalanceAmount?: number;
  messageId?: string; // CAMT <MsgId>
  statementId?: string; // CAMT <Stmt><Id>
  statementCreatedAt?: string; // CAMT <Stmt><CreDtTm> or GrpHdr
  // CAMT.053 specific (FinDock / mBank / NetSuite mapping)
  electronicSeqNb?: string; // ElctrncSeqNb (statement sequence)
  statementFromDate?: string; // FrToDt/FrDtTm
  statementToDate?: string; // FrToDt/ToDtTm
  accountServicerRef?: string; // AcctSvcrRef (bank reference)
  transactionCodeProprietary?: string; // BkTxCd Prtry/Cd (e.g. NCHG+920+020)
  instructedAmount?: number; // AmtDtls/InstdAmt (original currency amount)
  instructedCurrency?: string; // InstdAmt Ccy
  addtlTxInf?: string; // AddtlTxInf (long narrative, MT940 :86 equivalent in CAMT)
}

/** Parse structured labels from MT940 :86: (e.g. /EREF/, /REMI/, /ORDP//NAME/) */
function parseStructured86(text: string): Partial<ParsedEntry> {
  const out: Partial<ParsedEntry> = {};
  if (!text || typeof text !== "string") return out;
  const raw = text.replace(/\r?\n/g, " ").trim();

  const takeAfter = (tag: string): string | undefined => {
    const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\//g, "\\/");
    const re = new RegExp(
      `\\/${escapedTag}\\/([^]*?)(?=\\s*\\/[A-Z][A-Z0-9]+(?:\\/[^/]*)?\\/|$)`,
      "is",
    );
    const m = raw.match(re);
    const v = m?.[1]?.trim();
    return v && v.length > 0 ? v : undefined;
  };

  out.creditorRef = takeAfter("EREF");
  out.remittanceInfo = takeAfter("REMI");
  out.instructionId = takeAfter("IREF");
  out.bankRef86 = takeAfter("RREF");
  out.charges = takeAfter("CHRG");
  out.receivedAmount = takeAfter("RCMT");
  out.returnReasonCode = takeAfter("RTRN");
  out.exchangeRate = takeAfter("XCRT");
  out.orderingPartyName = takeAfter("ORDP//NAME") ?? takeAfter("ORDP");
  out.orderingPartyId = takeAfter("ORDP//ID");
  out.beneficiaryName = takeAfter("BENM//NAME") ?? takeAfter("BENM");

  return out;
}

/** Parse a single Bal block (OPBD, CLBD, CLAV) — case-insensitive */
function parseCamtBalance(block: string): { date: string; currency: string; amount: number } {
  const amtMatch = block.match(/<Amt[^>]*Ccy="([^"]+)"[^>]*>([^<]+)<\/Amt>/i);
  const dateMatch = block.match(/<Dt>([^<]+)<\/Dt>/i);
  const ccy = (amtMatch?.[1] ?? "").trim();
  const rawAmt = (amtMatch?.[2] ?? "").trim();
  const amount = rawAmt ? Number(rawAmt.replace(",", ".")) : 0;
  const date = (dateMatch?.[1] ?? "").trim();
  return { date, currency: ccy, amount };
}

export function parseCamt053(content: string): ParsedEntry[] {
  const raw = content;
  const msgId = (raw.match(/<MsgId>([^<]+)<\/MsgId>/i)?.[1] ?? "").trim();
  const stmtId = (raw.match(/<Stmt>[\s\S]*?<Id>([^<]+)<\/Id>/i)?.[1] ?? "").trim();
  const stmtCreDtTm =
    (raw.match(/<CreDtTm>([^<]+)<\/CreDtTm>/i)?.[1] ?? "").trim();
  const accountIban = (raw.match(/<Acct>[\s\S]*?<IBAN>([^<]+)<\/IBAN>/i)?.[1] ?? "").trim();
  const accountOthr = (raw.match(/<Acct>[\s\S]*?<Othr>[\s\S]*?<Id>([^<]+)<\/Id>/i)?.[1] ?? "").trim();
  const accountId = accountIban || accountOthr || "";
  const accountCcy = (raw.match(/<Acct>[\s\S]*?<Ccy>([^<]+)<\/Ccy>/i)?.[1] ?? "").trim();
  const elctrncSeqNb = (raw.match(/<ElctrncSeqNb>([^<]+)<\/ElctrncSeqNb>/i)?.[1] ?? "").trim();
  const frDtTm = (raw.match(/<FrDtTm>([^<]+)<\/FrDtTm>/i)?.[1] ?? "").trim();
  const toDtTm = (raw.match(/<ToDtTm>([^<]+)<\/ToDtTm>/i)?.[1] ?? "").trim();

  const openingBalBlock = raw.match(/<Bal>[\s\S]*?<Cd>OPBD<\/Cd>[\s\S]*?<\/Bal>/i);
  const closingBalBlock = raw.match(/<Bal>[\s\S]*?<Cd>CLBD<\/Cd>[\s\S]*?<\/Bal>/i);
  const valueBalBlock = raw.match(/<Bal>[\s\S]*?<Cd>CLAV<\/Cd>[\s\S]*?<\/Bal>/i);

  const opening = parseCamtBalance(openingBalBlock?.[0] ?? "");
  const closing = parseCamtBalance(closingBalBlock?.[0] ?? "");
  const valueBal = parseCamtBalance(valueBalBlock?.[0] ?? "");

  const entries: ParsedEntry[] = [];
  const ntryBlocks = raw.matchAll(/<Ntry\b[\s\S]*?<\/Ntry>/gi);

  for (const ntryMatch of ntryBlocks) {
    const ntryBlock = ntryMatch[0] ?? "";

    const ntryRef = (ntryBlock.match(/<NtryRef>([^<]+)<\/NtryRef>/i)?.[1] ?? "").trim();
    const ntryAmtMatch = ntryBlock.match(/<Amt[^>]*Ccy="([^"]+)"[^>]*>([^<]+)<\/Amt>/i);
    const ntryCurrency = (ntryAmtMatch?.[1] ?? accountCcy).trim();
    const ntryRawAmt = (ntryAmtMatch?.[2] ?? "").trim();
    const ntryAmount = ntryRawAmt ? Number(ntryRawAmt.replace(",", ".")) : 0;
    const ntryCd = (ntryBlock.match(/<CdtDbtInd>([^<]+)<\/CdtDbtInd>/i)?.[1] ?? "").toUpperCase();
    const creditDebit =
      ntryCd === "CRDT" || ntryCd === "DBIT" || ntryCd === "C" || ntryCd === "D"
        ? (ntryCd === "C" ? "CRDT" : ntryCd === "D" ? "DBIT" : ntryCd) as ParsedEntry["creditDebit"]
        : "";
    const rvslInd = /<RvslInd>true<\/RvslInd>/i.test(ntryBlock);
    const bookDate = (ntryBlock.match(/<BookgDt>[\s\S]*?<Dt>([^<]+)<\/Dt>/i)?.[1] ?? "").trim();
    const valDate = (ntryBlock.match(/<ValDt>[\s\S]*?<Dt>([^<]+)<\/Dt>/i)?.[1] ?? "").trim();
    const baseDate = bookDate || valDate;
    const valueDate = valDate || bookDate;
    const acctSvcrRefNtry = (ntryBlock.match(/<AcctSvcrRef>([^<]+)<\/AcctSvcrRef>/i)?.[1] ?? "").trim();
    const bkTxCdPrtry = (ntryBlock.match(/<BkTxCd>[\s\S]*?<Prtry>[\s\S]*?<Cd>([^<]+)<\/Cd>/i)?.[1] ?? "").trim();
    const addtlNtryInf = (ntryBlock.match(/<AddtlNtryInf>([^<]+)<\/AddtlNtryInf>/i)?.[1] ?? "").trim();
    const stsCd = (ntryBlock.match(/<Sts>[\s\S]*?<Cd>([^<]+)<\/Cd>/i)?.[1] ?? "").trim();
    const statusLegacy = (ntryBlock.match(/<Status>([^<]+)<\/Status>/i)?.[1] ?? "").trim();
    const entryStatus = stsCd || statusLegacy || "";

    const ntryDtlsBlocks = ntryBlock.match(/<NtryDtls>([\s\S]*?)<\/NtryDtls>/i)?.[1] ?? "";
    const txDtlsList = ntryDtlsBlocks ? ntryDtlsBlocks.matchAll(/<TxDtls>([\s\S]*?)<\/TxDtls>/gi) : [];

    const txDtlsArray = Array.from(txDtlsList).map((m) => m[1] ?? "");
    const hasDetails = txDtlsArray.length > 0;

    function buildEntry(
      amount: number,
      currency: string,
      ref: string,
      desc: string,
      endToEndIdVal: string,
      acctSvcrRefVal: string,
      instrIdVal: string,
      txIdVal: string,
      creditorRefVal: string,
      ustrdVal: string,
      addtlTxInfVal: string,
      returnReasonVal: string,
      dbtrNm: string,
      cdtrNm: string,
      instructedAmt: number | undefined,
      instructedCcy: string | undefined,
      ccyXchgVal: string | undefined,
    ): ParsedEntry | null {
      if (!currency && !accountCcy) return null;
      const ccy = currency || accountCcy;
      const descParts = [ustrdVal, addtlTxInfVal, addtlNtryInf].filter(Boolean);
      const description = descParts.length > 0 ? descParts.join(" | ") : desc;
      return {
        sourceFormat: "camt053",
        date: baseDate,
        valueDate,
        amount,
        currency: ccy,
        creditDebit,
        description,
        reference: ref || ntryRef,
        entryStatus: entryStatus || undefined,
        endToEndId: endToEndIdVal || undefined,
        creditorRef: creditorRefVal || undefined,
        orderingPartyName: dbtrNm || undefined,
        beneficiaryName: cdtrNm || undefined,
        statementReference: undefined,
        accountId: accountId || undefined,
        sequenceNumber: elctrncSeqNb || undefined,
        openingBalanceDate: opening.date || undefined,
        openingBalanceCurrency: opening.currency || accountCcy || undefined,
        openingBalanceAmount: opening.amount || undefined,
        closingBalanceDate: closing.date || undefined,
        closingBalanceCurrency: closing.currency || accountCcy || undefined,
        closingBalanceAmount: closing.amount || undefined,
        valueBalanceDate: valueBal.date || undefined,
        valueBalanceCurrency: valueBal.currency || undefined,
        valueBalanceAmount: valueBal.amount || undefined,
        messageId: msgId || undefined,
        statementId: stmtId || undefined,
        statementCreatedAt: stmtCreDtTm || undefined,
        electronicSeqNb: elctrncSeqNb || undefined,
        statementFromDate: frDtTm || undefined,
        statementToDate: toDtTm || undefined,
        accountServicerRef: acctSvcrRefVal || acctSvcrRefNtry || undefined,
        bankReference: acctSvcrRefVal || acctSvcrRefNtry || undefined,
        transactionTypeCode: bkTxCdPrtry ? bkTxCdPrtry.replace(/^[^+]*\+/, "").slice(0, 4) : undefined,
        transactionCodeProprietary: bkTxCdPrtry || undefined,
        isReversal: rvslInd || undefined,
        instructedAmount: instructedAmt,
        instructedCurrency: instructedCcy || undefined,
        exchangeRate: ccyXchgVal || undefined,
        addtlTxInf: addtlTxInfVal || undefined,
        returnReasonCode: returnReasonVal || undefined,
      };
    }

    if (!hasDetails) {
      if (!ntryCurrency && !accountCcy) continue;
      const e = buildEntry(
        ntryAmount,
        ntryCurrency,
        ntryRef,
        addtlNtryInf,
        "",
        acctSvcrRefNtry,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        undefined,
        undefined,
        undefined,
      );
      if (e) entries.push(e);
      continue;
    }

    for (const txDtls of txDtlsArray) {
      const refsBlock = txDtls.match(/<Refs>([\s\S]*?)<\/Refs>/i)?.[1] ?? "";
      const acctSvcrRef = (refsBlock.match(/<AcctSvcrRef>([^<]+)<\/AcctSvcrRef>/i)?.[1] ?? txDtls.match(/<AcctSvcrRef>([^<]+)<\/AcctSvcrRef>/i)?.[1] ?? "").trim();
      const instrId = (refsBlock.match(/<InstrId>([^<]+)<\/InstrId>/i)?.[1] ?? "").trim();
      const endToEndId = (refsBlock.match(/<EndToEndId>([^<]+)<\/EndToEndId>/i)?.[1] ?? txDtls.match(/<EndToEndId>([^<]+)<\/EndToEndId>/i)?.[1] ?? "").trim();
      const txId = (refsBlock.match(/<TxId>([^<]+)<\/TxId>/i)?.[1] ?? "").trim();
      const clrSysRef = (refsBlock.match(/<ClrSysRef>([^<]+)<\/ClrSysRef>/i)?.[1] ?? "").trim();

      const instdAmtMatch = txDtls.match(/<InstdAmt>[\s\S]*?<Amt[^>]*Ccy="([^"]+)"[^>]*>([^<]+)<\/Amt>/i);
      const txAmtMatch = txDtls.match(/<TxAmt>[\s\S]*?<Amt[^>]*Ccy="([^"]+)"[^>]*>([^<]+)<\/Amt>/i);
      const txDtlsAmtMatch = txDtls.match(/<Amt[^>]*Ccy="([^"]+)"[^>]*>([^<]+)<\/Amt>/i);
      const ccyXchg = (txDtls.match(/<XchgRate>([^<]+)<\/XchgRate>/i)?.[1] ?? "").trim();
      const srcCcy = (txDtls.match(/<SrcCcy>([^<]+)<\/SrcCcy>/i)?.[1] ?? "").trim();
      const trgtCcy = (txDtls.match(/<TrgtCcy>([^<]+)<\/TrgtCcy>/i)?.[1] ?? "").trim();
      const xchgStr = [srcCcy, trgtCcy, ccyXchg].filter(Boolean).join(" ") || ccyXchg || undefined;

      let amount = ntryAmount;
      let currency = ntryCurrency;
      let instructedAmt: number | undefined;
      let instructedCcy: string | undefined;

      if (instdAmtMatch) {
        instructedCcy = instdAmtMatch[1].trim();
        instructedAmt = Number((instdAmtMatch[2] ?? "").replace(",", "."));
        amount = ntryAmount;
        currency = ntryCurrency || instructedCcy;
      } else if (txAmtMatch) {
        currency = (txAmtMatch[1] ?? "").trim();
        amount = Number((txAmtMatch[2] ?? "").replace(",", "."));
      } else if (txDtlsAmtMatch) {
        currency = (txDtlsAmtMatch[1] ?? "").trim();
        amount = Number((txDtlsAmtMatch[2] ?? "").replace(",", "."));
      }

      const rmtBlock = txDtls.match(/<RmtInf>([\s\S]*?)<\/RmtInf>/i)?.[1] ?? "";
      const ustrd = (rmtBlock.match(/<Ustrd>([^<]+)<\/Ustrd>/i)?.[1] ?? txDtls.match(/<Ustrd>([^<]+)<\/Ustrd>/i)?.[1] ?? "").trim();
      const cdtrRefInf = (rmtBlock.match(/<CdtrRefInf>[\s\S]*?<Ref>([^<]+)<\/Ref>/i)?.[1] ?? txDtls.match(/<CdtrRefInf>[\s\S]*?<Ref>([^<]+)<\/Ref>/i)?.[1] ?? "").trim();
      const addtlTxInf = (txDtls.match(/<AddtlTxInf>([^<]+)<\/AddtlTxInf>/i)?.[1] ?? "").trim();
      const returnReason = (txDtls.match(/<RtrInf>[\s\S]*?<Cd>([^<]+)<\/Cd>/i)?.[1] ?? txDtls.match(/<Rsn>[\s\S]*?<Cd>([^<]+)<\/Cd>/i)?.[1] ?? "").trim();

      const dbtrNm = (txDtls.match(/<Dbtr>[\s\S]*?<Nm>([^<]+)<\/Nm>/i)?.[1] ?? txDtls.match(/<UltmtDbtr>[\s\S]*?<Nm>([^<]+)<\/Nm>/i)?.[1] ?? "").trim();
      const cdtrNm = (txDtls.match(/<Cdtr>[\s\S]*?<Nm>([^<]+)<\/Nm>/i)?.[1] ?? txDtls.match(/<UltmtCdtr>[\s\S]*?<Nm>([^<]+)<\/Nm>/i)?.[1] ?? "").trim();

      const ref = txId || clrSysRef || endToEndId || ntryRef;
      const txDtlsBkTxCd = (txDtls.match(/<BkTxCd>[\s\S]*?<Prtry>[\s\S]*?<Cd>([^<]+)<\/Cd>/i)?.[1] ?? "").trim();
      const prtryCode = txDtlsBkTxCd || bkTxCdPrtry;
      const e = buildEntry(
        amount,
        currency,
        ref,
        ustrd,
        endToEndId,
        acctSvcrRef,
        instrId,
        txId,
        cdtrRefInf,
        ustrd,
        addtlTxInf,
        returnReason,
        dbtrNm,
        cdtrNm,
        instructedAmt,
        instructedCcy,
        xchgStr,
      );
      if (e && prtryCode) {
        e.transactionCodeProprietary = prtryCode;
        e.transactionTypeCode = prtryCode.replace(/^[^+]*\+/, "").slice(0, 4) || e.transactionTypeCode;
      }
      if (e) entries.push(e);
    }
  }

  return entries;
}

export function parseMt940(content: string): ParsedEntry[] {
  const lines = content.split(/\r?\n/);

  let statementReference = "";
  let accountId = "";
  let accountBic = "";
  let sequenceNumber = "";
  let openingBalanceDate = "";
  let openingBalanceCurrency = "";
  let openingBalanceAmount = 0;
  let closingBalanceDate = "";
  let closingBalanceCurrency = "";
  let closingBalanceAmount = 0;
  let valueBalanceDate = "";
  let valueBalanceCurrency = "";
  let valueBalanceAmount = 0;

  const parseDate = (yyMMdd: string): string => {
    if (!/^\d{6}$/.test(yyMMdd)) return yyMMdd;
    const yy = yyMMdd.slice(0, 2);
    const mm = yyMMdd.slice(2, 4);
    const dd = yyMMdd.slice(4, 6);
    const yearPrefix = Number(yy) >= 70 ? "19" : "20";
    return `${yearPrefix}${yy}-${mm}-${dd}`;
  };

  const parseBalance = (body: string) => {
    const indicator = body[0];
    const dateRaw = body.slice(1, 7);
    const rest = body.slice(7).trim();
    const ccy = rest.slice(0, 3);
    const amtRaw = rest.slice(3).trim();
    const sign = indicator === "D" ? -1 : 1;
    const amount = amtRaw ? sign * Number(amtRaw.replace(",", ".")) : 0;
    const date = parseDate(dateRaw);
    return { date, currency: ccy, amount };
  };

  // First pass: header and balances
  for (const line of lines) {
    if (line.startsWith(":20:")) {
      statementReference = line.slice(4).trim();
    } else if (line.startsWith(":25:")) {
      const raw = line.slice(4).trim();
      const bicSlash = raw.match(/^([A-Z]{8})\/(.+)$/);
      if (bicSlash) {
        accountBic = bicSlash[1];
        accountId = bicSlash[2].trim();
      } else {
        accountId = raw;
      }
    } else if (line.startsWith(":28C:")) {
      sequenceNumber = line.slice(5).trim();
    } else if (line.startsWith(":60F:") || line.startsWith(":60M:")) {
      const body = line.slice(5).trim();
      const parsed = parseBalance(body);
      openingBalanceDate = parsed.date;
      openingBalanceCurrency = parsed.currency;
      openingBalanceAmount = parsed.amount;
    } else if (line.startsWith(":62F:") || line.startsWith(":62M:")) {
      const body = line.slice(5).trim();
      const parsed = parseBalance(body);
      closingBalanceDate = parsed.date;
      closingBalanceCurrency = parsed.currency;
      closingBalanceAmount = parsed.amount;
    } else if (line.startsWith(":64:")) {
      const body = line.slice(4).trim();
      const parsed = parseBalance(body);
      valueBalanceDate = parsed.date;
      valueBalanceCurrency = parsed.currency;
      valueBalanceAmount = parsed.amount;
    }
  }

  const entries: ParsedEntry[] = [];
  let current: ParsedEntry | null = null;

  // :61: format 6!n[4!n]2a[1!a]15d1!a3!c16x[/16x][34x] — parse step-by-step for robustness
  function parse61(body: string) {
    let refOwner = "";
    let bankRef = "";
    let supplementary = "";
    const valueDateRaw = body.slice(0, 6);
    let rest = body.length >= 6 ? body.slice(6) : "";
    let entryDate = "";
    if (/^\d{4}/.test(rest)) {
      const mmdd = rest.slice(0, 4);
      rest = rest.slice(4);
      const yy = valueDateRaw.slice(0, 2);
      entryDate = `20${yy}-${mmdd.slice(0, 2)}-${mmdd.slice(2, 4)}`;
    }
    const dcMatch = rest.match(/^(RC|RD|CR|DB|C|D)/i);
    const creditDebitRaw = dcMatch ? dcMatch[1].toUpperCase() : "";
    const isReversal = creditDebitRaw === "RC" || creditDebitRaw === "RD";
    const creditDebitChar =
      creditDebitRaw === "CR" || creditDebitRaw === "RC"
        ? "C"
        : creditDebitRaw === "DB" || creditDebitRaw === "RD"
          ? "D"
          : creditDebitRaw.slice(0, 1);
    if (dcMatch) rest = rest.slice(dcMatch[0].length);
    if (/^[A-Z]/i.test(rest)) rest = rest.slice(1); // optional funds code
    const amtMatch = rest.match(/^(\d{1,15}(?:,\d+)?)/);
    const amountStr = amtMatch ? amtMatch[1] : "";
    if (amtMatch) rest = rest.slice(amtMatch[0].length);
    const txMatch = rest.match(/^([SNF][A-Z0-9]{3})/i);
    const transactionTypeCode = txMatch ? txMatch[1] : "";
    if (txMatch) rest = rest.slice(4);
    const slashIdx = rest.indexOf("/");
    if (slashIdx >= 0) {
      refOwner = rest.slice(0, Math.min(16, slashIdx)).trim();
      const afterSlash = rest.slice(slashIdx + 1);
      const nextSlash = afterSlash.indexOf("/");
      bankRef = (nextSlash >= 0 ? afterSlash.slice(0, Math.min(16, nextSlash)) : afterSlash.slice(0, 16)).trim();
      supplementary = (nextSlash >= 0 ? afterSlash.slice(nextSlash + 1) : afterSlash.slice(16)).trim();
    } else {
      refOwner = rest.slice(0, 16).trim();
    }
    return {
      valueDate: parseDate(valueDateRaw),
      entryDate,
      creditDebitChar,
      isReversal,
      amountStr,
      transactionTypeCode,
      refOwner,
      bankRef,
      supplementary,
      currency: openingBalanceCurrency,
    };
  }

  for (const line of lines) {
    if (line.startsWith(":61:")) {
      if (current) entries.push(current);
      const body = line.slice(4).trim();
      const p = parse61(body);
      const amountNum = p.amountStr ? Number(p.amountStr.replace(",", ".")) : 0;
      const creditDebit =
        p.creditDebitChar === "C" || p.creditDebitChar === "D"
          ? (p.creditDebitChar as ParsedEntry["creditDebit"])
          : "";

      current = {
        sourceFormat: "mt940",
        date: p.valueDate,
        valueDate: p.valueDate,
        amount: amountNum,
        currency: p.currency,
        creditDebit,
        description: "",
        reference: p.refOwner,
        statementReference: statementReference || undefined,
        accountId: accountId || undefined,
        accountBic: accountBic || undefined,
        sequenceNumber: sequenceNumber || undefined,
        openingBalanceDate: openingBalanceDate || undefined,
        openingBalanceCurrency: openingBalanceCurrency || undefined,
        openingBalanceAmount,
        closingBalanceDate: closingBalanceDate || undefined,
        closingBalanceCurrency: closingBalanceCurrency || undefined,
        closingBalanceAmount,
        valueBalanceDate: valueBalanceDate || undefined,
        valueBalanceCurrency: valueBalanceCurrency || undefined,
        valueBalanceAmount: valueBalanceAmount || undefined,
        transactionTypeCode: p.transactionTypeCode || undefined,
        isReversal: p.isReversal || undefined,
        entryDate: p.entryDate || undefined,
        bankReference: p.bankRef || undefined,
        supplementaryDetails: p.supplementary || undefined,
      };
    } else if (line.startsWith(":86:")) {
      const body = line.slice(4).trim();
      if (current) {
        current.description = body;
        const structured = parseStructured86(body);
        if (structured.creditorRef) current.creditorRef = structured.creditorRef;
        if (structured.remittanceInfo) current.remittanceInfo = structured.remittanceInfo;
        if (structured.orderingPartyName) current.orderingPartyName = structured.orderingPartyName;
        if (structured.orderingPartyId) current.orderingPartyId = structured.orderingPartyId;
        if (structured.instructionId) current.instructionId = structured.instructionId;
        if (structured.bankRef86) current.bankRef86 = structured.bankRef86;
        if (structured.charges) current.charges = structured.charges;
        if (structured.receivedAmount) current.receivedAmount = structured.receivedAmount;
        if (structured.returnReasonCode) current.returnReasonCode = structured.returnReasonCode;
        if (structured.beneficiaryName) current.beneficiaryName = structured.beneficiaryName;
        if (structured.exchangeRate) current.exchangeRate = structured.exchangeRate;
      }
    }
  }

  if (current) entries.push(current);
  return entries;
}

const csvEscape = (s: string) => (s ?? "").replace(/"/g, '""');

type ColumnDef = {
  csvHeader: string;
  xlsxHeader: string;
  getCsvValue: (tx: ParsedEntry) => string;
  getXlsxValue: (tx: ParsedEntry) => string | number;
};

const COLUMNS: ColumnDef[] = [
  { csvHeader: "Format", xlsxHeader: "Format", getCsvValue: (tx) => tx.sourceFormat, getXlsxValue: (tx) => tx.sourceFormat },
  { csvHeader: "StatementRef", xlsxHeader: "Statement ref", getCsvValue: (tx) => tx.statementReference ?? "", getXlsxValue: (tx) => tx.statementReference ?? "" },
  { csvHeader: "Account", xlsxHeader: "Account", getCsvValue: (tx) => tx.accountId ?? "", getXlsxValue: (tx) => tx.accountId ?? "" },
  { csvHeader: "AccountBIC", xlsxHeader: "Account BIC", getCsvValue: (tx) => tx.accountBic ?? "", getXlsxValue: (tx) => tx.accountBic ?? "" },
  { csvHeader: "Sequence", xlsxHeader: "Sequence", getCsvValue: (tx) => tx.sequenceNumber ?? "", getXlsxValue: (tx) => tx.sequenceNumber ?? "" },
  { csvHeader: "ElectronicSeqNb", xlsxHeader: "Electronic seq nb", getCsvValue: (tx) => tx.electronicSeqNb ?? "", getXlsxValue: (tx) => tx.electronicSeqNb ?? "" },
  { csvHeader: "StatementFromDate", xlsxHeader: "Statement from date", getCsvValue: (tx) => tx.statementFromDate ?? "", getXlsxValue: (tx) => tx.statementFromDate ?? "" },
  { csvHeader: "StatementToDate", xlsxHeader: "Statement to date", getCsvValue: (tx) => tx.statementToDate ?? "", getXlsxValue: (tx) => tx.statementToDate ?? "" },
  { csvHeader: "OpeningBalanceDate", xlsxHeader: "Opening balance date", getCsvValue: (tx) => tx.openingBalanceDate ?? "", getXlsxValue: (tx) => tx.openingBalanceDate ?? "" },
  { csvHeader: "OpeningBalanceCurrency", xlsxHeader: "Opening balance currency", getCsvValue: (tx) => tx.openingBalanceCurrency ?? "", getXlsxValue: (tx) => tx.openingBalanceCurrency ?? "" },
  { csvHeader: "OpeningBalanceAmount", xlsxHeader: "Opening balance amount", getCsvValue: (tx) => tx.openingBalanceAmount != null ? tx.openingBalanceAmount.toString() : "", getXlsxValue: (tx) => tx.openingBalanceAmount ?? "" },
  { csvHeader: "ClosingBalanceDate", xlsxHeader: "Closing balance date", getCsvValue: (tx) => tx.closingBalanceDate ?? "", getXlsxValue: (tx) => tx.closingBalanceDate ?? "" },
  { csvHeader: "ClosingBalanceCurrency", xlsxHeader: "Closing balance currency", getCsvValue: (tx) => tx.closingBalanceCurrency ?? "", getXlsxValue: (tx) => tx.closingBalanceCurrency ?? "" },
  { csvHeader: "ClosingBalanceAmount", xlsxHeader: "Closing balance amount", getCsvValue: (tx) => tx.closingBalanceAmount != null ? tx.closingBalanceAmount.toString() : "", getXlsxValue: (tx) => tx.closingBalanceAmount ?? "" },
  { csvHeader: "ValueBalanceDate", xlsxHeader: "Value balance date", getCsvValue: (tx) => tx.valueBalanceDate ?? "", getXlsxValue: (tx) => tx.valueBalanceDate ?? "" },
  { csvHeader: "ValueBalanceCurrency", xlsxHeader: "Value balance currency", getCsvValue: (tx) => tx.valueBalanceCurrency ?? "", getXlsxValue: (tx) => tx.valueBalanceCurrency ?? "" },
  { csvHeader: "ValueBalanceAmount", xlsxHeader: "Value balance amount", getCsvValue: (tx) => tx.valueBalanceAmount != null ? tx.valueBalanceAmount.toString() : "", getXlsxValue: (tx) => tx.valueBalanceAmount ?? "" },
  { csvHeader: "MessageId", xlsxHeader: "Message ID", getCsvValue: (tx) => tx.messageId ?? "", getXlsxValue: (tx) => tx.messageId ?? "" },
  { csvHeader: "StatementId", xlsxHeader: "Statement ID", getCsvValue: (tx) => tx.statementId ?? "", getXlsxValue: (tx) => tx.statementId ?? "" },
  { csvHeader: "StatementCreatedAt", xlsxHeader: "Statement created at", getCsvValue: (tx) => tx.statementCreatedAt ?? "", getXlsxValue: (tx) => tx.statementCreatedAt ?? "" },
  { csvHeader: "BookingDate", xlsxHeader: "Booking date", getCsvValue: (tx) => tx.date, getXlsxValue: (tx) => tx.date },
  { csvHeader: "ValueDate", xlsxHeader: "Value date", getCsvValue: (tx) => tx.valueDate, getXlsxValue: (tx) => tx.valueDate },
  { csvHeader: "EntryDate", xlsxHeader: "Entry date", getCsvValue: (tx) => tx.entryDate ?? "", getXlsxValue: (tx) => tx.entryDate ?? "" },
  { csvHeader: "Currency", xlsxHeader: "Currency", getCsvValue: (tx) => tx.currency, getXlsxValue: (tx) => tx.currency },
  { csvHeader: "Amount", xlsxHeader: "Amount", getCsvValue: (tx) => tx.amount.toString(), getXlsxValue: (tx) => tx.amount },
  { csvHeader: "CreditDebit", xlsxHeader: "Credit / Debit", getCsvValue: (tx) => tx.creditDebit, getXlsxValue: (tx) => tx.creditDebit },
  { csvHeader: "TransactionTypeCode", xlsxHeader: "Transaction type code", getCsvValue: (tx) => tx.transactionTypeCode ?? "", getXlsxValue: (tx) => tx.transactionTypeCode ?? "" },
  { csvHeader: "TransactionCodeProprietary", xlsxHeader: "Transaction code proprietary", getCsvValue: (tx) => tx.transactionCodeProprietary ?? "", getXlsxValue: (tx) => tx.transactionCodeProprietary ?? "" },
  { csvHeader: "IsReversal", xlsxHeader: "Is reversal", getCsvValue: (tx) => tx.isReversal === true ? "Y" : tx.isReversal === false ? "N" : "", getXlsxValue: (tx) => tx.isReversal === true ? "Y" : tx.isReversal === false ? "N" : "" },
  { csvHeader: "EntryStatus", xlsxHeader: "Entry status", getCsvValue: (tx) => tx.entryStatus ?? "", getXlsxValue: (tx) => tx.entryStatus ?? "" },
  { csvHeader: "Reference", xlsxHeader: "Reference", getCsvValue: (tx) => csvEscape(tx.reference ?? ""), getXlsxValue: (tx) => tx.reference ?? "" },
  { csvHeader: "BankReference", xlsxHeader: "Bank reference", getCsvValue: (tx) => tx.bankReference ?? "", getXlsxValue: (tx) => tx.bankReference ?? "" },
  { csvHeader: "AccountServicerRef", xlsxHeader: "Account servicer ref", getCsvValue: (tx) => tx.accountServicerRef ?? "", getXlsxValue: (tx) => tx.accountServicerRef ?? "" },
  { csvHeader: "SupplementaryDetails", xlsxHeader: "Supplementary details", getCsvValue: (tx) => csvEscape(tx.supplementaryDetails ?? ""), getXlsxValue: (tx) => tx.supplementaryDetails ?? "" },
  { csvHeader: "Description", xlsxHeader: "Description", getCsvValue: (tx) => csvEscape(tx.description ?? ""), getXlsxValue: (tx) => tx.description ?? "" },
  { csvHeader: "AddtlTxInf", xlsxHeader: "Addtl tx inf", getCsvValue: (tx) => csvEscape(tx.addtlTxInf ?? ""), getXlsxValue: (tx) => tx.addtlTxInf ?? "" },
  { csvHeader: "EndToEndId", xlsxHeader: "End-to-end ID", getCsvValue: (tx) => tx.endToEndId ?? "", getXlsxValue: (tx) => tx.endToEndId ?? "" },
  { csvHeader: "CreditorRef", xlsxHeader: "Creditor ref", getCsvValue: (tx) => csvEscape(tx.creditorRef ?? ""), getXlsxValue: (tx) => tx.creditorRef ?? "" },
  { csvHeader: "RemittanceInfo", xlsxHeader: "Remittance info", getCsvValue: (tx) => csvEscape(tx.remittanceInfo ?? ""), getXlsxValue: (tx) => tx.remittanceInfo ?? "" },
  { csvHeader: "OrderingPartyName", xlsxHeader: "Ordering party name", getCsvValue: (tx) => csvEscape(tx.orderingPartyName ?? ""), getXlsxValue: (tx) => tx.orderingPartyName ?? "" },
  { csvHeader: "OrderingPartyId", xlsxHeader: "Ordering party ID", getCsvValue: (tx) => tx.orderingPartyId ?? "", getXlsxValue: (tx) => tx.orderingPartyId ?? "" },
  { csvHeader: "InstructionId", xlsxHeader: "Instruction ID", getCsvValue: (tx) => tx.instructionId ?? "", getXlsxValue: (tx) => tx.instructionId ?? "" },
  { csvHeader: "BankRef86", xlsxHeader: "Bank ref (86)", getCsvValue: (tx) => tx.bankRef86 ?? "", getXlsxValue: (tx) => tx.bankRef86 ?? "" },
  { csvHeader: "Charges", xlsxHeader: "Charges", getCsvValue: (tx) => tx.charges ?? "", getXlsxValue: (tx) => tx.charges ?? "" },
  { csvHeader: "ReceivedAmount", xlsxHeader: "Received amount", getCsvValue: (tx) => tx.receivedAmount ?? "", getXlsxValue: (tx) => tx.receivedAmount ?? "" },
  { csvHeader: "ReturnReasonCode", xlsxHeader: "Return reason code", getCsvValue: (tx) => tx.returnReasonCode ?? "", getXlsxValue: (tx) => tx.returnReasonCode ?? "" },
  { csvHeader: "BeneficiaryName", xlsxHeader: "Beneficiary name", getCsvValue: (tx) => csvEscape(tx.beneficiaryName ?? ""), getXlsxValue: (tx) => tx.beneficiaryName ?? "" },
  { csvHeader: "ExchangeRate", xlsxHeader: "Exchange rate", getCsvValue: (tx) => tx.exchangeRate ?? "", getXlsxValue: (tx) => tx.exchangeRate ?? "" },
  { csvHeader: "InstructedAmount", xlsxHeader: "Instructed amount", getCsvValue: (tx) => tx.instructedAmount != null ? tx.instructedAmount.toString() : "", getXlsxValue: (tx) => tx.instructedAmount ?? "" },
  { csvHeader: "InstructedCurrency", xlsxHeader: "Instructed currency", getCsvValue: (tx) => tx.instructedCurrency ?? "", getXlsxValue: (tx) => tx.instructedCurrency ?? "" },
];

function getNonEmptyColumnIndices(entries: ParsedEntry[]): number[] {
  const indices: number[] = [];
  for (let i = 0; i < COLUMNS.length; i++) {
    const hasValue = entries.some((tx) => {
      const v = COLUMNS[i].getCsvValue(tx);
      return String(v).trim() !== "";
    });
    if (hasValue) indices.push(i);
  }
  return indices;
}

export function buildCsv(entries: ParsedEntry[]): string {
  const colIndices = entries.length > 0 ? getNonEmptyColumnIndices(entries) : Array.from({ length: COLUMNS.length }, (_, i) => i);
  const header = colIndices.map((i) => COLUMNS[i].csvHeader).join(",") + "\n";
  const rows = entries.map((tx) =>
    colIndices
      .map((i) => COLUMNS[i].getCsvValue(tx))
      .map((field) => `"${field}"`)
      .join(","),
  );
  return header + rows.join("\n");
}

export function buildXlsxAoA(entries: ParsedEntry[]): (string | number)[][] {
  const colIndices = entries.length > 0 ? getNonEmptyColumnIndices(entries) : Array.from({ length: COLUMNS.length }, (_, i) => i);
  const headers = colIndices.map((i) => COLUMNS[i].xlsxHeader);
  const rows = entries.map((tx) => colIndices.map((i) => COLUMNS[i].getXlsxValue(tx)));
  return [headers, ...rows];
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildQbo(entries: ParsedEntry[], jobId: string): string {
  const now = new Date();
  const fmtDateTime = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(
      d.getUTCDate(),
    )}${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
  };

  const fmtDateOnly = (iso: string | undefined): string => {
    if (!iso) return fmtDateTime(now).slice(0, 8);
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return fmtDateTime(now).slice(0, 8);
    return `${m[1]}${m[2]}${m[3]}`;
  };

  const dtServer = fmtDateTime(now) + ".000[-0:UTC]";

  const first = entries[0];
  const acctId = first?.accountId ?? "0000000000";
  const bankId = "000000000";

  const dtStart =
    entries.length > 0
      ? fmtDateOnly(entries[0]?.date || entries[0]?.valueDate)
      : fmtDateTime(now).slice(0, 8);
  const dtEnd =
    entries.length > 0
      ? fmtDateOnly(
          entries[entries.length - 1]?.date ||
            entries[entries.length - 1]?.valueDate,
        )
      : fmtDateTime(now).slice(0, 8);

  const txnList = entries
    .map((tx, index) => {
      const posted = fmtDateOnly(tx.date || tx.valueDate);
      const sign =
        tx.creditDebit === "DBIT" || tx.creditDebit === "D" ? -1 : 1;
      const signedAmount = (sign * (tx.amount || 0)).toFixed(2);
      const name =
        tx.remittanceInfo ||
        tx.description ||
        tx.orderingPartyName ||
        tx.beneficiaryName ||
        "Converted transaction";
      const memoParts = [
        tx.reference,
        tx.endToEndId,
        tx.creditorRef,
        tx.transactionTypeCode ? `Type: ${tx.transactionTypeCode}` : "",
        tx.bankReference,
        tx.instructionId,
      ].filter(Boolean);
      const memo = memoParts.join(" | ").slice(0, 255);
      const fitId = `${jobId}-${index + 1}`;
      return [
        "      <STMTTRN>",
        "        <TRNTYPE>OTHER",
        `        <DTPOSTED>${posted}`,
        `        <TRNAMT>${signedAmount}`,
        `        <FITID>${fitId}`,
        `        <NAME>${escapeXml(name.slice(0, 255))}`,
        memo ? `        <MEMO>${escapeXml(memo)}` : "",
        "      </STMTTRN>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return [
    "OFXHEADER:100",
    "DATA:OFXSGML",
    "VERSION:102",
    "SECURITY:NONE",
    "ENCODING:UTF-8",
    "CHARSET:NONE",
    "COMPRESSION:NONE",
    "OLDFILEUID:NONE",
    "NEWFILEUID:NONE",
    "",
    "<OFX>",
    "  <SIGNONMSGSRSV1>",
    "    <SONRS>",
    "      <STATUS>",
    "        <CODE>0",
    "        <SEVERITY>INFO",
    "      </STATUS>",
    `      <DTSERVER>${dtServer}`,
    "      <LANGUAGE>ENG",
    "    </SONRS>",
    "  </SIGNONMSGSRSV1>",
    "  <BANKMSGSRSV1>",
    "    <STMTTRNRS>",
    `      <TRNUID>${jobId}`,
    "      <STATUS>",
    "        <CODE>0",
    "        <SEVERITY>INFO",
    "      </STATUS>",
    "      <STMTRS>",
    "        <CURDEF>USD",
    "        <BANKACCTFROM>",
    `          <BANKID>${bankId}`,
    `          <ACCTID>${acctId}`,
    "          <ACCTTYPE>CHECKING",
    "        </BANKACCTFROM>",
    "        <BANKTRANLIST>",
    `          <DTSTART>${dtStart}`,
    `          <DTEND>${dtEnd}`,
    txnList,
    "        </BANKTRANLIST>",
    "      </STMTRS>",
    "    </STMTTRNRS>",
    "  </BANKMSGSRSV1>",
    "</OFX>",
    "",
  ].join("\n");
}

