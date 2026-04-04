import {
  getDefaultFkConstraintName,
  getDefaultPrimaryKeyConstraintName,
} from "../../models/decorators/model_decorators_constants";
import {
  ColumnType,
  LazyRelationType,
} from "../../models/decorators/model_decorators_types";
import { RelationEnum } from "../../models/relations/relation";
import { getColumnValue } from "../../resources/utils";
import { SqlDataSource } from "../../sql_data_source";
import type { SqlDataSourceModel } from "../../sql_data_source_types";
import {
  ExecutionPhase,
  MigrationOperation,
  OperationType,
} from "./schema_diff_types";

/**
 * Generates TypeScript code using the schema builder API from migration operations.
 * Instead of producing raw SQL, this produces readable TS code like:
 *   this.schema.createTable("users", (table) => { table.varchar("name")... })
 */
export class MigrationCodeGenerator {
  private sql: SqlDataSource;
  private models: SqlDataSourceModel[];

  constructor(sql: SqlDataSource) {
    this.sql = sql;
    this.models = Object.values(this.sql._models);
  }

  /**
   * Generates code statements for up() and down() from migration operations
   */
  generateCode(operations: MigrationOperation[]): {
    up: string[];
    down: string[];
  } {
    const upStatements: string[] = [];
    const downStatements: string[] = [];

    let currentPhase: ExecutionPhase | null = null;
    const phaseComments: Record<ExecutionPhase, string> = {
      [ExecutionPhase.STRUCTURE_CREATION]: "Structure creation",
      [ExecutionPhase.CONSTRAINT_CREATION]: "Constraints and indexes",
      [ExecutionPhase.DESTRUCTIVE_OPERATIONS]: "Destructive operations",
    };

    for (const operation of operations) {
      if (operation.phase !== currentPhase) {
        currentPhase = operation.phase;
        if (upStatements.length > 0) {
          upStatements.push("");
        }
        upStatements.push(`// ${phaseComments[currentPhase]}`);
      }

      const { up, down } = this.generateOperationCode(operation);
      if (up) {
        upStatements.push(...up);
      }
      if (down) {
        downStatements.push(...down);
      }
    }

    return { up: upStatements, down: downStatements };
  }

  private generateOperationCode(operation: MigrationOperation): {
    up: string[] | null;
    down: string[] | null;
  } {
    switch (operation.type) {
      case OperationType.CREATE_TABLE:
        return this.generateCreateTableCode(operation);
      case OperationType.ADD_COLUMN:
        return this.generateAddColumnCode(operation);
      case OperationType.MODIFY_COLUMN:
        return this.generateModifyColumnCode(operation);
      case OperationType.DROP_COLUMN:
        return this.generateDropColumnCode(operation);
      case OperationType.CREATE_INDEX:
        return this.generateCreateIndexCode(operation);
      case OperationType.DROP_INDEX:
        return this.generateDropIndexCode(operation);
      case OperationType.ADD_FOREIGN_KEY:
        return this.generateAddForeignKeyCode(operation);
      case OperationType.DROP_FOREIGN_KEY:
        return this.generateDropForeignKeyCode(operation);
      case OperationType.ADD_UNIQUE_CONSTRAINT:
        return this.generateAddUniqueCode(operation);
      case OperationType.DROP_CONSTRAINT:
        return this.generateDropConstraintCode(operation);
      case OperationType.ADD_CHECK_CONSTRAINT:
        return this.generateAddCheckCode(operation);
      case OperationType.ADD_PRIMARY_KEY:
        return this.generateAddPrimaryKeyCode(operation);
      case OperationType.DROP_TABLE:
        return this.generateDropTableCode(operation);
      case OperationType.MODIFY_PRIMARY_KEY:
        return this.generateModifyPrimaryKeyCode(operation);
      default:
        return { up: null, down: null };
    }
  }

  // ============================================
  // CREATE TABLE
  // ============================================

  private generateCreateTableCode(operation: MigrationOperation): {
    up: string[];
    down: string[];
  } {
    const table = operation.data;
    const lines: string[] = [];

    lines.push(
      `this.schema.createTable(${this.quote(table.table)}, (table) => {`,
    );

    for (const column of table.columns) {
      const columnCode = this.generateColumnCode(table.table, column, true);
      lines.push(`  ${columnCode}`);
    }

    lines.push("});");

    const down = [`this.schema.dropTable(${this.quote(table.table)});`];
    return { up: lines, down };
  }

