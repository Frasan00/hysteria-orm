import {
  getDefaultFkConstraintName,
  getDefaultForeignKey,
} from "../../models/decorators/model_decorators_constants";
import {
  ColumnType,
  LazyRelationType,
} from "../../models/decorators/model_decorators_types";
import { Model } from "../../models/model";
import { RelationEnum } from "../../models/relations/relation";
import { getColumnValue } from "../../resources/utils";
import {
  TableColumnInfo,
  TableForeignKeyInfo,
  TableIndexInfo,
  TablePrimaryKeyInfo,
} from "../../schema_introspection_types";
import { SqlDataSource } from "../../sql_data_source";
import { MigrationOperationGenerator } from "./migration_operation_generator";
import {
  ExecutionPhase,
  GenerateTableDiffReturnType,
} from "./schema_diff_types";
import { normalizeColumnType } from "./type_normalizer";

export class SchemaDiff {
  private sql: SqlDataSource;
  private models: (typeof Model)[];
  private data: GenerateTableDiffReturnType;
  private readonly emptyStatements = [/alter table ".*"$/];

  private constructor(sql: SqlDataSource) {
    this.sql = sql;
    this.models = Object.values(this.sql.registeredModels);
    this.data = {
      columnsToAdd: [],
      columnsToDrop: [],
      columnsToModify: [],
      indexesToAdd: [],
      indexesToDrop: [],
      uniquesToAdd: [],
      uniquesToDrop: [],
      tablesToAdd: [],
      relationsToAdd: [],
      relationsToDrop: [],
      relationsToModify: [],
      primaryKeysToAdd: [],
      primaryKeysToDrop: [],
      primaryKeysToModify: [],
    };
  }

