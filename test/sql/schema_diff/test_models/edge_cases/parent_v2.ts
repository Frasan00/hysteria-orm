import {
  col,
  defineModel,
  defineRelations,
} from "../../../../../src/sql/models/define_model";
import { ChildV2 } from "./child_v2";

export const ParentV2 = defineModel("schema_diff_parent", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 255 }),
  },
});

export const ParentV2Relations = defineRelations(
  ParentV2,
  ({ hasMany, hasOne }) => ({
    children: hasMany(ChildV2, { foreignKey: "parentId" }),
    profileChild: hasOne(ChildV2, { foreignKey: "parentId" }),
  }),
);
