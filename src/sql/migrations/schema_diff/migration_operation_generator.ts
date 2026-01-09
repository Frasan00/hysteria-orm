import { format } from "sql-formatter";
import { convertCase } from "../../../utils/case_utils";
import {
  getDefaultFkConstraintName,
  getDefaultPrimaryKeyConstraintName,
} from "../../models/decorators/model_decorators_constants";
import {
  ColumnType,
  LazyRelationType,
} from "../../models/decorators/model_decorators_types";
import { Model } from "../../models/model";
import { RelationEnum } from "../../models/relations/relation";
import { getColumnValue } from "../../resources/utils";
import { SqlDataSource } from "../../sql_data_source";
import { CreateTableBuilder } from "../schema/create_table";
import Schema from "../schema/schema";
import { OnUpdateOrDelete } from "../schema/schema_types";
import { DropOrderResolver } from "./drop_order_resolver";
import {
  ExecutionPhase,
  GenerateTableDiffReturnType,
  MigrationOperation,
  OperationType,
} from "./schema_diff_types";

export class MigrationOperationGenerator {
  private sql: SqlDataSource;
  private models: (typeof Model)[];
  private dropResolver: DropOrderResolver;

  constructor(sql: SqlDataSource) {
    this.sql = sql;
    this.models = Object.values(this.sql.models);
    this.dropResolver = new DropOrderResolver(sql);
  }

  /**
   * Generates migration operations organized by execution phase
   */
  generateOperations(
    changes: GenerateTableDiffReturnType,
  ): MigrationOperation[] {
    const operations: MigrationOperation[] = [];

    // Phase 1: Structure Creation (No Dependencies)
    operations.push(...this.generateStructureCreationOperations(changes));

    // Phase 2: Constraint Creation (Simple Order)
    operations.push(...this.generateConstraintCreationOperations(changes));

    // Phase 3: Destructive Operations (Smart Dependency Resolution)
    operations.push(...this.generateDestructiveOperations(changes));

    // Handle column modifications (mixed operations)
    operations.push(...this.generateColumnModificationOperations(changes));

    const fkKey = (op: MigrationOperation) =>
      op.table && op.constraint ? `${op.table}::${op.constraint}` : undefined;
    const addSet = new Set(
      operations
        .filter((o) => o.type === OperationType.ADD_FOREIGN_KEY)
        .map((o) => fkKey(o))
        .filter(Boolean) as string[],
    );
    const dropSet = new Set(
      operations
        .filter((o) => o.type === OperationType.DROP_FOREIGN_KEY)
        .map((o) => fkKey(o))
        .filter(Boolean) as string[],
    );
    const churn = new Set<string>([...addSet].filter((k) => dropSet.has(k)));
    const filtered = operations.filter((o) => {
      const key = fkKey(o);
      if (!key) {
        return true;
      }
      if (
        churn.has(key) &&
        (o.type === OperationType.ADD_FOREIGN_KEY ||
          o.type === OperationType.DROP_FOREIGN_KEY)
      ) {
        return false;
      }
      return true;
    });

    return filtered;
  }

  /**
   * Phase 1: Structure Creation Operations
   */
  private generateStructureCreationOperations(
    changes: GenerateTableDiffReturnType,
  ): MigrationOperation[] {
    const operations: MigrationOperation[] = [];

    // 1. Create tables (no FK constraints)
    for (const table of changes.tablesToAdd) {
      const createTableSql = this.sql
        .schema()
        .createTable(table.table, (builder) => {
          for (const column of table.columns) {
            if (Array.isArray(column.type)) {
              builder.enum(column.databaseName, column.type);
              continue;
            }

            column.type &&
              this.executeBuilderMethod(
                table.table,
                builder,
                column,
                [
                  column.databaseName,
                  column.length,
                  column.precision && !column.withTimezone
                    ? column.precision
                    : undefined,
                  column.scale,
                  column.withTimezone
                    ? {
                        withTimezone: column.withTimezone,
                        precision: column.precision,
                      }
                    : undefined,
                ].filter(Boolean),
                true,
              );
          }
        })
        .toQuery() as string;

      operations.push({
        type: OperationType.CREATE_TABLE,
        phase: ExecutionPhase.STRUCTURE_CREATION,
        table: table.table,
        data: table,
        dependencies: [],
        sqlStatements: [createTableSql],
      });
    }

    // 2. Add columns
    for (const column of changes.columnsToAdd) {
      const addColumnSql = this.generateAddColumnViaAlter(column);
      operations.push({
        type: OperationType.ADD_COLUMN,
        phase: ExecutionPhase.STRUCTURE_CREATION,
        table: column.table,
        column: column.column.databaseName,
        data: column,
        dependencies: [`table.${column.table}`],
        sqlStatements: addColumnSql,
      });
    }

    return operations;
  }

