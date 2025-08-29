export type SupportedSqlDialect =
  | "postgres"
  | "cockroachdb"
  | "mysql"
  | "mariadb"
  | "sqlite";

function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function stripLengthSuffix(value: string): string {
  return value.replace(/\s*\([^)]*\)/g, "").trim();
}

export function normalizeColumnType(
  dialect: SupportedSqlDialect,
  rawType: string,
): string {
  const lowered = compactWhitespace(rawType.toLowerCase());
  const base = stripLengthSuffix(lowered);

  switch (dialect) {
    case "sqlite": {
      const rules: Array<{ test: (s: string) => boolean; normalized: string }> =
        [
          { test: (s) => s.includes("int"), normalized: "integer" },
          { test: (s) => s.includes("char"), normalized: "varchar" },
          { test: (s) => s.includes("text"), normalized: "text" },
          { test: (s) => s.includes("clob"), normalized: "text" },
          { test: (s) => s.includes("date"), normalized: "text" },
          { test: (s) => s.includes("time"), normalized: "text" },
          { test: (s) => s.includes("timestamp"), normalized: "text" },
          { test: (s) => s.includes("datetime"), normalized: "text" },
          { test: (s) => s.includes("blob"), normalized: "blob" },
          {
            test: (s) =>
              s.includes("real") || s.includes("floa") || s.includes("doub"),
            normalized: "real",
          },
          { test: (s) => s.includes("numeric"), normalized: "numeric" },
          { test: (s) => s.includes("bool"), normalized: "integer" },
          { test: (s) => s.includes("uuid"), normalized: "varchar" },
          { test: (s) => s.includes("ulid"), normalized: "varchar" },
          { test: (s) => s.includes("jsonb"), normalized: "text" },
          { test: (s) => s.includes("json"), normalized: "text" },
        ];

      for (const rule of rules) {
        if (rule.test(base)) {
          return rule.normalized;
        }
      }

      return base;
    }

    case "mysql":
    case "mariadb": {
      if (base.endsWith("text") || base === "text") return "text";
      switch (base) {
        case "int":
        case "integer":
          return "integer";
        case "tinyint":
          return "tinyint";
        case "smallint":
          return "smallint";
        case "mediumint":
          return "mediumint";
        case "bigint":
          return "bigint";
        case "float":
          return "float";
        case "double":
        case "double precision":
          return "double";
        case "real":
          return "double";
        case "decimal":
        case "numeric":
          return "numeric";
        case "varchar":
        case "character varying":
          return "varchar";
        case "char":
        case "character":
          return "char";
        case "uuid":
          return "varchar";
        case "ulid":
          return "varchar";
        case "date":
          return "date";
        case "datetime":
          return "datetime";
        case "timestamp":
          return "timestamp";
        case "time":
          return "time";
        case "year":
          return "year";
        case "jsonb":
          return "json";
        case "json":
          return "json";
        case "enum":
          return "enum";
        case "binary":
          return "binary";
        case "varbinary":
          return "varbinary";
        case "tinyblob":
          return "tinyblob";
        case "mediumblob":
          return "mediumblob";
        case "longblob":
          return "longblob";
        case "blob":
          return "blob";
        case "boolean":
        case "bool":
          return "boolean";
        default:
          return base;
      }
    }

    case "postgres":
    case "cockroachdb": {
      if (base.endsWith("text") || base === "text") return "text";
      if (base.startsWith("timestamp")) return "timestamp";
      if (base.startsWith("time")) return "time";
      if (base === "datetime") return "timestamp";
      switch (base) {
        case "character varying":
          return "varchar";
        case "character":
          return "char";
        case "ulid":
          return "varchar";
        case "double precision":
          return "double";
        case "real":
          return "real";
        case "float":
          return "real";
        case "integer":
        case "int4":
        case "int":
          return "integer";
        case "mediumint":
          return "integer";
        case "bigint":
        case "int8":
          return "bigint";
        case "smallint":
        case "int2":
          return "smallint";
        case "tinyint":
          return "smallint";
        case "uuid":
          return "uuid";
        case "year":
          return "smallint";
        case "bytea":
          return "bytea";
        case "binary":
        case "varbinary":
        case "blob":
        case "tinyblob":
        case "mediumblob":
        case "longblob":
          return "bytea";
        case "boolean":
        case "bool":
          return "boolean";
        case "numeric":
        case "decimal":
          return "numeric";
        case "jsonb":
          return "jsonb";
        case "json":
          return "json";
        case "date":
          return "date";
        default:
          return base;
      }
    }

    default:
      return base;
  }
}
