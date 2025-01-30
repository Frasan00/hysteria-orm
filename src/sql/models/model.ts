import { plural } from "pluralize";
import "reflect-metadata";
import { Entity } from "../../entity";
import { convertCase } from "../../utils/case_utils";
import { baseSoftDeleteDate } from "../../utils/date_utils";
import { ModelQueryBuilder, OneOptions } from "../query_builder/query_builder";
import { parseDatabaseDataIntoModelResponse } from "../serializer";
import { SqlDataSource } from "../sql_data_source";
import { ModelManager } from "../sql_data_source_types";
import { Transaction } from "../transactions/transaction";
import {
  belongsTo,
  column,
  ColumnOptions,
  getPrimaryKey,
  hasMany,
  hasOne,
  manyToMany,
} from "./model_decorators";
import {
  FindOneType,
  FindType,
  ModelKey,
  UnrestrictedFindOneType,
  UnrestrictedFindType,
} from "./model_manager/model_manager_types";

export type ModelWithoutExtraColumns<T extends Model> = Omit<
  Partial<T>,
  "$additional"
>;

export type BaseModelMethodOptions = {
  useConnection?: SqlDataSource;
  trx?: Transaction;
};

export function getBaseTableName(target: typeof Model): string {
  const className = target.name;
  const snakeCaseName = convertCase(className, "snake");
  return plural(snakeCaseName);
}

export function getBaseModelInstance<T extends Model>(): T {
  return { $additional: {} } as T;
}

const tableMap = new Map<typeof Model, string>();
const primaryKeyMap = new Map<typeof Model, string>();

/**
 * @description Represents a Table in the Database
 */
export abstract class Model extends Entity {
  /**
   * @description The sql sqlInstance generated by SqlDataSource.connect
   */
  static sqlInstance: SqlDataSource;

  /**
   * @description Table name for the model, if not set it will be the plural snake case of the model name given that is in PascalCase (es. User -> users)
   */
  static get table(): string {
    if (!tableMap.has(this)) {
      tableMap.set(this, getBaseTableName(this));
    }

    return tableMap.get(this)!;
  }

  /**
   * @description Getter for the primary key of the model
   */
  static get primaryKey(): string | undefined {
    if (!primaryKeyMap.has(this)) {
      primaryKeyMap.set(this, getPrimaryKey(this));
    }

    return primaryKeyMap.get(this)!;
  }

  /**
   * @description Constructor for the model, it's not meant to be used directly, it just initializes the $additional, it's advised to only use the static methods to interact with the database to save the model
   * @description Using the constructor could lead to unexpected behavior, if you want to create a new record use the insert method
   * @deprecated
   */
  constructor() {
    super();
  }

  /**
   * @description Returns all the records for the given model
   */
  static async all<T extends Model>(
    this: new () => T | typeof Model,
    options: BaseModelMethodOptions = {},
  ): Promise<T[]> {
    const typeofModel = this as unknown as typeof Model;
    const modelManager = typeofModel.dispatchModelManager<T>(options);
    return await modelManager.find();
  }

  /**
   * @description Gives a query sqlInstance for the given model
   */
  static query<T extends Model>(
    this: new () => T | typeof Model,
    options: BaseModelMethodOptions = {},
  ): ModelQueryBuilder<T> {
    const typeofModel = this as unknown as typeof Model;
    const modelManager = typeofModel.dispatchModelManager<T>(options);
    return modelManager.query();
  }

  /**
   * @description Finds the first record in the database
   * @deprecated Used only for debugging purposes, use findOne or query instead
   */
  static async first<T extends Model>(
    this: new () => T | typeof Model,
    options: OneOptions & BaseModelMethodOptions = {},
  ): Promise<T | null> {
    const typeofModel = this as unknown as typeof Model;
    const modelManager = typeofModel.dispatchModelManager<T>(options);
    return modelManager.query().one(options);
  }

  /**
   * @description Finds records for the given model
   */
  static async find<T extends Model>(
    this: new () => T | typeof Model,
    findOptions?: FindType<T> | UnrestrictedFindType<T>,
    options: BaseModelMethodOptions = {},
  ): Promise<T[]> {
    const typeofModel = this as unknown as typeof Model;
    const modelManager = typeofModel.dispatchModelManager<T>(options);
    return modelManager.find(findOptions);
  }

