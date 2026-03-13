import crypto from "node:crypto";
import { col, defineModel } from "../../../../src/sql/models/define_model";

export const PostWithUuid = defineModel("posts_with_uuid", {
  columns: {
    id: col.primary<string>(),
    userId: col.string(),
    title: col.string(),
    content: col.string(),
    shortDescription: col.string(),
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
