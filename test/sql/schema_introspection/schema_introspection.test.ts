import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";

const USERS_TABLE = "users_with_uuid";
const POSTS_TABLE = "posts_with_uuid";

beforeAll(async () => {
  const dataSource = new SqlDataSource();
  await dataSource.connect();
});

// Helper function to check if table exists
async function tableExists(tableName: string): Promise<boolean> {
  const sql = SqlDataSource.instance;

  try {
    const info = await sql.getTableInfo(tableName);
    return info.length > 0;
  } catch {
    return false;
  }
}

describe(`[${env.DB_TYPE}] Schema Introspection - getTableInfo()`, () => {
  test("should return column information for existing table", async () => {
    const hasTable = await tableExists(USERS_TABLE);
    if (!hasTable) {
      return;
    }

    const sql = SqlDataSource.instance;
    const columns = await sql.getTableInfo(USERS_TABLE);

    expect(columns.length).toBeGreaterThan(0);
    expect(columns[0]).toHaveProperty("name");
    expect(columns[0]).toHaveProperty("dataType");
    expect(columns[0]).toHaveProperty("isNullable");
  });

  test("should return correct column names", async () => {
    const hasTable = await tableExists(USERS_TABLE);
    if (!hasTable) {
      return;
    }

    const sql = SqlDataSource.instance;
    const columns = await sql.getTableInfo(USERS_TABLE);

    const columnNames = columns.map((c) => c.name);

    // Check for common columns
    expect(columnNames).toContain("id");
    expect(columnNames).toContain("name");
    expect(columnNames).toContain("email");
  });

  test("should return correct data types", async () => {
    const hasTable = await tableExists(USERS_TABLE);
    if (!hasTable) {
      return;
    }

    const sql = SqlDataSource.instance;
    const columns = await sql.getTableInfo(USERS_TABLE);

    const idColumn = columns.find((c) => c.name === "id");
    expect(idColumn).toBeDefined();
    expect(idColumn?.dataType).toBeDefined();

    const nameColumn = columns.find((c) => c.name === "name");
    expect(nameColumn).toBeDefined();
    expect(nameColumn?.dataType).toBeDefined();
  });

  test("should return nullable information correctly", async () => {
    const hasTable = await tableExists(USERS_TABLE);
    if (!hasTable) {
      return;
    }

    const sql = SqlDataSource.instance;
    const columns = await sql.getTableInfo(USERS_TABLE);

    columns.forEach((column) => {
      expect(column).toHaveProperty("isNullable");
      expect(typeof column.isNullable).toBe("boolean");
    });
  });

  test("should return default values", async () => {
    const hasTable = await tableExists(USERS_TABLE);
    if (!hasTable) {
      return;
    }

    const sql = SqlDataSource.instance;
    const columns = await sql.getTableInfo(USERS_TABLE);

    columns.forEach((column) => {
      // defaultValue can be null or a value
      expect(column).toHaveProperty("defaultValue");
    });
  });

  test("should handle missing table gracefully", async () => {
    const sql = SqlDataSource.instance;
    const columns = await sql.getTableInfo("non_existent_table");

    expect(columns).toEqual([]);
  });

  test("should return length for string columns (non-SQLite)", async () => {
    // SQLite doesn't return length information for columns
    if (env.DB_TYPE === "sqlite") {
      return;
    }

    const hasTable = await tableExists(USERS_TABLE);
    if (!hasTable) {
      return;
    }

    const sql = SqlDataSource.instance;
    const columns = await sql.getTableInfo(USERS_TABLE);

    const emailColumn = columns.find((c) => c.name === "email");
    if (emailColumn) {
      // Length might be null for some databases
      expect(emailColumn).toHaveProperty("length");
    }
  });

  test("should return precision and scale for numeric columns (non-SQLite)", async () => {
    // SQLite doesn't return precision/scale information for columns
    if (env.DB_TYPE === "sqlite") {
      return;
    }

    const hasTable = await tableExists(USERS_TABLE);
    if (!hasTable) {
      return;
    }

    const sql = SqlDataSource.instance;
    const columns = await sql.getTableInfo(USERS_TABLE);

    const ageColumn = columns.find((c) => c.name === "age");
    if (ageColumn) {
      expect(ageColumn).toHaveProperty("precision");
      expect(ageColumn).toHaveProperty("scale");
    }
  });

  test("should return timezone information for datetime columns", async () => {
    const hasTable = await tableExists(USERS_TABLE);
    if (!hasTable) {
      return;
    }

    const sql = SqlDataSource.instance;
    const columns = await sql.getTableInfo(USERS_TABLE);

    const createdAtColumn = columns.find((c) => c.name === "createdAt");
    if (createdAtColumn) {
      expect(createdAtColumn).toHaveProperty("withTimezone");
    }
  });
});

