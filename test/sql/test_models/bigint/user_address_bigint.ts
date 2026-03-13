import { defineModel, col } from "../../../../src/sql/models/define_model";

export const UserAddressWithBigint = defineModel("user_address_with_bigint", {
  columns: {
    id: col.integer({ primaryKey: true }),
    userId: col.integer(),
    addressId: col.integer(),
    createdAt: col.datetime({ autoCreate: true }),
    updatedAt: col.datetime({ autoCreate: true, autoUpdate: true }),
    deletedAt: col.datetime(),
  },
});
