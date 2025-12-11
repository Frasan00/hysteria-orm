import { SqlDataSource } from "../../src/sql/sql_data_source";

const sql = new SqlDataSource({
  type: "mssql",
  host: "localhost",
  port: 1433,
  username: "sa",
  password: "Password123!",
  database: "master",
  logs: true,
  driverOptions: {
    server: "localhost",
    options: {
      trustServerCertificate: true,
      encrypt: false,
    },
  },
});

await sql.connect();

export default sql;