  /**
   * Phase 2: Constraint Creation Operations
   */
  private generateConstraintCreationOperations(
    changes: GenerateTableDiffReturnType,
  ): MigrationOperation[] {
    const operations: MigrationOperation[] = [];

    // 0. Drop UNIQUE constraints first (e.g., rename cases)
    for (const uq of changes.uniquesToDrop || []) {
      const dropSql = this.sql
        .schema()
        .alterTable(uq.table, (t) => {
          t.dropConstraint(uq.name);
        })
        .toQueries();
      operations.push({
        type: OperationType.DROP_CONSTRAINT,
        phase: ExecutionPhase.CONSTRAINT_CREATION,
        table: uq.table,
        constraint: uq.name,
        data: uq,
        dependencies: [`table.${uq.table}`],
        sqlStatements: dropSql,
      });
    }

    // 1. Drop indexes first (rename cases), but skip ones already handled as unique constraints
    const uniqueDrops = new Set(
      (changes.uniquesToDrop || []).map((u) => u.name),
    );
    for (const idx of changes.indexesToDrop) {
      if (uniqueDrops.has(idx.index)) {
        continue;
      }

      const schema = new Schema(this.sql.getDbType());
      schema.dropIndex(idx.index, idx.table);
      const dropIndexSql = schema.queryStatements[0];
      operations.push({
        type: OperationType.DROP_INDEX,
        phase: ExecutionPhase.CONSTRAINT_CREATION,
        table: idx.table,
        index: idx.index,
        data: idx,
        dependencies: [`table.${idx.table}`],
        sqlStatements: [dropIndexSql],
      });
    }

    // 1. Add PRIMARY KEY constraints
    for (const primaryKey of changes.primaryKeysToAdd) {
      const model = this.models.find((m) => m.table === primaryKey.table);
      const modelPrimaryKeyColumn = model
        ?.getColumns()
        .find((col) => col.columnName === primaryKey.columns[0]);
      const constraintName =
        modelPrimaryKeyColumn?.primaryKeyConstraintName ||
        getDefaultPrimaryKeyConstraintName(
          primaryKey.table,
          primaryKey.columns[0],
        );

      const addPrimaryKeySql = this.sql
        .schema()
        .alterTable(primaryKey.table, (t) => {
          const pkConstraintName =
            constraintName ||
            getDefaultPrimaryKeyConstraintName(
              primaryKey.table,
              primaryKey.columns[0],
            );
          t.addConstraint("primary_key", {
            columns: [primaryKey.columns[0]],
            constraintName: pkConstraintName,
          });
        })
        .toQueries();

      operations.push({
        type: OperationType.ADD_PRIMARY_KEY,
        phase: ExecutionPhase.CONSTRAINT_CREATION,
        table: primaryKey.table,
        constraint: constraintName,
        data: primaryKey,
        dependencies: [`table.${primaryKey.table}`],
        sqlStatements: addPrimaryKeySql,
      });
    }

    // 3. Add FOREIGN KEY constraints
    for (const relation of changes.relationsToAdd) {
      if (relation.relation.type === RelationEnum.manyToMany) {
        continue;
      }

      const addForeignKeySql = this.generateAddRelationViaAlter(relation);
      const effectiveConstraintName = this.computeFkConstraintName(relation);

      operations.push({
        type: OperationType.ADD_FOREIGN_KEY,
        phase: ExecutionPhase.CONSTRAINT_CREATION,
        table: relation.table,
        constraint: effectiveConstraintName,
        data: relation,
        dependencies: this.getForeignKeyDependencies(relation) as any,
        sqlStatements: addForeignKeySql,
      });
    }

    // 4. Add UNIQUE constraints (after drops)
    for (const uq of changes.uniquesToAdd || []) {
      const model = this.models.find((m) => m.table === uq.table);
      const columns = (uq.columns || []).map((col) => {
        const mc = model?.getColumns().find((c) => c.columnName === col);
        return mc?.databaseName || col;
      });
      const addUqSql = this.sql
        .schema()
        .alterTable(uq.table, (t) => {
          t.addConstraint("unique", {
            columns,
            constraintName: uq.name || "mandatory",
          });
        })
        .toQueries();
      operations.push({
        type: OperationType.ADD_UNIQUE_CONSTRAINT,
        phase: ExecutionPhase.CONSTRAINT_CREATION,
        table: uq.table,
        constraint: uq.name || "mandatory",
        data: uq,
        dependencies: [`table.${uq.table}`],
        sqlStatements: addUqSql,
      });
    }

    // 5. Create indexes (after drops)
    for (const index of changes.indexesToAdd) {
      const createIndexSql = this.generateCreateIndexSql(index);
      operations.push({
        type: OperationType.CREATE_INDEX,
        phase: ExecutionPhase.CONSTRAINT_CREATION,
        table: index.table,
        index: index.index,
        data: index,
        dependencies: [`table.${index.table}`],
        sqlStatements: [createIndexSql],
      });
    }

    return operations;
  }

