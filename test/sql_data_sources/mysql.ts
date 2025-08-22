import { SqlDataSource } from "../../src/sql/sql_data_source";

const sql = await SqlDataSource.connect({
  type: "mysql",
  host: "localhost",
  port: 3306,
  username: "root",
  password: "root",
  database: "test",
  logs: true,
});

export default sql;