  // ============================================
  // ADD COLUMN
  // ============================================

  private generateAddColumnCode(operation: MigrationOperation): {
    up: string[];
    down: string[];
  } {
    const { table, column } = operation.data;
    const columnCode = this.generateColumnCode(table, column, false);

    const up = [
      `this.schema.alterTable(${this.quote(table)}, (table) => {`,
      `  table.addColumn((col) => ${columnCode.replace(/^table\./, "col.")});`,
      "});",
    ];

    const down = [
      `this.schema.alterTable(${this.quote(table)}, (table) => {`,
      `  table.dropColumn(${this.quote(column.databaseName)});`,
      "});",
    ];

    return { up, down };
  }

  // ============================================
  // MODIFY COLUMN
  // ============================================

  private generateModifyColumnCode(operation: MigrationOperation): {
    up: string[];
    down: string[];
  } {
    const { table, modelColumn, dbColumns } = operation.data;
    const columnCode = this.generateColumnCodeForModify(
      table,
      modelColumn,
      dbColumns,
    );

    const up = [
      `this.schema.alterTable(${this.quote(table)}, (table) => {`,
      `  table.alterColumn((col) => ${columnCode.replace(/^table\./, "col.")});`,
      "});",
    ];

    const down = [
      `// TODO: reverse column modification for ${this.quote(dbColumns.name)} on ${this.quote(table)}`,
    ];

    return { up, down };
  }

  // ============================================
  // DROP COLUMN
  // ============================================

  private generateDropColumnCode(operation: MigrationOperation): {
    up: string[];
    down: string[];
  } {
    const { table, column } = operation.data;

    const up = [
      `this.schema.alterTable(${this.quote(table)}, (table) => {`,
      `  table.dropColumn(${this.quote(column)});`,
      "});",
    ];

    const down = [
      `// TODO: reverse column drop for ${this.quote(column)} on ${this.quote(table)}`,
    ];

    return { up, down };
  }

  // ============================================
  // CREATE INDEX
  // ============================================

  private generateCreateIndexCode(operation: MigrationOperation): {
    up: string[];
    down: string[];
  } {
    const indexData = operation.data;
    const model = this.models.find((m) => m.table === indexData.table);
    const indexDef = model
      ?.getIndexes()
      .find((idx) => idx.name === indexData.index);
    const cols = (indexDef?.columns || []).map((col) => {
      const mc = model?.getColumns().find((c) => c.columnName === col);
      return mc?.databaseName || col;
    });

    const colsStr =
      cols.length === 1
        ? this.quote(cols[0])
        : `[${cols.map((c) => this.quote(c)).join(", ")}]`;

    const up = [
      `this.schema.createIndex(${this.quote(indexData.table)}, ${colsStr}, { constraintName: ${this.quote(indexData.index)} });`,
    ];

    const down = [
      `this.schema.dropIndex(${this.quote(indexData.index)}, ${this.quote(indexData.table)});`,
    ];

    return { up, down };
  }

  // ============================================
  // DROP INDEX
  // ============================================

  private generateDropIndexCode(operation: MigrationOperation): {
    up: string[];
    down: string[];
  } {
    const indexData = operation.data;

    const up = [
      `this.schema.dropIndex(${this.quote(indexData.index)}, ${this.quote(indexData.table)});`,
    ];

    const down = [
      `// TODO: reverse index drop for ${this.quote(indexData.index)} on ${this.quote(indexData.table)}`,
    ];

    return { up, down };
  }

  // ============================================
  // ADD FOREIGN KEY
  // ============================================

