import { SqlDataSource } from "../../src/sql/sql_data_source";

const sql = new SqlDataSource({
  type: "oracledb",
  host: "localhost",
  port: 1521,
  username: "hysteria",
  password: "oracle",
  database: "FREEPDB1",
  logs: true,
});

await sql.connect();

export default sql;
