/*
 * Represents a model in the Database
 */

interface ModelInput {
  tableName?: string;
}

export abstract class Model {
  public tableName: string;
  public primaryKey?: string;

  protected constructor(tableName?: string, primaryKey?: string) {
    this.tableName = tableName || this.constructor.name;
    this.primaryKey = primaryKey;
  }

  public toJson(): string {
    return JSON.stringify(this);
  }
}
