import {
  col,
  createSchema,
  defineModel,
  defineRelations,
} from "../../../../../src/sql/models/define_model";

/**
 * Anchor + 3 child models referencing the anchor with different
 * onUpdate + onDelete combinations. Exercises all four OnUpdateOrDelete
 * values.
 */
export const MultiTableDdlAnchor = defineModel("schema_diff_pgmy_mtd_anchor", {
  columns: {
    id: col.bigIncrement(),
    label: col.string({ length: 50 }),
  },
});

export const MultiTableDdlCascade = defineModel(
  "schema_diff_pgmy_mtd_cascade",
  {
    columns: {
      id: col.bigIncrement(),
      anchorId: col.bigInteger(),
    },
  },
);

export const MultiTableDdlSetNull = defineModel(
  "schema_diff_pgmy_mtd_setnull",
  {
    columns: {
      id: col.bigIncrement(),
      anchorId: col.bigInteger(),
    },
  },
);

export const MultiTableDdlNoAction = defineModel(
  "schema_diff_pgmy_mtd_noaction",
  {
    columns: {
      id: col.bigIncrement(),
      anchorId: col.bigInteger(),
    },
  },
);

export const MultiTableDdlRestrict = defineModel(
  "schema_diff_pgmy_mtd_restrict",
  {
    columns: {
      id: col.bigIncrement(),
      anchorId: col.bigInteger(),
    },
  },
);

export const MultiTableDdlCascadeRelations = defineRelations(
  MultiTableDdlCascade,
  ({ belongsTo }) => ({
    anchor: belongsTo(MultiTableDdlAnchor, {
      foreignKey: "anchorId",
      onUpdate: "cascade",
      onDelete: "cascade",
    }),
  }),
);

export const MultiTableDdlSetNullRelations = defineRelations(
  MultiTableDdlSetNull,
  ({ belongsTo }) => ({
    anchor: belongsTo(MultiTableDdlAnchor, {
      foreignKey: "anchorId",
      onUpdate: "set null",
      onDelete: "set null",
    }),
  }),
);

export const MultiTableDdlNoActionRelations = defineRelations(
  MultiTableDdlNoAction,
  ({ belongsTo }) => ({
    anchor: belongsTo(MultiTableDdlAnchor, {
      foreignKey: "anchorId",
      onUpdate: "no action",
      onDelete: "no action",
    }),
  }),
);

export const MultiTableDdlRestrictRelations = defineRelations(
  MultiTableDdlRestrict,
  ({ belongsTo }) => ({
    anchor: belongsTo(MultiTableDdlAnchor, {
      foreignKey: "anchorId",
      onUpdate: "restrict",
      onDelete: "restrict",
    }),
  }),
);

createSchema(
  {
    MultiTableDdlAnchor,
    MultiTableDdlCascade,
    MultiTableDdlSetNull,
    MultiTableDdlNoAction,
    MultiTableDdlRestrict,
  },
  {
    MultiTableDdlCascade: MultiTableDdlCascadeRelations,
    MultiTableDdlSetNull: MultiTableDdlSetNullRelations,
    MultiTableDdlNoAction: MultiTableDdlNoActionRelations,
    MultiTableDdlRestrict: MultiTableDdlRestrictRelations,
  },
);
