import {
  col,
  defineModel,
  defineRelations,
} from "../../../../../src/sql/models/define_model";

export const SelfRefV3 = defineModel("schema_diff_self_ref", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 255 }),
    parentId: col.bigInteger({ nullable: true }),
    managerId: col.bigInteger({ nullable: true }),
  },
});

export const SelfRefV3Relations = defineRelations(
  SelfRefV3,
  ({ belongsTo }) => ({
    manager: belongsTo(SelfRefV3, {
      foreignKey: "managerId",
      onDelete: "set null",
    }),
  }),
);
