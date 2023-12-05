/*
 * Represents a model in the Database
 */
export abstract class Model {
  public tableName: string;
  public primaryKey?: string;

  protected constructor(tableName?: string, primaryKey?: string) {
    this.tableName = tableName || this.constructor.name;
    this.primaryKey = primaryKey;
  }
}