  static async makeDiff(sql: SqlDataSource): Promise<SchemaDiff> {
    const diff = new SchemaDiff(sql);
    await Promise.all(
      diff.models.map(async (model) => {
        const databaseData = await diff.sql.getTableSchema(model.table);
        const modelData = {
          columns: model.getColumns(),
          indexes: model.getIndexes(),
          relations: model.getRelations(),
        };

        // Table not present in the database
        if (!databaseData.columns.length) {
          diff.data.tablesToAdd.push({
            table: model.table,
            columns: modelData.columns,
          });

          for (const index of modelData.indexes) {
            if (
              !databaseData.indexes
                .map((dbIndex) => dbIndex.name)
                .includes(index.name)
            ) {
              diff.data.indexesToAdd.push({
                table: model.table,
                index: index.name,
              });
            }
          }

          const modelUniques = (model as typeof Model).getUniques?.() || [];
          for (const uq of modelUniques) {
            diff.data.uniquesToAdd!.push({
              table: model.table,
              name: uq.name || "mandatory",
              columns: uq.columns,
            });
          }

          for (const relation of modelData.relations) {
            if (
              relation.type !== RelationEnum.belongsTo &&
              relation.type !== RelationEnum.manyToMany
            ) {
              continue;
            }

            if (
              relation.type === RelationEnum.manyToMany &&
              relation.manyToManyOptions
            ) {
              const throughTable = getColumnValue(
                relation.manyToManyOptions.throughModel,
              );

              // Only add the left side (this model)
              diff.data.relationsToAdd.push({
                table: throughTable,
                relation: {
                  type: RelationEnum.belongsTo,
                  model: () => model,
                  columnName: getColumnValue(
                    relation.manyToManyOptions.leftForeignKey,
                  ),
                  foreignKey: relation.manyToManyOptions.leftForeignKey,
                  constraintName: relation.constraintName
                    ? getColumnValue(relation.constraintName)
                    : getDefaultFkConstraintName(
                        throughTable,
                        getColumnValue(
                          relation.manyToManyOptions.leftForeignKey,
                        ),
                        model.table,
                      ),
                  onDelete: relation.onDelete,
                  onUpdate: relation.onUpdate,
                },
                onDelete: relation.onDelete,
                onUpdate: relation.onUpdate,
              });
              continue;
            }

            const expectedConstraintName = getColumnValue(
              relation.constraintName,
            );

            const dbRelation = databaseData.foreignKeys.find(
              (fk) => fk.name === expectedConstraintName,
            );

            if (!dbRelation) {
              diff.data.relationsToAdd.push({
                table: model.table,
                relation: relation,
                onDelete: relation.onDelete,
                onUpdate: relation.onUpdate,
              });
            }
          }

          return;
        }

        // Columns to add
        for (const column of modelData.columns) {
          if (
            !databaseData.columns
              .map((dbColumn) => dbColumn.name)
              .includes(column.databaseName)
          ) {
            diff.data.columnsToAdd.push({
              table: model.table,
              column: column,
            });
          }
        }

        // Columns to drop
        for (const column of databaseData.columns) {
          if (
            !modelData.columns
              .map((modelColumn) => modelColumn.databaseName)
              .includes(column.name)
          ) {
            diff.data.columnsToDrop.push({
              table: model.table,
              column: column.name,
            });
          }
        }

        // Indexes to add
        for (const index of modelData.indexes) {
          if (
            !databaseData.indexes
              .map((dbIndex) => dbIndex.name)
              .includes(index.name)
          ) {
            diff.data.indexesToAdd.push({
              table: model.table,
              index: index.name,
            });
          }
        }

        // Unique constraints to add (via decorator)
        const modelUniques = (model as typeof Model).getUniques?.() || [];
        for (const uq of modelUniques) {
          const exists = databaseData.indexes.some(
            (dbIndex) => dbIndex.name === uq.name && dbIndex.isUnique,
          );
          if (!exists) {
            diff.data.uniquesToAdd!.push({
              table: model.table,
              name: uq.name || "mandatory",
              columns: uq.columns,
            });
          }
        }

        // Indexes to drop (ignore unique indexes managed by constraints)
        for (const index of databaseData.indexes) {
          if (index.isUnique) {
            continue;
          }

          const existsInModel = modelData.indexes
            .map((modelIndex) => modelIndex.name)
            .includes(index.name);
          if (existsInModel) {
            continue;
          }

          diff.data.indexesToDrop.push({
            table: model.table,
            index: index.name,
          });
        }

        // Unique constraints to drop (not present in model uniques but unique in DB)
        for (const dbIndex of databaseData.indexes) {
          if (!dbIndex.isUnique) {
            continue;
          }
          const existsInModel = ((model as typeof Model).getUniques?.() || [])
            .map((u) => u.name)
            .includes(dbIndex.name);
          if (!existsInModel) {
            diff.data.uniquesToDrop!.push({
              table: model.table,
              name: dbIndex.name,
            });
          }
        }

        // Columns to modify
        for (const column of modelData.columns) {
          const dbColumn = databaseData.columns.find(
            (dbCol) => dbCol.name === column.databaseName,
          );

          if (!dbColumn) {
            continue;
          }

          const hasStructChange = !diff.areColumnsEqual(
            dbColumn,
            column,
            databaseData.indexes,
          );
          const defaultChange = diff.getDefaultChange({
            table: model.table,
            dbColumns: dbColumn,
            modelColumn: column,
          });

          if (hasStructChange || defaultChange) {
            diff.data.columnsToModify.push({
              table: model.table,
              dbColumns: dbColumn,
              modelColumn: column,
            });
          }
        }

        // Relations to add
        for (const relation of modelData.relations) {
          if (
            relation.type !== RelationEnum.belongsTo &&
            relation.type !== RelationEnum.manyToMany
          ) {
            continue;
          }

          if (
            relation.type === RelationEnum.manyToMany &&
            relation.manyToManyOptions
          ) {
            const throughTable = getColumnValue(
              relation.manyToManyOptions.throughModel,
            );

            // Add the left side (this model)
            diff.data.relationsToAdd.push({
              table: throughTable,
              relation: {
                type: RelationEnum.belongsTo,
                model: () => model,
                columnName: getColumnValue(
                  relation.manyToManyOptions.leftForeignKey,
                ),
                foreignKey: relation.manyToManyOptions.leftForeignKey,
                constraintName: relation.constraintName
                  ? getColumnValue(relation.constraintName)
                  : getDefaultFkConstraintName(
                      throughTable,
                      getColumnValue(
                        relation.manyToManyOptions.leftForeignKey ||
                          getDefaultForeignKey(model.table),
                      ),
                      model.table,
                    ),
                onDelete: relation.onDelete,
                onUpdate: relation.onUpdate,
              },
              onDelete: relation.onDelete,
              onUpdate: relation.onUpdate,
            });
            continue;
          }

          const dbRelation = databaseData.foreignKeys.find((fk) =>
            diff.areRelationsEqual(fk, relation),
          );

          if (!dbRelation) {
            diff.data.relationsToAdd.push({
              table: model.table,
              relation: relation,
              onDelete: relation.onDelete,
              onUpdate: relation.onUpdate,
            });
          }
        }

        // Relations to drop
        for (const dbRelation of databaseData.foreignKeys) {
          const modelRelation = modelData.relations.find(
            (rel) =>
              (rel.type === RelationEnum.belongsTo ||
                rel.type === RelationEnum.manyToMany) &&
              diff.areRelationsEqual(dbRelation, rel),
          );

          if (!modelRelation) {
            diff.data.relationsToDrop.push({
              table: model.table,
              relation: dbRelation,
            });
          }
        }

        // Relations to modify
        for (const modelRelation of modelData.relations) {
          if (
            modelRelation.type !== RelationEnum.belongsTo &&
            modelRelation.type !== RelationEnum.manyToMany
          ) {
            continue;
          }

          const dbRelation = databaseData.foreignKeys.find((fk) =>
            diff.areRelationsEqual(fk, modelRelation),
          );

          if (
            dbRelation &&
            !diff.areRelationsEqual(dbRelation, modelRelation)
          ) {
            diff.data.relationsToModify.push({
              table: model.table,
              dbRelation: dbRelation,
              modelRelation: modelRelation,
              onDelete: modelRelation.onDelete,
              onUpdate: modelRelation.onUpdate,
            });
          }
        }

        // Primary key to add
        const modelPrimaryKey = model.primaryKey;
        if (modelPrimaryKey && !databaseData.primaryKey) {
          diff.data.primaryKeysToAdd.push({
            table: model.table,
            columns: [modelPrimaryKey],
          });
        }

        // Primary key to drop
        if (databaseData.primaryKey && !modelPrimaryKey) {
          diff.data.primaryKeysToDrop.push({
            table: model.table,
            columns: databaseData.primaryKey.columns,
            name: databaseData.primaryKey.name,
          });
        }

        // Primary key to modify
        if (modelPrimaryKey && databaseData.primaryKey) {
          const modelPrimaryKeyColumn = model
            .getColumns()
            .find((col) => col.columnName === modelPrimaryKey);

          if (
            modelPrimaryKeyColumn &&
            !diff.arePrimaryKeysEqual(
              databaseData.primaryKey,
              modelPrimaryKeyColumn,
            )
          ) {
            diff.data.primaryKeysToModify.push({
              table: model.table,
              dbPrimaryKey: databaseData.primaryKey,
              modelPrimaryKey: modelPrimaryKey,
            });
          }
        }
      }),
    );

    return diff;
  }

