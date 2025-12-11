import { SqlDataSource } from "../../src/sql/sql_data_source";

const sql = new SqlDataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "root",
  password: "root",
  database: "test",
  logs: true,
});

await sql.connect();

export default sql;
