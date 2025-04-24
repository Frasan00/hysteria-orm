import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";

dayjs.extend(utc);
dayjs.extend(timezone);

export type DateFormat = "ISO" | "TIMESTAMP";
export type Timezone = "UTC" | "LOCAL";

export const baseSoftDeleteDate = (date: Date = new Date()): string => {
  const pad = (n: number) => n.toString().padStart(2, "0");

  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export const getDate = (
  date: Date,
  format: DateFormat = "ISO",
  timezone: Timezone = "UTC",
): string => {
  const d = dayjs(date);

  if (timezone === "LOCAL") {
    const localDate = d.local();
    if (format === "ISO") {
      return localDate.format("YYYY-MM-DD HH:mm:ss");
    }
    return localDate.unix().toString();
  }

  if (format === "ISO") {
    return d.utc().format("YYYY-MM-DD HH:mm:ss");
  }

  return d.utc().unix().toString();
};

export const parseDate = (value: string | Date | null): Date | null => {
  if (value === null) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  const parsed = dayjs(value);
  return parsed.toDate();
};
