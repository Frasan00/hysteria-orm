import { Model } from "../../models/model";
import { ModelKey, ModelRelation } from "../model_manager/model_manager_types";
import { ModelWithoutRelations } from "../model_types";

/**
 * Extracts the instance type from a Model class type.
 *
 * @example
 * type UserInstance = ModelInstanceType<typeof User>; // User
 */
export type ModelInstanceType<O> = O extends typeof Model
  ? InstanceType<O>
  : never;

/**
 * Available fetch hook combinations for query execution.
 * Hooks can be selectively ignored when fetching data.
 */
export type FetchHooks =
  | ["afterFetch"]
  | ["beforeFetch"]
  | ["afterFetch", "beforeFetch"]
  | ["beforeFetch", "afterFetch"]
  | [];

export type OneOptions = {
  ignoreHooks?: FetchHooks;
};

export type ManyOptions = {
  ignoreHooks?: FetchHooks;
};

/**
 * Extracts the related Model type from a relation key.
 *
 * @example
 * // If User has: posts: Post[]
 * type PostModel = RelatedInstance<User, "posts">; // Post
 *
 * // If User has: profile: Profile
 * type ProfileModel = RelatedInstance<User, "profile">; // Profile
 */
export type RelatedInstance<M extends Model, K extends ModelRelation<M>> =
  NonNullable<M[K]> extends (infer R)[]
    ? R extends Model
      ? R
      : never
    : NonNullable<M[K]> extends Model
      ? NonNullable<M[K]>
      : never;

// ============================================================================
// Type-Safe Select Utilities
// ============================================================================
//
// These types enable TypeScript to infer the correct return type based on
// which columns are selected in a query. This provides:
//
// 1. **Type Safety**: Only selected columns are available on the result
// 2. **Intellisense**: Autocomplete for model columns and aliases
// 3. **Alias Support**: `"column as alias"` syntax creates typed aliases
//
// Example:
// ```ts
// const user = await User.query()
//   .select("name", "age as userAge")
//   .one();
//
// user.name;     // ✓ string
// user.userAge;  // ✓ number (aliased from 'age')
// user.email;    // ✗ Type error - not selected
// ```
// ============================================================================

/**
 * Utility type to convert a union to an intersection.
 * Used internally to combine multiple select column types.
 *
 * @internal
 */
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;

/**
 * Represents all valid column selection formats with intellisense support.
 *
 * ## Supported Formats
 *
 * | Format                    | Example                  | Description                    |
 * |---------------------------|--------------------------|--------------------------------|
 * | Model column              | `"name"`                 | Direct column with intellisense |
 * | Qualified column          | `"users.name"`           | Table-prefixed column          |
 * | Aliased column            | `"name as userName"`     | Column with custom alias       |
 * | Wildcard                  | `"*"`                    | Select all from primary table  |
 * | Table wildcard            | `"users.*"`              | Select all from specific table |
 *
 * @example
 * User.query().select(
 *   "name",                    // Model column with intellisense
 *   "users.email",             // Qualified column
 *   "age as userAge",          // Aliased column
 *   "*"                        // All columns
 * );
 */
export type SelectableColumn<T extends Model> =
  | ModelKey<T>
  | `${string}.${string}`
  | `${string} as ${string}`
  | "*";

/**
 * Extracts the final property name from a column selection string.
 *
 * This type determines what property name will be available on the result:
 * - Plain columns use their name directly
 * - Aliased columns use the alias
 * - Wildcards return `never` (handled specially to return full model)
 *
 * ## Extraction Rules
 *
 * | Input                    | Output        | Explanation                    |
 * |--------------------------|---------------|--------------------------------|
 * | `"name"`                 | `"name"`      | Direct column                  |
 * | `"users.name"`           | `"name"`      | Extract column from qualified  |
 * | `"name as userName"`     | `"userName"`  | Use alias                      |
 * | `"users.name as author"` | `"author"`    | Alias takes precedence         |
 * | `"*"`                    | `never`       | Wildcard - full model          |
 * | `"users.*"`              | `never`       | Table wildcard - Record<>      |
 */
