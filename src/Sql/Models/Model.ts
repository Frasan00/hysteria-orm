import "reflect-metadata";
import { DateTime } from "luxon";
import { OneOptions, ModelQueryBuilder } from "../QueryBuilder/QueryBuilder";
import { ModelManager, SqlDataSource } from "../SqlDatasource";
import {
  DynamicColumnType,
  FindOneType,
  FindType,
  SelectableType,
  UnrestrictedFindOneType,
  UnrestrictedFindType,
} from "./ModelManager/ModelManagerTypes";
import { CaseConvention, convertCase } from "../../CaseUtils";
import { ModelUpdateQueryBuilder } from "../QueryBuilder/UpdateQueryBuilder";
import { ModelDeleteQueryBuilder } from "../QueryBuilder/DeleteQueryBuilder";
import { getPrimaryKey } from "./ModelDecorators";
import {
  addDynamicColumnsToModel,
  parseDatabaseDataIntoModelResponse,
} from "../serializer";
import { PaginatedData } from "../pagination";
import { Transaction } from "../Transaction";
import { AbstractModelManager } from "./ModelManager/AbstractModelManager";

export type BaseModelMethodOptions = {
  useConnection?: SqlDataSource;
  trx?: Transaction;
};

export function getBaseTable(target: typeof Model): string {
  const className = target.name;
  const table = className.endsWith("s")
    ? convertCase(className, "snake")
    : convertCase(className, "snake") + "s";
  return table;
}

export function getBaseModelInstance<T extends Model>(): T {
  return { extraColumns: {} } as T;
}

const tableMap = new WeakMap<typeof Model, string>();
const primaryKeyMap = new WeakMap<typeof Model, string>();

/**
 * @description Represents a Table in the Database
 */
export abstract class Model {
  /**
   * @description The sql instance generated by SqlDataSource.connect
   */
  static sqlInstance: SqlDataSource;

  /**
   * @description Table name for the model, if not set it will be the plural snake case of the model name given that is in PascalCase (es. User -> users)
   */
  static tableName: string;

