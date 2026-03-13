import { defineView, col } from "../../../../src/sql/models/define_model";

export const UserView = defineView("user_view", {
  columns: {
    id: col.primary<number>(),
    total: col.integer(),
  },
  statement(query) {
    query
      .selectRaw("COUNT(*) as total")
      .selectRaw("1 as id")
      .table("users_without_pk");
  },
});
