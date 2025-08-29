import { Model } from "../../models/model";
import { RelationEnum } from "../../models/relations/relation";
import { SqlDataSource } from "../../sql_data_source";
import {
  DropDependencies,
  ExecutionPhase,
  MigrationOperation,
  OperationType,
} from "./schema_diff_types";

export class DropOrderResolver {
  private sql: SqlDataSource;
  private models: (typeof Model)[];

  constructor(sql: SqlDataSource) {
    this.sql = sql;
    this.models = Object.values(this.sql.registeredModels);
  }

  /**
   * Builds dependency graph for objects being dropped
   */
  buildDropDependencies(changes: any): DropDependencies {
    const foreignKeys = new Map<string, string[]>();
    const tables = new Map<string, string[]>();
    const constraints = new Map<string, string[]>();

    // Build foreign key dependencies
    for (const relation of changes.relationsToDrop || []) {
      const fkId = `${relation.table}.${relation.relation.name}`;
      const dependencies: string[] = [];

      // Foreign keys depend on the referenced table
      if (relation.relation.referencedTable) {
        dependencies.push(`table.${relation.relation.referencedTable}`);
      }

      // Foreign keys depend on the columns they reference
      if (relation.relation.referencedColumns) {
        for (const col of relation.relation.referencedColumns) {
          dependencies.push(
            `column.${relation.relation.referencedTable}.${col}`,
          );
        }
      }

      foreignKeys.set(fkId, dependencies);
    }

    // Build table dependencies
    for (const table of changes.tablesToDrop || []) {
      const tableId = `table.${table.table}`;
      const dependencies: string[] = [];

      // Find all foreign keys that reference this table
      for (const model of this.models) {
        const relations = model.getRelations();
        for (const relation of relations) {
          if (relation.type === RelationEnum.belongsTo) {
            const relatedModel = relation.model();
            if (relatedModel.table === table.table) {
              dependencies.push(`fk.${model.table}.${relation.constraintName}`);
            }
          }
        }
      }

      tables.set(tableId, dependencies);
    }

    // Build constraint dependencies
    for (const column of changes.columnsToDrop || []) {
      const columnId = `column.${column.table}.${column.column}`;
      const dependencies: string[] = [];

      // Find constraints that depend on this column
      const model = this.models.find((m) => m.table === column.table);
      if (model) {
        const modelColumn = model
          .getColumns()
          .find((c) => c.databaseName === column.column);
        if (modelColumn) {
          // Primary key constraints
          if (modelColumn.isPrimary) {
            dependencies.push(`pk.${column.table}`);
          }

          // Foreign key constraints
          const relations = model.getRelations();
          for (const relation of relations) {
            if (relation.columnName === modelColumn.columnName) {
              dependencies.push(
                `fk.${column.table}.${relation.constraintName}`,
              );
            }
          }
        }
      }

      constraints.set(columnId, dependencies);
    }

    return { foreignKeys, tables, constraints };
  }

  /**
   * Performs reverse topological sort for safe DROP ordering
   */
  topologicalSortReverse<T>(
    items: Map<string, T[]>,
    getDependencies: (item: string) => string[],
  ): string[] {
    const visited = new Set<string>();
    const temp = new Set<string>();
    const result: string[] = [];

    const visit = (item: string) => {
      if (temp.has(item)) {
        throw new Error(`Circular dependency detected: ${item}`);
      }

      if (visited.has(item)) {
        return;
      }

      temp.add(item);
      const dependencies = getDependencies(item);
      for (const dep of dependencies) {
        visit(dep);
      }
      temp.delete(item);
      visited.add(item);
      result.push(item);
    };

    for (const item of items.keys()) {
      if (!visited.has(item)) {
        visit(item);
      }
    }

    return result;
  }

  /**
   * Generates drop operations in the correct order
   */
  generateDropOperations(changes: any): MigrationOperation[] {
    const dropDeps = this.buildDropDependencies(changes);
    const operations: MigrationOperation[] = [];

    // Sort foreign keys in reverse dependency order
    const sortedFKs = this.topologicalSortReverse(
      dropDeps.foreignKeys,
      (fk) => dropDeps.foreignKeys.get(fk) || [],
    );

    // Add foreign key drop operations
    for (const fkId of sortedFKs) {
      const [table, constraintName] = fkId.split(".");
      const relation = changes.relationsToDrop?.find(
        (r: any) => r.table === table && r.relation.name === constraintName,
      );

      if (relation) {
        operations.push({
          type: OperationType.DROP_FOREIGN_KEY,
          phase: ExecutionPhase.DESTRUCTIVE_OPERATIONS,
          table,
          constraint: constraintName,
          data: relation,
          dependencies: dropDeps.foreignKeys.get(fkId) || [],
          sqlStatements: this.generateDropForeignKeySql(relation),
        });
      }
    }

    // Sort tables in reverse dependency order
    const sortedTables = this.topologicalSortReverse(
      dropDeps.tables,
      (table) => dropDeps.tables.get(table) || [],
    );

    // Add constraint drop operations for columns being dropped
    for (const column of changes.columnsToDrop || []) {
      const columnId = `column.${column.table}.${column.column}`;
      const dependencies = dropDeps.constraints.get(columnId) || [];

      for (const constraint of dependencies) {
        if (constraint.startsWith("pk.")) {
          operations.push({
            type: OperationType.DROP_CONSTRAINT,
            phase: ExecutionPhase.DESTRUCTIVE_OPERATIONS,
            table: column.table,
            constraint: "PRIMARY KEY",
            data: { type: "primary_key", table: column.table },
            dependencies: [columnId],
            sqlStatements: this.generateDropPrimaryKeySql(column.table),
          });
        } else if (constraint.startsWith("unique.")) {
          operations.push({
            type: OperationType.DROP_CONSTRAINT,
            phase: ExecutionPhase.DESTRUCTIVE_OPERATIONS,
            table: column.table,
            constraint: `UNIQUE_${column.column}`,
            data: {
              type: "unique",
              table: column.table,
              column: column.column,
            },
            dependencies: [columnId],
            sqlStatements: this.generateDropUniqueConstraintSql(
              column.table,
              column.column,
            ),
          });
        }
      }
    }

    // Add column drop operations
    for (const column of changes.columnsToDrop || []) {
      operations.push({
        type: OperationType.DROP_COLUMN,
        phase: ExecutionPhase.DESTRUCTIVE_OPERATIONS,
        table: column.table,
        column: column.column,
        data: column,
        dependencies: [],
        sqlStatements: this.generateDropColumnSql(column),
      });
    }

    // Add table drop operations
    for (const tableId of sortedTables) {
      const tableName = tableId.replace("table.", "");
      const table = changes.tablesToDrop?.find(
        (t: any) => t.table === tableName,
      );

      if (table) {
        operations.push({
          type: OperationType.DROP_TABLE,
          phase: ExecutionPhase.DESTRUCTIVE_OPERATIONS,
          table: tableName,
          data: table,
          dependencies: dropDeps.tables.get(tableId) || [],
          sqlStatements: this.generateDropTableSql(table),
        });
      }
    }

    return operations;
  }

