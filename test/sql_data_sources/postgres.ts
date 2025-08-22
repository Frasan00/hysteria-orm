import { SqlDataSource } from "../../src/sql/sql_data_source";

const sql = await SqlDataSource.connect({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "root",
  password: "root",
  database: "test",
  logs: true,
});

export default sql;
