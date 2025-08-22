import fs from "node:fs";
import path from "node:path";
import { env } from "../../../env/env";
import { HysteriaError } from "../../../errors/hysteria_error";
import { AstParser } from "../../ast/parser";
import {
  AddPrimaryKeyNode,
  AlterTableNode,
  DropConstraintNode,
  DropPrimaryKeyNode,
  RenameTableNode,
} from "../../ast/query/node/alter_table";
import { AddConstraintNode } from "../../ast/query/node/alter_table/add_constraint";
import { ConstraintNode } from "../../ast/query/node/constraint";
import { CreateTableNode } from "../../ast/query/node/create_table";
import { DropTableNode } from "../../ast/query/node/drop_table";
import { CreateIndexNode, DropIndexNode } from "../../ast/query/node/index_op";
import { TruncateNode } from "../../ast/query/node/truncate";
import { QueryNode } from "../../ast/query/query";
import { Model } from "../../models/model";
import type { SqlDataSourceType } from "../../sql_data_source_types";
import { AlterTableBuilder } from "./alter_table";
import { CreateTableBuilder } from "./create_table";

export default class Schema {
  queryStatements: string[];
  sqlType: SqlDataSourceType;

  constructor(sqlType?: SqlDataSourceType) {
    this.sqlType = (sqlType || env.DB_TYPE) as SqlDataSourceType;

    if (!this.sqlType) {
      throw new HysteriaError("Schema::constructor", "ENV_NOT_SET");
    }

    this.queryStatements = [];
  }

  /**
   * @description Add raw query to the migration
   */
  rawQuery(query: string): void {
    this.queryStatements.push(query);
  }

  /**
   * @description Runs the sql in the given file, throws error if file does not exist or is not .sql or .txt
   * @description IMPORTANT: migration cli is always intended to be run from the root of the project so choose the file path accordingly
   */
  runFile(filePath: string): void {
    if (!fs.existsSync(filePath)) {
      throw new HysteriaError(
        "Schema::runFile",
        `FILE_NOT_FOUND_OR_NOT_ACCESSIBLE`,
      );
    }

    const file = path.basename(filePath);
    const fileExtension = path.extname(file);
    if (fileExtension !== ".sql" && fileExtension !== ".txt") {
      throw new HysteriaError("Schema::runFile", `FILE_NOT_A_SQL_OR_TXT_FILE`);
    }

    const query = fs.readFileSync(filePath, "utf-8");
    this.rawQuery(query);
  }

  /**
   * @description Create table constructor
   */
  createTable(
    table: string,
    cb: (table: CreateTableBuilder) => void,
    options?: { ifNotExists?: boolean },
  ): void {
    const tableBuilder = new CreateTableBuilder([], table);
    cb(tableBuilder);

    const nodes = tableBuilder.getNodes();
    const astParser = new AstParser(
      {
        table: table,
        databaseCaseConvention: "preserve",
        modelCaseConvention: "preserve",
      } as typeof Model,
      this.sqlType,
    );

    const createTableNode = new CreateTableNode(
      table,
      nodes,
      options?.ifNotExists,
    );
    const frag = astParser.parse([createTableNode]).sql;
    const stmt = frag.startsWith("create table")
      ? frag
      : `create table ${frag}`;
    this.rawQuery(stmt);
  }

  /**
   * @description Alter table constructor
   */
  alterTable(table: string, cb: (t: AlterTableBuilder) => void): void {
    const nodes: QueryNode[] = [];
    const builder = new AlterTableBuilder(table, nodes, this.sqlType);
    cb(builder);

    if (!nodes.length) {
      return;
    }

    const astParser = this.generateAstInstance({
      table,
      databaseCaseConvention: "preserve",
      modelCaseConvention: "preserve",
    } as typeof Model);

    let group: QueryNode[] = [];
    const flushGroup = () => {
      if (!group.length) return;
      const nodeGroup = new AlterTableNode(table, group);
      const frag = astParser.parse([nodeGroup]).sql;
      const stmt = frag.startsWith("alter table")
        ? frag
        : `alter table ${frag}`;
      this.rawQuery(stmt);
      group = [];
    };

    for (const child of nodes) {
      if (
        child.file === "add_constraint" &&
        group.length &&
        (group[0] as any).file === "add_column"
      ) {
        // merge with current add column group
        group.push(child);
      } else {
        flushGroup();
        group.push(child);
      }
    }
    flushGroup();
  }

  /**
   * @description Drop table in the database
   */
  dropTable(table: string, ifExists: boolean = false): void {
    const node = new DropTableNode(table, ifExists);
    const astParser = this.generateAstInstance({
      table,
      databaseCaseConvention: "preserve",
      modelCaseConvention: "preserve",
    } as typeof Model);
    this.rawQuery(astParser.parse([node]).sql);
  }

