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
  RelationsToAdd,
} from "./schema_diff_types";
import { normalizeColumnType } from "./type_normalizer";

export class SchemaDiff {
  private sql: SqlDataSource;
  private models: (typeof Model)[];
  private data: GenerateTableDiffReturnType;
  private readonly emptyStatements = [/alter table ".*"$/];

  private constructor(sql: SqlDataSource) {
    this.sql = sql;
    this.models = Object.values(this.sql.models);
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
          // Ignore columns that don't declare a type
          columns: model
            .getColumns()
            .filter((c) => c?.type !== undefined && c?.type !== null),
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
            if (relation.type !== RelationEnum.belongsTo) {
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
          const existsInDb = databaseData.columns.some(
            (dbColumn) =>
              dbColumn.name === column.databaseName ||
              dbColumn.name === column.columnName,
          );
          if (!existsInDb) {
            diff.data.columnsToAdd.push({
              table: model.table,
              column: column,
            });
          }
        }

        // Columns to drop
        for (const column of databaseData.columns) {
          const existsInModel = modelData.columns.some(
            (modelColumn) =>
              modelColumn.databaseName === column.name ||
              modelColumn.columnName === column.name,
          );
          if (!existsInModel) {
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
            (dbCol) =>
              dbCol.name === column.databaseName ||
              dbCol.name === column.columnName,
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

          const expectedName = getColumnValue(relation.constraintName);
          if (
            expectedName &&
            databaseData.foreignKeys.some((fk) => fk.name === expectedName)
          ) {
            continue;
          }

          const dbRelation = databaseData.foreignKeys.find((fk) =>
            diff.relationMatchesDbRelation(model, relation, fk),
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
        const modelExpectedFkNames = new Set(
          modelData.relations
            .filter((rel) => rel.type === RelationEnum.belongsTo)
            .map((rel) => {
              const srcCol = getColumnValue(rel.foreignKey) || rel.columnName;
              const mc = model
                .getColumns()
                .find((c) => c.columnName === srcCol);
              const srcDb = mc?.databaseName || srcCol;
              return (
                getColumnValue(rel.constraintName) ||
                getDefaultFkConstraintName(
                  model.table,
                  srcDb,
                  rel.model().table,
                )
              );
            }),
        );

        for (const dbRelation of databaseData.foreignKeys) {
          if (dbRelation.name && modelExpectedFkNames.has(dbRelation.name)) {
            continue;
          }

          const modelRelation = modelData.relations.find((rel) => {
            if (
              rel.type !== RelationEnum.belongsTo &&
              rel.type !== RelationEnum.manyToMany
            ) {
              return false;
            }
            return diff.relationMatchesDbRelation(
              model,
              rel as any,
              dbRelation,
            );
          });

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
            diff.relationMatchesDbRelation(model, modelRelation, fk),
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

    await diff.processManyToMany();

    await diff.removeFkChurnByName();

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

  private relationMatchesDbRelation(
    model: typeof Model,
    modelRelation: LazyRelationType,
    dbRelation: TableForeignKeyInfo,
  ): boolean {
    let relatedModel: typeof Model | undefined;
    const mr: any = modelRelation as any;
    if (mr && mr.model) {
      if (typeof mr.model === "function" && mr.model.table) {
        relatedModel = mr.model as typeof Model;
      } else if (typeof mr.model === "function") {
        try {
          const v = mr.model();
          if (v && v.table) {
            relatedModel = v as typeof Model;
          }
        } catch (_) {}
      }
    }

    if (!relatedModel) {
      return false;
    }
    const expectedReferencedTable =
      modelRelation.type === RelationEnum.belongsTo
        ? relatedModel.table
        : modelRelation.type === RelationEnum.manyToMany &&
            modelRelation.manyToManyOptions
          ? getColumnValue(modelRelation.manyToManyOptions.throughModel)
          : undefined;

    if (
      expectedReferencedTable &&
      dbRelation.referencedTable !== expectedReferencedTable
    ) {
      return false;
    }

    const fkName = getColumnValue(modelRelation.constraintName);
    if (fkName && dbRelation.name && fkName !== dbRelation.name) {
      return false;
    }

    const modelColumns = model.getColumns();
    const relationType = (mr.type as RelationEnum) || RelationEnum.belongsTo;
    let localColumn =
      relationType === RelationEnum.belongsTo
        ? getColumnValue(mr.foreignKey)
        : mr.columnName;
    const mc = modelColumns.find((c) => c.columnName === localColumn);
    if (mc) {
      localColumn = mc.databaseName;
    }

    const referencedPkName = relatedModel.primaryKey || "id";
    const relatedPk = relatedModel
      .getColumns()
      .find((c) => c.columnName === referencedPkName);
    const referencedColumn = relatedPk?.databaseName || referencedPkName;

    return (
      dbRelation.columns.length === 1 &&
      dbRelation.columns[0] === localColumn &&
      dbRelation.referencedColumns.length === 1 &&
      dbRelation.referencedColumns[0] === referencedColumn
    );
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
        } catch (_) {
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

  private async processManyToMany(): Promise<void> {
    const processed = new Set<string>();
    for (const model of this.models) {
      const relations = model.getRelations();
      for (const relation of relations) {
        if (
          relation.type !== RelationEnum.manyToMany ||
          !relation.manyToManyOptions
        ) {
          continue;
        }
        if (relation.manyToManyOptions.wasModelProvided) {
          continue;
        }

        const throughTable = getColumnValue(
          relation.manyToManyOptions.throughModel,
        );
        if (processed.has(throughTable)) {
          continue;
        }
        processed.add(throughTable);

        const leftModel = this.models.find(
          (m) => m.table === relation?.manyToManyOptions?.primaryModel,
        );
        const rightModel = relation.model();
        if (!leftModel || !rightModel) {
          continue;
        }

        const leftPkName = leftModel.primaryKey || "id";
        const rightPkName = rightModel.primaryKey || "id";
        const leftPk = leftModel
          .getColumns()
          .find((c) => c.columnName === leftPkName);
        const rightPk = rightModel
          .getColumns()
          .find((c) => c.columnName === rightPkName);
        if (!leftPk || !rightPk) {
          continue;
        }

        const leftFkName =
          getColumnValue(relation.manyToManyOptions.leftForeignKey) ||
          leftPkName;
        const rightFkName =
          getColumnValue(relation.manyToManyOptions.rightForeignKey) ||
          rightPkName;

        const dbThrough = await this.sql.getTableSchema(throughTable);
        if (!dbThrough.columns.length) {
          this.data.tablesToAdd.push({
            table: throughTable,
            columns: [
              this.clonePkAsColumn(leftPk, leftFkName),
              this.clonePkAsColumn(rightPk, rightFkName),
            ],
          });

          this.pushM2mFkRelations({
            throughTable,
            leftModel,
            rightModel,
            leftFkName,
            rightFkName,
            onDelete: relation.onDelete,
            onUpdate: relation.onUpdate,
            constraintName: undefined,
          });
          continue;
        }

        const leftExpected = this.clonePkAsColumn(leftPk, leftFkName);
        const rightExpected = this.clonePkAsColumn(rightPk, rightFkName);
        const leftDbCol = dbThrough.columns.find((c) => c.name === leftFkName);
        const rightDbCol = dbThrough.columns.find(
          (c) => c.name === rightFkName,
        );
        const leftColOk = leftDbCol
          ? this.areColumnsEqual(leftDbCol, leftExpected, dbThrough.indexes)
          : false;
        const rightColOk = rightDbCol
          ? this.areColumnsEqual(rightDbCol, rightExpected, dbThrough.indexes)
          : false;

        // Drop old FK-bound columns that do not match the expected names
        for (const fk of dbThrough.foreignKeys) {
          const isLeft = fk.referencedTable === leftModel.table;
          const isRight = fk.referencedTable === rightModel.table;
          if (!isLeft && !isRight) {
            continue;
          }
          const expectedName = isLeft ? leftFkName : rightFkName;
          const actualName = fk.columns[0];
          if (actualName && actualName !== expectedName) {
            this.data.relationsToDrop.push({
              table: throughTable,
              relation: fk,
            });
            if (actualName !== leftFkName && actualName !== rightFkName) {
              this.data.columnsToDrop.push({
                table: throughTable,
                column: actualName,
              });
            }
          }
        }

        // Add missing columns (dedup when both sides are the same name)
        const pendingAddColumns: Record<string, ColumnType> = {};
        if (!leftColOk) {
          pendingAddColumns[leftExpected.databaseName] = leftExpected;
        }
        if (!rightColOk) {
          pendingAddColumns[rightExpected.databaseName] =
            pendingAddColumns[rightExpected.databaseName] || rightExpected;
        }
        for (const name of Object.keys(pendingAddColumns)) {
          this.data.columnsToAdd.push({
            table: throughTable,
            column: pendingAddColumns[name],
          });
        }

        const leftExpectedRel = this.buildBelongsToRelation(
          throughTable,
          () => leftModel,
          leftFkName,
          leftPkName,
          undefined,
          relation.onDelete,
          relation.onUpdate,
        );
        const rightExpectedRel = this.buildBelongsToRelation(
          throughTable,
          relation.model,
          rightFkName,
          rightPkName,
          undefined,
          relation.onDelete,
          relation.onUpdate,
        );

        const leftDbFk = dbThrough.foreignKeys.find(
          (fk) =>
            fk.referencedTable === leftModel.table &&
            fk.columns.length === 1 &&
            fk.columns[0] === leftFkName,
        );
        const rightDbFk = dbThrough.foreignKeys.find(
          (fk) =>
            fk.referencedTable === rightModel.table &&
            fk.columns.length === 1 &&
            fk.columns[0] === rightFkName,
        );
        if (!leftDbFk) {
          const conflictLeft = dbThrough.foreignKeys.find(
            (fk) => fk.referencedTable === leftModel.table,
          );
          if (conflictLeft) {
            this.data.relationsToDrop.push({
              table: throughTable,
              relation: conflictLeft,
            });
          }
          this.data.relationsToAdd.push(leftExpectedRel as RelationsToAdd);
        }
        if (!rightDbFk) {
          const conflictRight = dbThrough.foreignKeys.find(
            (fk) => fk.referencedTable === rightModel.table,
          );
          if (conflictRight) {
            this.data.relationsToDrop.push({
              table: throughTable,
              relation: conflictRight,
            });
          }
          this.data.relationsToAdd.push(rightExpectedRel as RelationsToAdd);
        }
      }
    }
  }

  private async removeFkChurnByName(): Promise<void> {
    const tablesNeedingCheck = new Set<string>();
    for (const rel of this.data.relationsToAdd) {
      tablesNeedingCheck.add(rel.table);
    }
    for (const rel of this.data.relationsToDrop) {
      tablesNeedingCheck.add(rel.table);
    }

    const tableToDbFks = new Map<string, Set<string>>();
    for (const table of tablesNeedingCheck) {
      const schema = await this.sql.getTableSchema(table);
      const names = new Set(
        (schema.foreignKeys || [])
          .map((fk) => fk.name)
          .filter(Boolean) as string[],
      );
      tableToDbFks.set(table, names);
    }

    const modelExpectedByTable = new Map<string, Set<string>>();
    for (const model of this.models) {
      const rels = model.getRelations();
      const expected = new Set<string>();
      for (const rel of rels) {
        if (rel.type !== RelationEnum.belongsTo) {
          continue;
        }
        const srcColRaw = (rel as any).foreignKey || rel.columnName;
        const mc = model.getColumns().find((c) => c.columnName === srcColRaw);
        const srcDb = mc?.databaseName || srcColRaw;
        const name =
          getColumnValue((rel as any).constraintName) ||
          getDefaultFkConstraintName(model.table, srcDb, rel.model().table);
        expected.add(name);
      }
      modelExpectedByTable.set(model.table, expected);
    }

    this.data.relationsToAdd = await Promise.all(
      this.data.relationsToAdd.map(async (r) => {
        const dbSchema = await this.sql.getTableSchema(r.table);
        const model = this.models.find((m) => m.table === r.table);
        const modelCols = model?.getColumns() || [];

        let sourceCol = (r.relation as any).columnName;
        if (r.relation.type === RelationEnum.belongsTo) {
          const fkModelCol = modelCols.find(
            (c) => c.columnName === (r.relation as any).foreignKey,
          );
          sourceCol =
            fkModelCol?.databaseName || (r.relation as any).foreignKey;
        } else {
          const mc = modelCols.find((c) => c.columnName === sourceCol);
          sourceCol = mc?.databaseName || sourceCol;
        }

        let referencedTable = r.table;
        let referencedCol = (r.relation as any).foreignKey;
        if (r.relation.type === RelationEnum.belongsTo) {
          const relModel = r.relation.model();
          referencedTable = relModel.table;
          const pkName = relModel.primaryKey || "id";
          const pkCol = relModel
            .getColumns()
            .find((c) => c.columnName === pkName);
          referencedCol = pkCol?.databaseName || pkName;
        }

        const candidateCols = new Set<string>(
          [sourceCol, (r.relation as any).columnName].filter(
            Boolean,
          ) as string[],
        );
        const existsStructurally = dbSchema.foreignKeys.some((fk) => {
          if (fk.columns.length !== 1 || fk.referencedColumns.length !== 1) {
            return false;
          }
          const colMatch = candidateCols.has(fk.columns[0]);
          const refTableMatch = fk.referencedTable === referencedTable;
          const refColMatch = fk.referencedColumns[0] === referencedCol;
          return colMatch && refTableMatch && refColMatch;
        });

        const expectedName =
          getColumnValue((r.relation as any).constraintName) ||
          getDefaultFkConstraintName(r.table, sourceCol, referencedTable);
        const dbFks = tableToDbFks.get(r.table) || new Set<string>();

        if (existsStructurally || (expectedName && dbFks.has(expectedName))) {
          return null;
        }

        if (
          r.relation.type === RelationEnum.manyToMany &&
          r.relation.manyToManyOptions
        ) {
          const through = getColumnValue(
            r.relation.manyToManyOptions.throughModel,
          );
          const leftKey = getColumnValue(
            r.relation.manyToManyOptions.leftForeignKey,
          );
          const rightKey = getColumnValue(
            r.relation.manyToManyOptions.rightForeignKey,
          );
          const leftMatch =
            r.table === through &&
            r.relation.columnName === leftKey &&
            r.relation.model().table === model?.table;
          const rightMatch =
            r.table === through &&
            r.relation.columnName === rightKey &&
            r.relation.model().table !== model?.table;

          const dbThrough = await this.sql.getTableSchema(through);
          const leftOk = dbThrough.foreignKeys.some(
            (fk) =>
              fk.columns.length === 1 &&
              fk.columns[0] === leftKey &&
              fk.referencedTable === (model?.table || ""),
          );
          const rightOk = dbThrough.foreignKeys.some(
            (fk) =>
              fk.columns.length === 1 &&
              fk.columns[0] === rightKey &&
              fk.referencedTable === r.relation.model().table,
          );
          if ((leftMatch && leftOk) || (rightMatch && rightOk)) {
            return null;
          }
        }

        return r;
      }),
    ).then((arr) => arr.filter(Boolean) as typeof this.data.relationsToAdd);

    this.data.relationsToDrop = await Promise.all(
      this.data.relationsToDrop.map(async (r) => {
        const model = this.models.find((m) => m.table === r.table);
        if (!model) {
          return r;
        }
        const rels = model.getRelations();
        const modelCols = model.getColumns();
        const matches = rels.some((rel: any) => {
          if (rel.type !== RelationEnum.belongsTo) {
            return false;
          }
          const mc = modelCols.find((c) => c.columnName === rel.foreignKey);
          const srcCol = mc?.databaseName || rel.foreignKey;
          const relModel = rel.model();
          const pkName = relModel.primaryKey || "id";
          const pkCol = relModel
            .getColumns()
            .find((c: any) => c.columnName === pkName);
          const refCol = pkCol?.databaseName || pkName;
          return (
            r.relation.columns.length === 1 &&
            r.relation.columns[0] === srcCol &&
            r.relation.referencedTable === relModel.table &&
            r.relation.referencedColumns.length === 1 &&
            r.relation.referencedColumns[0] === refCol
          );
        });
        return matches ? null : r;
      }),
    ).then((arr) => arr.filter(Boolean) as typeof this.data.relationsToDrop);
  }

  private clonePkAsColumn(pk: ColumnType, columnName: string): ColumnType {
    return {
      columnName,
      databaseName: columnName,
      isPrimary: false,
      type: pk.type,
      length: pk.length,
      precision: pk.precision,
      scale: pk.scale,
      withTimezone: pk.withTimezone,
      constraints: { nullable: false },
    } as ColumnType;
  }

  private pushM2mFkRelations(input: {
    throughTable: string;
    leftModel: typeof Model;
    rightModel: typeof Model;
    leftFkName: string;
    rightFkName: string;
    onDelete?: string;
    onUpdate?: string;
    constraintName?: string | (() => string);
  }): void {
    const leftRelation = this.buildBelongsToRelation(
      input.throughTable,
      () => input.leftModel,
      input.leftFkName,
      input.leftModel.primaryKey || "id",
      input.constraintName,
      input.onDelete,
      input.onUpdate,
    );
    const rightRelation = this.buildBelongsToRelation(
      input.throughTable,
      () => input.rightModel,
      input.rightFkName,
      input.rightModel.primaryKey || "id",
      input.constraintName,
      input.onDelete,
      input.onUpdate,
    );
    this.data.relationsToAdd.push(leftRelation as RelationsToAdd);
    this.data.relationsToAdd.push(rightRelation as RelationsToAdd);
  }

  private buildBelongsToRelation(
    table: string,
    relatedModel: () => typeof Model,
    sourceColumnName: string,
    relatedPkName: string,
    constraintName?: string | (() => string),
    onDelete?: string,
    onUpdate?: string,
  ) {
    const constraint = constraintName
      ? getColumnValue(constraintName)
      : getDefaultFkConstraintName(
          table,
          sourceColumnName,
          relatedModel().table,
        );
    return {
      table,
      relation: {
        type: RelationEnum.belongsTo,
        model: relatedModel,
        columnName: sourceColumnName,
        foreignKey: sourceColumnName,
        constraintName: constraint,
        onDelete: onDelete,
        onUpdate: onUpdate,
      },
      onDelete,
      onUpdate,
    } as const;
  }
}
