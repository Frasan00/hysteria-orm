import { SqlDataSource } from "../../src/sql/sql_data_source";

const sql = new SqlDataSource({
  type: "mysql",
  host: "localhost",
  port: 3306,
  username: "root",
  password: "root",
  database: "test",
  logs: true,
});

await sql.connect();

export default sql;