  /**
   * @description Finds a record for the given model or throws an error if it doesn't exist
   */
  static async findOneOrFail<T extends Model>(
    this: new () => T | typeof Model,
    findOneOptions: (FindOneType<T> | UnrestrictedFindOneType<T>) & {
      customError?: Error;
    },
    options: BaseModelMethodOptions = {},
  ): Promise<T> {
    const typeofModel = this as unknown as typeof Model;
    const modelManager = typeofModel.dispatchModelManager<T>(options);
    return modelManager.findOneOrFail(findOneOptions);
  }

  /**
   * @description Finds a record for the given model
   */
  static async findOne<T extends Model>(
    this: new () => T | typeof Model,
    findOneOptions: (FindOneType<T> | UnrestrictedFindOneType<T>) &
      BaseModelMethodOptions,
    options: BaseModelMethodOptions = {},
  ): Promise<T | null> {
    const typeofModel = this as unknown as typeof Model;
    const modelManager = typeofModel.dispatchModelManager<T>(options);
    return modelManager.findOne(findOneOptions);
  }

  /**
   * @description Finds a record for the given model for the given value, the model must have a primary key defined else it will throw an error
   */
  static async findOneByPrimaryKey<T extends Model>(
    this: new () => T | typeof Model,
    value: string | number,
    options: BaseModelMethodOptions = {},
  ): Promise<T | null> {
    const typeofModel = this as unknown as typeof Model;
    const modelManager = typeofModel.dispatchModelManager<T>(options);
    return modelManager.findOneByPrimaryKey(value);
  }

  /**
   * @description Refreshes a model from the database, the model must have a primary key defined
   */
  static async refresh<T extends Model>(
    this: new () => T | typeof Model,
    model: T,
    options: BaseModelMethodOptions = {},
  ): Promise<T | null> {
    const typeofModel = this as unknown as typeof Model;
    const modelManager = typeofModel.dispatchModelManager<T>(options);
    const primaryKey = typeofModel.primaryKey as keyof T;
    const primaryKeyValue = model[primaryKey];
    const refreshedModel = await modelManager.findOneByPrimaryKey(
      primaryKeyValue as string,
    );
    if (!refreshedModel) {
      return null;
    }

    refreshedModel.$additional = model.$additional;
    return refreshedModel;
  }

  /**
   * @description Saves a new record to the database
   * @description $additional will be ignored if set in the modelData and won't be returned in the response
   */
  static async insert<T extends Model>(
    this: new () => T | typeof Model,
    modelData: ModelWithoutExtraColumns<T>,
    options: BaseModelMethodOptions = {},
  ): Promise<T> {
    const typeofModel = this as unknown as typeof Model;
    const modelManager = typeofModel.dispatchModelManager<T>(options);
    return modelManager.insert(modelData as T);
  }

  /**
   * @description Saves multiple records to the database
   * @description $additional will be ignored if set in the modelData and won't be returned in the response
   */
  static async insertMany<T extends Model>(
    this: new () => T | typeof Model,
    modelsData: ModelWithoutExtraColumns<T>[],
    options: BaseModelMethodOptions = {},
  ): Promise<T[]> {
    const typeofModel = this as unknown as typeof Model;
    const modelManager = typeofModel.dispatchModelManager<T>(options);
    return modelManager.insertMany(modelsData as T[]);
  }

  /**
   * @description Updates a record to the database
   * @description If the record has a primary key, the record itself will be updated, else nothing will happen and null will be returned
   */
  static async updateRecord<T extends Model>(
    this: new () => T | typeof Model,
    modelSqlInstance: T,
    options: BaseModelMethodOptions = {},
  ): Promise<T | null> {
    const typeofModel = this as unknown as typeof Model;
    const modelManager = typeofModel.dispatchModelManager<T>(options);
    const updatedModel = await modelManager.updateRecord(modelSqlInstance);
    if (!updatedModel) {
      return null;
    }

    updatedModel.$additional = modelSqlInstance.$additional;
    return updatedModel;
  }

