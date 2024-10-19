import { DataSource, DataSourceInput } from "../../data_source";
import mongodb from "mongodb";

export type MongoDataSourceInput = Exclude<
  DataSourceInput,
  "pgOptions" | "mysqlOptions"
>;

export class MongoDataSource extends DataSource {
  public url: string;
  public isConnected: boolean;
  private mongoClient: mongodb.MongoClient;
  private static instance: MongoDataSource | null = null;

  private constructor(url: string, mongoClient: mongodb.MongoClient) {
    super();
    this.url = url;
    this.isConnected = false;
    this.mongoClient = mongoClient;
  }

  public static connect(
    url: string,
    options?: MongoDataSourceInput["mongoOptions"],
    cb?: () => void,
  ): MongoDataSource {
    if (!url) {
      throw new Error("url is required to connect to mongo database");
    }

    const mongoClient = new mongodb.MongoClient(url, options);
    this.instance = new MongoDataSource(url, mongoClient);
    this.instance.isConnected = true;
    cb?.();
    return this.instance;
  }

  static getInstance(): MongoDataSource {
    if (!MongoDataSource.instance) {
      throw new Error("sql database connection not established");
    }

    return MongoDataSource.instance;
  }

  public async disconnect(): Promise<void> {
    await this.mongoClient.close();
    this.isConnected = false;
  }
}