  /**
   * @description Static getter for table;
   * @internal
   */
  static get table(): string {
    if (!tableMap.has(this)) {
      tableMap.set(this, this.tableName || getBaseTable(this));
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
   * @description Defines the case convention for the model
   * @type {CaseConvention}
   */
  static modelCaseConvention: CaseConvention = "camel";

  /**
   * @description Defines the case convention for the database, this should be the case convention you use in your database
   * @type {CaseConvention}
   */
  static databaseCaseConvention: CaseConvention = "snake";

  /**
   * @description Extra columns for the model, all data retrieved from the database that is not part of the model will be stored here
   */
  public extraColumns: { [key: string]: any };

  /**
   * @description Constructor for the model, it's not meant to be used directly, it just initializes the extraColumns, it's advised to only use the static methods to interact with the Model instances
   */
  public constructor() {
    this.extraColumns = {};
  }

  /**
   * @description Gives a query instance for the given model
   * @param model
   * @returns {ModelQueryBuilder<T>}
   */
  static query<T extends Model>(
    this: new () => T | typeof Model,
    options: BaseModelMethodOptions = {},
  ): ModelQueryBuilder<T> {
    const typeofModel = this as unknown as typeof Model;
    const modelManager = typeofModel.getModelManager<T>(options);
    console.log(modelManager);
    return modelManager.query();
  }

  /**
   * @description Finds the first record in the database
   * @param model
   * @param {FindType} options
   * @returns {Promise<T[]>}
   */
  static async first<T extends Model>(
    this: new () => T | typeof Model,
    options: OneOptions & BaseModelMethodOptions = { throwErrorOnNull: false },
  ): Promise<T | null> {
    const typeofModel = this as unknown as typeof Model;
    const modelManager = typeofModel.getModelManager<T>(options);
    return await modelManager.query().one(options);
  }

  /**
   * @description Finds records for the given model
   * @param model
   * @param {FindType} options
   * @returns {Promise<T[]>}
   */
  static find<T extends Model>(
    this: new () => T | typeof Model,
    options?: FindType<T> | UnrestrictedFindType<T>,
  ): Promise<T[]> {
    const typeofModel = this as unknown as typeof Model;
    const modelManager = typeofModel.getModelManager<T>({
      trx: options?.trx,
      useConnection: options?.useConnection,
    } as BaseModelMethodOptions);
    return modelManager.find(options);
  }

  /**
   * @description Finds a record for the given model
   * @param model
   * @param {FindOneType} options
   * @returns {Promise<T | null>}
   */
  static findOne<T extends Model>(
    this: new () => T | typeof Model,
    options: FindOneType<T> | UnrestrictedFindOneType<T>,
  ): Promise<T | null> {
    const typeofModel = this as unknown as typeof Model;
    const modelManager = typeofModel.getModelManager<T>(options);
    return modelManager.findOne(options);
  }

  /**
   * @description Finds a record for the given model for the given id, "id" must be set in the model in order for it to work
   * @param model
   * @param {number | string} id
   * @returns {Promise<T | null>}
   */
  static findOneByPrimaryKey<T extends Model>(
    this: new () => T | typeof Model,
    value: string | number | boolean,
    options: { throwErrorOnNull: boolean } & BaseModelMethodOptions = {
      throwErrorOnNull: false,
    },
  ): Promise<T | null> {
    const typeofModel = this as unknown as typeof Model;
    const modelManager = typeofModel.getModelManager<T>(options);
    return modelManager.findOneByPrimaryKey(value, options.throwErrorOnNull);
  }

  /**
   * @description Refreshes a model from the database, the model must have a primary key defined
   * @param model
   */
  static refresh<T extends Model>(
    this: new () => T | typeof Model,
    model: T,
    options: { throwErrorOnNull: boolean } & BaseModelMethodOptions = {
      throwErrorOnNull: false,
    },
  ): Promise<T | null> {
    const typeofModel = this as unknown as typeof Model;
    const modelManager = typeofModel.getModelManager<T>(options);
    const primaryKey = typeofModel.primaryKey as keyof T;
    const primaryKeyValue = model[primaryKey];
    return modelManager.findOneByPrimaryKey(
      primaryKeyValue as string,
      options.throwErrorOnNull,
    );
  }

  /**
   * @description Saves a new record to the database
   * @description While using mysql, it will return records only if the primary key is auto incrementing integer, else it will always return null
   * @param model
   * @param {Model} modelData
   * @param trx
   * @returns {Promise<T | null>}
   */
  static insert<T extends Model>(
    this: new () => T | typeof Model,
    modelData: Partial<T>,
    options: BaseModelMethodOptions = {},
  ): Promise<T | null> {
    const typeofModel = this as unknown as typeof Model;
    const modelManager = typeofModel.getModelManager<T>(options);
    return modelManager.insert(modelData);
  }

  /**
   * @description Saves multiple records to the database
   * @description WHile using mysql, it will return records only if the primary key is auto incrementing integer, else it will always return []
   * @param model
   * @param {Model} modelsData
   * @param trx
   * @returns {Promise<T[]>}
   */
  static insertMany<T extends Model>(
    this: new () => T | typeof Model,
    modelsData: Partial<T>[],
    options: BaseModelMethodOptions = {},
  ): Promise<T[]> {
    const typeofModel = this as unknown as typeof Model;
    const modelManager = typeofModel.getModelManager<T>(options);
    return modelManager.insertMany(modelsData);
  }

  /**
   * @description Updates a record to the database
   * @param model
   * @param {Model} modelInstance
   * @param trx
   * @returns
   */
  static updateRecord<T extends Model>(
    this: new () => T | typeof Model,
    modelInstance: T,
    options: BaseModelMethodOptions = {},
  ): Promise<T | null> {
    const typeofModel = this as unknown as typeof Model;
    const modelManager = typeofModel.getModelManager<T>(options);
    return modelManager.updateRecord(modelInstance);
  }

  /**
   * @description Finds the first record or creates a new one if it doesn't exist
   * @param model
   * @param {Partial<T>} searchCriteria
   * @param {Partial<T>} createData
   */
  static async firstOrCreate<T extends Model>(
    this: new () => T | typeof Model,
    searchCriteria: Partial<T>,
    createData: Partial<T>,
    options: BaseModelMethodOptions = {},
  ): Promise<T> {
    const typeofModel = this as unknown as typeof Model;
    const modelManager = typeofModel.getModelManager<T>(options);
    const doesExist = await modelManager.findOne({
      where: searchCriteria,
    });

    if (doesExist) {
      return doesExist;
    }

    return (await modelManager.insert(createData)) as T;
  }

  /**
   * @description Updates or creates a new record
   * @param {Partial<T>} searchCriteria
   * @param {Partial<T>} data
   * @param options - The options to update the record on conflict, default is true
   */
  static async upsert<T extends Model>(
    this: new () => T | typeof Model,
    searchCriteria: Partial<T>,
    data: Partial<T>,
    options: { updateOnConflict?: boolean } & BaseModelMethodOptions = {
      updateOnConflict: true,
    },
  ): Promise<T> {
    const typeofModel = this as unknown as typeof Model;
    const modelManager = typeofModel.getModelManager<T>(options);
    const doesExist = await modelManager.findOne({
      where: searchCriteria,
    });

    if (doesExist) {
      data[typeofModel.primaryKey as keyof T] =
        doesExist[typeofModel.primaryKey as keyof T];

      if (options.updateOnConflict) {
        return (await modelManager.updateRecord(data as T)) as T;
      }

      return doesExist;
    }

    return (await modelManager.insert(data)) as T;
  }

  /**
   * @description Updates or creates multiple records
   * @param {Partial<T>} searchCriteria
   * @param {Partial<T>} data
   * @param options - The options to update the record on conflict, default is true
   * @returns - The updated or created records
   */
  static async upsertMany<T extends Model>(
    this: new () => T | typeof Model,
    searchCriteria: SelectableType<T>[],
    data: Partial<T>[],
    options: { updateOnConflict?: boolean } & BaseModelMethodOptions = {
      updateOnConflict: true,
    },
  ): Promise<T[]> {
    const typeofModel = this as unknown as typeof Model;
    const modelManager = typeofModel.getModelManager<T>(options);

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
      }, {} as Partial<T>);

      const doesExist = await modelManager.findOne({
        where: search,
      });

      if (doesExist) {
        record[typeofModel.primaryKey as keyof T] =
          doesExist[typeofModel.primaryKey as keyof T];

        if (options.updateOnConflict) {
          results.push((await modelManager.updateRecord(record as T)) as T);
          continue;
        }

        results.push(doesExist);
        continue;
      }

      results.push((await modelManager.insert(record)) as T);
    }

