import {
  col,
  defineModel,
  defineRelations,
} from "../../../../../src/sql/models/define_model";
import { ChildV1 } from "./child_v1";

export const ParentV1 = defineModel("schema_diff_parent", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 255 }),
  },
});

export const ParentV1Relations = defineRelations(ParentV1, ({ hasMany }) => ({
  children: hasMany(ChildV1, { foreignKey: "parentId" }),
}));
