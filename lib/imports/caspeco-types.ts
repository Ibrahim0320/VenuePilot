export type CaspecoFileType = "daily" | "weekday";

export type CaspecoImportSummary = {
  rowsDetected: number;
  rowsImported: number;
  totalGuestsCurrentYear: number;
  totalGuestsPreviousYear: number;
  totalBookingsCurrentYear: number;
  totalBookingsPreviousYear: number;
  detectedFileType: CaspecoFileType;
};

export type CaspecoDailyRow = {
  bookingUnit: string;
  date: string;
  guestsCurrentYear: number;
  guestsPreviousYear: number;
  guestsDiff: number;
  bookingsCurrentYear: number;
  bookingsPreviousYear: number;
  bookingsDiff: number;
  source: string;
};

export type CaspecoWeekdayRow = {
  bookingUnit: string;
  weekday: number;
  weekdayName: string;
  bookingsCurrentYear: number;
  bookingsPreviousYear: number;
  bookingsDiff: number;
  guestsCurrentYear: number;
  guestsPreviousYear: number;
  guestsDiff: number;
  source: string;
};

export type CaspecoImportResult = {
  fileType: CaspecoFileType;
  summary: CaspecoImportSummary;
  dailyRows: CaspecoDailyRow[];
  weekdayRows: CaspecoWeekdayRow[];
  totalRow?: CaspecoDailyRow | CaspecoWeekdayRow;
  warnings: string[];
};
