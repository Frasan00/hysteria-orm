import { QueryNode } from "../../query";

export class ColumnTypeNode extends QueryNode {
  column: string;
  dataType: string;
  length?: number;
  precision?: number;
  scale?: number;
  enumValues?: readonly string[];
  autoIncrement?: boolean;
  withTimezone?: boolean;
  chainsWith = ",";
  canKeywordBeSeenMultipleTimes = true;
  folder = "column";
  file = "column_type";
  isRawValue = false;

  constructor(
    column: string,
    dataType: string,
    opts: {
      length?: number;
      precision?: number;
      scale?: number;
      enumValues?: readonly string[];
      withTimezone?: boolean;
      autoIncrement?: boolean;
      isRawValue?: boolean;
    } = {},
  ) {
    super("");
    this.column = column;
    this.dataType = dataType;
    this.length = opts.length;
    this.precision = opts.precision;
    this.scale = opts.scale;
    this.enumValues = opts.enumValues;
    this.withTimezone = opts.withTimezone;
    this.autoIncrement = opts.autoIncrement;
    this.isRawValue = opts.isRawValue ?? false;
  }
}
