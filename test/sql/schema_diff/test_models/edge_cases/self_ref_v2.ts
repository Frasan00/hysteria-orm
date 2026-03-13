import {
  col,
  createSchema,
  defineModel,
  defineRelations,
} from "../../../../../src/sql/models/define_model";

export const SelfRefV2 = defineModel("schema_diff_self_ref", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 255 }),
    parentId: col.bigInteger({ nullable: true }),
  },
});

export const SelfRefV2Relations = defineRelations(
  SelfRefV2,
  ({ belongsTo }) => ({
    parent: belongsTo(SelfRefV2, {
      foreignKey: "parentId",
      onDelete: "cascade",
    }),
  }),
);

createSchema({ SelfRefV2 }, { SelfRefV2: SelfRefV2Relations });
