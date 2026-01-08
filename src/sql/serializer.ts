import { convertCase } from "../utils/case_utils";
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
 * 3. **Hidden Columns**: Columns marked as `hidden` in the model decorator are
 *    automatically excluded from the response.
 *
 * 4. **Custom Serializers**: If a column has a custom `serialize` function defined,
 *    it's applied to transform the database value (e.g., parsing JSON strings).
 *
 * 5. **Wildcard Protection**: When wildcards like `table.*` are used with JOINs,
 *    columns from other tables are filtered out to prevent data bleeding.
 *    Only explicitly selected columns (via aliases) are included from joined tables.
 *
 * @param model - Raw database row as key-value pairs
 * @param typeofModel - The Model class for metadata lookup
 * @param modelColumns - Array of column definitions from the model
 * @param modelColumnsMap - Map of column name -> column definition for O(1) lookup
 * @param modelSelectedColumns - Array of selected column names (in model case convention)
 * @param hasWildcards - Whether the query used wildcards (*, table.*)
 * @returns Promise resolving to the serialized model with proper typing
 */
export const parseDatabaseDataIntoModelResponse = async <
  T extends Record<string, any>,
>(
  model: T,
  typeofModel: typeof Model,
  modelColumns: ColumnType[],
  modelColumnsMap: Map<string, ColumnType>,
  modelSelectedColumns: string[] = [],
  hasWildcards: boolean = false,
): Promise<T> => {
  const casedModel: Record<string, any> =
    new (typeofModel as unknown as new () => T)();

  // Pre-compute hidden columns for O(1) lookup during iteration
  const hiddenColumnsSet = new Set<string>(
    modelColumns
      .filter((column) => column.hidden)
      .map((column) => column.columnName),
  );

  // Map database column names to model column definitions for reverse lookup
  const databaseColumnsMap = new Map<string, ColumnType>(
    modelColumns.map((modelColumn) => [modelColumn.databaseName, modelColumn]),
  );

  // Create a Set for O(1) lookup of selected columns (null means all columns)
  const modelSelectedColumnsSet = modelSelectedColumns.length
    ? new Set<string>(modelSelectedColumns)
    : null;

  await Promise.all(
    Object.keys(model).map(async (key) => {
      const databaseValue = model[key];

      // Convert database column name to model property name
      // First check if it's a known model column, otherwise apply case conversion
      const modelKey =
        databaseColumnsMap.get(key)?.columnName ??
        convertCase(key, typeofModel.modelCaseConvention);

      const isModelColumn = modelColumnsMap.has(modelKey);
      const isHidden = hiddenColumnsSet.has(modelKey);

      // Determine if this column should be included based on selection
      // - With wildcards: include all model columns (wildcards mean "select all from this table")
      // - Without wildcards: only include if explicitly in the selection list
      const isSelected = hasWildcards
        ? true
        : modelSelectedColumnsSet
          ? modelSelectedColumnsSet.has(modelKey)
          : true;

      // Handle model columns (columns defined in the Model class)
      if (isModelColumn) {
        // Skip hidden columns and non-selected columns
        if (isHidden || !isSelected) {
          return;
        }

        // Preserve null values as-is (don't skip them)
        if (databaseValue === null) {
          casedModel[modelKey] = null;
          return;
        }

        // Apply custom serializer if defined (e.g., JSON parsing, date formatting)
        const modelColumn = modelColumnsMap.get(modelKey);
        if (modelColumn && modelColumn.serialize) {
          casedModel[modelKey] = await modelColumn.serialize(databaseValue);
          return;
        }

        casedModel[modelKey] = databaseValue;
        return;
      }

      // Handle non-model columns (aliases, selectRaw results, joined table columns)
      // This is where wildcard protection kicks in:
      // - When NO wildcards used: include all extra columns (they came from explicit selection)
      // - When wildcards used: only include if EXPLICITLY in the selection list
      //   This prevents columns from joined tables bleeding into the model when using
      //   queries like: .select("posts.*", "users.*") - users columns won't appear on Post model
      if (
        !hasWildcards ||
        (modelSelectedColumnsSet && modelSelectedColumnsSet.has(modelKey))
      ) {
        casedModel[modelKey] = databaseValue;
      }
    }),
  );

  // Ensure all selected columns exist on the model, even if not returned by database
  // This handles cases where a column is selected but has no data (e.g., LEFT JOIN with no match)
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
 * - Hidden columns filtered out
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
 * Post.query()
 *   .select("posts.*", "users.*")
 *   .leftJoin("users", "users.id", "posts.user_id")
 *   .many();
 *
 * // Correct approach: use explicit aliases for joined table columns
 * Post.query()
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

  const modelColumns = typeofModel.getColumns();
  const modelColumnsMap = new Map<string, ColumnType>(
    modelColumns.map((modelColumn) => [modelColumn.columnName, modelColumn]),
  );

  // Detect if wildcards were used (*, table.*)
  // When wildcards are present, we need special handling to prevent columns
  // from joined tables bleeding into the model (see function docs above)
  const hasWildcards = modelSelectedColumns.some((col) => col.includes("*"));

  // Process selected columns from database convention to model convention
  // This normalizes various input formats (table.column, column as alias, etc.)
  const processedSelectedColumns: string[] = [];
  for (const databaseColumn of modelSelectedColumns) {
    // Handle aliased columns: "column as alias" -> extract "alias"
    const lowerColumn = databaseColumn.toLowerCase();
    if (lowerColumn.includes(" as ")) {
      const aliasMatch = databaseColumn.match(/\s+as\s+(.+)$/i);
      if (aliasMatch) {
        processedSelectedColumns.push(
          convertCase(aliasMatch[1].trim(), typeofModel.modelCaseConvention),
        );
      }
      continue;
    }

    let processedColumn = databaseColumn;

    // Handle qualified columns: "table.column" -> extract "column"
    if (processedColumn.includes(".")) {
      processedColumn = processedColumn.split(".").pop() as string;
    }

    // Skip wildcards (they're tracked separately via hasWildcards flag)
    if (processedColumn === "*") {
      continue;
    }

    // Convert to model case convention (e.g., snake_case -> camelCase)
    const columnName =
      modelColumnsMap.get(processedColumn)?.columnName ??
      convertCase(processedColumn, typeofModel.modelCaseConvention);
    processedSelectedColumns.push(columnName);
  }
  modelSelectedColumns = processedSelectedColumns;

  // Serialize each model in parallel for better performance
  const serializedModels = await Promise.all(
    models.map(async (model) => {
      const serializedModel = await parseDatabaseDataIntoModelResponse(
        model,
        typeofModel,
        modelColumns,
        modelColumnsMap,
        modelSelectedColumns,
        hasWildcards,
      );

      return serializedModel;
    }),
  );

  return serializedModels.length === 1 ? serializedModels[0] : serializedModels;
};