  private computeFkConstraintName(relationData: {
    table: string;
    relation: LazyRelationType;
  }): string | undefined {
    // If explicitly provided, use it
    const explicit = getColumnValue(relationData.relation.constraintName);
    if (explicit) {
      return explicit;
    }

    // Determine referenced table
    let referencesTable = relationData.table;
    if (relationData.relation.type === RelationEnum.belongsTo) {
      referencesTable = relationData.relation.model().table;
    } else if (
      relationData.relation.type === RelationEnum.manyToMany &&
      relationData.relation.manyToManyOptions
    ) {
      referencesTable = getColumnValue(
        relationData.relation.manyToManyOptions.throughModel,
      );
    }

    // Determine source column database name
    const model = this.models.find((m) => m.table === relationData.table);
    const modelColumns = model?.getColumns() || [];
    let sourceColumnName = relationData.relation.columnName;
    if (relationData.relation.type === RelationEnum.belongsTo) {
      const fkModelCol = modelColumns.find(
        (c) => c.columnName === relationData.relation.foreignKey,
      );
      sourceColumnName =
        fkModelCol?.databaseName ||
        (relationData.relation.foreignKey as string);
    } else {
      const mc = modelColumns.find((c) => c.columnName === sourceColumnName);
      sourceColumnName = mc?.databaseName || sourceColumnName;
    }

    return getDefaultFkConstraintName(
      relationData.table,
      sourceColumnName,
      referencesTable,
    );
  }

  /**
   * Phase 3: Destructive Operations (Smart Dependency Resolution)
   */
  private generateDestructiveOperations(
    changes: GenerateTableDiffReturnType,
  ): MigrationOperation[] {
    return this.dropResolver.generateDropOperations(changes);
  }

  /**
   * Handle column modifications (mixed operations)
   */
  private generateColumnModificationOperations(
    changes: GenerateTableDiffReturnType,
  ): MigrationOperation[] {
    const operations: MigrationOperation[] = [];

    // Handle column modifications
    for (const column of changes.columnsToModify || []) {
      const modifySql = this.generateModifyColumnViaAlter(column);
      operations.push({
        type: OperationType.MODIFY_COLUMN,
        phase: ExecutionPhase.DESTRUCTIVE_OPERATIONS,
        table: column.table,
        column: column.dbColumns.name,
        data: column,
        dependencies: [],
        sqlStatements: modifySql,
      });
    }

    return operations;
  }

