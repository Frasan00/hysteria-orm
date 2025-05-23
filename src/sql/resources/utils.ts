import { HysteriaError } from "../../errors/hysteria_error";

export function convertValueToSQL(value: any, type: string): string {
  switch (type) {
    case "string":
      return `'${value}'`;
    case "number":
    case "boolean":
      return `${value}`;
    default:
      throw new HysteriaError(
        "convertValueToSQL",
        `UNSUPPORTED_DATABASE_TYPE_${type}`,
      );
  }
}
