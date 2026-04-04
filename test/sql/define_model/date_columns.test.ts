import {
  defineModel,
  col,
} from "../../../src/sql/models/define_model";
import { DateTime } from "luxon";

/**
 * Tests for the refactored date column API:
 * - col.datetime()         → typed as Date
 * - col.datetime.string()  → typed as string (untouched)
 * - autoCreate / autoUpdate hooks
 * - Timezone support (UTC, specific timezones)
 * Same patterns apply to col.date, col.timestamp, col.time
 */
describe("date columns – refactored API", () => {
  // -------------------------------------------------------------------------
  // Column registration
  // -------------------------------------------------------------------------

  describe("column registration", () => {
    test("col.datetime() registers as datetime with internal serialize/prepare", () => {
      const M = defineModel("dt_test", {
        columns: {
          id: col.increment(),
          createdAt: col.datetime(),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "createdAt")!;
      expect(c).toBeDefined();
      expect(c.type).toBe("datetime");
      expect(c.serialize).toBeDefined();
      expect(c.prepare).toBeDefined();
    });

    test("col.datetime.string() registers as datetime with internal serialize/prepare", () => {
      const M = defineModel("dt_str_test", {
        columns: {
          id: col.increment(),
          createdAt: col.datetime.string(),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "createdAt")!;
      expect(c).toBeDefined();
      expect(c.type).toBe("datetime");
      expect(c.serialize).toBeDefined();
      expect(c.prepare).toBeDefined();
    });

    test("col.date() registers as date column", () => {
      const M = defineModel("d_test", {
        columns: {
          id: col.increment(),
          birthDate: col.date(),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "birthDate")!;
      expect(c).toBeDefined();
      expect(c.type).toBe("date");
      expect(c.serialize).toBeDefined();
      expect(c.prepare).toBeDefined();
    });

    test("col.date.string() registers as date column", () => {
      const M = defineModel("d_str_test", {
        columns: {
          id: col.increment(),
          birthDate: col.date.string(),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "birthDate")!;
      expect(c).toBeDefined();
      expect(c.type).toBe("date");
      expect(c.serialize).toBeDefined();
      expect(c.prepare).toBeDefined();
    });

    test("col.timestamp() registers as timestamp column", () => {
      const M = defineModel("ts_test", {
        columns: {
          id: col.increment(),
          lastSeen: col.timestamp(),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "lastSeen")!;
      expect(c).toBeDefined();
      expect(c.type).toBe("timestamp");
      expect(c.serialize).toBeDefined();
      expect(c.prepare).toBeDefined();
    });

    test("col.timestamp.string() registers as timestamp column", () => {
      const M = defineModel("ts_str_test", {
        columns: {
          id: col.increment(),
          lastSeen: col.timestamp.string(),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "lastSeen")!;
      expect(c).toBeDefined();
      expect(c.type).toBe("timestamp");
      expect(c.serialize).toBeDefined();
      expect(c.prepare).toBeDefined();
    });

    test("col.time() registers as time column", () => {
      const M = defineModel("time_test", {
        columns: {
          id: col.increment(),
          loginTime: col.time(),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "loginTime")!;
      expect(c).toBeDefined();
      expect(c.type).toBe("time");
      expect(c.serialize).toBeDefined();
      expect(c.prepare).toBeDefined();
    });

    test("col.time.string() registers as time column", () => {
      const M = defineModel("time_str_test", {
        columns: {
          id: col.increment(),
          loginTime: col.time.string(),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "loginTime")!;
      expect(c).toBeDefined();
      expect(c.type).toBe("time");
      expect(c.serialize).toBeDefined();
      expect(c.prepare).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // Date mode – prepare / serialize behaviour
  // -------------------------------------------------------------------------

  describe("date mode – prepare returns Date, serialize returns Date", () => {
    test("col.datetime() prepare passes Date as-is", () => {
      const M = defineModel("dt_prep", {
        columns: {
          id: col.increment(),
          ts: col.datetime(),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "ts")!;
      const now = new Date("2025-06-15T12:30:00Z");
      const result = c.prepare!(now);
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(now.getTime());
    });

    test("col.datetime() serialize converts string to Date", () => {
      const M = defineModel("dt_ser", {
        columns: {
          id: col.increment(),
          ts: col.datetime(),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "ts")!;
      const result = c.serialize!("2025-06-15T12:30:00Z");
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe("2025-06-15T12:30:00.000Z");
    });

    test("col.datetime() serialize passes Date through as-is", () => {
      const M = defineModel("dt_ser_date", {
        columns: {
          id: col.increment(),
          ts: col.datetime(),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "ts")!;
      const now = new Date("2025-06-15T12:30:00Z");
      const result = c.serialize!(now);
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(now.getTime());
    });

    test("col.datetime() serialize returns null for null", () => {
      const M = defineModel("dt_ser_null", {
        columns: {
          id: col.increment(),
          ts: col.datetime(),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "ts")!;
      expect(c.serialize!(null)).toBeNull();
    });

    test("col.datetime() serialize returns undefined for undefined", () => {
      const M = defineModel("dt_ser_undef", {
        columns: {
          id: col.increment(),
          ts: col.datetime(),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "ts")!;
      expect(c.serialize!(undefined)).toBeUndefined();
    });

    test("col.date() prepare passes Date as-is", () => {
      const M = defineModel("d_prep", {
        columns: {
          id: col.increment(),
          d: col.date(),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "d")!;
      const now = new Date("2025-06-15");
      const result = c.prepare!(now);
      expect(result).toBeInstanceOf(Date);
    });

    test("col.timestamp() prepare passes Date as-is", () => {
      const M = defineModel("ts_prep", {
        columns: {
          id: col.increment(),
          ts: col.timestamp(),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "ts")!;
      const now = new Date("2025-06-15T12:30:00Z");
      const result = c.prepare!(now);
      expect(result).toBeInstanceOf(Date);
    });

    test("col.time() prepare passes Date as-is", () => {
      const M = defineModel("time_prep", {
        columns: {
          id: col.increment(),
          t: col.time(),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "t")!;
      const now = new Date();
      const result = c.prepare!(now);
      expect(result).toBeInstanceOf(Date);
    });
  });

  // -------------------------------------------------------------------------
  // String mode – prepare / serialize behaviour
  // -------------------------------------------------------------------------

  describe("string mode – prepare passes string untouched, serialize returns string", () => {
    test("col.datetime.string() prepare passes string as-is", () => {
      const M = defineModel("dt_str_prep", {
        columns: {
          id: col.increment(),
          ts: col.datetime.string(),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "ts")!;
      const str = "2025-06-15 12:30:00";
      const result = c.prepare!(str);
      expect(result).toBe(str);
    });

    test("col.datetime.string() serialize returns string for Date input", () => {
      const M = defineModel("dt_str_ser", {
        columns: {
          id: col.increment(),
          ts: col.datetime.string(),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "ts")!;
      const d = new Date("2025-06-15T12:30:00Z");
      const result = c.serialize!(d);
      expect(typeof result).toBe("string");
      expect(result).toContain("2025-06-15");
      expect(result).toContain("12:30:00");
    });

    test("col.datetime.string() serialize returns string for string input", () => {
      const M = defineModel("dt_str_ser2", {
        columns: {
          id: col.increment(),
          ts: col.datetime.string(),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "ts")!;
      const str = "2025-06-15 12:30:00";
      const result = c.serialize!(str);
      expect(result).toBe(str);
    });

    test("col.datetime.string() serialize returns null for null", () => {
      const M = defineModel("dt_str_ser_null", {
        columns: {
          id: col.increment(),
          ts: col.datetime.string(),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "ts")!;
      expect(c.serialize!(null)).toBeNull();
    });

    test("col.date.string() prepare passes string untouched", () => {
      const M = defineModel("d_str_prep", {
        columns: {
          id: col.increment(),
          d: col.date.string(),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "d")!;
      const str = "2025-06-15";
      expect(c.prepare!(str)).toBe(str);
    });

    test("col.timestamp.string() prepare passes string untouched", () => {
      const M = defineModel("ts_str_prep", {
        columns: {
          id: col.increment(),
          ts: col.timestamp.string(),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "ts")!;
      const str = "1750003800";
      expect(c.prepare!(str)).toBe(str);
    });

    test("col.time.string() prepare passes string untouched", () => {
      const M = defineModel("time_str_prep", {
        columns: {
          id: col.increment(),
          t: col.time.string(),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "t")!;
      const str = "12:30:00";
      expect(c.prepare!(str)).toBe(str);
    });
  });

  // -------------------------------------------------------------------------
  // autoCreate hooks
  // -------------------------------------------------------------------------

  describe("autoCreate hooks", () => {
    test("col.datetime({ autoCreate: true }) prepare returns Date when no value given", () => {
      const M = defineModel("dt_ac", {
        columns: {
          id: col.increment(),
          ts: col.datetime({ autoCreate: true }),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "ts")!;
      const before = Date.now();
      const result = c.prepare!(null);
      const after = Date.now();

      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeGreaterThanOrEqual(before);
      expect(result.getTime()).toBeLessThanOrEqual(after);
    });

    test("col.datetime.string({ autoCreate: true }) prepare returns formatted string when no value given", () => {
      const M = defineModel("dt_str_ac", {
        columns: {
          id: col.increment(),
          ts: col.datetime.string({ autoCreate: true }),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "ts")!;
      const result = c.prepare!(null);

      expect(typeof result).toBe("string");
      // format: YYYY-MM-DD HH:mm:ss
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    test("col.date({ autoCreate: true }) prepare returns Date when no value given", () => {
      const M = defineModel("d_ac", {
        columns: {
          id: col.increment(),
          d: col.date({ autoCreate: true }),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "d")!;
      const result = c.prepare!(null);
      expect(result).toBeInstanceOf(Date);
    });

    test("col.date.string({ autoCreate: true }) prepare returns date string", () => {
      const M = defineModel("d_str_ac", {
        columns: {
          id: col.increment(),
          d: col.date.string({ autoCreate: true }),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "d")!;
      const result = c.prepare!(null);
      expect(typeof result).toBe("string");
      // format: YYYY-MM-DD
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test("col.timestamp({ autoCreate: true }) prepare returns Date when no value given", () => {
      const M = defineModel("ts_ac", {
        columns: {
          id: col.increment(),
          ts: col.timestamp({ autoCreate: true }),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "ts")!;
      const result = c.prepare!(null);
      expect(result).toBeInstanceOf(Date);
    });

    test("col.timestamp.string({ autoCreate: true }) prepare returns unix timestamp string", () => {
      const M = defineModel("ts_str_ac", {
        columns: {
          id: col.increment(),
          ts: col.timestamp.string({ autoCreate: true }),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "ts")!;
      const before = Math.floor(Date.now() / 1000);
      const result = c.prepare!(null);
      const after = Math.floor(Date.now() / 1000);

      expect(typeof result).toBe("string");
      const val = parseInt(result, 10);
      expect(val).toBeGreaterThanOrEqual(before);
      expect(val).toBeLessThanOrEqual(after);
    });

    test("col.time({ autoCreate: true }) prepare returns Date when no value given", () => {
      const M = defineModel("time_ac", {
        columns: {
          id: col.increment(),
          t: col.time({ autoCreate: true }),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "t")!;
      const result = c.prepare!(null);
      expect(result).toBeInstanceOf(Date);
    });

    test("col.time.string({ autoCreate: true }) prepare returns time string", () => {
      const M = defineModel("time_str_ac", {
        columns: {
          id: col.increment(),
          t: col.time.string({ autoCreate: true }),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "t")!;
      const result = c.prepare!(null);
      expect(typeof result).toBe("string");
      // format: HH:mm:ss
      expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    test("autoCreate does NOT override user-supplied value (Date mode)", () => {
      const M = defineModel("dt_ac_no_override", {
        columns: {
          id: col.increment(),
          ts: col.datetime({ autoCreate: true }),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "ts")!;
      const userDate = new Date("2020-01-01T00:00:00Z");
      const result = c.prepare!(userDate);
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(userDate.getTime());
    });

    test("autoCreate does NOT override user-supplied value (String mode)", () => {
      const M = defineModel("dt_str_ac_no_override", {
        columns: {
          id: col.increment(),
          ts: col.datetime.string({ autoCreate: true }),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "ts")!;
      const userStr = "2020-01-01 00:00:00";
      const result = c.prepare!(userStr);
      expect(result).toBe(userStr);
    });
  });

  // -------------------------------------------------------------------------
  // autoUpdate hooks
  // -------------------------------------------------------------------------

  describe("autoUpdate hooks", () => {
    test("col.datetime({ autoCreate: true, autoUpdate: true }) prepare overrides value on update", () => {
      const M = defineModel("dt_au", {
        columns: {
          id: col.increment(),
          ts: col.datetime({ autoCreate: true, autoUpdate: true }),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "ts")!;
      expect(c.autoUpdate).toBe(true);

      // When value is supplied, autoUpdate replaces it with current date
      const oldDate = new Date("2020-01-01T00:00:00Z");
      const before = Date.now();
      const result = c.prepare!(oldDate);
      const after = Date.now();

      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeGreaterThanOrEqual(before);
      expect(result.getTime()).toBeLessThanOrEqual(after);
    });

    test("col.datetime.string({ autoCreate: true, autoUpdate: true }) prepare overrides value with string on update", () => {
      const M = defineModel("dt_str_au", {
        columns: {
          id: col.increment(),
          ts: col.datetime.string({ autoCreate: true, autoUpdate: true }),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "ts")!;
      expect(c.autoUpdate).toBe(true);

      const result = c.prepare!("2020-01-01 00:00:00");
      expect(typeof result).toBe("string");
      // Should be a current-date string, not the old one
      expect(result).not.toBe("2020-01-01 00:00:00");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    test("col.date({ autoCreate: true, autoUpdate: true }) autoUpdate flag is set", () => {
      const M = defineModel("d_au", {
        columns: {
          id: col.increment(),
          d: col.date({ autoCreate: true, autoUpdate: true }),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "d")!;
      expect(c.autoUpdate).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Timezone support using luxon
  // -------------------------------------------------------------------------

  describe("timezone support", () => {
    test("UTC autoCreate string produces UTC formatted date", () => {
      const M = defineModel("dt_utc", {
        columns: {
          id: col.increment(),
          ts: col.datetime.string({ autoCreate: true, timezone: "UTC" }),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "ts")!;
      const result = c.prepare!(null) as string;

      // Parse with luxon and verify it's close to now in UTC
      const now = DateTime.utc();
      const parsed = DateTime.fromSQL(result, { zone: "utc" });
      expect(parsed.isValid).toBe(true);
      // Within 2 seconds of current UTC time
      expect(Math.abs(parsed.toMillis() - now.toMillis())).toBeLessThan(2000);
    });

    test("LOCAL autoCreate string produces local formatted date", () => {
      const M = defineModel("dt_local", {
        columns: {
          id: col.increment(),
          ts: col.datetime.string({ autoCreate: true, timezone: "LOCAL" }),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "ts")!;
      const result = c.prepare!(null) as string;

      // Should be a valid SQL datetime string
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);

      // Parse as local time
      const parsed = DateTime.fromSQL(result);
      expect(parsed.isValid).toBe(true);
      const now = DateTime.local();
      expect(Math.abs(parsed.toMillis() - now.toMillis())).toBeLessThan(2000);
    });

    test("date mode autoCreate in UTC produces a Date close to current UTC time", () => {
      const M = defineModel("dt_date_utc", {
        columns: {
          id: col.increment(),
          ts: col.datetime({ autoCreate: true, timezone: "UTC" }),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "ts")!;
      const before = Date.now();
      const result = c.prepare!(null) as Date;
      const after = Date.now();

      expect(result).toBeInstanceOf(Date);
      // Date objects always hold UTC internally
      const utcNow = DateTime.utc();
      const resultDt = DateTime.fromJSDate(result, { zone: "utc" });
      expect(Math.abs(resultDt.toMillis() - utcNow.toMillis())).toBeLessThan(
        2000,
      );
    });

    test("serialization in date mode converts string from DB to Date", () => {
      const M = defineModel("dt_ser_tz", {
        columns: {
          id: col.increment(),
          ts: col.datetime(),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "ts")!;
      // Simulate DB returning a string
      const dbValue = "2025-06-15T12:30:00.000Z";
      const result = c.serialize!(dbValue);
      expect(result).toBeInstanceOf(Date);
      const dt = DateTime.fromJSDate(result, { zone: "utc" });
      expect(dt.year).toBe(2025);
      expect(dt.month).toBe(6);
      expect(dt.day).toBe(15);
      expect(dt.hour).toBe(12);
      expect(dt.minute).toBe(30);
    });

    test("serialization in string mode for UTC converts Date to UTC string", () => {
      const M = defineModel("dt_str_ser_utc", {
        columns: {
          id: col.increment(),
          ts: col.datetime.string({ timezone: "UTC" }),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "ts")!;
      // Simulate DB returning a Date object
      const dbDate = new Date("2025-06-15T12:30:00Z");
      const result = c.serialize!(dbDate);
      expect(typeof result).toBe("string");
      expect(result).toBe("2025-06-15 12:30:00");
    });

    test("serialization in string mode for LOCAL converts Date to local string", () => {
      const M = defineModel("dt_str_ser_local", {
        columns: {
          id: col.increment(),
          ts: col.datetime.string({ timezone: "LOCAL" }),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "ts")!;
      const dbDate = new Date("2025-06-15T12:30:00Z");
      const result = c.serialize!(dbDate);
      expect(typeof result).toBe("string");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);

      // Verify it matches local interpretation
      const expected = DateTime.fromJSDate(dbDate).toFormat(
        "yyyy-MM-dd HH:mm:ss",
      );
      expect(result).toBe(expected);
    });

    test("col.date.string() autoCreate with UTC produces UTC date", () => {
      const M = defineModel("d_str_utc", {
        columns: {
          id: col.increment(),
          d: col.date.string({ autoCreate: true, timezone: "UTC" }),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "d")!;
      const result = c.prepare!(null) as string;
      const todayUTC = DateTime.utc().toFormat("yyyy-MM-dd");
      expect(result).toBe(todayUTC);
    });

    test("col.timestamp.string() autoCreate with UTC produces unix timestamp", () => {
      const M = defineModel("ts_str_utc_ac", {
        columns: {
          id: col.increment(),
          ts: col.timestamp.string({ autoCreate: true, timezone: "UTC" }),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "ts")!;
      const before = Math.floor(Date.now() / 1000);
      const result = c.prepare!(null) as string;
      const after = Math.floor(Date.now() / 1000);

      expect(typeof result).toBe("string");
      const ts = parseInt(result, 10);
      expect(ts).toBeGreaterThanOrEqual(before);
      expect(ts).toBeLessThanOrEqual(after);
    });

    test("col.time.string() autoCreate with UTC produces UTC time", () => {
      const M = defineModel("time_str_utc", {
        columns: {
          id: col.increment(),
          t: col.time.string({ autoCreate: true, timezone: "UTC" }),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "t")!;
      const result = c.prepare!(null) as string;
      expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);

      // Should be close to current UTC time
      const nowUtc = DateTime.utc();
      const [h, m] = result.split(":").map(Number);
      expect(h).toBe(nowUtc.hour);
      // Minutes should be within 1 of each other
      expect(Math.abs(m - nowUtc.minute)).toBeLessThanOrEqual(1);
    });
  });

  // -------------------------------------------------------------------------
  // null handling
  // -------------------------------------------------------------------------

  describe("null handling", () => {
    test("prepare returns null for null when autoCreate is false", () => {
      const M = defineModel("dt_null", {
        columns: {
          id: col.increment(),
          ts: col.datetime(),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "ts")!;
      expect(c.prepare!(null)).toBeNull();
    });

    test("prepare returns null for undefined when autoCreate is false", () => {
      const M = defineModel("dt_undef", {
        columns: {
          id: col.increment(),
          ts: col.datetime(),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "ts")!;
      expect(c.prepare!(undefined)).toBeNull();
    });

    test("string mode prepare returns null for null when autoCreate is false", () => {
      const M = defineModel("dt_str_null", {
        columns: {
          id: col.increment(),
          ts: col.datetime.string(),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "ts")!;
      expect(c.prepare!(null)).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // options passthrough (withTimezone, precision, nullable)
  // -------------------------------------------------------------------------

  describe("options passthrough", () => {
    test("withTimezone option is set on datetime column", () => {
      const M = defineModel("dt_wtz", {
        columns: {
          id: col.increment(),
          ts: col.datetime({ withTimezone: true }),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "ts")!;
      expect(c.withTimezone).toBe(true);
    });

    test("withTimezone defaults to true when timezone is provided", () => {
      const M = defineModel("dt_wtz_default", {
        columns: {
          id: col.increment(),
          ts: col.datetime({ timezone: "UTC" }),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "ts")!;
      expect(c.withTimezone).toBe(true);
    });

    test("string mode respects withTimezone", () => {
      const M = defineModel("dt_str_wtz", {
        columns: {
          id: col.increment(),
          ts: col.datetime.string({ withTimezone: true }),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "ts")!;
      expect(c.withTimezone).toBe(true);
    });

    test("nullable option is passed through", () => {
      const M = defineModel("dt_nullable", {
        columns: {
          id: col.increment(),
          ts: col.datetime({ nullable: true }),
        },
      });

      const c = M.getColumns().find((c) => c.columnName === "ts")!;
      expect(c.constraints?.nullable).toBe(true);
    });
  });
});