  /**
   * @description Finds the first record or creates a new one if it doesn't exist
   */
  static async firstOrCreate<T extends Model>(
    this: new () => T | typeof Model,
    searchCriteria: ModelWithoutExtraColumns<T>,
    createData: ModelWithoutExtraColumns<T>,
    options: BaseModelMethodOptions = {},
  ): Promise<T> {
    const typeofModel = this as unknown as typeof Model;
    const modelManager = typeofModel.dispatchModelManager<T>(options);
    const doesExist = await modelManager.findOne({
      where: searchCriteria,
    });

    if (doesExist) {
      return doesExist;
    }

    return (await modelManager.insert(createData as T)) as T;
  }

  /**
   * @description Updates or creates a new record
   */
  static async upsert<T extends Model>(
    this: new () => T | typeof Model,
    searchCriteria: ModelWithoutExtraColumns<T>,
    data: ModelWithoutExtraColumns<T>,
    options: { updateOnConflict?: boolean } & BaseModelMethodOptions = {
      updateOnConflict: true,
    },
  ): Promise<T> {
    const typeofModel = this as unknown as typeof Model;
    const modelManager = typeofModel.dispatchModelManager<T>(options);
    const doesExist = await modelManager.findOne({
      where: searchCriteria,
    });

    if (doesExist) {
      (data as T)[typeofModel.primaryKey as keyof T] =
        doesExist[typeofModel.primaryKey as keyof T];

      if (options.updateOnConflict) {
        return (await modelManager.updateRecord(data as T)) as T;
      }

      return doesExist;
    }

    return (await modelManager.insert(data as T)) as T;
  }

  /**
   * @description Updates or creates multiple records
   */
  static async upsertMany<T extends Model>(
    this: new () => T | typeof Model,
    searchCriteria: ModelKey<T>[],
    data: ModelWithoutExtraColumns<T>[],
    options: { updateOnConflict?: boolean } & BaseModelMethodOptions = {
      updateOnConflict: true,
    },
  ): Promise<T[]> {
    const typeofModel = this as unknown as typeof Model;
    const modelManager = typeofModel.dispatchModelManager<T>(options);

    if (
      !data.every((record) =>
        searchCriteria.every((column) => column in record),
      )
    ) {
      throw new Error(
        "Conflict columns are not present in the data, please make sure to include them in the data, " +
          searchCriteria.join(", "),
      );
    }

    const results: T[] = [];

    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      const search = searchCriteria.reduce((acc, column) => {
        acc[column] = record[column];
        return acc;
      }, {} as ModelWithoutExtraColumns<T>);

      const doesExist = await modelManager.findOne({
        where: search,
      });

      if (doesExist) {
        (record as T)[typeofModel.primaryKey as keyof T] =
          doesExist[typeofModel.primaryKey as keyof T];

        if (options.updateOnConflict) {
          results.push((await modelManager.updateRecord(record as T)) as T);
          continue;
        }

        results.push(doesExist);
        continue;
      }

      results.push((await modelManager.insert(record as T)) as T);
    }

