import { col, defineModel } from "../../../../src/sql/models/define_model";

export const PostWithUuid = defineModel("posts_with_uuid", {
  columns: {
    id: col.uuid({ primaryKey: true }),
    userId: col.string(),
    title: col.string(),
    content: col.string(),
    shortDescription: col.string(),
    createdAt: col.datetime({ autoCreate: true }),
    updatedAt: col.datetime({ autoCreate: true, autoUpdate: true }),
    deletedAt: col.datetime(),
  },
});
