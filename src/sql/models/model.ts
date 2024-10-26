import "reflect-metadata";
import { DateTime } from "luxon";
import { convertCase } from "../../utils/case_utils";
import { PaginatedData } from "../pagination";
import { ModelQueryBuilder, OneOptions } from "../query_builder/query_builder";
import {
  parseDatabaseDataIntoModelResponse,
  addDynamicColumnsToModel,
} from "../serializer";
import { SqlDataSource, ModelManager } from "../sql_data_source";
import { getPrimaryKey } from "./model_decorators";
import {
  FindType,
  UnrestrictedFindType,
  FindOneType,
  UnrestrictedFindOneType,
  SelectableType,
  DynamicColumnType,
} from "./model_manager/model_manager_types";
import { Transaction } from "../transactions/transaction";
import { Entity } from "../../entity";

export type BaseModelMethodOptions = {
  useConnection?: SqlDataSource;
  trx?: Transaction;
};

export function getBaseTableName(target: typeof Model): string {
  const className = target.name;
  return className.endsWith("s")
    ? convertCase(className, "snake")
    : convertCase(className, "snake") + "s";
}

export function getBaseModelInstance<T extends Model>(): T {
  return { $additionalColumns: {} } as T;
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
  static tableName: string;

  /**
   * @description Static getter for table;
   * @internal
   */
  static get table(): string {
    if (!tableMap.has(this)) {
      tableMap.set(this, this.tableName || getBaseTableName(this));
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
   * @description Constructor for the model, it's not meant to be used directly, it just initializes the $additionalColumns, it's advised to only use the static methods to interact with the database to save the model
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
  ): Promise<T | null> {
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
   * @description Finds a record for the given model for the given id, "id" must be set in the model in order for it to work
   */
  static async findOneByPrimaryKey<T extends Model>(
    this: new () => T | typeof Model,
    value: string | number | boolean,
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
    return modelManager.findOneByPrimaryKey(primaryKeyValue as string);
  }

  /**
   * @description Saves a new record to the database
   */
  static async insert<T extends Model>(
    this: new () => T | typeof Model,
    modelData: Partial<T>,
    options: BaseModelMethodOptions = {},
  ): Promise<T | null> {
    const typeofModel = this as unknown as typeof Model;
    const modelManager = typeofModel.dispatchModelManager<T>(options);
    return modelManager.insert(modelData);
  }

  /**
   * @description Saves multiple records to the database
   * @description WHile using mysql, it will return records only if the primary key is auto incrementing integer, else it will always return []
   */
  static async insertMany<T extends Model>(
    this: new () => T | typeof Model,
    modelsData: Partial<T>[],
    options: BaseModelMethodOptions = {},
  ): Promise<T[]> {
    const typeofModel = this as unknown as typeof Model;
    const modelManager = typeofModel.dispatchModelManager<T>(options);
    return modelManager.insertMany(modelsData);
  }

  /**
   * @description Updates a record to the database
   */
  static async updateRecord<T extends Model>(
    this: new () => T | typeof Model,
    modelSqlInstance: T,
    options: BaseModelMethodOptions = {},
  ): Promise<T | null> {
    const typeofModel = this as unknown as typeof Model;
    const modelManager = typeofModel.dispatchModelManager<T>(options);
    return modelManager.updateRecord(modelSqlInstance);
  }

  /**
   * @description Finds the first record or creates a new one if it doesn't exist
   */
  static async firstOrCreate<T extends Model>(
    this: new () => T | typeof Model,
    searchCriteria: Partial<T>,
    createData: Partial<T>,
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

    return (await modelManager.insert(createData)) as T;
  }

  /**
   * @description Updates or creates a new record
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
    const modelManager = typeofModel.dispatchModelManager<T>(options);
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
      column = "deletedAt" as SelectableType<T>,
      value = DateTime.local().toISO(),
    } = options || {};

    modelSqlInstance[column as keyof T] = value as T[keyof T];
    const modelManager = typeofModel.dispatchModelManager<T>({
      trx: options?.trx,
      useConnection: options?.useConnection,
    });
    await modelManager.updateRecord(modelSqlInstance);

    if (typeof value === "string") {
      modelSqlInstance[column as keyof T] = DateTime.fromISO(
        value,
      ) as T[keyof T];
    }

    modelSqlInstance[column as keyof T] = value as T[keyof T];
    return (await parseDatabaseDataIntoModelResponse(
      [modelSqlInstance],
      typeofModel,
    )) as T;
  }

  /**
   * @description Adds dynamic columns to the model that are not defined in the Table and are defined in the model
   * @description It does not support custom connection or transaction
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
