/**
 * @description AdminJS adapter for Hysteria ORM
 */

import type {
  BaseProperty,
  BaseRecord,
  BaseResource,
  Filter,
  ParamsType,
  PropertyType,
} from "adminjs";
import { DriverNotFoundError } from "../drivers/driver_constants";
import type { Model } from "../sql/models/model";
import type { SqlDataSource } from "../sql/sql_data_source";
import {
  HYSTERIA_TO_ADMINJS_TYPE_MAP,
  type AdminJsInstance,
  type AdminJsOptions,
} from "./adminjs_types";

type AnyModel = typeof Model & { new (): any };

// Store the sqlDataSource reference for resources to use
let globalSqlDataSource: SqlDataSource | null = null;

function applyFilter(
  query: ReturnType<AnyModel["query"]>,
  filter: unknown,
  model: AnyModel,
): void {
  if (!filter || typeof filter !== "object") return;

  const filterObj = filter as { filters?: Record<string, { value: unknown }> };
  if (!filterObj.filters) return;

  const columns = model.getColumns();

  for (const [key, filterValue] of Object.entries(filterObj.filters)) {
    const value = filterValue.value;
    if (value === undefined || value === null || value === "") continue;

    const column = columns.find(
      (c) => c.columnName === key || c.databaseName === key,
    );
    if (!column) continue;

    const typeString = typeof column.type === "string" ? column.type : "string";
    const propertyType = HYSTERIA_TO_ADMINJS_TYPE_MAP[typeString] || "string";

    if (propertyType === "string" || propertyType === "textarea") {
      query.whereLike(key, `%${value}%`);
      continue;
    }

    if (propertyType === "boolean") {
      query.where(key, value === "true" || value === true);
      continue;
    }

    if (propertyType === "date" || propertyType === "datetime") {
      if (typeof value === "object" && value !== null) {
        const dateFilter = value as { from?: string; to?: string };
        if (dateFilter.from) {
          query.where(key, ">=", dateFilter.from);
        }
        if (dateFilter.to) {
          query.where(key, "<=", dateFilter.to);
        }
        continue;
      }
      query.where(key, value as string);
      continue;
    }

    query.where(key, value as string | number | boolean);
  }
}

function recordToParams(
  record: Model,
  model: AnyModel,
): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  const columns = model.getColumns();

  for (const column of columns) {
    const value = record[column.columnName as keyof typeof record];
    params[column.columnName] = value;
  }

  return params;
}

/**
 * @description Creates a Hysteria Resource class that extends AdminJS BaseResource
 */
async function createHysteriaResourceClass() {
  const adminjs = await import("adminjs").catch(() => {
    throw new DriverNotFoundError("adminjs");
  });

  const {
    BaseResource: BaseResourceClass,
    BaseRecord: BaseRecordClass,
    BaseProperty: BasePropertyClass,
  } = adminjs;

  return class HysteriaResource extends BaseResourceClass {
    private _model: AnyModel;
    private _db: SqlDataSource;

    constructor(model: AnyModel) {
      super(model);
      this._model = model;
      this._db = globalSqlDataSource!;
    }

    static isAdapterFor(rawResource: unknown): boolean {
      if (typeof rawResource !== "function") return false;
      const resource = rawResource as AnyModel;
      return (
        resource.prototype !== undefined &&
        typeof resource.table === "string" &&
        typeof resource.getColumns === "function"
      );
    }

    databaseName(): string {
      return this._db.database || "hysteria";
    }

    databaseType(): string {
      return this._db.getDbType();
    }

    id(): string {
      return this._model.table;
    }

    properties(): BaseProperty[] {
      const columns = this._model.getColumns();
      return columns.map((column) => {
        const typeString =
          typeof column.type === "string" ? column.type : "string";
        const adminJsType =
          HYSTERIA_TO_ADMINJS_TYPE_MAP[typeString] || "string";

        return new BasePropertyClass({
          path: column.columnName,
          type: adminJsType as PropertyType,
          isId: column.isPrimary,
          isSortable: true,
        });
      });
    }

    property(path: string): BaseProperty | null {
      const columns = this._model.getColumns();
      const column = columns.find(
        (c) => c.columnName === path || c.databaseName === path,
      );

      if (!column) return null;

      const typeString =
        typeof column.type === "string" ? column.type : "string";
      const adminJsType = HYSTERIA_TO_ADMINJS_TYPE_MAP[typeString] || "string";

      return new BasePropertyClass({
        path: column.columnName,
        type: adminJsType as PropertyType,
        isId: column.isPrimary,
        isSortable: true,
      });
    }

    async count(filter: Filter): Promise<number> {
      const query = this._model.query({ connection: this._db });
      applyFilter(query, filter, this._model);
      return query.getCount();
    }

    async find(
      filter: Filter,
      options: {
        limit?: number;
        offset?: number;
        sort?: { sortBy?: string; direction?: "asc" | "desc" };
      } = {},
    ): Promise<BaseRecord[]> {
      const query = this._model.query({ connection: this._db });
      applyFilter(query, filter, this._model);

      if (options.limit) {
        query.limit(options.limit);
      }
      if (options.offset) {
        query.offset(options.offset);
      }
      if (options.sort?.sortBy) {
        query.orderBy(options.sort.sortBy, options.sort.direction || "asc");
      }

      const records = await query.many();
      return records.map(
        (record: unknown) =>
          new BaseRecordClass(
            recordToParams(record as Model, this._model),
            this,
          ),
      );
    }

    async findOne(id: string | number): Promise<BaseRecord | null> {
      const primaryKey = this._model.primaryKey;
      if (!primaryKey) return null;

      const record = await this._model.findOneByPrimaryKey(id as string, {
        connection: this._db,
      });

      if (!record) return null;

      return new BaseRecordClass(
        recordToParams(record as Model, this._model),
        this,
      );
    }

    async findMany(ids: (string | number)[]): Promise<BaseRecord[]> {
      const primaryKey = this._model.primaryKey;
      if (!primaryKey) return [];

      const records = await this._model
        .query({ connection: this._db })
        .whereIn(primaryKey, ids)
        .many();

      return records.map(
        (record: unknown) =>
          new BaseRecordClass(
            recordToParams(record as Model, this._model),
            this,
          ),
      );
    }

    async create(params: Record<string, unknown>): Promise<ParamsType> {
      const record = await this._model.insert(params, {
        connection: this._db,
      });
      return recordToParams(record as Model, this._model);
    }

    async update(
      id: string | number,
      params: Record<string, unknown>,
    ): Promise<ParamsType> {
      const primaryKey = this._model.primaryKey;
      if (!primaryKey) {
        throw new Error("Model has no primary key");
      }

      const existingRecord = await this._model.findOneByPrimaryKey(
        id as string,
        {
          connection: this._db,
        },
      );

      if (!existingRecord) {
        throw new Error("Record not found");
      }

      const updatedRecord = await this._model.updateRecord(
        existingRecord,
        params,
        { connection: this._db },
      );

      return recordToParams(updatedRecord as Model, this._model);
    }

    async delete(id: string | number): Promise<void> {
      const primaryKey = this._model.primaryKey;
      if (!primaryKey) {
        throw new Error("Model has no primary key");
      }

      const record = await this._model.findOneByPrimaryKey(id as string, {
        connection: this._db,
      });

      if (record) {
        await this._model.deleteRecord(record, {
          connection: this._db,
        });
      }
    }
  };
}

