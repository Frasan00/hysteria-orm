import { SqlDataSource } from "../../src/sql/sql_data_source";

const sql = await SqlDataSource.connect({
  type: "cockroachdb",
  host: "localhost",
  port: 26257,
  username: "root",
  password: "root",
  database: "test",
  logs: true,
});

export default sql;
