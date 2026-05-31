import assert from "node:assert/strict";
import { describe, it } from "node:test";
import ExcelJS from "exceljs";
import { parseCaspecoWorkbook } from "@/lib/imports/caspeco-parser";

describe("Caspeco parser", () => {
  it("detects and parses daily booking files with guests before bookings", async () => {
    const buffer = await createWorkbookBuffer([
      ["BOKNINGAR PER DAG - DATUM"],
      [],
      [],
      [],
      [],
      [],
      [
        "Bokningsenhet",
        "Period (Dag)",
        "Gäster - Innevarande år",
        "Gäster - Föregående år",
        "Gäster - Diff",
        "Bokningar - Innevarande år",
        "Bokningar - Föregående år",
        "Bokningar - Diff"
      ],
      ["Biljard", "2026-05-01", 22, 18, 4, 9, 7, 2],
      ["Biljard", new Date(Date.UTC(2026, 4, 2)), null, 20, -20, 0, 8, -8],
      ["Total", "2026-05-31", 22, 38, -16, 9, 15, -6]
    ]);

    const result = await parseCaspecoWorkbook(buffer, "daily.xlsx");

    assert.equal(result.fileType, "daily");
    assert.equal(result.dailyRows.length, 2);
    assert.equal(result.weekdayRows.length, 0);
    assert.equal(result.dailyRows[0]?.date, "2026-05-01");
    assert.equal(result.dailyRows[0]?.guestsCurrentYear, 22);
    assert.equal(result.dailyRows[0]?.bookingsCurrentYear, 9);
    assert.equal(result.dailyRows[1]?.date, "2026-05-02");
    assert.equal(result.dailyRows[1]?.guestsCurrentYear, 0);
    assert.equal(result.summary.totalGuestsCurrentYear, 22);
    assert.equal(result.summary.totalBookingsCurrentYear, 9);
    assert.equal(result.totalRow?.bookingUnit, "Total");
  });

  it("detects and parses weekday booking files with bookings before guests", async () => {
    const buffer = await createWorkbookBuffer([
      ["BOKNINGAR PER DAG - VECKODAG"],
      [],
      [],
      [],
      [],
      [],
      [
        "Bokningsenhet",
        "Period (Veckodag)",
        "Bokningar - Innevarande år",
        "Bokningar - Föregående år",
        "Bokningar - Diff",
        "Gäster - Innevarande år",
        "Gäster - Föregående år",
        "Gäster - Diff"
      ],
      ["Biljard", "Måndag", 12, 10, 2, 44, 38, 6],
      ["Biljard", "Lördag", 30, 22, 8, 120, 90, 30],
      ["Total", "Totalt", 42, 32, 10, 164, 128, 36]
    ]);

    const result = await parseCaspecoWorkbook(buffer, "weekday.xlsx");

    assert.equal(result.fileType, "weekday");
    assert.equal(result.weekdayRows.length, 2);
    assert.equal(result.weekdayRows[0]?.weekday, 1);
    assert.equal(result.weekdayRows[0]?.bookingsCurrentYear, 12);
    assert.equal(result.weekdayRows[0]?.guestsCurrentYear, 44);
    assert.equal(result.weekdayRows[1]?.weekday, 6);
    assert.equal(result.summary.totalBookingsCurrentYear, 42);
    assert.equal(result.summary.totalGuestsCurrentYear, 164);
    assert.equal(result.totalRow?.bookingUnit, "Total");
  });

  it("returns a helpful error for non-Caspeco files", async () => {
    const buffer = await createWorkbookBuffer([
      ["Something else"],
      ["Name", "Value"],
      ["A", 1]
    ]);

    await assert.rejects(
      () => parseCaspecoWorkbook(buffer, "bad.xlsx"),
      /Expected title text including BOKNINGAR PER DAG/
    );
  });
});

async function createWorkbookBuffer(rows: unknown[][]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Export");

  for (const row of rows) {
    worksheet.addRow(row);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
