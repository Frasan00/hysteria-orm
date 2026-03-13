import {
  col,
  defineModel,
  defineRelations,
} from "../../../../../src/sql/models/define_model";

export const FkDropAnchor = defineModel("schema_diff_fk_anchor", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 255 }),
  },
});

export const FkDropMultipleV1 = defineModel("schema_diff_fk_multiple", {
  columns: {
    id: col.bigIncrement(),
    title: col.string({ length: 255 }),
    createdById: col.bigInteger(),
    updatedById: col.bigInteger(),
    approvedById: col.bigInteger(),
  },
});

export const FkDropMultipleV1Relations = defineRelations(
  FkDropMultipleV1,
  ({ belongsTo }) => ({
    createdBy: belongsTo(FkDropAnchor, {
      foreignKey: "createdById",
      constraintName: "fk_fkm_created",
    }),
    updatedBy: belongsTo(FkDropAnchor, {
      foreignKey: "updatedById",
      constraintName: "fk_fkm_updated",
    }),
    approvedBy: belongsTo(FkDropAnchor, {
      foreignKey: "approvedById",
      constraintName: "fk_fkm_approved",
    }),
  }),
);
