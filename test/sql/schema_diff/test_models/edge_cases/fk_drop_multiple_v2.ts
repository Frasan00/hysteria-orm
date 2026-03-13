import {
  col,
  defineModel,
  defineRelations,
} from "../../../../../src/sql/models/define_model";
import { FkDropAnchor } from "./fk_drop_multiple_anchor";

export const FkDropMultipleV2 = defineModel("schema_diff_fk_multiple", {
  columns: {
    id: col.bigIncrement(),
    title: col.string({ length: 255 }),
    createdById: col.bigInteger(),
    updatedById: col.bigInteger(),
    approvedById: col.bigInteger(),
  },
});

export const FkDropMultipleV2Relations = defineRelations(
  FkDropMultipleV2,
  ({ belongsTo }) => ({
    createdBy: belongsTo(FkDropAnchor, {
      foreignKey: "createdById",
      constraintName: "fk_fkm_created",
    }),
  }),
);
