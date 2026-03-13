import {
  col,
  defineModel,
  defineRelations,
} from "../../../../../src/sql/models/define_model";
import { MultiFkAnchor } from "./multi_fk_v1";

export const MultiFkV2 = defineModel("schema_diff_mfk", {
  columns: {
    id: col.bigIncrement(),
    title: col.string({ length: 255 }),
    createdById: col.bigInteger(),
    updatedById: col.bigInteger(),
    approvedById: col.bigInteger({ nullable: true }),
  },
});

export const MultiFkV2Relations = defineRelations(
  MultiFkV2,
  ({ belongsTo }) => ({
    createdBy: belongsTo(MultiFkAnchor, {
      foreignKey: "createdById",
      onDelete: "cascade",
    }),
    updatedBy: belongsTo(MultiFkAnchor, { foreignKey: "updatedById" }),
    approvedBy: belongsTo(MultiFkAnchor, { foreignKey: "approvedById" }),
  }),
);
