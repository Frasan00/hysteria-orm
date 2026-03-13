import { defineModel, col } from "../../../../src/sql/models/define_model";

export const AddressWithBigint = defineModel("address_with_bigint", {
  columns: {
    id: col.integer({ primaryKey: true }),
    street: col.string(),
    city: col.string(),
    state: col.string(),
    zip: col.string(),
    country: col.string(),
    createdAt: col.datetime({ autoCreate: true }),
    updatedAt: col.datetime({ autoCreate: true, autoUpdate: true }),
    deletedAt: col.datetime(),
  },
});
