import {
  col,
  defineModel,
  defineRelations,
} from "../../../../../src/sql/models/define_model";
import { CircularBV2 } from "./circular_b_v2";

export const CircularAV2 = defineModel("schema_diff_circular_a", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 255 }),
    bId: col.bigInteger(),
  },
});

export const CircularAV2Relations = defineRelations(
  CircularAV2,
  ({ belongsTo }) => ({
    b: belongsTo(CircularBV2, { foreignKey: "bId" }),
  }),
);

export const CircularBV2Relations = defineRelations(
  CircularBV2,
  ({ belongsTo }) => ({
    a: belongsTo(CircularAV2, { foreignKey: "aId" }),
  }),
);
