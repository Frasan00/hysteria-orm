import ColumnOptionsBuilder from "./ColumnOptionsBuilder";

export default class ColumnTypeBuilder {
  protected tableName: string;
  protected queryStatements: string[];
  protected partialQuery: string;
  protected columnName: string;
  protected sqlType: `mysql` | `postgres`;

  constructor(
    tableName: string,
    queryStatements: string[],
    partialQuery: string,
    sqlType: `mysql` | `postgres`,
  ) {
    this.tableName = tableName;
    this.queryStatements = queryStatements;
    this.partialQuery = partialQuery;
    this.sqlType = sqlType;
    this.columnName = "";
  }

  public varchar(name: string, length: number): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} VARCHAR(${length})`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public tinytext(name: string): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} TINYTEXT`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public mediumtext(name: string): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} MEDIUMTEXT`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public longtext(name: string): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} LONGTEXT`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public binary(name: string, length: number): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} BINARY(${length})`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public enum(name: string, values: string[]): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} ENUM("${values.join('","')}")`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public text(name: string): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} TEXT`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public char(name: string, length: number): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} CHAR(${length})`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public tinyint(name: string): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} TINYINT`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public smallint(name: string): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} SMALLINT`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public mediumint(name: string): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} MEDIUMINT`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  /**
   * @description If using mysql, it will automatically add INT AUTO_INCREMENT PRIMARY KEY
   * @param name
   */
  public serial(name: string): ColumnOptionsBuilder {
    if (this.sqlType === `mysql`) {
      this.columnName = name;
      this.partialQuery += `${name} INT AUTO_INCREMENT PRIMARY KEY`;
      return new ColumnOptionsBuilder(
        this.tableName,
        this.queryStatements,
        this.partialQuery,
        this.sqlType,
        this.columnName,
      );
    }

    this.columnName = name;
    this.partialQuery += `${name} SERIAL`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  /**
   * @description If using mysql, it will automatically add BIGINT AUTO_INCREMENT PRIMARY KEY
   * @param name
   */
  public bigSerial(name: string): ColumnOptionsBuilder {
    if (this.sqlType === `mysql`) {
      this.columnName = name;
      this.partialQuery += `${name} BIGINT AUTO_INCREMENT PRIMARY KEY`;
      return new ColumnOptionsBuilder(
        this.tableName,
        this.queryStatements,
        this.partialQuery,
        this.sqlType,
        this.columnName,
      );
    }

    this.columnName = name;
    this.partialQuery += `${name} BIGSERIAL`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public integer(name: string): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} INT`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public bigint(name: string): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} BIGINT`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public float(name: string): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} FLOAT`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public decimal(name: string): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} DECIMAL`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public double(name: string): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} DOUBLE`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public boolean(name: string): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} BOOLEAN`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public date(name: string): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} DATE`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  public timestamp(name: string): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} TIMESTAMP`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  /**
   * @description EXPERIMENTAL
   * @param name
   */
  public json(name: string): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} JSON`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }

  /**
   * @description EXPERIMENTAL
   * @param name
   */
  public jsonb(name: string): ColumnOptionsBuilder {
    this.columnName = name;
    this.partialQuery += `${name} JSONB`;
    return new ColumnOptionsBuilder(
      this.tableName,
      this.queryStatements,
      this.partialQuery,
      this.sqlType,
      this.columnName,
    );
  }
}
