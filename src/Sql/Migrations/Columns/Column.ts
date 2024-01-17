import { ColumnConfig, ColumnType } from "./ColumnTypes";

export class Column {
  public name!: string;
  public oldName?: string; // used for alter table
  public type!: ColumnType;
  public values?: string[];
  public length?: number;
  public alter?: boolean; // used for alter table
  public after?: string; // used for alter table
  public config: ColumnConfig = {
    nullable: true,
    unique: false,
    autoIncrement: false,
    primary: false,
    defaultValue: false,
    autoCreate: false,
    autoUpdate: false,
    references: undefined,
    unsigned: false,
    cascade: false,
  };

  public getColumn(): Column {
    return this;
  }
}
