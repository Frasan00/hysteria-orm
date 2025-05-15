import { Model } from "../models/model";

export type Returning = "raw" | "affectedRows";
export type SqlRunnerReturnType<T extends Returning> = T extends "raw"
  ? any
  : number;

export type SqlLiteOptions<T extends Model> = {
  typeofModel?: typeof Model;
  mode?: "insertMany" | "insertOne" | "affectedRows" | "fetch" | "raw";
  models?: T | T[];
};
