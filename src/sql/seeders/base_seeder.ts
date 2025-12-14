import logger from "../../utils/logger";
import { SqlDataSource } from "../sql_data_source";

/**
 * @description Base class for all seeders
 * @description Provides access to the SqlDataSource instance
 */
export abstract class BaseSeeder {
  protected sqlDataSource: SqlDataSource;
  readonly logger = logger;

  constructor(sqlDataSource: SqlDataSource) {
    this.sqlDataSource = sqlDataSource;
  }

  /**
   * @description Run the seeder
   * @description This method should be implemented by all seeders
   */
  abstract run(): Promise<void>;
}