/**
 * @description Creates a Hysteria Database class that extends AdminJS BaseDatabase
 */
async function createHysteriaDatabaseClass() {
  const adminjs = await import("adminjs").catch(() => {
    throw new DriverNotFoundError("adminjs");
  });

  const { BaseDatabase: BaseDatabaseClass } = adminjs;

  return class HysteriaDatabase extends BaseDatabaseClass {
    static isAdapterFor(_database: unknown): boolean {
      // We don't use database-level adapter, only resource-level
      return false;
    }

    resources(): BaseResource[] {
      return [];
    }
  };
}

/**
 * @description Registers the Hysteria ORM adapter with AdminJS
 */
export async function registerHysteriaAdapter(): Promise<void> {
  const AdminJS = await import("adminjs").catch(() => {
    throw new DriverNotFoundError("adminjs");
  });

  const HysteriaResource = await createHysteriaResourceClass();
  const HysteriaDatabase = await createHysteriaDatabaseClass();

  AdminJS.default.registerAdapter({
    Database: HysteriaDatabase,
    Resource: HysteriaResource,
  });
}

/**
 * @description Initializes AdminJS with Hysteria ORM models
 */
export async function initializeAdminJs(
  sqlDataSource: SqlDataSource,
  options: AdminJsOptions,
): Promise<AdminJsInstance> {
  // Set global reference for resources to use
  globalSqlDataSource = sqlDataSource;

  const AdminJS = await import("adminjs").catch(() => {
    throw new DriverNotFoundError("adminjs");
  });

  // Register the adapter first
  await registerHysteriaAdapter();

  const models =
    options.resources ||
    (Object.values(sqlDataSource.registeredModels) as AnyModel[]);

  if (!models.length) {
    throw new Error(
      "No models provided for AdminJS. Please provide models in the resources option or register them in SqlDataSource.",
    );
  }

  // Build resources with options
  const resources = models.map((model) => {
    const modelOptions = options.resourceOptions?.[model.table] || {};
    return {
      resource: model,
      options: modelOptions,
    };
  });

  const adminOptions: Record<string, unknown> = {
    rootPath: options.rootPath || "/admin",
    resources,
  };

  if (options.branding) {
    adminOptions.branding = options.branding;
  }
  if (options.locale?.language) {
    adminOptions.locale = options.locale;
  }
  if (options.assets) {
    adminOptions.assets = options.assets;
  }
  if (options.settings) {
    adminOptions.settings = options.settings;
  }
  if (options.pages) {
    const validPages: Record<string, unknown> = {};
    for (const [key, page] of Object.entries(options.pages)) {
      if (page.component) {
        validPages[key] = page;
      }
    }
    if (Object.keys(validPages).length > 0) {
      adminOptions.pages = validPages;
    }
  }

  const admin = new AdminJS.default(adminOptions);

  return { admin } as unknown as AdminJsInstance;
}

/**
 * @description Initializes AdminJS with Express router
 * @description Requires @adminjs/express to be installed
 */
export async function initializeAdminJsExpress(
  sqlDataSource: SqlDataSource,
  options: AdminJsOptions,
): Promise<Required<AdminJsInstance>> {
  const { admin } = await initializeAdminJs(sqlDataSource, options);

  // Dynamic import with type erasure to avoid compile-time dependency
  let AdminJSExpress: { buildRouter: (admin: unknown) => unknown };
  try {
    // @ts-expect-error - @adminjs/express is an optional peer dependency
    AdminJSExpress = await import("@adminjs/express");
  } catch {
    throw new DriverNotFoundError("@adminjs/express");
  }

  const router = AdminJSExpress.buildRouter(admin);

  return { admin, router } as unknown as Required<AdminJsInstance>;
}
