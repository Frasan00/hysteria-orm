import { MongoDataSource } from "./mongo_data_source";
import * as mongodb from "mongodb";
import { log } from "../../utils/logger";

export class Session {
  public mongoDataSource: MongoDataSource;
  private mongoClient: mongodb.MongoClient;
  private session: mongodb.ClientSession | null = null;
  private readonly logs: boolean;

  constructor(mongoDataSource: MongoDataSource, logs: boolean = false) {
    this.mongoDataSource = mongoDataSource;
    this.mongoClient = this.mongoDataSource.getCurrentConnection();
    this.logs = logs;
  }

  public async startSession(): Promise<void> {
    try {
      this.session = this.mongoClient.startSession();
      this.session.startTransaction();
      log("Session started", this.logs);
    } catch (error) {
      await this.releaseConnection();
      throw error;
    }
  }

  public async commit(): Promise<void> {
    try {
      if (this.session) {
        await this.session.commitTransaction();
        log("Session committed", this.logs);
      }
    } catch (error) {
      throw error;
    } finally {
      await this.releaseConnection();
    }
  }

  public async rollback(): Promise<void> {
    try {
      if (this.session) {
        await this.session.abortTransaction();
        log("Session rolled back", this.logs);
      }
    } finally {
      await this.releaseConnection();
    }
  }

  private async releaseConnection(): Promise<void> {
    if (this.session) {
      this.session.endSession();
      this.session = null;
      log("Session ended", this.logs);
    }
  }
}
