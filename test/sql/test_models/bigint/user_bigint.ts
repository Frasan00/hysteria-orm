import { defineModel, col } from "../../../../src/sql/models/define_model";

export enum UserStatus {
  active = "active",
  inactive = "inactive",
}

export const UserWithBigint = defineModel("users_with_bigint", {
  columns: {
    id: col.integer({ primaryKey: true }),
    name: col.string(),
    email: col.string(),
    password: col.string(),
    status: col.string(),
    age: col.integer(),
    salary: col.integer(),
    gender: col.string(),
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
    beforeUpdate(queryBuilder) {
      queryBuilder.whereNull("users_with_bigint.deleted_at");
    },
    beforeDelete(queryBuilder) {
      queryBuilder.whereNull("users_with_bigint.deleted_at");
    },
    beforeFetch(queryBuilder) {
      queryBuilder.whereNull("users_with_bigint.deleted_at");
    },
  },
});
