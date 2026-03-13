import {
  col,
  defineModel,
  defineRelations,
} from "../../../../../src/sql/models/define_model";
import { ParentV2 } from "./parent_v2";

export const ChildV2 = defineModel("schema_diff_child", {
  columns: {
    id: col.bigIncrement(),
    value: col.string({ length: 255 }),
    parentId: col.bigInteger(),
  },
});

export const ChildV2Relations = defineRelations(ChildV2, ({ belongsTo }) => ({
  parent: belongsTo(ParentV2, { foreignKey: "parentId" }),
}));
