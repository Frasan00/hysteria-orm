import { defineModel, col } from "../../../../src/sql/models/define_model";

export enum UserStatus {
  active = "active",
  inactive = "inactive",
}

export const UserWithoutPk = defineModel("users_without_pk", {
  columns: {
    name: col.string(),
    email: col.string(),
    password: col.string(),
    status: col.string(),
    age: col.integer(),
    salary: col.integer(),
    gender: col.string(),
    image: col.boolean(),
    height: col.integer(),
    weight: col.integer(),
    description: col.string(),
    shortDescription: col.string(),
    isActive: col.boolean(),
    json: col.json(),
    birthDate: col.date(),
    createdAt: col.datetime({ autoCreate: true }),
    updatedAt: col.datetime({ autoCreate: true, autoUpdate: true }),
    deletedAt: col.datetime(),
  },
  hooks: {
    beforeFetch: (queryBuilder) => {
      const fromNode = (queryBuilder as any).fromNode;
      const fromStr = typeof fromNode?.table === "string" ? fromNode.table : "";
      const parts = fromStr.split(/\s+as\s+/i).map((s: string) => s.trim());
      // If FROM was overridden with a CTE/subquery, the soft-delete filter
      // cannot reference the base table — skip it.
      if (parts[0] !== "users_without_pk") {
        return;
      }
      const ref = parts[1] ?? parts[0]; // alias if present, else base table
      queryBuilder.whereNull(`${ref}.deleted_at`);
    },
  },
});