  /**
   * Analyzes impact of column/table drops on constraints
   */
  analyzeConstraintImpact(changes: any): Map<string, string[]> {
    const impact = new Map<string, string[]>();

    for (const column of changes.columnsToDrop || []) {
      const affectedConstraints: string[] = [];
      const model = this.models.find((m) => m.table === column.table);

      if (model) {
        const modelColumn = model
          .getColumns()
          .find((c) => c.databaseName === column.column);
        if (modelColumn) {
          // Check primary key constraints
          if (modelColumn.isPrimary) {
            affectedConstraints.push(`PRIMARY KEY on ${column.table}`);
          }

          // Check foreign key constraints
          const relations = model.getRelations();
          for (const relation of relations) {
            if (relation.columnName === modelColumn.columnName) {
              affectedConstraints.push(
                `FOREIGN KEY ${relation.constraintName} on ${column.table}`,
              );
            }
          }
        }
      }

      impact.set(`${column.table}.${column.column}`, affectedConstraints);
    }

    return impact;
  }

  /**
   * Detects operations requiring DROP+CREATE sequences
   */
  detectMixedOperations(changes: any): any[] {
    const mixedOps: any[] = [];

    // Column modifications that affect constraints
    for (const column of changes.columnsToModify || []) {
      const model = this.models.find((m) => m.table === column.table);
      if (model) {
        const modelColumn = model
          .getColumns()
          .find((c) => c.databaseName === column.dbColumns.name);
        if (modelColumn) {
          const hasConstraintChanges = this.hasConstraintChanges(
            column.dbColumns,
            column.modelColumn,
          );
          if (hasConstraintChanges) {
            mixedOps.push({
              type: "column_modification_with_constraints",
              table: column.table,
              column: column.dbColumns.name,
              description: `Column ${column.dbColumns.name} modification requires constraint recreation`,
            });
          }
        }
      }
    }

    // Primary key modifications
    for (const pk of changes.primaryKeysToModify || []) {
      mixedOps.push({
        type: "primary_key_modification",
        table: pk.table,
        description: `Primary key modification on ${pk.table} requires FK recreation`,
      });
    }

    return mixedOps;
  }

  private hasConstraintChanges(dbColumn: any, modelColumn: any): boolean {
    // Check if nullable constraint changed
    if (dbColumn.isNullable !== !modelColumn.constraints?.nullable) {
      return true;
    }

    // Check if unique constraint changed
    if (dbColumn.isUnique !== !!modelColumn.constraints?.unique) {
      return true;
    }

    // Check if default value changed
    if (dbColumn.defaultValue !== modelColumn.constraints?.default) {
      return true;
    }

    return false;
  }

  private generateDropForeignKeySql(relation: any): string[] {
    if (this.sql.getDbType() === "sqlite") {
      return [];
    }
    if (!relation.relation.name) {
      return [];
    }
    return this.sql.alterTable(relation.table, (t) => {
      t.dropConstraint(relation.relation.name);
    });
  }

  private generateDropPrimaryKeySql(table: string): string[] {
    if (this.sql.getDbType() === "sqlite") {
      return [];
    }
    return this.sql.alterTable(table, (t) => {
      t.dropPrimaryKey();
    });
  }

  private generateDropUniqueConstraintSql(
    table: string,
    column: string,
  ): string[] {
    if (this.sql.getDbType() === "sqlite") {
      return [];
    }
    return this.sql.alterTable(table, (t) => {
      t.dropConstraint(`UNIQUE_${column}`);
    });
  }

  private generateDropColumnSql(column: any): string[] {
    return this.sql.alterTable(column.table, (t) => {
      t.dropColumn(column.column);
    });
  }

  private generateDropTableSql(table: any): string[] {
    return [`DROP TABLE ${table.table}`];
  }
}
