const DATETIME_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const convertDateStringToDateForOracle = (value: any): any => {
  if (typeof value !== "string") {
    return value;
  }

  if (DATETIME_REGEX.test(value)) {
    return new Date(value.replace(" ", "T") + "Z");
  }

  if (DATE_ONLY_REGEX.test(value)) {
    return new Date(value + "T00:00:00Z");
  }

  return value;
};

/**
 * Converts Oracle Lob objects to strings/buffers
 * Oracle returns CLOB/BLOB as Lob stream objects that need to be read
 * CLOB type = 2017, BLOB type = 2019
 */
const convertOracleLobToValue = async (lob: any): Promise<string | Buffer> => {
  return new Promise((resolve, reject) => {
    const isClob = lob.type === 2017;
    if (isClob) {
      let data = "";
      lob.setEncoding("utf8");
      lob.on("data", (chunk: string) => {
        data += chunk;
      });
      lob.on("end", () => resolve(data));
      lob.on("error", reject);
    } else {
      const chunks: Buffer[] = [];
      lob.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });
      lob.on("end", () => resolve(Buffer.concat(chunks)));
      lob.on("error", reject);
    }
  });
};

/**
 * Process Oracle row to convert any Lob objects to their string/buffer values
 */
export const processOracleRow = async (
  row: Record<string, any>,
): Promise<Record<string, any>> => {
  const processedRow: Record<string, any> = {};
  for (const key in row) {
    const value = row[key];
    if (
      value &&
      typeof value === "object" &&
      value.constructor?.name === "Lob"
    ) {
      processedRow[key] = await convertOracleLobToValue(value);
    } else {
      processedRow[key] = value;
    }
  }
  return processedRow;
};
