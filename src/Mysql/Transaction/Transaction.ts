import { Pool } from "mysql2/promise";
import { BEGIN_TRANSACTION } from "../Templates/Query/TRANSACTION";
import { COMMIT_TRANSACTION } from "../Templates/Query/TRANSACTION";
import { ROLLBACK_TRANSACTION } from "../Templates/Query/TRANSACTION";
import { log, queryError } from "../../Logger";

export class Transaction {
  protected query: string;
  protected mysql: Pool;
  protected logs: boolean;

  constructor(mysqlConnection: Pool, logs: boolean) {
    this.logs = logs;
    this.mysql = mysqlConnection;
    this.query = "";
  }

  /**
   * Add query to transaction.
   * @param query
   */
  public addQuery(query: string): void {
    this.query += query + "\n";
  }

  /**
   * Start transaction.
   */

  async start(): Promise<void> {
    try {
      await this.mysql.query(BEGIN_TRANSACTION);
      log(BEGIN_TRANSACTION, this.logs);
    } catch (error) {
      queryError(error);
      throw error;
    }
  }

  /**
   * Commit transaction.
   */
  async commit(): Promise<void> {
    try {
      log(this.query, this.logs);
      await this.mysql.query(this.query);
      await this.mysql.query(COMMIT_TRANSACTION);
      log(COMMIT_TRANSACTION, this.logs);
    } catch (error) {
      queryError(error);
      throw error;
    }
  }

  /**
   * Rollback transaction.
   */
  async rollback(): Promise<void> {
    try {
      log(this.query, this.logs);
      await this.mysql.query(ROLLBACK_TRANSACTION);
      log(ROLLBACK_TRANSACTION, this.logs);
    } catch (error) {
      queryError(error);
      throw error;
    }
  }
}
