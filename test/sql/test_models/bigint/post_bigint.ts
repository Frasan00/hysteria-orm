import { defineModel, col } from "../../../../src/sql/models/define_model";

export const PostWithBigint = defineModel("posts_with_bigint", {
  columns: {
    id: col.integer({ primaryKey: true }),
    userId: col.integer(),
    title: col.string(),
    content: col.string(),
    shortDescription: col.string(),
    createdAt: col.datetime({ autoCreate: true }),
    updatedAt: col.datetime({ autoCreate: true, autoUpdate: true }),
    deletedAt: col.datetime(),
  },
});
