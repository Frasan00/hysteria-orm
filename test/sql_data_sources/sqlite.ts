import { SqlDataSource } from "../../src/sql/sql_data_source";
import path from "node:path";

const sql = await SqlDataSource.connect({
  type: "sqlite",
  database: path.resolve(process.cwd(), "sqlite.db"),
  logs: true,
});

export default sql;
