/*
 * Represents a model in the Database
 */

interface ModelInput {
  tableName?: string;
}

export abstract class Model {
  public tableName: string;

  protected constructor(tableName?: string) {
    this.tableName = tableName || this.constructor.name;
  }

  public toJson(): string {
    return JSON.stringify(this);
  }
}
