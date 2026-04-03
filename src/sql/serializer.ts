import { ColumnType } from "./models/decorators/model_decorators_types";
import { Model } from "./models/model";

/**
 * Transforms raw database row data into a properly typed model response.
 *
 * This function handles the core serialization logic for query results:
 *
 * 1. **Case Conversion**: Converts database column names (e.g., snake_case)
 *    to model property names (e.g., camelCase) based on model conventions.
 *
 * 2. **Column Filtering**: Only includes columns that were explicitly selected.
 *    - When `hasWildcards` is true (e.g., `SELECT *`), all model columns are included
 *    - When `hasWildcards` is false, only explicitly selected columns are included
 *
 * 3. **Custom Serializers**: If a column has a custom `serialize` function defined,
 *    it's applied to transform the database value (e.g., parsing JSON strings).
 *
 * 4. **Wildcard Protection**: When wildcards like `table.*` are used with JOINs,
 *    columns from other tables are filtered out to prevent data bleeding.
 *    Only explicitly selected columns (via aliases) are included from joined tables.
 *
 * 5. **Model Instance**: Creates an actual Model instance with prototype chain for
 *    proper column serialization and type handling.
 *
 * All Maps and Sets are pre-computed once per batch in `serializeModel` and passed
 * in as parameters to avoid redundant allocations per row.
 *
 * @param model - Raw database row as key-value pairs
 * @param typeofModel - The Model class to create instances from
 * @param columnsByName - Pre-computed map of model column name -> ColumnType (once per batch)
 * @param columnsByDbName - Pre-computed map of database column name -> ColumnType (once per batch)
 * @param modelSelectedColumnsSet - Pre-computed Set of selected column names, null means all (once per batch)
 * @param hasWildcards - Whether the query used wildcards (*, table.*)
 * @returns Promise resolving to the serialized model instance with proper typing
 */
export const parseDatabaseDataIntoModelResponse = async <
  T extends Record<string, any>,
>(
  model: T,
  typeofModel: typeof Model,
  columnsByName: Map<string, ColumnType>,
  columnsByDbName: Map<string, ColumnType>,
  modelSelectedColumnsSet: Set<string> | null,
  hasWildcards: boolean = false,
): Promise<T> => {
  const casedModel = Object.create(typeofModel.prototype) as Record<
    string,
    any
  >;

  // Collect deferred async serialize results to avoid Promise overhead for sync serializers.
  // In the common case (all serializers sync), this stays null and no Promises are created.
  let deferredAsync: Array<{ key: string; promise: Promise<any> }> | null =
    null;

  for (const key of Object.keys(model)) {
    const databaseValue = model[key];

    // Convert database column name to model property name
    const modelKey = columnsByDbName.get(key)?.columnName ?? key;

    const isModelColumn = columnsByName.has(modelKey);

    // Determine if this column should be included based on selection
    const isSelected = hasWildcards
      ? true
      : modelSelectedColumnsSet
        ? modelSelectedColumnsSet.has(modelKey)
        : true;

    // Handle model columns (columns defined in the Model class)
    if (isModelColumn) {
      if (!isSelected) {
        continue;
      }

      // Preserve null values as-is
      if (databaseValue === null) {
        casedModel[modelKey] = null;
        continue;
      }

      // Apply custom serializer if defined (e.g., JSON parsing, date formatting)
      const modelColumn = columnsByName.get(modelKey);
      if (modelColumn?.serialize) {
        const result = modelColumn.serialize(databaseValue);
        // Only defer to the async path if the serializer actually returns a Promise.
        // This avoids Promise allocation overhead for synchronous serializers (the common case).
        if (result !== null && typeof (result as any)?.then === "function") {
          if (!deferredAsync) deferredAsync = [];
          deferredAsync.push({
            key: modelKey,
            promise: result as Promise<any>,
          });
        } else {
          casedModel[modelKey] = result;
        }
        continue;
      }

      casedModel[modelKey] = databaseValue;
      continue;
    }

    // Handle non-model columns (aliases, selectRaw results, joined table columns).
    // Wildcard protection: when wildcards are used, only include columns that were
    // explicitly selected to prevent joined-table columns bleeding into the model.
    if (
      !hasWildcards ||
      (modelSelectedColumnsSet && modelSelectedColumnsSet.has(modelKey))
    ) {
      casedModel[modelKey] = databaseValue;
    }
  }

  // Resolve any async serializers collected during the sync pass
  if (deferredAsync) {
    const resolved = await Promise.all(deferredAsync.map((d) => d.promise));
    for (let i = 0; i < deferredAsync.length; i++) {
      casedModel[deferredAsync[i].key] = resolved[i];
    }
  }

  // Ensure all selected columns exist on the model, even if not returned by database
  if (modelSelectedColumnsSet) {
    for (const column of modelSelectedColumnsSet) {
      if (!(column in casedModel)) {
        casedModel[column] = null;
      }
    }
  }

  return casedModel as T;
};

