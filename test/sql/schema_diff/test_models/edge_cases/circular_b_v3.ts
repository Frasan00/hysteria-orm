import {
  col,
  defineModel,
  defineRelations,
} from "../../../../../src/sql/models/define_model";
import { CircularAV3 } from "./circular_a_v3";

export const CircularBV3 = defineModel("schema_diff_circular_b", {
  columns: {
    id: col.bigIncrement(),
    label: col.string({ length: 255 }),
    aId: col.bigInteger(),
  },
});

export const CircularBV3Relations = defineRelations(
  CircularBV3,
  ({ belongsTo }) => ({
    a: belongsTo(CircularAV3, { foreignKey: "aId" }),
  }),
);