  /**
   * Gets dependencies for foreign key operations
   */
  private getForeignKeyDependencies(relation: {
    table: string;
    relation: LazyRelationType;
  }): string[] {
    const dependencies: string[] = [];

    if (relation.relation.type === RelationEnum.belongsTo) {
      const relatedModel = relation.relation.model();
      dependencies.push(`table.${relatedModel.table}`);

      // Add dependency on the referenced column
      const pkName = relatedModel.primaryKey || "id";
      const pkColumn = relatedModel
        .getColumns()
        .find((c: ColumnType) => c.columnName === pkName);
      if (pkColumn) {
        dependencies.push(
          `column.${relatedModel.table}.${pkColumn.databaseName}`,
        );
      }
    } else if (
      relation.relation.type === RelationEnum.manyToMany &&
      relation.relation.manyToManyOptions
    ) {
      const throughTable = getColumnValue(
        relation.relation.manyToManyOptions.throughModel,
      );
      dependencies.push(`table.${throughTable}`);
    }

    // Add dependency on the source table and column
    dependencies.push(`table.${relation.table}`);

    const model = this.models.find((m) => m.table === relation.table);
    if (model) {
      const sourceColumn = model
        .getColumns()
        .find(
          (c: ColumnType) =>
            c.columnName === relation.relation.columnName ||
            c.databaseName === relation.relation.columnName,
        );
      if (sourceColumn) {
        dependencies.push(
          `column.${relation.table}.${sourceColumn.databaseName}`,
        );
      }
    }

    return dependencies;
  }

  /**
   * Executes builder method for column creation
   */
  private executeBuilderMethod(
    table: string,
    builder: CreateTableBuilder,
    column: ColumnType,
    args: unknown[],
    applyConstraints: boolean = true,
  ) {
    const b = (builder[column.type as keyof typeof builder] as any)(...args);
    if (!applyConstraints) {
      return b;
    }

    if (column.isPrimary) {
      b.primaryKey({
        constraintName:
          column.primaryKeyConstraintName ||
          getDefaultPrimaryKeyConstraintName(table, column.columnName),
      });
    }

    if (column.constraints?.default !== undefined) {
      b.default(column.constraints.default);
    }

    if (column.constraints?.nullable === false) {
      b.notNullable();
    } else if (column.constraints?.nullable === true) {
      b.nullable();
    }

    return b;
  }

  /**
   * Generates ADD COLUMN SQL via ALTER TABLE
   */
  private generateAddColumnViaAlter(columnData: {
    table: string;
    column: ColumnType;
  }): string[] {
    const args = [
      columnData.column.databaseName,
      columnData.column.length,
      columnData.column.precision && !columnData.column.withTimezone
        ? columnData.column.precision
        : undefined,
      columnData.column.scale,
      columnData.column.withTimezone
        ? {
            withTimezone: columnData.column.withTimezone,
            precision: columnData.column.precision,
          }
        : undefined,
    ].filter(Boolean);

    return this.sql
      .schema()
      .alterTable(columnData.table, (t) => {
        t.addColumn((b) => {
          // First create the column without constraints
          const columnBuilder = this.executeBuilderMethod(
            columnData.table,
            b,
            columnData.column,
            args,
            false,
          );

          // Then apply constraints separately
          if (columnData.column.constraints?.default !== undefined) {
            columnBuilder.default(columnData.column.constraints.default);
          }

          if (columnData.column.constraints?.nullable === false) {
            columnBuilder.notNullable();
          } else if (columnData.column.constraints?.nullable === true) {
            columnBuilder.nullable();
          }

          return columnBuilder;
        });
      })
      .toQueries();
  }

