import {
  col,
  defineModel,
  defineRelations,
} from "../../../../../src/sql/models/define_model";

export const MultiFkAnchor = defineModel("schema_diff_mfk_anchor", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 255 }),
  },
});

export const MultiFkV1 = defineModel("schema_diff_mfk", {
  columns: {
    id: col.bigIncrement(),
    title: col.string({ length: 255 }),
    createdById: col.bigInteger(),
    updatedById: col.bigInteger(),
  },
});

export const MultiFkV1Relations = defineRelations(
  MultiFkV1,
  ({ belongsTo }) => ({
    createdBy: belongsTo(MultiFkAnchor, { foreignKey: "createdById" }),
    updatedBy: belongsTo(MultiFkAnchor, { foreignKey: "updatedById" }),
  }),
);
