import {
  col,
  createSchema,
  defineModel,
  defineRelations,
} from "../../../../../src/sql/models/define_model";

export const SelfRefV1 = defineModel("schema_diff_self_ref", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 255 }),
    parentId: col.bigInteger({ nullable: true }),
  },
});

export const SelfRefV1Relations = defineRelations(
  SelfRefV1,
  ({ belongsTo }) => ({
    parent: belongsTo(SelfRefV1, { foreignKey: "parentId" }),
  }),
);

createSchema({ SelfRefV1 }, { SelfRefV1: SelfRefV1Relations });
