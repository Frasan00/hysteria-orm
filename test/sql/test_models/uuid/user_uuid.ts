import { col, defineModel } from "../../../../src/sql/models/define_model";

export enum UserStatus {
  active = "active",
  inactive = "inactive",
}

export const UserWithUuid = defineModel("users_with_uuid", {
  columns: {
    id: col.uuid({ primaryKey: true }),
    name: col.string(),
    email: col.string(),
    password: col.string({ hidden: true }),
    status: col.string(),
    age: col.integer(),
    salary: col.integer(),
    gender: col.string(),
    height: col.integer(),
    weight: col.integer(),
    description: col.encryption.symmetric({ key: "symmetricKey" }),
    shortDescription: col.string(),
    isActive: col.boolean(),
    json: col.json(),
    birthDate: col.date(),
    createdAt: col.datetime({ autoCreate: true }),
    updatedAt: col.datetime({ autoCreate: true, autoUpdate: true }),
    deletedAt: col.datetime(),
  },
  hooks: {
    beforeUpdate: (queryBuilder) => {
      queryBuilder.whereNull("users_with_uuid.deleted_at");
    },
    beforeDelete: (queryBuilder) => {
      queryBuilder.whereNull("users_with_uuid.deleted_at");
    },
    beforeFetch: (queryBuilder) => {
      queryBuilder.whereNull("users_with_uuid.deleted_at");
    },
    afterFetch: (data) => {
      return data;
    },
    beforeInsert: (data) => {
      const originalName = data.name;
      data.name = originalName!.toUpperCase();
      data.name = originalName;
    },
    beforeInsertMany: (data) => {
      for (const item of data) {
        const originalName = item.name;
        item.name = originalName!.toUpperCase();
        item.name = originalName;
      }
    },
  },
});