  /**
   * Generates MODIFY COLUMN SQL via ALTER TABLE
   */
  private generateModifyColumnViaAlter(columnData: {
    table: string;
    dbColumns: any;
    modelColumn: ColumnType;
  }): string[] {
    if (this.sql.getDbType() === "sqlite") {
      return [];
    }

    // Generate type changes with constraints
    const args = [
      columnData.modelColumn.databaseName,
      columnData.modelColumn.length,
      columnData.modelColumn.precision && !columnData.modelColumn.withTimezone
        ? columnData.modelColumn.precision
        : undefined,
      columnData.modelColumn.scale,
      columnData.modelColumn.withTimezone
        ? {
            withTimezone: columnData.modelColumn.withTimezone,
            precision: columnData.modelColumn.precision,
          }
        : undefined,
    ].filter(Boolean);

    const alterColumnSql = this.sql
      .schema()
      .alterTable(columnData.table, (t) => {
        t.alterColumn((b) => {
          const columnBuilder = this.executeBuilderMethod(
            columnData.table,
            b,
            columnData.modelColumn,
            args,
            false,
          );

          // Add constraints based on the model column
          if (columnData.modelColumn.constraints?.default !== undefined) {
            columnBuilder.default(columnData.modelColumn.constraints.default);
          }

          if (columnData.modelColumn.constraints?.nullable === false) {
            columnBuilder.notNullable();
          } else if (columnData.modelColumn.constraints?.nullable === true) {
            columnBuilder.nullable();
          }

          return columnBuilder;
        });
      })
      .toQueries();

    return alterColumnSql;
  }

  /**
   * Generates CREATE INDEX SQL using schema builder
   */
  private generateCreateIndexSql(indexData: {
    table: string;
    index: string;
  }): string {
    const model = this.models.find((m) => m.table === indexData.table);
    const indexDef = model
      ?.getIndexes()
      .find((idx) => idx.name === indexData.index);
    const cols = (indexDef?.columns || []).map((col) => {
      const mc = model?.getColumns().find((c) => c.columnName === col);
      return mc?.databaseName || col;
    });

    const schema = new Schema(this.sql.getDbType());
    schema.createIndex(indexData.table, cols, {
      constraintName: indexData.index,
    });

    // Return the generated SQL
    return schema.queryStatements[0] || "";
  }

