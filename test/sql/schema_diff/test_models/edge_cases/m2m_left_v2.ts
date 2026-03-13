import {
  col,
  defineModel,
  defineRelations,
} from "../../../../../src/sql/models/define_model";
import { M2mRight } from "./m2m_right";

export const M2mLeftV2 = defineModel("schema_diff_m2m_left", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 255 }),
  },
});

export const M2mLeftV2Relations = defineRelations(
  M2mLeftV2,
  ({ manyToMany }) => ({
    rights: manyToMany(M2mRight, {
      through: "schema_diff_m2m_pivot",
      leftForeignKey: "leftId",
      rightForeignKey: "rightId",
      onDelete: "cascade",
    }),
  }),
);
