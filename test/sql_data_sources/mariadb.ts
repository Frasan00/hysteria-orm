import { SqlDataSource } from "../../src/sql/sql_data_source";

const sql = new SqlDataSource({
  type: "mariadb",
  host: process.env.DB_HOST_MARIADB || process.env.DB_HOST || "localhost",
  port: Number(
    process.env.DB_PORT_MARIADB ||
      process.env.DB_PORT ||
      (process.env.HYSTERIA_WORKTREE_COMPOSE === "1" ? 3306 : 3307),
  ),
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_DATABASE || "test",
  logs: true,
});

await sql.connect();

export default sql;