  /**
   * Generates ADD FOREIGN KEY SQL via ALTER TABLE
   */
  private generateAddRelationViaAlter(relationData: {
    table: string;
    relation: LazyRelationType;
  }): string[] {
    let referencesTable = relationData.table;
    let referencesColumn = relationData.relation.foreignKey;

    if (relationData.relation.type === RelationEnum.belongsTo) {
      referencesTable = relationData.relation.model().table;
      referencesColumn = relationData.relation.model().primaryKey || "id";
    } else if (
      relationData.relation.type === RelationEnum.manyToMany &&
      relationData.relation.manyToManyOptions
    ) {
      referencesTable = getColumnValue(
        relationData.relation.manyToManyOptions.throughModel,
      );
      referencesColumn = getColumnValue(
        relationData.relation.manyToManyOptions.rightForeignKey,
      );

      if (!referencesColumn || referencesColumn === "undefined") {
        referencesColumn = relationData.relation.model().primaryKey || "id";
      }
    }

    const constraintName =
      typeof relationData.relation.constraintName === "string"
        ? (relationData.relation.constraintName as string)
        : undefined;
    let foreignKeyColumn = getColumnValue(referencesColumn);

    if (relationData.relation.type === RelationEnum.belongsTo) {
      const relatedModel = relationData.relation.model();
      const primaryKeyName = relatedModel.primaryKey;
      const relatedModelColumns = relatedModel.getColumns();
      const relatedModelPKColumn = relatedModelColumns.find(
        (col) => col.columnName === primaryKeyName,
      );

      if (relatedModelPKColumn) {
        foreignKeyColumn = relatedModelPKColumn.databaseName;
      } else {
        const databaseCaseConvention =
          relatedModel?.databaseCaseConvention || "preserve";
        foreignKeyColumn = convertCase(primaryKeyName, databaseCaseConvention);
      }
    } else if (
      relationData.relation.type === RelationEnum.manyToMany &&
      relationData.relation.manyToManyOptions
    ) {
      const relatedModel = relationData.relation.model();

      if (typeof foreignKeyColumn === "string" && foreignKeyColumn) {
        const relatedModelColumns = relatedModel.getColumns();
        const specifiedColumn = relatedModelColumns.find(
          (col) => col.columnName === foreignKeyColumn,
        );

        if (specifiedColumn) {
          foreignKeyColumn = specifiedColumn.databaseName;
        } else {
          const primaryKeyName = relatedModel.primaryKey || "id";
          const relatedModelPKColumn = relatedModelColumns.find(
            (col) => col.columnName === primaryKeyName,
          );

          if (relatedModelPKColumn) {
            foreignKeyColumn = relatedModelPKColumn.databaseName;
          } else {
            const databaseCaseConvention =
              relatedModel?.databaseCaseConvention || "preserve";
            foreignKeyColumn = convertCase(
              foreignKeyColumn || primaryKeyName,
              databaseCaseConvention,
            );
          }
        }
      } else {
        const primaryKeyName = relatedModel.primaryKey || "id";
        const relatedModelColumns = relatedModel.getColumns();
        const relatedModelPKColumn = relatedModelColumns.find(
          (col) => col.columnName === primaryKeyName,
        );

        if (relatedModelPKColumn) {
          foreignKeyColumn = relatedModelPKColumn.databaseName;
        } else {
          const databaseCaseConvention =
            relatedModel?.databaseCaseConvention || "preserve";
          foreignKeyColumn = convertCase(
            primaryKeyName,
            databaseCaseConvention,
          );
        }
      }
    }

    const model = this.models.find((m) => m.table === relationData.table);
    const modelColumns = model?.getColumns() || [];

    let sourceColumnName = relationData.relation.columnName;

    const modelColumn = modelColumns.find(
      (col) => col.columnName === sourceColumnName,
    );

    if (modelColumn) {
      sourceColumnName = modelColumn.databaseName;
    } else {
      const databaseCaseConvention =
        model?.databaseCaseConvention || "preserve";
      sourceColumnName = convertCase(sourceColumnName, databaseCaseConvention);
    }

    if (relationData.relation.type === RelationEnum.belongsTo) {
      const foreignKeyColumn = modelColumns.find(
        (col) => col.columnName === relationData.relation.foreignKey,
      );

      if (foreignKeyColumn) {
        sourceColumnName = foreignKeyColumn.databaseName;
      } else {
        const databaseCaseConvention =
          model?.databaseCaseConvention || "preserve";
        sourceColumnName = convertCase(
          relationData.relation.foreignKey,
          databaseCaseConvention,
        );
      }
    } else if (
      relationData.relation.type === RelationEnum.manyToMany &&
      relationData.relation.manyToManyOptions
    ) {
      const leftKey = relationData.relation.manyToManyOptions.leftForeignKey;
      const leftKeyStr = getColumnValue(leftKey);

      const leftKeyColumn = modelColumns.find(
        (col) => col.columnName === leftKeyStr,
      );

      if (leftKeyColumn) {
        sourceColumnName = leftKeyColumn.databaseName;
      } else {
        const databaseCaseConvention =
          model?.databaseCaseConvention || "preserve";
        sourceColumnName = convertCase(leftKeyStr, databaseCaseConvention);
      }
    }

    const onDelete = relationData.relation.onDelete?.toLowerCase() as
      | OnUpdateOrDelete
      | undefined;
    const onUpdate = relationData.relation.onUpdate?.toLowerCase() as
      | OnUpdateOrDelete
      | undefined;

    return this.sql
      .schema()
      .alterTable(relationData.table, (t) => {
        const fkConstraintName =
          constraintName ||
          getDefaultFkConstraintName(
            relationData.table,
            sourceColumnName,
            referencesTable,
          );

        t.addConstraint("foreign_key", {
          columns: [sourceColumnName],
          references: {
            table: referencesTable,
            columns: [foreignKeyColumn],
          },
          constraintName: fkConstraintName,
          onDelete,
          onUpdate,
        });
      })
      .toQueries();
  }

  /**
   * Formats SQL statements consistently
   */
  formatSqlStatements(operations: MigrationOperation[]): MigrationOperation[] {
    return operations.map((operation) => ({
      ...operation,
      sqlStatements: operation.sqlStatements.map((statement) =>
        format(statement, {
          ...this.sql.inputDetails.queryFormatOptions,
        })
          .replace(/\n/g, " ")
          .replace(/\s+/g, " "),
      ),
    }));
  }
}
