import crypto from "node:crypto";
import { defineModel, col } from "../../../../src/sql/models/define_model";

export const AddressWithUuid = defineModel("address_with_uuid", {
  columns: {
    id: col.primary<string>(),
    street: col.string(),
    city: col.string(),
    state: col.string(),
    zip: col.string(),
    country: col.string(),
    createdAt: col.datetime({ autoCreate: true }),
    updatedAt: col.datetime({ autoCreate: true, autoUpdate: true }),
    deletedAt: col.datetime(),
  },
  hooks: {
    beforeInsert: async (data) => {
      data.id = crypto.randomUUID();
    },
    beforeInsertMany: async (data) => {
      for (const item of data) {
        item.id = crypto.randomUUID();
      }
    },
  },
});
