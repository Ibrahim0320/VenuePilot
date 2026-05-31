import ExcelJS from "exceljs";
import type {
  CaspecoDailyRow,
  CaspecoFileType,
  CaspecoImportResult,
  CaspecoWeekdayRow
} from "@/lib/imports/caspeco-types";

type CellValue = ExcelJS.CellValue | undefined;

const WEEKDAY_BY_NORMALIZED_NAME: Record<string, number> = {
  mandag: 1,
  man: 1,
  monday: 1,
  tisdag: 2,
  tis: 2,
  tuesday: 2,
  onsdag: 3,
  ons: 3,
  wednesday: 3,
  torsdag: 4,
  tor: 4,
  thursday: 4,
  fredag: 5,
  fre: 5,
  friday: 5,
  lordag: 6,
  lor: 6,
  saturday: 6,
  sondag: 0,
  son: 0,
  sunday: 0
};

const WEEKDAY_NAME_BY_NUMBER: Record<number, string> = {
  0: "Söndag",
  1: "Måndag",
  2: "Tisdag",
  3: "Onsdag",
  4: "Torsdag",
  5: "Fredag",
  6: "Lördag"
};

export async function parseCaspecoWorkbook(
  input: Buffer | ArrayBuffer,
  source: string
): Promise<CaspecoImportResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(toArrayBuffer(input));

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("Excel file contains no worksheets.");
  }

  const fileType = detectCaspecoFileType(worksheet);
  const headerRowNumber = findHeaderRowNumber(worksheet);

  if (!headerRowNumber) {
    throw new Error(
      "Could not find the Caspeco table header. Expected columns including Bokningsenhet and Period."
    );
  }

  return fileType === "daily"
    ? parseDailyWorksheet(worksheet, headerRowNumber, source)
    : parseWeekdayWorksheet(worksheet, headerRowNumber, source);
}

function parseDailyWorksheet(
  worksheet: ExcelJS.Worksheet,
  headerRowNumber: number,
  source: string
): CaspecoImportResult {
  const dailyRows: CaspecoDailyRow[] = [];
  const warnings: string[] = [];
  let totalRow: CaspecoDailyRow | undefined;

  for (let rowNumber = headerRowNumber + 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const bookingUnit = valueToString(row.getCell(1).value);
    const periodValue = row.getCell(2).value;

    if (isBlankDataRow(row)) {
      continue;
    }

    const isTotal = isTotalValue(bookingUnit) || isTotalValue(valueToString(periodValue));

    try {
      const parsedRow: CaspecoDailyRow = {
        bookingUnit: bookingUnit || "Unknown",
        date: parseDateCell(periodValue),
        guestsCurrentYear: parseNumberCell(row.getCell(3).value),
        guestsPreviousYear: parseNumberCell(row.getCell(4).value),
        guestsDiff: parseNumberCell(row.getCell(5).value),
        bookingsCurrentYear: parseNumberCell(row.getCell(6).value),
        bookingsPreviousYear: parseNumberCell(row.getCell(7).value),
        bookingsDiff: parseNumberCell(row.getCell(8).value),
        source
      };

      if (isTotal) {
        totalRow = parsedRow;
      } else {
        dailyRows.push(parsedRow);
      }
    } catch (error) {
      if (!isTotal) {
        warnings.push(rowWarning(rowNumber, error));
      }
    }
  }

  if (!dailyRows.length) {
    throw new Error("No daily booking rows could be detected in this Caspeco file.");
  }

  return buildImportResult("daily", dailyRows, [], totalRow, warnings);
}