export type ExtractColumnName<S extends string> =
  S extends `${string} as ${infer Alias}`
    ? Alias
    : S extends "*"
      ? never
      : S extends `${string}.*`
        ? never
        : S extends `${string}.${infer Column}`
          ? Column extends "*"
            ? never
            : Column
          : S;

/**
 * Resolves the TypeScript type for a selected column.
 *
 * If the column exists in the model, its type is used.
 * Otherwise, `any` is used (for aliased columns, joins, etc.).
 *
 * @example
 * // If User.age is `number`:
 * GetColumnType<User, "age">    // number
 * GetColumnType<User, "custom"> // any (not a model column)
 */
export type GetColumnType<
  T extends Model,
  ColumnName extends string,
> = ColumnName extends keyof ModelWithoutRelations<T>
  ? ModelWithoutRelations<T>[ColumnName]
  : any;

/**
 * Builds the type for a single selected column.
 *
 * ## Type Resolution
 *
 * | Selection          | Result Type                           |
 * |--------------------|---------------------------------------|
 * | `"*"`              | `ModelWithoutRelations<T>` (full)     |
 * | `"table.*"`        | `Record<string, any>` (unknown shape) |
 * | `"column"`         | `{ column: ColumnType }`              |
 * | `"col as alias"`   | `{ alias: ColumnType }`               |
 *
 * @internal
 */
export type BuildSingleSelectType<
  T extends Model,
  S extends string,
> = S extends "*"
  ? ModelWithoutRelations<T>
  : S extends `${string}.*`
    ? Record<string, any>
    : ExtractColumnName<S> extends never
      ? {}
      : {
          [K in ExtractColumnName<S>]: GetColumnType<T, ExtractColumnName<S>>;
        };

/**
 * Checks if a column selection includes wildcards or is empty.
 * Used to determine if the full model type should be returned.
 *
 * @internal
 */
type HasStarOrEmpty<Columns extends readonly string[]> =
  Columns["length"] extends 0
    ? true
    : "*" extends Columns[number]
      ? true
      : false;

/**
 * Builds the combined TypeScript type for multiple selected columns.
 *
 * This is the main type used to compute the return type of `select()` calls.
 * It handles all the complexity of combining multiple column selections into
 * a single coherent type.
 *
 * ## Rules
 *
 * 1. **Empty selection or `*`**: Returns full `ModelWithoutRelations<T>`
 * 2. **Specific columns**: Returns intersection of all selected column types
 * 3. **With `table.*`**: Adds `Record<string, any>` to allow unknown properties
 * 4. **Always includes**: Base `Model` methods (save, delete, etc.)
 *
 * @example
 * // .select("name", "age as userAge")
 * BuildSelectType<User, ["name", "age as userAge"]>
 * // Result: { name: string; userAge: number } & Pick<Model, keyof Model>
 *
 * @example
 * // .select("*")
 * BuildSelectType<User, ["*"]>
 * // Result: ModelWithoutRelations<User> (all columns)
 */
export type BuildSelectType<
  T extends Model,
  Columns extends readonly string[],
> =
  HasStarOrEmpty<Columns> extends true
    ? ModelWithoutRelations<T>
    : UnionToIntersection<
          {
            [K in keyof Columns]: Columns[K] extends string
              ? BuildSingleSelectType<T, Columns[K]>
              : {};
          }[number]
        > extends infer Result
      ? Result extends Record<string, any>
        ? keyof Result extends never
          ? ModelWithoutRelations<T>
          : Result & Pick<Model, keyof Model>
        : ModelWithoutRelations<T>
      : ModelWithoutRelations<T>;

/**
 * The final result type for ModelQueryBuilder queries.
 *
 * Combines selected columns (S) with loaded relations (R) into a single type.
 *
 * @typeParam S - Selected columns type from `select()` calls
 * @typeParam R - Relations type from `load()` calls
 *
 * @example
 * // User.query().select("name").load("posts").one()
 * SelectedModel<{ name: string }, { posts: Post[] }>
 * // Result: { name: string; posts: Post[] }
 */
export type SelectedModel<
  S extends Record<string, any> = {},
  R extends Record<string, any> = {},
> = S & R;
