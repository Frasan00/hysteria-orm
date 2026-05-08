import type { TableSchemaInfo } from "../../sql/schema_introspection_types";
import { mapColumnType } from "./db_pull_type_map";
import { sanitizeColumnName } from "./db_pull_naming";

export interface GenerateOptions {
  naming: "camel" | "snake" | "pascal";
}

function quote(str: string): string {
  return JSON.stringify(str);
}

function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return "null";
  }
  if (typeof value === "string") {
    return quote(value);
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(formatValue).join(", ")}]`;
  }
  return String(value);
}

export function generateModelCode(
  tableName: string,
  schema: TableSchemaInfo,
  dialect: string,
  _options: GenerateOptions,
): string {
  const lines: string[] = [];

  const primaryKeyColumns = new Set(schema.primaryKey?.columns || []);

  // Build FK column map for JSDoc annotations
  const fkColumnMap = new Map<
    string,
    {
      referencedTable: string;
      referencedColumns: string[];
      onDelete?: string | null;
      onUpdate?: string | null;
    }
  >();
  for (const fk of schema.foreignKeys) {
    for (let i = 0; i < fk.columns.length; i++) {
      const col = fk.columns[i];
      const refCol = fk.referencedColumns[i];
      if (!fkColumnMap.has(col)) {
        fkColumnMap.set(col, {
          referencedTable: fk.referencedTable,
          referencedColumns: [refCol],
          onDelete: fk.onDelete,
          onUpdate: fk.onUpdate,
        });
      }
    }
  }

  lines.push(`import { col, defineModel } from "hysteria-orm";`);
  lines.push("");
  lines.push(`export const ${tableName} = defineModel(${quote(tableName)}, {`);
  lines.push("  columns: {");

  for (const column of schema.columns) {
    const sanitized = sanitizeColumnName(column.name);
    const colName = sanitized.name;
    const isPrimaryKey = primaryKeyColumns.has(column.name);
    const { method, options: colOptions } = mapColumnType(dialect, column);

    const optionParts: string[] = [];
    for (const [key, value] of Object.entries(colOptions)) {
      if (value !== undefined && value !== null) {
        optionParts.push(`${key}: ${formatValue(value)}`);
      }
    }

    const optionsStr =
      optionParts.length > 0 ? `{ ${optionParts.join(", ")} }` : "";
    const colDef = optionsStr
      ? `col.${method}(${optionsStr})`
      : `col.${method}()`;

    // Add FK JSDoc annotation if this column is a foreign key
    const fkInfo = fkColumnMap.get(column.name);
    if (fkInfo) {
      const refCols = fkInfo.referencedColumns.join(", ");
      let fkDoc = `/** @fk references ${fkInfo.referencedTable}(${refCols})`;
      if (fkInfo.onDelete) {
        fkDoc += ` — onDelete: ${fkInfo.onDelete}`;
      }
      if (fkInfo.onUpdate) {
        fkDoc += ` — onUpdate: ${fkInfo.onUpdate}`;
      }
      fkDoc += " */";
      lines.push(`    ${fkDoc}`);
    }

    if (isPrimaryKey) {
      lines.push(`    // Primary key column`);
      if (method === "integer" || method === "bigInteger") {
        lines.push(`    // TODO: may be auto-increment, verify manually`);
      }
    }
    lines.push(`    ${colName}: ${colDef},`);
  }

  lines.push("  },");

  // Generate indexes with named syntax when name is available
  const nonUniqueIndexes = schema.indexes.filter((idx) => !idx.isUnique);
  if (nonUniqueIndexes.length > 0) {
    lines.push("  indexes: [");
    for (const index of nonUniqueIndexes) {
      if (index.name) {
        lines.push(
          `    { columns: [${index.columns.map(quote).join(", ")}], name: ${quote(index.name)} },`,
        );
      } else {
        lines.push(`    [${index.columns.map(quote).join(", ")}],`);
      }
    }
    lines.push("  ],");
  }

  // Generate uniques with named syntax when name is available
  const uniqueIndexes = schema.indexes.filter((idx) => idx.isUnique);
  if (uniqueIndexes.length > 0) {
    lines.push("  uniques: [");
    for (const index of uniqueIndexes) {
      if (index.name) {
        lines.push(
          `    { columns: [${index.columns.map(quote).join(", ")}], name: ${quote(index.name)} },`,
        );
      } else {
        lines.push(`    [${index.columns.map(quote).join(", ")}],`);
      }
    }
    lines.push("  ],");
  }

  lines.push("});");
  lines.push("");
  lines.push(
    `export type ${tableName}Type = InstanceType<typeof ${tableName}>;`,
  );
  lines.push("");

  return lines.join("\n");
}

export function generateIndexTs(modelNames: string[]): string {
  const lines: string[] = [];

  for (const name of modelNames) {
    lines.push(`export * from "./${name}";`);
  }

  lines.push("");
  return lines.join("\n");
}