function parseWeekdayWorksheet(
  worksheet: ExcelJS.Worksheet,
  headerRowNumber: number,
  source: string
): CaspecoImportResult {
  const weekdayRows: CaspecoWeekdayRow[] = [];
  const warnings: string[] = [];
  let totalRow: CaspecoWeekdayRow | undefined;

  for (let rowNumber = headerRowNumber + 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const bookingUnit = valueToString(row.getCell(1).value);
    const periodValue = row.getCell(2).value;
    const periodText = valueToString(periodValue);

    if (isBlankDataRow(row)) {
      continue;
    }

    const isTotal = isTotalValue(bookingUnit) || isTotalValue(periodText);

    try {
      const weekday = isTotal ? -1 : parseWeekdayCell(periodValue);
      const parsedRow: CaspecoWeekdayRow = {
        bookingUnit: bookingUnit || "Unknown",
        weekday,
        weekdayName: weekday >= 0 ? WEEKDAY_NAME_BY_NUMBER[weekday] : "Total",
        bookingsCurrentYear: parseNumberCell(row.getCell(3).value),
        bookingsPreviousYear: parseNumberCell(row.getCell(4).value),
        bookingsDiff: parseNumberCell(row.getCell(5).value),
        guestsCurrentYear: parseNumberCell(row.getCell(6).value),
        guestsPreviousYear: parseNumberCell(row.getCell(7).value),
        guestsDiff: parseNumberCell(row.getCell(8).value),
        source
      };

      if (isTotal) {
        totalRow = parsedRow;
      } else {
        weekdayRows.push(parsedRow);
      }
    } catch (error) {
      warnings.push(rowWarning(rowNumber, error));
    }
  }

  if (!weekdayRows.length) {
    throw new Error("No weekday booking rows could be detected in this Caspeco file.");
  }

  return buildImportResult("weekday", [], weekdayRows, totalRow, warnings);
}

function buildImportResult(
  fileType: CaspecoFileType,
  dailyRows: CaspecoDailyRow[],
  weekdayRows: CaspecoWeekdayRow[],
  totalRow: CaspecoDailyRow | CaspecoWeekdayRow | undefined,
  warnings: string[]
): CaspecoImportResult {
  const metricRows = fileType === "daily" ? dailyRows : weekdayRows;

  return {
    fileType,
    summary: {
      rowsDetected: metricRows.length,
      rowsImported: 0,
      totalGuestsCurrentYear: sum(metricRows, "guestsCurrentYear"),
      totalGuestsPreviousYear: sum(metricRows, "guestsPreviousYear"),
      totalBookingsCurrentYear: sum(metricRows, "bookingsCurrentYear"),
      totalBookingsPreviousYear: sum(metricRows, "bookingsPreviousYear"),
      detectedFileType: fileType
    },
    dailyRows,
    weekdayRows,
    totalRow,
    warnings
  };
}

function detectCaspecoFileType(worksheet: ExcelJS.Worksheet): CaspecoFileType {
  const firstRowsText = collectWorksheetText(worksheet, 12);

  if (!firstRowsText.includes("bokningar per dag")) {
    throw new Error(
      "This does not look like a Caspeco booking export. Expected title text including BOKNINGAR PER DAG."
    );
  }

  if (firstRowsText.includes("veckodag")) {
    return "weekday";
  }

  if (firstRowsText.includes("datum")) {
    return "daily";
  }

  throw new Error(
    "Could not detect Caspeco export type. Expected the title to include DATUM or VECKODAG."
  );
}

function findHeaderRowNumber(worksheet: ExcelJS.Worksheet): number | null {
  const maxRows = Math.min(worksheet.rowCount, 25);

  for (let rowNumber = 1; rowNumber <= maxRows; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const firstCell = normalizeText(valueToString(row.getCell(1).value));
    const secondCell = normalizeText(valueToString(row.getCell(2).value));

    if (firstCell.includes("bokningsenhet") && secondCell.includes("period")) {
      return rowNumber;
    }
  }

  return null;
}

function collectWorksheetText(worksheet: ExcelJS.Worksheet, maxRows: number): string {
  const chunks: string[] = [];

  for (let rowNumber = 1; rowNumber <= Math.min(worksheet.rowCount, maxRows); rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    row.eachCell((cell) => {
      const value = valueToString(cell.value);
      if (value) {
        chunks.push(value);
      }
    });
  }

  return normalizeText(chunks.join(" "));
}