  private generateAddForeignKeyCode(operation: MigrationOperation): {
    up: string[];
    down: string[];
  } {
    const relationData = operation.data;
    const { sourceColumn, referencedTable, referencedColumn, constraintName } =
      this.resolveRelationDetails(relationData);

    const onDelete = relationData.relation.onDelete?.toLowerCase();
    const onUpdate = relationData.relation.onUpdate?.toLowerCase();

    const optsParts: string[] = [];
    if (constraintName) {
      optsParts.push(`constraintName: ${this.quote(constraintName)}`);
    }
    if (onDelete) {
      optsParts.push(`onDelete: ${this.quote(onDelete)}`);
    }
    if (onUpdate) {
      optsParts.push(`onUpdate: ${this.quote(onUpdate)}`);
    }

    const optsStr = optsParts.length > 0 ? `, { ${optsParts.join(", ")} }` : "";

    const up = [
      `this.schema.alterTable(${this.quote(relationData.table)}, (table) => {`,
      `  table.foreignKey(${this.quote(sourceColumn)}, ${this.quote(referencedTable)}, ${this.quote(referencedColumn)}${optsStr});`,
      "});",
    ];

    const dropName =
      constraintName ||
      getDefaultFkConstraintName(
        relationData.table,
        sourceColumn,
        referencedTable,
      );
    const down = [
      `this.schema.alterTable(${this.quote(relationData.table)}, (table) => {`,
      `  table.dropConstraint(${this.quote(dropName)});`,
      "});",
    ];

    return { up, down };
  }

  // ============================================
  // DROP FOREIGN KEY
  // ============================================

  private generateDropForeignKeyCode(operation: MigrationOperation): {
    up: string[];
    down: string[];
  } {
    const constraintName =
      operation.constraint || operation.data?.relation?.name;

    if (!constraintName) {
      return { up: null as any, down: null as any };
    }

    const table = operation.table || operation.data?.table;

    const up = [
      `this.schema.alterTable(${this.quote(table)}, (table) => {`,
      `  table.dropConstraint(${this.quote(constraintName)});`,
      "});",
    ];

    const down = [
      `// TODO: reverse FK drop for ${this.quote(constraintName)} on ${this.quote(table)}`,
    ];

    return { up, down };
  }

  // ============================================
  // ADD UNIQUE CONSTRAINT
  // ============================================

  private generateAddUniqueCode(operation: MigrationOperation): {
    up: string[];
    down: string[];
  } {
    const uq = operation.data;
    const model = this.models.find((m) => m.table === uq.table);
    const columns = (uq.columns || []).map((col: string) => {
      const mc = model?.getColumns().find((c) => c.columnName === col);
      return mc?.databaseName || col;
    });

    const colsStr = `[${columns.map((c: string) => this.quote(c)).join(", ")}]`;
    const constraintName = uq.name || "mandatory";

    const up = [
      `this.schema.addUnique(${this.quote(uq.table)}, ${colsStr}, { constraintName: ${this.quote(constraintName)} });`,
    ];

    const down = [
      `this.schema.dropUnique(${this.quote(uq.table)}, ${colsStr}, { constraintName: ${this.quote(constraintName)} });`,
    ];

    return { up, down };
  }

  // ============================================
  // DROP CONSTRAINT
  // ============================================

  private generateDropConstraintCode(operation: MigrationOperation): {
    up: string[];
    down: string[];
  } {
    const data = operation.data;
    const table = operation.table || data.table;
    const constraintName = operation.constraint || data.name;

    if (!constraintName || !table) {
      return { up: null as any, down: null as any };
    }

    // Primary key constraint drop (from column drop dependencies)
    if (data.type === "primary_key") {
      const up = [
        `this.schema.alterTable(${this.quote(table)}, (table) => {`,
        `  table.dropPrimaryKey();`,
        "});",
      ];
      const down = [
        `// TODO: reverse primary key drop on ${this.quote(table)}`,
      ];
      return { up, down };
    }

    // Unique constraint drop (from column drop dependencies)
    if (data.type === "unique") {
      const col = data.column;
      const up = [
        `this.schema.alterTable(${this.quote(table)}, (table) => {`,
        `  table.dropConstraint(${this.quote(constraintName)});`,
        "});",
      ];
      const down = [
        `// TODO: reverse unique constraint drop for ${this.quote(col)} on ${this.quote(table)}`,
      ];
      return { up, down };
    }

    // Check constraint drop (has expression or comes from checksToDrop)
    if (data.expression !== undefined) {
      const up = [
        `this.schema.dropCheck(${this.quote(table)}, ${this.quote(constraintName)});`,
      ];
      const down = [
        `// TODO: reverse check constraint drop for ${this.quote(constraintName)} on ${this.quote(table)}`,
      ];
      return { up, down };
    }

    // Generic constraint drop (uniquesToDrop, etc.)
    const up = [
      `this.schema.alterTable(${this.quote(table)}, (table) => {`,
      `  table.dropConstraint(${this.quote(constraintName)});`,
      "});",
    ];

    const down = [
      `// TODO: reverse constraint drop for ${this.quote(constraintName)} on ${this.quote(table)}`,
    ];

    return { up, down };
  }

