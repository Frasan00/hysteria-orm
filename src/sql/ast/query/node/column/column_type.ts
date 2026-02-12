import { QueryNode } from "../../query";

export class ColumnTypeNode extends QueryNode {
  column: string | (() => string);
  dataType: string;
  length?: number;
  precision?: number;
  scale?: number;
  enumValues?: readonly string[];
  autoIncrement?: boolean;
  withTimezone?: boolean;
  autoCreate?: boolean;
  autoUpdate?: boolean;
  collate?: string;
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
      autoCreate?: boolean;
      autoUpdate?: boolean;
      collate?: string;
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
    this.autoCreate = opts.autoCreate;
    this.autoUpdate = opts.autoUpdate;
    this.collate = opts.collate;
    this.isRawValue = opts.isRawValue ?? false;
  }
}
