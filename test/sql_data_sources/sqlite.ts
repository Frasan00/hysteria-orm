import { SqlDataSource } from "../../src/sql/sql_data_source";

const sql = await SqlDataSource.connect({
  type: "sqlite",
  database: "./sqlite.db",
  logs: true,
});

export default sql;
