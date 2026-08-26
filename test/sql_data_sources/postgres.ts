import { SqlDataSource } from "../../src/sql/sql_data_source";

const sql = new SqlDataSource({
  type: "postgres",
  host: process.env.DB_HOST_POSTGRES || process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT_POSTGRES || process.env.DB_PORT || 5432),
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_DATABASE || "test",
  logs: true,
});

await sql.connect();

export default sql;