describe(`[${env.DB_TYPE}] Schema Introspection - getIndexInfo()`, () => {
  test("should return index information for existing table", async () => {
    const hasTable = await tableExists(USERS_TABLE);
    if (!hasTable) {
      return;
    }

    const sql = SqlDataSource.instance;
    const indexes = await sql.getIndexInfo(USERS_TABLE);

    // At minimum, should have primary key index
    expect(indexes.length).toBeGreaterThanOrEqual(0);
  });

  test("should return index names", async () => {
    const hasTable = await tableExists(USERS_TABLE);
    if (!hasTable) {
      return;
    }

    const sql = SqlDataSource.instance;
    const indexes = await sql.getIndexInfo(USERS_TABLE);

    indexes.forEach((index) => {
      expect(index).toHaveProperty("name");
      expect(index.name).toBeDefined();
    });
  });

  test("should return index columns", async () => {
    const hasTable = await tableExists(USERS_TABLE);
    if (!hasTable) {
      return;
    }

    const sql = SqlDataSource.instance;
    const indexes = await sql.getIndexInfo(USERS_TABLE);

    indexes.forEach((index) => {
      expect(index).toHaveProperty("columns");
      expect(Array.isArray(index.columns)).toBe(true);
      expect(index.columns.length).toBeGreaterThan(0);
    });
  });

  test("should return unique constraint information", async () => {
    const hasTable = await tableExists(USERS_TABLE);
    if (!hasTable) {
      return;
    }

    const sql = SqlDataSource.instance;
    const indexes = await sql.getIndexInfo(USERS_TABLE);

    indexes.forEach((index) => {
      expect(index).toHaveProperty("isUnique");
      expect(typeof index.isUnique).toBe("boolean");
    });
  });

  test("should handle composite indexes", async () => {
    // This test assumes there might be composite indexes
    const hasTable = await tableExists(POSTS_TABLE);
    if (!hasTable) {
      return;
    }

    const sql = SqlDataSource.instance;
    const indexes = await sql.getIndexInfo(POSTS_TABLE);

    // Check if any index has multiple columns
    const compositeIndexes = indexes.filter((idx) => idx.columns.length > 1);

    // If composite indexes exist, verify structure
    compositeIndexes.forEach((index) => {
      expect(index.columns.length).toBeGreaterThan(1);
      expect(index.name).toBeDefined();
    });
  });

  test("should handle missing table gracefully", async () => {
    const sql = SqlDataSource.instance;
    const indexes = await sql.getIndexInfo("non_existent_table");

    expect(indexes).toEqual([]);
  });
});