  getSqlStatements(): string[] {
    const operations = this.getSqlStatementsByPhase();
    return Object.values(operations).flat();
  }

  /**
   * Gets all SQL statements organized by execution phase
   * This is the single API to get all migration SQL statements
   */
  private getSqlStatementsByPhase(): Record<ExecutionPhase, string[]> {
    const operationGenerator = new MigrationOperationGenerator(this.sql);
    const operations = operationGenerator.generateOperations(this.data);
    const formattedOperations =
      operationGenerator.formatSqlStatements(operations);

    const statementsByPhase: Record<ExecutionPhase, string[]> = {
      [ExecutionPhase.STRUCTURE_CREATION]: [],
      [ExecutionPhase.CONSTRAINT_CREATION]: [],
      [ExecutionPhase.DESTRUCTIVE_OPERATIONS]: [],
    };

    for (const operation of formattedOperations) {
      statementsByPhase[operation.phase].push(...operation.sqlStatements);
    }

    return statementsByPhase;
  }

  private areColumnsEqual(
    dbColumn: TableColumnInfo,
    modelColumn: ColumnType,
    dbIndexes: TableIndexInfo[] = [],
  ): boolean {
    // Only provided types in the model are chosen for the diff
    let baseCondition = dbColumn.name === modelColumn.databaseName;

    const dialect = this.sql.getDbType();
    const normalizedDbType = normalizeColumnType(dialect, dbColumn.dataType);
    const normalizedModelType =
      typeof modelColumn.type === "string"
        ? normalizeColumnType(dialect, modelColumn.type)
        : undefined;

    if (normalizedModelType) {
      baseCondition &&= normalizedDbType === normalizedModelType;
    }

    if (modelColumn.length != null && dbColumn.length != null) {
      baseCondition &&= dbColumn.length === modelColumn.length;
    }

    const isFloatingType =
      normalizedModelType === "real" ||
      normalizedModelType === "double" ||
      normalizedModelType === "float";

    if (modelColumn.precision != null && dbColumn.precision != null) {
      if (
        (dialect === "postgres" || dialect === "cockroachdb") &&
        isFloatingType
      ) {
        // Ignore precision differences for floating types in Postgres/Cockroach
      } else {
        baseCondition &&= dbColumn.precision === modelColumn.precision;
      }
    }

    if (modelColumn.scale != null && dbColumn.scale != null) {
      if (
        (dialect === "postgres" || dialect === "cockroachdb") &&
        isFloatingType
      ) {
        // Ignore scale differences for floating types in Postgres/Cockroach
      } else {
        baseCondition &&= dbColumn.scale === modelColumn.scale;
      }
    }

    if (typeof modelColumn.type === "string") {
      const isTimestampLike =
        normalizedModelType === "timestamp" || normalizedModelType === "time";
      if (isTimestampLike) {
        if (
          modelColumn.withTimezone !== undefined &&
          dbColumn.withTimezone !== undefined
        ) {
          baseCondition &&=
            !!dbColumn.withTimezone === !!modelColumn.withTimezone;
        }
      }
    }

    // Check nullable constraint changes
    if (modelColumn.constraints?.nullable !== undefined) {
      const modelNullable = modelColumn.constraints.nullable;
      const dbNullable = dbColumn.isNullable;
      const nullableMatch = modelNullable === dbNullable;
      baseCondition = baseCondition && nullableMatch;
    }

    return baseCondition;
  }