  // ============================================
  // ADD CHECK CONSTRAINT
  // ============================================

  private generateAddCheckCode(operation: MigrationOperation): {
    up: string[];
    down: string[];
  } {
    const chk = operation.data;

    const up = [
      `this.schema.addCheck(${this.quote(chk.table)}, ${this.quote(chk.expression)}, { constraintName: ${this.quote(chk.name)} });`,
    ];

    const down = [
      `this.schema.dropCheck(${this.quote(chk.table)}, ${this.quote(chk.name)});`,
    ];

    return { up, down };
  }

  // ============================================
  // ADD PRIMARY KEY
  // ============================================

  private generateAddPrimaryKeyCode(operation: MigrationOperation): {
    up: string[];
    down: string[];
  } {
    const pk = operation.data;
    const model = this.models.find((m) => m.table === pk.table);
    const modelPkCol = model
      ?.getColumns()
      .find((col) => col.columnName === pk.columns[0]);
    const constraintName =
      modelPkCol?.primaryKeyConstraintName ||
      getDefaultPrimaryKeyConstraintName(pk.table, pk.columns[0]);

    const colsStr = `[${pk.columns.map((c: string) => this.quote(c)).join(", ")}]`;

    const up = [
      `this.schema.alterTable(${this.quote(pk.table)}, (table) => {`,
      `  table.addConstraint("primary_key", { columns: ${colsStr}, constraintName: ${this.quote(constraintName)} });`,
      "});",
    ];

    const down = [
      `this.schema.alterTable(${this.quote(pk.table)}, (table) => {`,
      `  table.dropPrimaryKey();`,
      "});",
    ];

    return { up, down };
  }

  // ============================================
  // DROP TABLE
  // ============================================

  private generateDropTableCode(operation: MigrationOperation): {
    up: string[];
    down: string[];
  } {
    const tableName = operation.table || operation.data?.table;

    const up = [`this.schema.dropTable(${this.quote(tableName)});`];
    const down = [`// TODO: reverse table drop for ${this.quote(tableName)}`];

    return { up, down };
  }

  // ============================================
  // MODIFY PRIMARY KEY
  // ============================================

  private generateModifyPrimaryKeyCode(operation: MigrationOperation): {
    up: string[];
    down: string[];
  } {
    const pk = operation.data;
    const table = pk.table;

    const up = [
      `this.schema.alterTable(${this.quote(table)}, (table) => {`,
      `  table.dropPrimaryKey();`,
      "});",
      `this.schema.alterTable(${this.quote(table)}, (table) => {`,
      `  table.addPrimaryKey(${this.quote(pk.modelPrimaryKey)});`,
      "});",
    ];

    const down = [
      `// TODO: reverse primary key modification on ${this.quote(table)}`,
    ];

    return { up, down };
  }

  // ============================================
  // Column Code Generation
  // ============================================

  /**
   * Generates a single column builder code string like:
   *   table.varchar("name", 255).notNullable().default("foo")
   *
   * @param tableName - The table this column belongs to
   * @param column - The column metadata
   * @param applyConstraints - Whether to include constraints (PK, nullable, default, etc.)
   */
  private generateColumnCode(
    tableName: string,
    column: ColumnType,
    applyConstraints: boolean,
  ): string {
    let code = this.generateColumnTypeCode(column);

    if (!applyConstraints) {
      return code;
    }

    // Primary key
    if (column.isPrimary) {
      const pkName =
        column.primaryKeyConstraintName ||
        getDefaultPrimaryKeyConstraintName(tableName, column.columnName);
      code += `.primaryKey({ constraintName: ${this.quote(pkName)} })`;
    }

    // Unsigned (MySQL/MariaDB)
    if (column.unsigned) {
      code += ".unsigned()";
    }

    // Zerofill (MySQL/MariaDB)
    if (column.zerofill) {
      code += ".zerofill()";
    }

    // Default value
    if (column.constraints?.default !== undefined) {
      code += `.default(${this.formatDefaultValue(column.constraints.default)})`;
    }

    // Nullable
    if (column.constraints?.nullable === false) {
      code += ".notNullable()";
    } else if (column.constraints?.nullable === true) {
      code += ".nullable()";
    }

    return code + ";";
  }

