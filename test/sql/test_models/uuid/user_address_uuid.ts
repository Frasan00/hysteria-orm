import crypto from "node:crypto";
import { defineModel, col } from "../../../../src/sql/models/define_model";

export const UserAddressWithUuid = defineModel("user_address_with_uuid", {
  columns: {
    id: col.primary<string>(),
    userId: col.string(),
    addressId: col.string(),
    createdAt: col.datetime({ autoCreate: true }),
    updatedAt: col.datetime({ autoCreate: true, autoUpdate: true }),
    deletedAt: col.datetime(),
  },
  hooks: {
    beforeInsert: (data) => {
      data.id = crypto.randomUUID();
    },
    beforeInsertMany: (data) => {
      for (const item of data) {
        item.id = crypto.randomUUID();
      }
    },
  },
});
