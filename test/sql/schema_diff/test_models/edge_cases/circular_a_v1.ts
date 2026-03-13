import {
  col,
  defineModel,
  defineRelations,
} from "../../../../../src/sql/models/define_model";
import { CircularBV1 } from "./circular_b_v1";

export const CircularAV1 = defineModel("schema_diff_circular_a", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 255 }),
    bId: col.bigInteger(),
  },
});

export const CircularAV1Relations = defineRelations(
  CircularAV1,
  ({ belongsTo }) => ({
    b: belongsTo(CircularBV1, { foreignKey: "bId" }),
  }),
);
