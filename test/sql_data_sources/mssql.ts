import { SqlDataSource } from "../../src/sql/sql_data_source";

const host = process.env.DB_HOST_MSSQL || process.env.DB_HOST || "localhost";
const sql = new SqlDataSource({
  type: "mssql",
  host,
  port: Number(process.env.DB_PORT_MSSQL || process.env.DB_PORT || 1433),
  username: process.env.DB_USER || "sa",
  password: process.env.DB_PASSWORD || "Password123!",
  database: process.env.DB_DATABASE || "master",
  logs: true,
  driverOptions: {
    server: host,
    options: {
      trustServerCertificate: true,
      encrypt: false,
    },
  },
});

await sql.connect();

export default sql;
