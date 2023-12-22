/*
 * Represents a model in the Database
 */
export interface Metadata {
  readonly tableName: string;
  readonly primaryKey?: string;
}

export abstract class Model {
  public metadata: Metadata;

  protected constructor(tableName?: string, primaryKey?: string) {
    this.metadata = {
      tableName: tableName || this.constructor.name,
      primaryKey: primaryKey,
    };
  }
}
