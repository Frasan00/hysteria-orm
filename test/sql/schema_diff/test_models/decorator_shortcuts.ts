import { col, defineModel } from "../../../../src/sql/models/define_model";

/**
 * Model specifically for testing decorator shortcuts idempotency
 * Uses col.string(), col.text(), etc.
 * This ensures schema sync is idempotent when using col shortcuts
 */
export const DecoratorShortcutsModel = defineModel(
  "schema_diff_decorator_shortcuts",
  {
    columns: {
      id: col.bigIncrement(),
      name: col.string({ length: 100 }),
      email: col.string({ length: 255 }),
      age: col.integer(),
      isActive: col.boolean(),
      balance: col.decimal({ precision: 10, scale: 2 }),
      birthDate: col.date(),
      createdAt: col.timestamp(),
    },
  },
);