function isBlankDataRow(row: ExcelJS.Row): boolean {
  for (let column = 1; column <= 8; column += 1) {
    if (valueToString(row.getCell(column).value)) {
      return false;
    }
  }
  return true;
}

function isTotalValue(value: string): boolean {
  const normalized = normalizeText(value);
  return normalized === "total" || normalized === "totalt" || normalized.includes("total");
}

function parseDateCell(value: CellValue): string {
  const unwrapped = unwrapCellValue(value);

  if (unwrapped instanceof Date) {
    return formatDate(unwrapped);
  }

  if (typeof unwrapped === "number") {
    return formatDate(excelSerialDateToDate(unwrapped));
  }

  const text = valueToString(unwrapped);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  throw new Error(`Invalid date value "${text || "blank"}". Expected YYYY-MM-DD or Excel date.`);
}

function parseWeekdayCell(value: CellValue): number {
  const unwrapped = unwrapCellValue(value);

  if (typeof unwrapped === "number") {
    if (unwrapped >= 1 && unwrapped <= 6) {
      return unwrapped;
    }
    if (unwrapped === 7 || unwrapped === 0) {
      return 0;
    }
  }

  const text = normalizeText(valueToString(unwrapped)).replace(/\.$/, "");
  const weekday = WEEKDAY_BY_NORMALIZED_NAME[text];

  if (weekday === undefined) {
    throw new Error(`Invalid weekday value "${valueToString(unwrapped) || "blank"}".`);
  }

  return weekday;
}

function parseNumberCell(value: CellValue): number {
  const unwrapped = unwrapCellValue(value);

  if (unwrapped === null || unwrapped === undefined || unwrapped === "") {
    return 0;
  }

  if (typeof unwrapped === "number") {
    return Math.trunc(unwrapped);
  }

  const text = valueToString(unwrapped)
    .replace(/\s/g, "")
    .replace(/\u00a0/g, "")
    .replace(",", ".");

  if (!text) {
    return 0;
  }

  const number = Number(text);
  return Number.isNaN(number) ? 0 : Math.trunc(number);
}

function valueToString(value: unknown): string {
  const unwrapped = unwrapCellValue(value);

  if (unwrapped === null || unwrapped === undefined) {
    return "";
  }

  if (unwrapped instanceof Date) {
    return formatDate(unwrapped);
  }

  return String(unwrapped).trim();
}

function unwrapCellValue(value: unknown): unknown {
  if (value && typeof value === "object") {
    if ("result" in value) {
      return unwrapCellValue((value as { result?: unknown }).result);
    }
    if ("text" in value) {
      return (value as { text?: unknown }).text;
    }
    if ("richText" in value) {
      return (value as { richText?: Array<{ text?: string }> }).richText
        ?.map((part) => part.text ?? "")
        .join("");
    }
  }

  return value;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function excelSerialDateToDate(serial: number): Date {
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400;
  return new Date(utcValue * 1000);
}

function formatDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sum(
  rows: Array<CaspecoDailyRow | CaspecoWeekdayRow>,
  key:
    | "guestsCurrentYear"
    | "guestsPreviousYear"
    | "bookingsCurrentYear"
    | "bookingsPreviousYear"
): number {
  return rows.reduce((total, row) => total + row[key], 0);
}

function rowWarning(rowNumber: number, error: unknown): string {
  return `Row ${rowNumber}: ${error instanceof Error ? error.message : "Could not parse row."}`;
}

function toArrayBuffer(input: Buffer | ArrayBuffer): ArrayBuffer {
  if (input instanceof ArrayBuffer) {
    return input;
  }

  const copy = new Uint8Array(input.byteLength);
  copy.set(input);
  return copy.buffer;
}
