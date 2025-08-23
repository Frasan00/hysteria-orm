import { ColumnTypeNode } from "../../ast/query/node/column";
import { QueryNode } from "../../ast/query/query";
import { BaseBuilder } from "./base_builder";
import { ConstraintBuilder } from "./constraint_builder";

export class CreateTableBuilder extends BaseBuilder {
  private tableName?: string;

  constructor(nodes: QueryNode[], tableName?: string) {
    super(nodes);
    this.tableName = tableName;
  }

  private build(node: ColumnTypeNode): ConstraintBuilder {
    this.nodes.push(node);
    return new ConstraintBuilder(this.nodes, node, this.tableName);
  }

  // #region string
  /**
   * Fixed-length character string
   * @mysql Supported as CHAR(length)
   * @postgres Supported as CHAR(length)
   * @sqlite Supported as TEXT (length ignored)
   */
  char(name: string, length: number = 1): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "char", { length });
    return this.build(node);
  }

  /**
   * Variable-length character string
   * @mysql Supported as VARCHAR(length)
   * @postgres Supported as VARCHAR(length)
   * @sqlite Supported as TEXT (length ignored)
   */
  varchar(name: string, length: number = 255): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "varchar", { length });
    return this.build(node);
  }

  /**
   * @alias varchar
   */
  string(name: string, length: number = 255): ConstraintBuilder {
    return this.varchar(name, length);
  }

  /**
   * Text types with various sizes
   * @mysql Supported as TEXT, MEDIUMTEXT, LONGTEXT, TINYTEXT
   * @postgres All mapped to TEXT
   * @sqlite All mapped to TEXT
   */
  text(
    name: string,
    type: "longtext" | "mediumtext" | "tinytext" = "longtext",
  ): ConstraintBuilder {
    const node = new ColumnTypeNode(name, type);
    return this.build(node);
  }

  /**
   * @mysql LONGTEXT
   * @postgres TEXT
   * @sqlite TEXT
   */
  longtext(name: string): ConstraintBuilder {
    return this.text(name, "longtext");
  }

  /**
   * @mysql MEDIUMTEXT
   * @postgres TEXT
   * @sqlite TEXT
   */
  mediumtext(name: string): ConstraintBuilder {
    return this.text(name, "mediumtext");
  }

  /**
   * @mysql TINYTEXT
   * @postgres TEXT
   * @sqlite TEXT
   */
  tinytext(name: string): ConstraintBuilder {
    return this.text(name, "tinytext");
  }

  /**
   * UUID identifier
   * @mysql VARCHAR(36)
   * @postgres UUID (native type)
   * @sqlite VARCHAR(36)
   */
  uuid(name: string): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "uuid");
    return this.build(node);
  }

  /**
   * ULID (Universally Unique Lexicographically Sortable Identifier)
   * @mysql VARCHAR(26)
   * @postgres VARCHAR(26)
   * @sqlite VARCHAR(26)
   */
  ulid(name: string): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "ulid");
    return this.build(node);
  }

  // #endregion

  // #region number
  /**
   * Integer type
   * @mysql INT (with optional auto_increment)
   * @postgres INTEGER (with optional SERIAL for auto_increment)
   * @sqlite INTEGER (with optional autoincrement)
   */
  integer(name: string, length: number = 255): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "integer", { length });
    return this.build(node);
  }

  /**
   * Small integer type
   * @mysql TINYINT
   * @postgres SMALLINT
   * @sqlite INTEGER
   */
  tinyint(name: string, length: number = 255): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "tinyint", { length });
    return this.build(node);
  }

  /**
   * Small integer type
   * @mysql SMALLINT
   * @postgres SMALLINT
   * @sqlite INTEGER
   */
  smallint(name: string, length: number = 255): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "smallint", { length });
    return this.build(node);
  }

  /**
   * Medium integer type
   * @mysql MEDIUMINT
   * @postgres INTEGER
   * @sqlite INTEGER
   */
  mediumint(name: string, length: number = 255): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "mediumint", { length });
    return this.build(node);
  }

  /**
   * Large integer type
   * @mysql BIGINT (with optional auto_increment)
   * @postgres BIGINT (with optional BIGSERIAL for auto_increment)
   * @sqlite INTEGER
   */
  bigint(name: string, length: number = 255): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "bigint", { length });
    return this.build(node);
  }

  /**
   * Single precision floating point
   * @mysql FLOAT
   * @postgres REAL
   * @sqlite REAL
   */
  float(name: string, precision: number = 10): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "float", { precision });
    return this.build(node);
  }

  /**
   * Double precision floating point
   * @mysql DOUBLE
   * @postgres DOUBLE PRECISION
   * @sqlite REAL
   */
  double(name: string, precision: number = 10): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "double", { precision });
    return this.build(node);
  }

  /**
   * Real number type
   * @mysql DOUBLE (alias)
   * @postgres REAL
   * @sqlite REAL
   */
  real(name: string, precision: number = 10): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "real", { precision });
    return this.build(node);
  }

  /**
   * Exact decimal number
   * @mysql DECIMAL(precision, scale)
   * @postgres NUMERIC(precision, scale)
   * @sqlite NUMERIC(precision, scale)
   */
  decimal(
    name: string,
    precision: number = 10,
    scale: number = 2,
  ): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "decimal", { precision, scale });
    return this.build(node);
  }

  /**
   * Exact numeric type (alias for decimal)
   * @mysql NUMERIC(precision, scale)
   * @postgres NUMERIC(precision, scale)
   * @sqlite NUMERIC(precision, scale)
   */
  numeric(
    name: string,
    precision: number = 10,
    scale: number = 2,
  ): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "numeric", { precision, scale });
    return this.build(node);
  }

  // #endregion

  // #region date
  /**
   * Date type
   * @mysql DATE
   * @postgres DATE
   * @sqlite TEXT
   */
  date(name: string, precision?: number): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "date", { precision });
    return this.build(node);
  }

  /**
   * Time type
   * @mysql TIME(precision)
   * @postgres TIME(precision)
   * @sqlite TEXT
   */
  time(name: string, precision?: number): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "time", { precision });
    return this.build(node);
  }

  /**
   * Year type
   * @mysql YEAR
   * @postgres SMALLINT
   * @sqlite TEXT
   */
  year(name: string): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "year");
    return this.build(node);
  }

  /**
   * Date and time type
   * @mysql DATETIME(precision)
   * @postgres TIMESTAMP(precision) WITHOUT TIME ZONE
   * @sqlite TEXT
   */
  datetime(
    name: string,
    options?: { withTimezone?: boolean; precision?: number },
  ): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "datetime", {
      withTimezone: options?.withTimezone ?? false,
      precision: options?.precision,
    });
    return this.build(node);
  }

  /**
   * Timestamp type
   * @mysql TIMESTAMP(precision)
   * @postgres TIMESTAMP(precision) WITH/WITHOUT TIME ZONE
   * @sqlite TEXT
   */
  timestamp(
    name: string,
    options?: { withTimezone?: boolean; precision?: number },
  ): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "timestamp", {
      withTimezone: options?.withTimezone ?? false,
      precision: options?.precision,
    });
    return this.build(node);
  }

  // #endregion

  // #region boolean
  /**
   * Boolean type
   * @mysql BOOLEAN
   * @postgres BOOLEAN
   * @sqlite INTEGER
   */
  boolean(name: string): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "boolean");
    return this.build(node);
  }

  // #endregion

  // #region binary
  /**
   * Fixed-length binary data
   * @mysql BINARY(length)
   * @postgres BYTEA
   * @sqlite BLOB
   */
  binary(name: string): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "binary");
    return this.build(node);
  }

  /**
   * Variable-length binary data
   * @mysql VARBINARY(length)
   * @postgres BYTEA
   * @sqlite BLOB
   */
  varbinary(name: string, length: number = 255): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "varbinary", { length });
    return this.build(node);
  }

  /**
   * Binary large object
   * @mysql BLOB
   * @postgres BYTEA
   * @sqlite BLOB
   */
  blob(name: string): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "blob");
    return this.build(node);
  }

  /**
   * Small binary large object
   * @mysql TINYBLOB
   * @postgres BYTEA
   * @sqlite BLOB
   */
  tinyblob(name: string): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "tinyblob");
    return this.build(node);
  }

  /**
   * Medium binary large object
   * @mysql MEDIUMBLOB
   * @postgres BYTEA
   * @sqlite BLOB
   */
  mediumblob(name: string): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "mediumblob");
    return this.build(node);
  }

  /**
   * Large binary large object
   * @mysql LONGBLOB
   * @postgres BYTEA
   * @sqlite BLOB
   */
  longblob(name: string): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "longblob");
    return this.build(node);
  }

  // #endregion

  // #region json

  /**
   * JSON data type
   * @mysql JSON (MySQL 5.7+)
   * @postgres JSON
   * @sqlite TEXT (not supported, stored as text)
   */
  json(name: string): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "json");
    return this.build(node);
  }

  /**
   * Binary JSON data type
   * @mysql Not supported (falls back to JSON)
   * @postgres JSONB
   * @sqlite TEXT (not supported, stored as text)
   */
  jsonb(name: string): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "jsonb");
    return this.build(node);
  }

  // #endregion

  // #region enum
  /**
   * Enumeration type
   * @mysql ENUM(values)
   * @postgres TEXT with CHECK constraint
   * @sqlite TEXT
   */
  enum(name: string, values: readonly string[]): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "enum", { enumValues: values });
    return this.build(node);
  }

  // #endregion

  // #region custom
  /**
   * Custom column type
   * @mysql Custom type as specified
   * @postgres Custom type as specified
   * @sqlite Custom type as specified
   */
  custom(name: string, type: string, length?: number): ConstraintBuilder {
    const node = new ColumnTypeNode(name, type, { length });
    return this.build(node);
  }

  /**
   * Raw column type
   * @mysql Custom type as specified
   * @postgres Custom type as specified
   * @sqlite Custom type as specified
   * @example
   * ```ts
   * qb.rawColumn("name varchar(255)");
   * ```
   */
  rawColumn(raw: string): ConstraintBuilder {
    const node = new ColumnTypeNode(raw, "", { isRawValue: true });
    return this.build(node);
  }

  // #endregion
}