  private areRelationsEqual(
    dbRelation: TableForeignKeyInfo,
    modelRelation: LazyRelationType,
  ): boolean {
    const expectedConstraintName = getColumnValue(modelRelation.constraintName);

    let baseCondition = expectedConstraintName
      ? dbRelation.name === expectedConstraintName
      : true;
    if (modelRelation.type === RelationEnum.belongsTo) {
      const relatedModel = modelRelation.model();
      const pkName = relatedModel.primaryKey || "id";
      const pkColumn = relatedModel
        .getColumns()
        .find((c) => c.columnName === pkName);
      const expectedRefTable = relatedModel.table;
      const expectedRefColumn = pkColumn?.databaseName || pkName;

      baseCondition =
        baseCondition &&
        dbRelation.referencedTable === expectedRefTable &&
        !!dbRelation.referencedColumns &&
        dbRelation.referencedColumns.length === 1 &&
        dbRelation.referencedColumns[0] === expectedRefColumn;
    } else if (
      modelRelation.type === RelationEnum.manyToMany &&
      modelRelation.manyToManyOptions
    ) {
      const expectedThroughTable = getColumnValue(
        modelRelation.manyToManyOptions.throughModel,
      );
      baseCondition =
        baseCondition && dbRelation.referencedTable === expectedThroughTable;
    }

    const dbOnDelete = dbRelation.onDelete?.toLowerCase();
    const dbOnUpdate = dbRelation.onUpdate?.toLowerCase();
    const modelOnDelete = modelRelation.onDelete?.toLowerCase();
    const modelOnUpdate = modelRelation.onUpdate?.toLowerCase();

    if (modelOnDelete) {
      baseCondition &&= dbOnDelete === modelOnDelete;
    }

    if (modelOnUpdate) {
      baseCondition &&= dbOnUpdate === modelOnUpdate;
    }

    return baseCondition;
  }

