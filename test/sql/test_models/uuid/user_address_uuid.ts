import { defineModel, col } from "../../../../src/sql/models/define_model";

export const UserAddressWithUuid = defineModel("user_address_with_uuid", {
  columns: {
    id: col.uuid({ primaryKey: true }),
    userId: col.string(),
    addressId: col.string(),
    createdAt: col.datetime({ autoCreate: true }),
    updatedAt: col.datetime({ autoCreate: true, autoUpdate: true }),
    deletedAt: col.datetime(),
  },
});
