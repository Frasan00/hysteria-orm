export class DropColumn {
  public name: string;
  public foreignKey: boolean;

  constructor(name: string, foreignKey: boolean = false) {
    this.name = name;
    this.foreignKey = foreignKey;
  }

  public getColumn(): DropColumn {
    return this;
  }
}
