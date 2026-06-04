export type SupportedSqlDialect =
  | "oracledb"
  | "postgres"
  | "cockroachdb"
  | "mysql"
  | "mariadb"
  | "sqlite"
  | "mssql";

function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function stripLengthSuffix(value: string): string {
  return value.replace(/\s*\([^)]*\)/g, "").trim();
}

/**
 * Detect the `unsigned` and `zerofill` modifiers (MySQL/MariaDB) and
 * return them along with the bare base type with the modifier tokens
 * stripped out. The returned `modifiers` array preserves the order
 * in which the modifiers appeared in the input.
 */
function detectModifier(base: string): {
  bareBase: string;
  modifiers: string[];
} {
  const tokens = base.split(/\s+/).filter((t) => t.length > 0);
  const modifiers: string[] = [];
  const kept: string[] = [];
  for (const token of tokens) {
    if (token === "unsigned" || token === "zerofill") {
      modifiers.push(token);
    } else {
      kept.push(token);
    }
  }
  return { bareBase: kept.join(" "), modifiers };
}

function appendModifier(base: string, modifiers: string[]): string {
  if (modifiers.length === 0) return base;
  return `${base} ${modifiers.join(" ")}`;
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
          { test: (s) => s === "increment", normalized: "integer" },
          { test: (s) => s === "bigincrement", normalized: "integer" },
          { test: (s) => s.includes("int"), normalized: "integer" },
          { test: (s) => s === "string", normalized: "varchar" },
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
      const { bareBase, modifiers } = detectModifier(base);
      const numericTypes = new Set<string>([
        "int",
        "integer",
        "increment",
        "tinyint",
        "smallint",
        "mediumint",
        "bigint",
        "bigincrement",
        "float",
        "double",
        "double precision",
        "real",
        "decimal",
        "numeric",
        "year",
        "bool",
        "boolean",
      ]);
      const isNumeric = numericTypes.has(bareBase);

      if (bareBase.endsWith("text") || bareBase === "text") {
        // `text` and its variants are non-numeric: drop any modifier.
        return "text";
      }
      let normalized: string;
      switch (bareBase) {
        case "int":
        case "integer":
        case "increment":
          normalized = "integer";
          break;
        case "tinyint":
          normalized = "boolean";
          break;
        case "smallint":
          normalized = "smallint";
          break;
        case "mediumint":
          normalized = "mediumint";
          break;
        case "bigint":
        case "bigincrement":
          normalized = "bigint";
          break;
        case "float":
          normalized = "float";
          break;
        case "double":
        case "double precision":
          normalized = "double";
          break;
        case "real":
          normalized = "double";
          break;
        case "decimal":
        case "numeric":
          normalized = "numeric";
          break;
        case "string":
        case "varchar":
        case "character varying":
          normalized = "varchar";
          break;
        case "char":
        case "character":
          normalized = "char";
          break;
        case "uuid":
          normalized = "varchar";
          break;
        case "ulid":
          normalized = "varchar";
          break;
        case "date":
          normalized = "date";
          break;
        case "datetime":
          normalized = "datetime";
          break;
        case "timestamp":
          normalized = "timestamp";
          break;
        case "time":
          normalized = "time";
          break;
        case "year":
          normalized = "year";
          break;
        case "jsonb":
          normalized = "json";
          break;
        case "json":
          normalized = "json";
          break;
        case "enum":
          normalized = "enum";
          break;
        case "binary":
          normalized = "binary";
          break;
        case "varbinary":
          normalized = "varbinary";
          break;
        case "tinyblob":
          normalized = "tinyblob";
          break;
        case "mediumblob":
          normalized = "mediumblob";
          break;
        case "longblob":
          normalized = "longblob";
          break;
        case "blob":
          normalized = "blob";
          break;
        case "boolean":
        case "bool":
          normalized = "boolean";
          break;
        default:
          normalized = bareBase;
          break;
      }

      // Preserve the `unsigned` / `zerofill` modifier only on numeric
      // types; on non-numeric types the modifier is irrelevant and is
      // silently dropped.
      if (isNumeric && modifiers.length > 0) {
        return appendModifier(normalized, modifiers);
      }
      return normalized;
    }

    case "postgres":
    case "cockroachdb": {
      if (base.endsWith("text") || base === "text") return "text";
      if (base.startsWith("timestamp")) return "timestamp";
      if (base.startsWith("time")) return "time";
      if (base === "datetime") return "timestamp";
      switch (base) {
        case "string":
        case "varchar":
        case "character varying":
          return "varchar";
        case "char":
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
        case "increment":
        case "serial":
          return "integer";
        case "mediumint":
          return "integer";
        case "bigint":
        case "int8":
        case "bigincrement":
        case "bigserial":
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

    case "mssql": {
      if (base.endsWith("text") || base === "text" || base === "ntext")
        return "text";
      if (base.startsWith("datetime2")) return "datetime2";
      if (base.startsWith("datetimeoffset")) return "datetimeoffset";
      switch (base) {
        case "int":
        case "integer":
        case "increment":
          return "int";
        case "tinyint":
          return "tinyint";
        case "smallint":
          return "smallint";
        case "bigint":
        case "bigincrement":
          return "bigint";
        case "float":
          return "float";
        case "real":
          return "real";
        case "double":
        case "double precision":
          return "float";
        case "decimal":
        case "numeric":
          return "decimal";
        case "money":
          return "money";
        case "smallmoney":
          return "smallmoney";
        case "string":
        case "varchar":
        case "character varying":
          return "varchar";
        case "nvarchar":
          return "nvarchar";
        case "char":
        case "character":
          return "char";
        case "nchar":
          return "nchar";
        case "uuid":
        case "uniqueidentifier":
          return "uniqueidentifier";
        case "ulid":
          return "varchar";
        case "date":
          return "date";
        case "datetime":
          return "datetime";
        case "smalldatetime":
          return "smalldatetime";
        case "time":
          return "time";
        case "timestamp":
          return "datetime2";
        case "binary":
          return "binary";
        case "varbinary":
        case "blob":
        case "tinyblob":
        case "mediumblob":
        case "longblob":
        case "bytea":
          return "varbinary";
        case "image":
          return "image";
        case "bit":
        case "boolean":
        case "bool":
          return "bit";
        case "json":
        case "jsonb":
          return "nvarchar";
        case "xml":
          return "xml";
        case "sql_variant":
          return "sql_variant";
        default:
          return base;
      }
    }

    case "oracledb": {
      // Oracle data types normalization
      if (base.endsWith("clob") || base === "clob" || base === "nclob")
        return "clob";
      if (base.startsWith("timestamp")) return "timestamp";
      if (base.startsWith("interval")) return "interval";
      switch (base) {
        case "string":
        case "varchar":
        case "varchar2":
        case "nvarchar2":
        case "character varying":
          return "varchar2";
        case "char":
        case "nchar":
        case "character":
          return "char";
        case "number":
        case "numeric":
        case "decimal":
        case "integer":
        case "int":
        case "smallint":
        case "tinyint":
        case "mediumint":
        case "bigint":
          return "number";
        case "binary_float":
        case "float":
        case "real":
          return "binary_float";
        case "binary_double":
        case "double":
        case "double precision":
          return "binary_double";
        case "date":
          return "date";
        case "blob":
        case "raw":
        case "long raw":
        case "bytea":
        case "binary":
        case "varbinary":
          return "blob";
        case "json":
        case "jsonb":
          return "clob";
        case "boolean":
        case "bool":
          return "number";
        case "uuid":
        case "ulid":
          return "varchar2";
        default:
          return base;
      }
    }
    default:
      return base;
  }
}
