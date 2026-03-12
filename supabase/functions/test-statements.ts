// Simple manual test harness for the statement parsers/exporters.
// Run with Deno in the functions directory, e.g.:
// deno run --allow-read ./test-statements.ts

import {
  buildCsv,
  parseCamt053,
  parseMt940,
} from "./_shared/statements.ts";

const mt940Path = "../test_upload_files/sample.mt940";
const camtPath = "../test_upload_files/sample_camt053.xml";

async function main() {
  const mt940Content = await Deno.readTextFile(mt940Path);
  const camtContent = await Deno.readTextFile(camtPath);

  const mt940Entries = parseMt940(mt940Content);
  const camtEntries = parseCamt053(camtContent);

  console.log("MT940 entries:", mt940Entries.length);
  console.log("First MT940 entry:", mt940Entries[0]);

  console.log("CAMT.053 entries:", camtEntries.length);
  console.log("First CAMT entry:", camtEntries[0]);

  const mt940Csv = buildCsv(mt940Entries);
  const camtCsv = buildCsv(camtEntries);

  console.log("MT940 CSV preview:");
  console.log(mt940Csv.split("\n").slice(0, 5).join("\n"));

  console.log("CAMT.053 CSV preview:");
  console.log(camtCsv.split("\n").slice(0, 5).join("\n"));
}

main().catch((err) => {
  console.error(err);
  Deno.exit(1);
});

