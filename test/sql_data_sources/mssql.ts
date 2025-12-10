import { SqlDataSource } from "../../src/sql/sql_data_source";

const sql = await SqlDataSource.connect({
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

export default sql;
