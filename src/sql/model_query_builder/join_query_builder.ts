import { Model } from "../models/model";
import joinTemplate from "../resources/query/JOIN";
import { SqlDataSource } from "../sql_data_source";
import { FooterQueryBuilder } from "./footer_query_builder";

export abstract class JoinQueryBuilder<
  T extends Model,
> extends FooterQueryBuilder<T> {
  protected model: typeof Model;
  protected joinQuery: string;
  protected sqlDataSource: SqlDataSource;
  protected logs: boolean;

  protected constructor(model: typeof Model, sqlDataSource: SqlDataSource) {
    super(model, sqlDataSource);
    this.model = model;
    this.joinQuery = "";
    this.sqlDataSource = sqlDataSource;
    this.logs = this.sqlDataSource.logs;
  }

  joinRaw(query: string): this {
    this.joinQuery += ` ${query} `;
    return this;
  }

  join(
    relationTable: string,
    primaryColumn: string,
    foreignColumn: string,
  ): this {
    const join = joinTemplate(
      this.model,
      relationTable,
      primaryColumn as string,
      foreignColumn as string,
    );

    this.joinQuery += join.innerJoin();
    return this;
  }

  leftJoin(
    relationTable: string,
    primaryColumn: string,
    foreignColumn: string,
  ): this {
    const join = joinTemplate(
      this.model,
      relationTable,
      primaryColumn as string,
      foreignColumn as string,
    );

    this.joinQuery += join.leftJoin();
    return this;
  }

  rightJoin(
    relationTable: string,
    primaryColumn: string,
    foreignColumn: string,
  ): this {
    const join = joinTemplate(
      this.model,
      relationTable,
      primaryColumn as string,
      foreignColumn as string,
    );

    this.joinQuery += join.rightJoin();
    return this;
  }
}