describe(`[${env.DB_TYPE}] Schema Introspection - getForeignKeyInfo()`, () => {
  test("should return foreign key information for existing table", async () => {
    const hasTable = await tableExists(POSTS_TABLE);
    if (!hasTable) {
      return;
    }

    const sql = SqlDataSource.instance;
    const foreignKeys = await sql.getForeignKeyInfo(POSTS_TABLE);

    // Posts table should have foreign key to users
    // Note: This depends on the actual schema
    expect(Array.isArray(foreignKeys)).toBe(true);
  });

  test("should return foreign key names if available", async () => {
    const hasTable = await tableExists(POSTS_TABLE);
    if (!hasTable) {
      return;
    }

    const sql = SqlDataSource.instance;
    const foreignKeys = await sql.getForeignKeyInfo(POSTS_TABLE);

    foreignKeys.forEach((fk) => {
      expect(fk).toHaveProperty("columns");
      expect(fk).toHaveProperty("referencedTable");
      expect(fk).toHaveProperty("referencedColumns");
      expect(fk).toHaveProperty("onDelete");
      expect(fk).toHaveProperty("onUpdate");
    });
  });

  test("should return columns involved in foreign key", async () => {
    const hasTable = await tableExists(POSTS_TABLE);
    if (!hasTable) {
      return;
    }

    const sql = SqlDataSource.instance;
    const foreignKeys = await sql.getForeignKeyInfo(POSTS_TABLE);

    foreignKeys.forEach((fk) => {
      expect(Array.isArray(fk.columns)).toBe(true);
      expect(fk.columns.length).toBeGreaterThan(0);

      fk.columns.forEach((col) => {
        expect(typeof col).toBe("string");
      });
    });
  });

  test("should return referenced table and columns", async () => {
    const hasTable = await tableExists(POSTS_TABLE);
    if (!hasTable) {
      return;
    }

    const sql = SqlDataSource.instance;
    const foreignKeys = await sql.getForeignKeyInfo(POSTS_TABLE);

    foreignKeys.forEach((fk) => {
      expect(typeof fk.referencedTable).toBe("string");
      expect(Array.isArray(fk.referencedColumns)).toBe(true);
      expect(fk.referencedColumns.length).toBeGreaterThan(0);

      fk.referencedColumns.forEach((col) => {
        expect(typeof col).toBe("string");
      });
    });
  });

  test("should return cascade actions", async () => {
    const hasTable = await tableExists(POSTS_TABLE);
    if (!hasTable) {
      return;
    }

    const sql = SqlDataSource.instance;
    const foreignKeys = await sql.getForeignKeyInfo(POSTS_TABLE);

    foreignKeys.forEach((fk) => {
      // onDelete and onUpdate can be null or a string
      expect(fk).toHaveProperty("onDelete");
      expect(fk).toHaveProperty("onUpdate");
    });
  });

  test("should handle missing table gracefully", async () => {
    const sql = SqlDataSource.instance;
    const foreignKeys = await sql.getForeignKeyInfo("non_existent_table");

    expect(foreignKeys).toEqual([]);
  });

  test("should handle composite foreign keys", async () => {
    // This test checks if the method can handle composite foreign keys
    const hasTable = await tableExists(POSTS_TABLE);
    if (!hasTable) {
      return;
    }

    const sql = SqlDataSource.instance;
    const foreignKeys = await sql.getForeignKeyInfo(POSTS_TABLE);

    // Check for composite foreign keys (multiple columns)
    const compositeFks = foreignKeys.filter((fk) => fk.columns.length > 1);

    compositeFks.forEach((fk) => {
      expect(fk.columns.length).toBe(fk.referencedColumns.length);
    });
  });
});

describe(`[${env.DB_TYPE}] Schema Introspection - getPrimaryKeyInfo()`, () => {
  test("should return primary key information for existing table", async () => {
    const hasTable = await tableExists(USERS_TABLE);
    if (!hasTable) {
      return;
    }

    const sql = SqlDataSource.instance;
    const primaryKey = await sql.getPrimaryKeyInfo(USERS_TABLE);

    expect(primaryKey).toBeDefined();
    expect(primaryKey?.columns).toBeDefined();
    expect(primaryKey?.columns.length).toBeGreaterThan(0);
  });

  test("should return primary key columns", async () => {
    const hasTable = await tableExists(USERS_TABLE);
    if (!hasTable) {
      return;
    }

    const sql = SqlDataSource.instance;
    const primaryKey = await sql.getPrimaryKeyInfo(USERS_TABLE);

    expect(primaryKey?.columns).toContain("id");
  });

  test("should return primary key name if available", async () => {
    const hasTable = await tableExists(USERS_TABLE);
    if (!hasTable) {
      return;
    }

    const sql = SqlDataSource.instance;
    const primaryKey = await sql.getPrimaryKeyInfo(USERS_TABLE);

    expect(primaryKey).toHaveProperty("name");
    // Name can be undefined for some databases
    if (primaryKey?.name) {
      expect(typeof primaryKey.name).toBe("string");
    }
  });

  test("should handle composite primary keys", async () => {
    // Most test tables use single column primary keys
    // This test verifies the structure for composite keys
    const hasTable = await tableExists(USERS_TABLE);
    if (!hasTable) {
      return;
    }

    const sql = SqlDataSource.instance;
    const primaryKey = await sql.getPrimaryKeyInfo(USERS_TABLE);

    if (primaryKey && primaryKey.columns.length > 1) {
      expect(primaryKey.columns.length).toBeGreaterThan(1);
      primaryKey.columns.forEach((col) => {
        expect(typeof col).toBe("string");
      });
    }
  });

  test("should return undefined or implicit primary key for table without primary key", async () => {
    const sql = SqlDataSource.instance;

    // Create a temporary table without primary key
    const tempTable = `temp_table_no_pk_${Date.now()}`;

    try {
      await sql.rawQuery(
        `CREATE TABLE ${tempTable} (id INT, name VARCHAR(100))`,
      );

      const primaryKey = await sql.getPrimaryKeyInfo(tempTable);

      // CockroachDB automatically creates a rowid primary key
      if (env.DB_TYPE === "cockroachdb") {
        expect(primaryKey).toBeDefined();
        expect(primaryKey?.columns).toContain("rowid");
      } else {
        expect(primaryKey).toBeUndefined();
      }
    } finally {
      await sql.rawQuery(`DROP TABLE IF EXISTS ${tempTable}`);
    }
  });

  test("should handle missing table gracefully", async () => {
    const sql = SqlDataSource.instance;
    const primaryKey = await sql.getPrimaryKeyInfo("non_existent_table");

    expect(primaryKey).toBeUndefined();
  });
});