  /**
   * @description Rename table in the database
   */
  renameTable(oldTable: string, newTable: string): void {
    const node = new AlterTableNode(oldTable, [new RenameTableNode(newTable)]);
    const astParser = this.generateAstInstance({
      table: oldTable,
      databaseCaseConvention: "preserve",
      modelCaseConvention: "preserve",
    } as typeof Model);

    this.rawQuery(astParser.parse([node]).sql);
  }

  /**
   * @description Truncate table
   */
  truncateTable(table: string): void {
    const node = new TruncateNode(table);
    const astParser = this.generateAstInstance({
      table,
      databaseCaseConvention: "preserve",
      modelCaseConvention: "preserve",
    } as typeof Model);
    this.rawQuery(astParser.parse([node]).sql);
  }

  /**
   * @description Create index on table
   */
  createIndex(table: string, columns: string[], indexName?: string): void {
    indexName = indexName || `${table}_${columns.join("_")}_index`;
    const node = new CreateIndexNode(table, columns, indexName);
    const astParser = this.generateAstInstance({
      table,
      databaseCaseConvention: "preserve",
      modelCaseConvention: "preserve",
    } as typeof Model);
    this.rawQuery(astParser.parse([node]).sql);
  }

  /**
   * @description Drop index on table
   * @mysql requires table name for index drop
   */
  dropIndex(indexName: string, table?: string): void {
    const node = new DropIndexNode(indexName, table);
    const astParser = this.generateAstInstance({
      table,
      databaseCaseConvention: "preserve",
      modelCaseConvention: "preserve",
    } as typeof Model);
    this.rawQuery(astParser.parse([node]).sql);
  }

  /**
   * @description Adds a primary key to a table
   */
  addPrimaryKey(table: string, columns: string[]): void {
    const node = new AddPrimaryKeyNode(columns);
    const astParser = this.generateAstInstance({
      table,
      databaseCaseConvention: "preserve",
      modelCaseConvention: "preserve",
    } as typeof Model);
    this.rawQuery(astParser.parse([node]).sql);
  }

  /**
   * @description Drops a foreign key from a table, only usable if the constraint was generated by the orm and not manually provided
   */
  dropForeignKey(table: string, column: string, constraintName?: string): void {
    // if name not provided, assume it was generated by AddConstraint
    if (!constraintName) {
      constraintName = `${table}_${column}_fk`;
    }

    const dropNode = new DropConstraintNode(constraintName);
    const alterNode = new AlterTableNode(table, [dropNode]);

    const astParser = this.generateAstInstance({
      table,
      databaseCaseConvention: "preserve",
      modelCaseConvention: "preserve",
    } as typeof Model);

    this.rawQuery(astParser.parse([alterNode]).sql);
  }

  /**
   * @description Drops a primary key from a table
   */
  dropPrimaryKey(table: string): void {
    const node = new DropPrimaryKeyNode();
    const astParser = this.generateAstInstance({
      table,
      databaseCaseConvention: "preserve",
      modelCaseConvention: "preserve",
    } as typeof Model);
    this.rawQuery(astParser.parse([node]).sql);
  }

  /**
   * @description Adds a foreign key to a table
   */
  addConstraint(
    table: string,
    columns: string[],
    foreignTable: string,
    foreignColumns: string[],
    constraintName?: string,
    options?: { onDelete?: string; onUpdate?: string },
  ): void {
    if (!constraintName) {
      constraintName = `${table}_${columns.join("_")}_fk`;
    }

    const constraint = new ConstraintNode("foreign_key", {
      columns,
      references: { table: foreignTable, columns: foreignColumns },
      constraintName,
      onDelete: options?.onDelete as any,
      onUpdate: options?.onUpdate as any,
    });

    const alterNode = new AlterTableNode(table, [
      new AddConstraintNode(constraint),
    ]);
    const astParser = this.generateAstInstance({
      table,
      databaseCaseConvention: "preserve",
      modelCaseConvention: "preserve",
    } as typeof Model);
    this.rawQuery(astParser.parse([alterNode]).sql);
  }

  /**
   * @description Drops a cosntraint from a table
   */
  dropConstraint(table: string, constraintName: string): void {
    const node = new DropConstraintNode(constraintName);
    const astParser = this.generateAstInstance({
      table,
      databaseCaseConvention: "preserve",
      modelCaseConvention: "preserve",
    } as typeof Model);
    this.rawQuery(astParser.parse([node]).sql);
  }

  private generateAstInstance(model: typeof Model): AstParser {
    return new AstParser(
      {
        table: model.table,
        databaseCaseConvention: "preserve",
        modelCaseConvention: "preserve",
      } as typeof Model,
      this.sqlType,
    );
  }
}
