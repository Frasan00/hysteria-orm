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
  char(name: string, length: number = 1): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "char", { length });
    return this.build(node);
  }

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

  text(
    name: string,
    type: "longtext" | "mediumtext" | "tinytext" = "longtext",
  ): ConstraintBuilder {
    const node = new ColumnTypeNode(name, type);
    return this.build(node);
  }

  uuid(name: string): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "uuid");
    return this.build(node);
  }

  // #endregion

  // #region number
  integer(name: string, length: number = 255): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "integer", { length });
    return this.build(node);
  }

  bigint(name: string, length: number = 255): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "bigint", { length });
    return this.build(node);
  }

  float(name: string, length: number = 255): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "float", { length });
    return this.build(node);
  }

  double(name: string, length: number = 255): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "double", { length });
    return this.build(node);
  }

  decimal(
    name: string,
    precision: number = 10,
    scale: number = 2,
  ): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "decimal", { precision, scale });
    return this.build(node);
  }

  // #endregion

  // #region date
  date(name: string): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "date");
    return this.build(node);
  }

  datetime(name: string, withTimezone: boolean = false): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "datetime", { withTimezone });
    return this.build(node);
  }

  timestamp(name: string, withTimezone: boolean = false): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "timestamp", { withTimezone });
    return this.build(node);
  }

  // #endregion

  // #region boolean
  boolean(name: string): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "boolean");
    return this.build(node);
  }

  // #endregion

  // #region binary
  binary(name: string): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "bytea");
    return this.build(node);
  }

  // #endregion

  // #region json

  /**
   * @sqlite json is not supported, text will be used instead
   */
  json(name: string): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "json");
    return this.build(node);
  }

  /**
   * @sqlite jsonb is not supported, text will be used instead
   */
  jsonb(name: string): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "jsonb");
    return this.build(node);
  }

  // #endregion

  // #region enum
  enum(name: string, values: readonly string[]): ConstraintBuilder {
    const node = new ColumnTypeNode(name, "enum", { enumValues: values });
    return this.build(node);
  }

  // #endregion

  // #region custom
  custom(name: string, type: string, length?: number): ConstraintBuilder {
    const node = new ColumnTypeNode(name, type, { length });
    return this.build(node);
  }

  // #endregion
}