/**
 * Main serializer function that transforms database query results into Model instances.
 *
 * This is the entry point for all query result serialization. It processes the raw
 * database rows and converts them into properly typed Model instances with:
 * - Correct property names (case conversion)
 * - Only selected columns included
 * - Custom serializers applied
 *
 * ## Column Selection Processing
 *
 * The `modelSelectedColumns` array is processed to extract actual column names:
 *
 * | Input Format           | Processed As          | Example                    |
 * |------------------------|----------------------|----------------------------|
 * | `"column"`             | `"column"`           | `"name"` -> `"name"`       |
 * | `"table.column"`       | `"column"`           | `"users.name"` -> `"name"` |
 * | `"column as alias"`    | `"alias"`            | `"age as userAge"` -> `"userAge"` |
 * | `"*"`                  | (skipped, sets flag) | Sets `hasWildcards=true`   |
 * | `"table.*"`            | (skipped, sets flag) | Sets `hasWildcards=true`   |
 *
 * ## Wildcard Behavior
 *
 * When wildcards are detected (`*` or `table.*`):
 * - All columns from the primary model table are included
 * - Columns from joined tables are EXCLUDED unless explicitly aliased
 *
 * This prevents data bleeding when using JOINs:
 * ```ts
 * // Without this protection, `name` from users would appear on Post model
 * sql.from(posts)
 *   .select("posts.*", "users.*")
 *   .leftJoin("users", "users.id", "posts.user_id")
 *   .many();
 *
 * // Correct approach: use explicit aliases for joined table columns
 * sql.from(posts)
 *   .select("posts.*", "users.name as authorName")
 *   .leftJoin("users", "users.id", "posts.user_id")
 *   .many();
 * ```
 *
 * @param models - Array of raw database rows to serialize
 * @param typeofModel - The Model class for metadata and type information
 * @param modelSelectedColumns - Array of selected columns in database convention
 * @returns Promise resolving to serialized model(s) or null if empty
 */
export const serializeModel = async <T extends Model>(
  models: T[],
  typeofModel: typeof Model,
  modelSelectedColumns: string[] = [],
): Promise<T | T[] | null> => {
  if (!models.length) {
    return null;
  }

  // Use cached column Maps — computed once per model class, never per call
  const columnsByName = typeofModel.getColumnsByName();
  const columnsByDbName = typeofModel.getColumnsByDatabaseName();

  // Detect if wildcards were used (*, table.*)
  const hasWildcards = modelSelectedColumns.some((col) => col.includes("*"));

  // Process selected columns from user input to normalized model property names.
  // This runs once per batch, not per row.
  const processedSelectedColumns: string[] = [];
  for (const databaseColumn of modelSelectedColumns) {
    // Handle aliased columns: "column as alias" -> extract "alias"
    const lowerColumn = databaseColumn.toLowerCase();
    if (lowerColumn.includes(" as ")) {
      const aliasMatch = databaseColumn.match(/\s+as\s+(.+)$/i);
      if (aliasMatch) {
        processedSelectedColumns.push(aliasMatch[1].trim());
      }
      continue;
    }

    let processedColumn = databaseColumn;

    // Handle qualified columns: "table.column" -> extract "column"
    if (processedColumn.includes(".")) {
      processedColumn = processedColumn.split(".").pop() as string;
    }

    // Skip wildcards (tracked separately via hasWildcards flag)
    if (processedColumn === "*") continue;

    // Use model column name if known, otherwise preserve as-is
    const columnName =
      columnsByName.get(processedColumn)?.columnName ?? processedColumn;
    processedSelectedColumns.push(columnName);
  }

  // Pre-compute the selected columns Set once — shared across all rows in this batch
  const modelSelectedColumnsSet = processedSelectedColumns.length
    ? new Set<string>(processedSelectedColumns)
    : null;

  const serializedModels = await Promise.all(
    models.map((model) =>
      parseDatabaseDataIntoModelResponse(
        model,
        typeofModel,
        columnsByName,
        columnsByDbName,
        modelSelectedColumnsSet,
        hasWildcards,
      ),
    ),
  );

  return serializedModels.length === 1 ? serializedModels[0] : serializedModels;
};
