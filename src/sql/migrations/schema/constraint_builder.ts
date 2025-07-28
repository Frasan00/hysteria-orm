import { ColumnTypeNode } from "../../ast/query/node/column";
import { ConstraintNode } from "../../ast/query/node/constraint";
import { AfterConstraintNode } from "../../ast/query/node/constraint/after";
import { QueryNode } from "../../ast/query/query";
import { BaseBuilder } from "./base_builder";

export type CommonConstraintOptions = {
  constraintName?: string;
};

export type PrimaryKeyOptions = CommonConstraintOptions & {
  autoIncrement?: boolean;
};

export type ForeignKeyOptions = CommonConstraintOptions & {
  onDelete?: "cascade" | "restrict" | "set null" | "no action";
  onUpdate?: "cascade" | "restrict" | "set null" | "no action";
};

export class ConstraintBuilder extends BaseBuilder {
  private readonly columnNode: ColumnTypeNode;
  private readonly tableName?: string;

  constructor(
    nodes: QueryNode[],
    columnNode: ColumnTypeNode,
    tableName?: string,
  ) {
    super(nodes);
    this.columnNode = columnNode;
    this.tableName = tableName;
  }

  // #region primary key
  primaryKey(): this {
    const defaultName = this.tableName
      ? `pk_${this.tableName}_${this.columnNode.column}`
      : `pk_${this.columnNode.column}`;
    this.nodes.push(
      new ConstraintNode("primary_key", {
        columns: [this.columnNode.column],
        constraintName: defaultName,
      }),
    );
    return this;
  }

  // #endregion

  // #region foreign key
  foreignKey(
    references: `${string}.${string}`,
    options?: ForeignKeyOptions,
  ): this {
    const [table, cols] = references.split(".");
    const refCols = cols.split(",");
    const name =
      options?.constraintName ?? `fk_${this.columnNode.column}_${table}`;
    this.nodes.push(
      new ConstraintNode("foreign_key", {
        columns: [this.columnNode.column],
        references: { table, columns: refCols },
        constraintName: name,
        onDelete: options?.onDelete,
        onUpdate: options?.onUpdate,
      }),
    );
    return this;
  }

  increment(): this {
    this.columnNode.autoIncrement = true;
    return this;
  }

  // #endregion

  // #region unique
  unique(options?: CommonConstraintOptions): this {
    const name =
      options?.constraintName ??
      (this.tableName
        ? `uk_${this.tableName}_${this.columnNode.column}`
        : `uk_${this.columnNode.column}`);
    this.nodes.push(
      new ConstraintNode("unique", {
        columns: [this.columnNode.column],
        constraintName: name,
      }),
    );
    return this;
  }

  // #endregion

  // #region not nullable
  notNullable(): this {
    this.nodes.push(new ConstraintNode("not_null"));
    return this;
  }

  // #endregion

  // #region nullable
  nullable(): this {
    // Nullable means no not_null constraint
    return this;
  }

  // #endregion

  // #region default
  default(value: string | number | boolean | null): this {
    let defaultVal: string | undefined;

    if (value === null) {
      defaultVal = "NULL";
    } else if (typeof value === "boolean") {
      defaultVal = value ? "TRUE" : "FALSE";
    } else if (value !== undefined) {
      defaultVal = value.toString();
    }

    this.nodes.push(
      new ConstraintNode("default", {
        defaultValue: defaultVal,
      }),
    );
    return this;
  }

  // #endregion

  // #region after
  after(columnName: string): this {
    this.nodes.push(new AfterConstraintNode(columnName));
    return this;
  }

  // #endregion
}
