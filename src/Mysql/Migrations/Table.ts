import {Column} from "./Columns/Column";

export abstract class Table {
  public tableName: string;
  public columns: Column[] = [];
  protected constructor(tableName: string) {
    this.tableName = tableName;
  }
}