  private arePrimaryKeysEqual(
    dbPrimaryKey: TablePrimaryKeyInfo,
    modelPrimaryKeyColumn: ColumnType,
  ): boolean {
    if (dbPrimaryKey.columns.length !== 1) {
      return false;
    }

    const dbPrimaryKeyColumn = dbPrimaryKey.columns[0];
    const columnsMatch =
      dbPrimaryKeyColumn === modelPrimaryKeyColumn.databaseName;

    const constraintNamesMatch =
      !dbPrimaryKey.name ||
      !modelPrimaryKeyColumn.primaryKeyConstraintName ||
      dbPrimaryKey.name === modelPrimaryKeyColumn.primaryKeyConstraintName;

    return columnsMatch && constraintNamesMatch;
  }
  private getDefaultChange(columnData: {
    table: string;
    dbColumns: TableColumnInfo;
    modelColumn: ColumnType;
  }): "set" | "drop" | false {
    const dialect = this.sql.getDbType();
    const normalizedDbType = normalizeColumnType(
      dialect,
      columnData.dbColumns.dataType,
    );
    const normalizedModelType =
      typeof columnData.modelColumn.type === "string"
        ? normalizeColumnType(dialect, columnData.modelColumn.type)
        : undefined;
    if (normalizedModelType && normalizedDbType !== normalizedModelType) {
      return false;
    }
    if (
      columnData.modelColumn.length != null &&
      columnData.dbColumns.length != null &&
      columnData.dbColumns.length !== columnData.modelColumn.length
    ) {
      return false;
    }
    if (
      columnData.modelColumn.precision != null &&
      columnData.dbColumns.precision != null &&
      columnData.dbColumns.precision !== columnData.modelColumn.precision
    ) {
      return false;
    }
    if (
      columnData.modelColumn.scale != null &&
      columnData.dbColumns.scale != null &&
      columnData.dbColumns.scale !== columnData.modelColumn.scale
    ) {
      return false;
    }
    if (
      typeof columnData.modelColumn.type === "string" &&
      (normalizedModelType === "timestamp" || normalizedModelType === "time") &&
      columnData.modelColumn.withTimezone !== undefined &&
      columnData.dbColumns.withTimezone !== undefined &&
      !!columnData.dbColumns.withTimezone !==
        !!columnData.modelColumn.withTimezone
    ) {
      return false;
    }
    const modelHasDefault =
      columnData.modelColumn.constraints?.default !== undefined;
    const dbHasDefault =
      columnData.dbColumns.defaultValue !== null &&
      columnData.dbColumns.defaultValue !== undefined;
    if (modelHasDefault && !dbHasDefault) {
      return "set";
    }
    if (!modelHasDefault && dbHasDefault) {
      return "drop";
    }
    if (modelHasDefault && dbHasDefault) {
      const dbDefault = String(columnData.dbColumns.defaultValue);
      const modelDefault = String(
        columnData.modelColumn.constraints?.default as any,
      );

      const dbNorm = this.normalizeDefaultValue(
        dialect,
        normalizedDbType,
        dbDefault,
      );
      const modelNorm = this.normalizeDefaultValue(
        dialect,
        normalizedModelType || normalizedDbType,
        modelDefault,
      );
      return dbNorm !== modelNorm ? "set" : false;
    }
    return false;
  }

  private normalizeDefaultValue(
    dialect: ReturnType<SqlDataSource["getDbType"]>,
    dataType: string | undefined,
    value: string,
  ): string {
    let v = String(value).trim();
    if (!v) {
      return v;
    }
    if (dialect === "postgres" || dialect === "cockroachdb") {
      // Special handling for JSON/JSONB default values
      if (dataType === "json" || dataType === "jsonb") {
        try {
          // Remove PostgreSQL type annotations and quotes
          v = v.replace(/^\((.*)\)$/s, "$1");
          v = v.replace(/::(jsonb?|[a-zA-Z_ ]+[\[\]]*)/g, "");

          // Remove outer quotes if present
          const singleQuoted = v.match(/^'(.*)'$/s);
          if (singleQuoted) {
            v = singleQuoted[1];
          }

          // For empty object representations
          if (v === "{}" || v === "") {
            return "{}";
          }

          // Parse and re-stringify to normalize JSON format
          const parsed = JSON.parse(v);
          return JSON.stringify(parsed);
        } catch (e) {
          // If parsing fails, continue with regular normalization
        }
      }

      // Regular normalization for non-JSON types
      v = v.replace(/^\((.*)\)$/s, "$1");
      v = v.replace(/::[a-zA-Z_ ]+[\[\]]*/g, "");
      const singleQuoted = v.match(/^'(.*)'$/s);
      if (singleQuoted) {
        v = singleQuoted[1];
      }
      if (/^true$/i.test(v)) {
        return "true";
      }
      if (/^false$/i.test(v)) {
        return "false";
      }
      if (/^null$/i.test(v)) {
        return "null";
      }
      if (/^\d+(?:\.\d+)?$/.test(v)) {
        return v;
      }
      return v;
    }
    if (dialect === "mysql" || dialect === "mariadb") {
      v = v.replace(/^\((.*)\)$/s, "$1");
      const singleQuoted = v.match(/^'(.*)'$/s);
      if (singleQuoted) {
        v = singleQuoted[1];
      }
      if (/^current_timestamp(?:\(\d+\))?$/i.test(v)) {
        return "current_timestamp";
      }
      return v;
    }
    if (dialect === "sqlite") {
      v = v.replace(/^\((.*)\)$/s, "$1");
      const singleQuoted = v.match(/^'(.*)'$/s);
      if (singleQuoted) {
        v = singleQuoted[1];
      }
      return v.toLowerCase();
    }
    return v;
  }
}
