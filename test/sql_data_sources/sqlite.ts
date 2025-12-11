import path from "node:path";
import { SqlDataSource } from "../../src/sql/sql_data_source";

const sql = new SqlDataSource({
  type: "sqlite",
  database: path.resolve(process.cwd(), "sqlite.db"),
  logs: true,
});

await sql.connect();

export default sql;