  /**
   * Generates column code for MODIFY/ALTER operations.
   * Includes constraints based on both model column and DB column state.
   */
  private generateColumnCodeForModify(
    tableName: string,
    modelColumn: ColumnType,
    dbColumn: any,
  ): string {
    let code = this.generateColumnTypeCode(modelColumn);

    // Default value
    if (modelColumn.constraints?.default !== undefined) {
      code += `.default(${this.formatDefaultValue(modelColumn.constraints.default)})`;
    } else if (dbColumn.defaultValue != null && dbColumn.defaultValue !== "") {
      code += ".default(null)";
    }

    // Nullable
    if (modelColumn.constraints?.nullable === false) {
      code += ".notNullable()";
    } else if (modelColumn.constraints?.nullable === true) {
      code += ".nullable()";
    }

    return code;
  }

  /**
   * Generates the column type part of the code, e.g. `table.varchar("name", 255)`
   */
  private generateColumnTypeCode(column: ColumnType): string {
    const name = column.databaseName;

    // Enum type
    if (Array.isArray(column.type)) {
      const values = column.type.map((v) => this.quote(v)).join(", ");
      return `table.enum(${this.quote(name)}, [${values}])`;
    }

    const type = column.type as string;

    // Types that take no extra args
    const noArgTypes = new Set([
      "uuid",
      "ulid",
      "boolean",
      "year",
      "json",
      "jsonb",
      "binary",
      "blob",
      "tinyblob",
      "mediumblob",
      "longblob",
      "geometry",
      "point",
      "linestring",
      "polygon",
      "multiPoint",
    ]);

    if (noArgTypes.has(type)) {
      return `table.${type}(${this.quote(name)})`;
    }

    // Timestamp / datetime with options
    if (type === "timestamp" || type === "datetime") {
      const optsParts: string[] = [];
      if (column.withTimezone) {
        optsParts.push("withTimezone: true");
      }
      if (column.precision != null) {
        optsParts.push(`precision: ${column.precision}`);
      }
      if (optsParts.length > 0) {
        return `table.${type}(${this.quote(name)}, { ${optsParts.join(", ")} })`;
      }
      return `table.${type}(${this.quote(name)})`;
    }

    // date, time with optional precision
    if (type === "date" || type === "time") {
      if (column.precision != null) {
        return `table.${type}(${this.quote(name)}, ${column.precision})`;
      }
      return `table.${type}(${this.quote(name)})`;
    }

    // Increment types
    if (type === "increment" || type === "bigIncrement") {
      if (column.length != null && column.length !== 255) {
        return `table.${type}(${this.quote(name)}, ${column.length})`;
      }
      return `table.${type}(${this.quote(name)})`;
    }

    // Decimal / numeric with precision and scale
    if (type === "decimal" || type === "numeric") {
      if (column.precision != null) {
        if (column.scale != null) {
          return `table.${type}(${this.quote(name)}, ${column.precision}, ${column.scale})`;
        }
        return `table.${type}(${this.quote(name)}, ${column.precision})`;
      }
      return `table.${type}(${this.quote(name)})`;
    }

    // Float / double / real with precision
    if (type === "float" || type === "double" || type === "real") {
      if (column.precision != null && column.precision !== 10) {
        return `table.${type}(${this.quote(name)}, ${column.precision})`;
      }
      return `table.${type}(${this.quote(name)})`;
    }

    // Text types
    if (type === "longtext" || type === "mediumtext" || type === "tinytext") {
      return `table.${type}(${this.quote(name)})`;
    }

    // Types with length: varchar, char, string, integer, tinyint, smallint, mediumint, bigint, biginteger, varbinary
    const lengthTypes = new Set([
      "varchar",
      "char",
      "string",
      "integer",
      "tinyint",
      "smallint",
      "mediumint",
      "bigint",
      "biginteger",
      "varbinary",
    ]);

    if (lengthTypes.has(type)) {
      if (column.length != null && column.length !== 255) {
        return `table.${type}(${this.quote(name)}, ${column.length})`;
      }
      return `table.${type}(${this.quote(name)})`;
    }

    // Built-in type we didn't specifically handle (fallback)
    if (MigrationCodeGenerator.BUILTIN_COLUMN_TYPES.has(type)) {
      return `table.${type}(${this.quote(name)})`;
    }

    // Custom/unknown type
    if (column.length != null) {
      return `table.custom(${this.quote(name)}, ${this.quote(type)}, ${column.length})`;
    }
    return `table.custom(${this.quote(name)}, ${this.quote(type)})`;
  }

