/*
 * Represents a model in the Database
 */
import { camelToSnakeCase } from "../../CaseUtils";

export interface Metadata {
  readonly tableName: string;
  readonly primaryKey?: string;
}

export abstract class Model {
  public metadata: Metadata;
  public aliasColumns: { [key: string]: string | number | boolean } = {};

  protected constructor(tableName?: string, primaryKey?: string) {
    this.metadata = {
      tableName: tableName || camelToSnakeCase(this.constructor.name) + "s",
      primaryKey: primaryKey,
    };
  }

  public setProps<T extends this>(data: Partial<T>): void {
    for (const key in data) {
      Object.assign(this, { [key]: data[key] });
    }
  }
}