    return results;
  }

  /**
   * @description Updates records to the database
   * @param model
   * @param {Model} modelInstance
   * @param trx
   * @returns Update query builder
   */
  static update<T extends Model>(
    this: new () => T | typeof Model,
    options: BaseModelMethodOptions = {},
  ): ModelUpdateQueryBuilder<T> {
    const typeofModel = this as unknown as typeof Model;
    const modelManager = typeofModel.getModelManager<T>(options);
    return modelManager.update();
  }

  /**
   * @description Gives a Delete query builder instance
   * @param model
   * @param {Model} modelInstance
   * @param trx
   * @returns
   */
  static deleteQuery<T extends Model>(
    this: new () => T | typeof Model,
    options: BaseModelMethodOptions = {},
  ): ModelDeleteQueryBuilder<T> {
    const typeofModel = this as unknown as typeof Model;
    const modelManager = typeofModel.getModelManager<T>(options);
    return modelManager.deleteQuery();
  }

  /**
   * @description Deletes a record to the database
   * @param model
   * @param {Model} modelInstance
   * @param trx
   * @returns
   */
  static deleteRecord<T extends Model>(
    this: new () => T | typeof Model,
    modelInstance: T,
    options: BaseModelMethodOptions = {},
  ): Promise<T | null> {
    const typeofModel = this as unknown as typeof Model;
    const modelManager = typeofModel.getModelManager<T>(options);
    return modelManager.deleteRecord(modelInstance);
  }

  /**
   * @description Soft Deletes a record to the database
   * @param model
   * @param {Model} modelInstance
   * @param options - The options to soft delete the record, column and value - Default is 'deletedAt' for column and the current date and time for value, string is always counted as a Date stringified as new Date().toString()
   * @param trx
   * @returns
   */
  static async softDelete<T extends Model>(
    this: new () => T | typeof Model,
    modelInstance: T,
    options?: {
      column?: string;
      value?: string | number | boolean;
    } & BaseModelMethodOptions,
  ): Promise<T> {
    const typeofModel = this as unknown as typeof Model;
    const {
      column = "deletedAt" as SelectableType<T>,
      value = DateTime.local().toISO(),
    } = options || {};

    modelInstance[column as keyof T] = value as T[keyof T];
    const modelManager = typeofModel.getModelManager<T>({
      trx: options?.trx,
      useConnection: options?.useConnection,
    });
    await modelManager.updateRecord(modelInstance);

    if (typeof value === "string") {
      modelInstance[column as keyof T] = DateTime.fromISO(value) as T[keyof T];
    }

    modelInstance[column as keyof T] = value as T[keyof T];
    return (await parseDatabaseDataIntoModelResponse(
      [modelInstance],
      typeofModel,
    )) as T;
  }

  /**
   * @description Adds dynamic columns to the model that are not defined in the Table and are defined in the model
   * @description It does not support custom connection or transaction
   * @param model
   * @param data
   * @param dynamicColumns
   * @returns
   */
  static async addDynamicColumns<T extends Model>(
    this: new () => T | typeof Model,
    data: T | T[] | PaginatedData<T>,
    dynamicColumns: DynamicColumnType<T>[],
  ): Promise<T | T[] | PaginatedData<T>> {
    const typeofModel = this as unknown as typeof Model;
    typeofModel.establishConnection();
    if (Array.isArray(data)) {
      for (const model of data) {
        await addDynamicColumnsToModel(
          typeofModel,
          model,
          dynamicColumns as string[],
        );
      }

      return data as T[];
    }

    if (!Array.isArray(data)) {
      await addDynamicColumnsToModel(
        typeofModel,
        data,
        dynamicColumns as string[],
      );

      return data as T;
    }

    for (const model of (data as PaginatedData<T>).data) {
      await addDynamicColumnsToModel(
        typeofModel,
        model,
        dynamicColumns as string[],
      );
    }

    return data as PaginatedData<T>;
  }

  /**
   * @description Merges the provided data with the instance
   * @param instance
   * @param data
   * @returns {void}
   */
  static combineProps<T extends Model>(instance: T, data: Partial<T>): void {
    for (const key in data) {
      Object.assign(instance, { [key]: data[key] });
    }
  }

  /**
   * @description Adds a beforeFetch clause to the model, adding the ability to modify the query before fetching the data
   * @param queryBuilder
   */
  static beforeFetch(queryBuilder: ModelQueryBuilder<any>): void {
    queryBuilder;
  }

  /**
   * @description Adds a beforeCreate clause to the model, adding the ability to modify the data after fetching the data
   * @param data
   * @returns {T}
   */
  static beforeInsert(data: any): Model[] {
    return data;
  }

  /**
   * @description Adds a beforeUpdate clause to the model, adding the ability to modify the query before updating the data
   * @param data
   */
  static beforeUpdate(queryBuilder: ModelUpdateQueryBuilder<any>): void {
    queryBuilder;
  }

  /**
   * @description Adds a beforeDelete clause to the model, adding the ability to modify the query before deleting the data
   * @param data
   */
  static beforeDelete(queryBuilder: ModelDeleteQueryBuilder<any>): void {
    queryBuilder;
  }

  /**
   * @description Adds a afterFetch clause to the model, adding the ability to modify the data after fetching the data
   * @param data
   * @returns {T}
   */
  static async afterFetch(data: Model[]): Promise<Model[]> {
    return data;
  }

  /**
   * @description Establishes a connection to the database instantiated from the SqlDataSource.connect method, this is done automatically when using the static methods
   * @description This method is meant to be used only if you want to establish sql instance of the model directly
   * @internal
   * @returns {void}
   */
  static establishConnection(): void {
    const sql = SqlDataSource.getInstance();
    if (!sql) {
      throw new Error(
        "Sql instance not initialized, did you defined it in SqlDataSource.connect static method?",
      );
    }

    this.sqlInstance = sql;
  }

  /**
   * @description Gives the correct model manager with the correct connection based on the options provided
   * @param this
   * @param options
   * @returns
   */
  private static getModelManager<T extends Model>(
    this: typeof Model,
    options: BaseModelMethodOptions,
  ): ModelManager<T> {
    if (options.useConnection) {
      return options.useConnection.getModelManager<T>(
        this as unknown as typeof Model,
      );
    }

    if (options.trx) {
      return options.trx.sqlDataSource.getModelManager<T>(
        this as unknown as typeof Model,
      );
    }

    const typeofModel = this as unknown as typeof Model;
    typeofModel.establishConnection();
    return typeofModel.sqlInstance.getModelManager<T>(typeofModel);
  }
}
