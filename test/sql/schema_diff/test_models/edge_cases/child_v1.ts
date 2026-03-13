import {
  col,
  defineModel,
  defineRelations,
} from "../../../../../src/sql/models/define_model";
import { ParentV1 } from "./parent_v1";

export const ChildV1 = defineModel("schema_diff_child", {
  columns: {
    id: col.bigIncrement(),
    value: col.string({ length: 255 }),
    parentId: col.bigInteger(),
  },
});

export const ChildV1Relations = defineRelations(ChildV1, ({ belongsTo }) => ({
  parent: belongsTo(ParentV1, { foreignKey: "parentId" }),
}));
