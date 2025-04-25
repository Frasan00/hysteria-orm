import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import { HysteriaError } from "../errors/hysteria_error";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

export type DateFormat = "ISO" | "TIMESTAMP" | "DATE_ONLY" | "TIME_ONLY";
export type Timezone = "UTC" | "LOCAL";

export const getDate = (
  date: Date,
  format: DateFormat = "ISO",
  timezone: Timezone = "UTC",
): string => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error("Invalid date provided");
  }

  const d = dayjs(date);

  if (timezone === "LOCAL") {
    const localDate = d.local();
    switch (format) {
      case "ISO":
        return localDate.format("YYYY-MM-DD HH:mm:ss");
      case "DATE_ONLY":
        return localDate.format("YYYY-MM-DD");
      case "TIME_ONLY":
        return localDate.format("HH:mm:ss");
      default:
        return localDate.unix().toString();
    }
  }

  const utcDate = d.utc();
  switch (format) {
    case "ISO":
      return utcDate.format("YYYY-MM-DD HH:mm:ss");
    case "DATE_ONLY":
      return utcDate.format("YYYY-MM-DD");
    case "TIME_ONLY":
      return utcDate.format("HH:mm:ss");
    default:
      return utcDate.unix().toString();
  }
};

export const parseDate = (
  value: string | Date | null,
  format?: string,
  timezone: Timezone = "UTC",
): Date | null => {
  if (value === null) {
    return null;
  }

  if (value instanceof Date) {
    if (isNaN(value.getTime())) {
      throw new HysteriaError("DateUtils::parseDate", "INVALID_DATE_OBJECT");
    }
    return value;
  }

  try {
    const parsed = format ? dayjs(value, format) : dayjs(value);

    if (!parsed.isValid()) {
      throw new HysteriaError("DateUtils::parseDate", "INVALID_DATE_STRING");
    }

    return timezone === "UTC" ? parsed.utc().toDate() : parsed.local().toDate();
  } catch (error: unknown) {
    throw new HysteriaError("DateUtils::parseDate", "FAILED_TO_PARSE_DATE");
  }
};

export const baseSoftDeleteDate = (date: Date = new Date()): string => {
  return dayjs(date).utc().format("YYYY-MM-DD HH:mm:ss");
};
