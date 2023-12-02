import { ColumnConfig, ColumnType } from "../ColumnTypes";

interface ColumnInput {
  readonly name: string;
  readonly type: ColumnType;
  readonly config?: ColumnConfig;
  readonly length?: number;
}

export class Column {
  public name: string;
  public type: ColumnType;
  public length?: number = 100;
  public config?: ColumnConfig;

  constructor(input: ColumnInput) {
    this.name = input.name;
    this.type = input.type;
    this.length = input.length;
    this.config = input.config;
  }

  public getColumn(): Column {
    return this;
  }
}
