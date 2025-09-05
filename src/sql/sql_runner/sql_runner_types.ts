import { Model } from "../models/model";
import { AnnotatedModel } from "../models/model_query_builder/model_query_builder_types";
import { Readable } from "node:stream";
import { GetConnectionReturnType } from "../sql_data_source_types";

export type Returning = "raw" | "affectedRows";
export type SqlRunnerReturnType<T extends Returning> = T extends "raw"
  ? any
  : number;

export type SqlLiteOptions<T extends Model> = {
  typeofModel?: typeof Model;
  mode?: "insertMany" | "insertOne" | "affectedRows" | "fetch" | "raw";
  models?: T | T[];
  customConnection?: GetConnectionReturnType<"sqlite">;
};

export type SqlStreamingReturnType<
  T extends "generator" | "stream",
  A extends Record<string, any>,
  R extends Record<string, any>,
> = T extends "generator"
  ? AsyncGenerator<AnnotatedModel<Model, A, R>>
  : Readable;
