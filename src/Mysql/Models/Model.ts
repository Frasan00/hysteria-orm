/*
 * Represents a model in the Database
 */

interface ModelInput {
  name?: string;
}

export abstract class Model {
  public name: string;

  constructor(name?: string) {
    this.name = name || this.constructor.name;
  }

  public toJson(): string {
    return JSON.stringify(this);
  }
}
