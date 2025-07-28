import {
  AddColumnNode,
  AlterColumnTypeNode,
  DropColumnNode,
  RenameColumnNode,
} from "../../ast/query/node/alter_table";
import { AddConstraintNode } from "../../ast/query/node/alter_table/add_constraint";
import { ColumnTypeNode } from "../../ast/query/node/column";
import { QueryNode } from "../../ast/query/query";
import { SqlDataSourceType } from "../../sql_data_source_types";
import { BaseBuilder } from "./base_builder";
import { ConstraintBuilder } from "./constraint_builder";
import { CreateTableBuilder } from "./create_table";

export class AlterTableBuilder extends BaseBuilder {
  private table: string;
  private sqlType: SqlDataSourceType;
  constructor(table: string, nodes: QueryNode[], sqlType: SqlDataSourceType) {
    super(nodes);
    this.table = table;
    this.sqlType = sqlType;
  }

  addColumn(cb: (col: CreateTableBuilder) => ConstraintBuilder): void {
    const tempNodes: QueryNode[] = [];
    const builder = new CreateTableBuilder(tempNodes, this.table);
    cb(builder);
    if (!tempNodes.length) {
      return;
    }

    const columnNodes = tempNodes.filter((n) => n.folder === "column");
    if (columnNodes.length !== 1) {
      throw new Error("addColumn callback must define exactly one column");
    }

    const colNode = columnNodes[0] as ColumnTypeNode;
    this.nodes.push(new AddColumnNode(colNode));

    // wrap related constraint nodes
    tempNodes.forEach((n) => {
      if (n.folder === "constraint") {
        this.nodes.push(new AddConstraintNode(n as any));
      }
    });
  }

  dropColumn(name: string) {
    this.nodes.push(new DropColumnNode(name));
  }

  renameColumn(oldName: string, newName: string) {
    this.nodes.push(new RenameColumnNode(oldName, newName));
  }

  /**
   * @sqlite not supported and will be ignored
   */
  alterColumn(columnBuilder: (col: CreateTableBuilder) => ConstraintBuilder) {
    if (this.sqlType === "sqlite") {
      return;
    }

    const tempNodes: QueryNode[] = [];
    const builder = new CreateTableBuilder(tempNodes, this.table);
    columnBuilder(builder);
    if (!tempNodes.length) {
      return;
    }
    const columnNodes = tempNodes.filter((n) => n.folder === "column");
    if (columnNodes.length !== 1) {
      throw new Error("alterColumn callback must define exactly one column");
    }

    const colNode = columnNodes[0] as ColumnTypeNode;
    this.nodes.push(new AlterColumnTypeNode(colNode.column, colNode));
  }
}