  // ============================================
  // Relation Resolution (reuses MigrationOperationGenerator logic)
  // ============================================

  private resolveRelationDetails(relationData: {
    table: string;
    relation: LazyRelationType;
  }): {
    sourceColumn: string;
    referencedTable: string;
    referencedColumn: string;
    constraintName: string | undefined;
  } {
    let referencedTable = relationData.table;
    let referencedColumn = "id";

    if (relationData.relation.type === RelationEnum.belongsTo) {
      const relatedModel = relationData.relation.model();
      referencedTable = relatedModel.table;
      const primaryKeyName = relatedModel.primaryKey || "id";
      const relatedModelColumns = relatedModel.getColumns();
      const relatedModelPKColumn = relatedModelColumns.find(
        (col) => col.columnName === primaryKeyName,
      );
      referencedColumn = relatedModelPKColumn?.databaseName || primaryKeyName;
    } else if (
      relationData.relation.type === RelationEnum.manyToMany &&
      relationData.relation.manyToManyOptions
    ) {
      referencedTable = getColumnValue(
        relationData.relation.manyToManyOptions.throughModel,
      );
      const rightKey = getColumnValue(
        relationData.relation.manyToManyOptions.rightForeignKey,
      );
      if (rightKey && rightKey !== "undefined") {
        referencedColumn = rightKey;
      } else {
        const relatedModel = relationData.relation.model();
        referencedColumn = relatedModel.primaryKey || "id";
      }
    }

    // Resolve source column
    const model = this.models.find((m) => m.table === relationData.table);
    const modelColumns = model?.getColumns() || [];
    let sourceColumn = relationData.relation.columnName;

    if (relationData.relation.type === RelationEnum.belongsTo) {
      const fkCol = modelColumns.find(
        (col) => col.columnName === relationData.relation.foreignKey,
      );
      sourceColumn =
        fkCol?.databaseName || (relationData.relation.foreignKey as string);
    } else if (
      relationData.relation.type === RelationEnum.manyToMany &&
      relationData.relation.manyToManyOptions
    ) {
      const leftKey = getColumnValue(
        relationData.relation.manyToManyOptions.leftForeignKey,
      );
      const leftCol = modelColumns.find((c) => c.columnName === leftKey);
      sourceColumn = leftCol?.databaseName || leftKey;
    } else {
      const mc = modelColumns.find((c) => c.columnName === sourceColumn);
      sourceColumn = mc?.databaseName || sourceColumn;
    }

    // Constraint name
    const constraintName =
      typeof relationData.relation.constraintName === "string"
        ? (relationData.relation.constraintName as string)
        : getColumnValue(relationData.relation.constraintName) || undefined;

    return { sourceColumn, referencedTable, referencedColumn, constraintName };
  }

  // ============================================
  // Helpers
  // ============================================

  private quote(value: string): string {
    const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `"${escaped}"`;
  }

  private formatDefaultValue(
    value: string | number | boolean | null | undefined,
  ): string {
    if (value === null || value === undefined) {
      return "null";
    }
    if (value === "NULL") {
      return '"NULL"';
    }
    if (typeof value === "boolean") {
      return value.toString();
    }
    if (typeof value === "number") {
      return value.toString();
    }
    if (value === "TRUE" || value === "true") {
      return "true";
    }
    if (value === "FALSE" || value === "false") {
      return "false";
    }
    return this.quote(String(value));
  }

  private static readonly BUILTIN_COLUMN_TYPES = new Set([
    "char",
    "varchar",
    "string",
    "text",
    "longtext",
    "mediumtext",
    "tinytext",
    "uuid",
    "ulid",
    "integer",
    "tinyint",
    "smallint",
    "mediumint",
    "bigint",
    "biginteger",
    "float",
    "double",
    "real",
    "decimal",
    "numeric",
    "increment",
    "bigIncrement",
    "boolean",
    "date",
    "time",
    "datetime",
    "timestamp",
    "year",
    "json",
    "jsonb",
    "binary",
    "varbinary",
    "blob",
    "tinyblob",
    "mediumblob",
    "longblob",
    "geometry",
    "point",
    "linestring",
    "polygon",
    "multiPoint",
  ]);
}