    return results;
  }

  /**
   * @description Deletes a record to the database
   */
  static async deleteRecord<T extends Model>(
    this: new () => T | typeof Model,
    modelSqlInstance: T,
    options: BaseModelMethodOptions = {},
  ): Promise<T | null> {
    const typeofModel = this as unknown as typeof Model;
    const modelManager = typeofModel.dispatchModelManager<T>(options);
    return modelManager.deleteRecord(modelSqlInstance);
  }

  /**
   * @description Soft Deletes a record to the database
   */
  static async softDelete<T extends Model>(
    this: new () => T | typeof Model,
    modelSqlInstance: T,
    options?: {
      column?: string;
      value?: string | number | boolean;
    } & BaseModelMethodOptions,
  ): Promise<T> {
    const typeofModel = this as unknown as typeof Model;
    const {
      column = "deletedAt" as ModelKey<T>,
      value = baseSoftDeleteDate(new Date()),
    } = options || {};

    modelSqlInstance[column as keyof T] = value as T[keyof T];
    const modelManager = typeofModel.dispatchModelManager<T>({
      trx: options?.trx,
      useConnection: options?.useConnection,
    });
    await modelManager.updateRecord(modelSqlInstance);

    if (typeof value === "string") {
      modelSqlInstance[column as keyof T] = new Date(value) as T[keyof T];
    }

    modelSqlInstance[column as keyof T] = value as T[keyof T];
    return (await parseDatabaseDataIntoModelResponse(
      [modelSqlInstance],
      typeofModel,
    )) as T;
  }

  /**
   * @description Merges the provided data with the sqlInstance
   */
  static combineProps<T extends Model>(sqlInstance: T, data: Partial<T>): void {
    for (const key in data) {
      Object.assign(sqlInstance, { [key]: data[key] });
    }
  }

  /**
   * @description Adds a beforeFetch clause to the model, adding the ability to modify the query before fetching the data
   */
  static beforeFetch(queryBuilder: ModelQueryBuilder<any>): void {
    queryBuilder;
  }

  /**
   * @description Adds a beforeInsert clause to the model, adding the ability to modify the data after fetching the data
   */
  static beforeInsert(data: any): void {
    return data;
  }

  /**
   * @description Adds a beforeUpdate clause to the model, adding the ability to modify the query before updating the data
   */
  static beforeUpdate(queryBuilder: ModelQueryBuilder<any>): void {
    queryBuilder;
  }

  /**
   * @description Adds a beforeDelete clause to the model, adding the ability to modify the query before deleting the data
   */
  static beforeDelete(queryBuilder: ModelQueryBuilder<any>): void {
    queryBuilder;
  }

  /**
   * @description Adds a afterFetch clause to the model, adding the ability to modify the data after fetching the data
   */
  static async afterFetch(data: Model[]): Promise<Model[]> {
    return data;
  }

  // JS Static methods

  /**
   * @description Defines a column in the model, useful in javascript in order to not have to rely on decorators since are not supported without a transpiler like babel
   * @javascript
   */
  static column(columnName: string, options: ColumnOptions = {}): void {
    // take the column decorator and apply it automatically
    column(options)(this.prototype, columnName);
  }

  /**
   * @description Defines an hasOne relation
   * @javascript
   */
  static hasOne(
    columnName: string,
    model: () => typeof Model,
    foreignKey: string,
  ): void {
    hasOne(model, foreignKey)(this.prototype, columnName);
  }

  /**
   * @description Defines an hasMany
   * @javascript
   */
  static hasMany(
    columnName: string,
    model: () => typeof Model,
    foreignKey: string,
  ): void {
    hasMany(model, foreignKey)(this.prototype, columnName);
  }

  /**
   * @description Defines a belongsTo
   * @javascript
   */
  static belongsTo(
    columnName: string,
    model: () => typeof Model,
    foreignKey: string,
  ): void {
    belongsTo(model, foreignKey)(this.prototype, columnName);
  }

  /**
   * @description Defines a many to many
   * @javascript
   */
  static manyToMany(
    columnName: string,
    model: () => typeof Model,
    throughModel: string,
    foreignKey: string,
  ): void {
    manyToMany(model, throughModel, foreignKey)(this.prototype, columnName);
  }

  /**
   * @description Establishes a connection to the database instantiated from the SqlDataSource.connect method, this is done automatically when using the static methods
   * @description This method is meant to be used only if you want to establish sql sqlInstance of the model directly
   * @internal
   */
  private static establishConnection(): void {
    const sql = SqlDataSource.getInstance();
    if (!sql) {
      throw new Error(
        "sql sqlInstance not initialized, did you defined it in SqlDataSource.connect static method?",
      );
    }

    this.sqlInstance = sql;
  }

  /**
   * @description Gives the correct model manager with the correct connection based on the options provided
   */
  private static dispatchModelManager<T extends Model>(
    this: typeof Model,
    options?: BaseModelMethodOptions,
  ): ModelManager<T> {
    if (options?.useConnection) {
      return options.useConnection.getModelManager<T>(
        this as unknown as typeof Model,
      );
    }

    if (options?.trx) {
      return options.trx.sqlDataSource.getModelManager<T>(
        this as unknown as typeof Model,
      );
    }

    const typeofModel = this as unknown as typeof Model;
    typeofModel.establishConnection();
    return typeofModel.sqlInstance.getModelManager<T>(typeofModel);
  }
}