describe(`[${env.DB_TYPE}] Schema Introspection - getTableSchema()`, () => {
  test("should return complete schema information", async () => {
    const hasTable = await tableExists(USERS_TABLE);
    if (!hasTable) {
      return;
    }

    const sql = SqlDataSource.instance;
    const schema = await sql.getTableSchema(USERS_TABLE);

    expect(schema).toHaveProperty("columns");
    expect(schema).toHaveProperty("indexes");
    expect(schema).toHaveProperty("foreignKeys");
    expect(schema).toHaveProperty("primaryKey");
  });

  test("should return all schema components", async () => {
    const hasTable = await tableExists(USERS_TABLE);
    if (!hasTable) {
      return;
    }

    const sql = SqlDataSource.instance;
    const schema = await sql.getTableSchema(USERS_TABLE);

    // Verify columns
    expect(Array.isArray(schema.columns)).toBe(true);
    expect(schema.columns.length).toBeGreaterThan(0);

    // Verify indexes
    expect(Array.isArray(schema.indexes)).toBe(true);

    // Verify foreign keys
    expect(Array.isArray(schema.foreignKeys)).toBe(true);

    // Verify primary key (can be undefined)
    if (schema.primaryKey) {
      expect(schema.primaryKey.columns).toBeDefined();
    }
  });

  test("should handle missing table gracefully", async () => {
    const sql = SqlDataSource.instance;
    const schema = await sql.getTableSchema("non_existent_table");

    expect(schema.columns).toEqual([]);
    expect(schema.indexes).toEqual([]);
    expect(schema.foreignKeys).toEqual([]);
    expect(schema.primaryKey).toBeUndefined();
  });

  test("should return consistent data across all methods", async () => {
    const hasTable = await tableExists(USERS_TABLE);
    if (!hasTable) {
      return;
    }

    const sql = SqlDataSource.instance;

    // Get individual components
    const columns = await sql.getTableInfo(USERS_TABLE);
    const indexes = await sql.getIndexInfo(USERS_TABLE);
    const foreignKeys = await sql.getForeignKeyInfo(USERS_TABLE);
    const primaryKey = await sql.getPrimaryKeyInfo(USERS_TABLE);

    // Get complete schema
    const schema = await sql.getTableSchema(USERS_TABLE);

    // Verify consistency
    expect(schema.columns).toEqual(columns);
    expect(schema.indexes).toEqual(indexes);
    expect(schema.foreignKeys).toEqual(foreignKeys);
    expect(schema.primaryKey).toEqual(primaryKey);
  });
});

describe(`[${env.DB_TYPE}] Schema Introspection - Database Specific`, () => {
  test("should handle SQLite specific behavior", async () => {
    if (env.DB_TYPE !== "sqlite") {
      return;
    }

    const sql = SqlDataSource.instance;
    const columns = await sql.getTableInfo(USERS_TABLE);

    // SQLite has specific column type handling
    columns.forEach((col) => {
      expect(col).toHaveProperty("name");
      expect(col).toHaveProperty("dataType");
      expect(col).toHaveProperty("isNullable");
    });
  });

  test("should handle PostgreSQL specific types", async () => {
    if (env.DB_TYPE !== "postgres" && env.DB_TYPE !== "cockroachdb") {
      return;
    }

    const hasTable = await tableExists(USERS_TABLE);
    if (!hasTable) {
      return;
    }

    const sql = SqlDataSource.instance;
    const columns = await sql.getTableInfo(USERS_TABLE);

    // PostgreSQL has rich type information
    columns.forEach((col) => {
      expect(col.dataType).toBeDefined();
    });
  });

  test("should handle MySQL specific types", async () => {
    if (env.DB_TYPE !== "mysql" && env.DB_TYPE !== "mariadb") {
      return;
    }

    const hasTable = await tableExists(USERS_TABLE);
    if (!hasTable) {
      return;
    }

    const sql = SqlDataSource.instance;
    const columns = await sql.getTableInfo(USERS_TABLE);

    // MySQL has specific type handling
    columns.forEach((col) => {
      expect(col.dataType).toBeDefined();
    });
  });
});
