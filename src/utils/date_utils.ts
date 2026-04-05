import { HysteriaError } from "../errors/hysteria_error";

export type DateFormat = "ISO" | "TIMESTAMP" | "DATE_ONLY" | "TIME_ONLY";
export type Timezone = "UTC" | "LOCAL";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatLocal(date: Date, format: DateFormat): string {
  const Y = date.getFullYear();
  const M = pad(date.getMonth() + 1);
  const D = pad(date.getDate());
  const h = pad(date.getHours());
  const m = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  switch (format) {
    case "ISO":
      return `${Y}-${M}-${D} ${h}:${m}:${s}`;
    case "DATE_ONLY":
      return `${Y}-${M}-${D}`;
    case "TIME_ONLY":
      return `${h}:${m}:${s}`;
    case "TIMESTAMP":
      return Math.floor(date.getTime() / 1000).toString();
  }
}

function formatUTC(date: Date, format: DateFormat): string {
  const Y = date.getUTCFullYear();
  const M = pad(date.getUTCMonth() + 1);
  const D = pad(date.getUTCDate());
  const h = pad(date.getUTCHours());
  const m = pad(date.getUTCMinutes());
  const s = pad(date.getUTCSeconds());
  switch (format) {
    case "ISO":
      return `${Y}-${M}-${D} ${h}:${m}:${s}`;
    case "DATE_ONLY":
      return `${Y}-${M}-${D}`;
    case "TIME_ONLY":
      return `${h}:${m}:${s}`;
    case "TIMESTAMP":
      return Math.floor(date.getTime() / 1000).toString();
  }
}

export const getDate = (
  date: Date,
  format: DateFormat = "ISO",
  timezone: Timezone = "UTC",
): string => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error("Invalid date provided");
  }

  return timezone === "LOCAL"
    ? formatLocal(date, format)
    : formatUTC(date, format);
};

export const parseDate = (value: string | Date | null): Date | null => {
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
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) {
      throw new HysteriaError("DateUtils::parseDate", "INVALID_DATE_STRING");
    }

    return parsed;
  } catch (error) {
    throw new HysteriaError(
      "DateUtils::parseDate",
      "FAILED_TO_PARSE_DATE",
      error as Error,
    );
  }
};

export const baseSoftDeleteDate = (date: Date = new Date()): string => {
  return formatUTC(date, "ISO");
};
