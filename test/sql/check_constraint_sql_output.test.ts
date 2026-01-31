/**
 * Test to verify CHECK constraint SQL generation for different databases
 */

import { AstParser } from "../src/sql/ast/parser";
import { ConstraintNode } from "../src/sql/ast/query/node/constraint";
import { CreateTableNode } from "../src/sql/ast/query/node/create_table";
import { ColumnTypeNode } from "../src/sql/ast/query/node/column/column_type";
import { Model } from "../src/sql/models/model";
import type { SqlDataSourceType } from "../src/sql/sql_data_source_types";

describe("Check Constraint SQL Generation", () => {
  const mockModel = {
    table: "test_table",
    databaseCaseConvention: "preserve",
    modelCaseConvention: "preserve",
  } as typeof Model;

  const testDatabases: SqlDataSourceType[] = [
    "postgres",
    "mysql",
    "sqlite",
    "mssql",
    "oracledb",
  ];

  testDatabases.forEach((dbType) => {
    describe(`${dbType} CHECK constraints`, () => {
      it("should generate column-level check constraint", () => {
        const parser = new AstParser(mockModel, dbType);

        const columnNode = new ColumnTypeNode("age", "integer");
        const checkConstraint = new ConstraintNode("check", {
          columns: ["age"],
          checkExpression: "age >= 18",
          constraintName: "chk_test_age",
        });

        const createTableNode = new CreateTableNode(
          "test_table",
          [columnNode],
          [checkConstraint],
          false,
          {},
        );

        const result = parser.parse([createTableNode]);

        expect(result.sql).toBeTruthy();
        expect(result.sql.toLowerCase()).toContain("check");
        expect(result.sql).toContain("age >= 18");

        console.log(`\n${dbType.toUpperCase()}:`);
        console.log(result.sql);
      });

      it("should generate check constraint without custom name", () => {
        const parser = new AstParser(mockModel, dbType);

        const columnNode = new ColumnTypeNode("price", "decimal");
        const checkConstraint = new ConstraintNode("check", {
          checkExpression: "price > 0",
        });

        const createTableNode = new CreateTableNode(
          "test_table",
          [columnNode],
          [checkConstraint],
          false,
          {},
        );

        const result = parser.parse([createTableNode]);

        expect(result.sql).toBeTruthy();
        expect(result.sql.toLowerCase()).toContain("check");
        expect(result.sql).toContain("price > 0");
      });

      it("should generate complex check constraint", () => {
        const parser = new AstParser(mockModel, dbType);

        const columnNode = new ColumnTypeNode("discount", "integer");
        const checkConstraint = new ConstraintNode("check", {
          columns: ["discount"],
          checkExpression: "discount >= 0 AND discount <= 100",
          constraintName: "valid_discount",
        });

        const createTableNode = new CreateTableNode(
          "test_table",
          [columnNode],
          [checkConstraint],
          false,
          {},
        );

        const result = parser.parse([createTableNode]);

        expect(result.sql).toBeTruthy();
        expect(result.sql.toLowerCase()).toContain("check");
        expect(result.sql).toContain("discount >= 0 AND discount <= 100");
      });

      it("should handle proper identifier quoting based on database", () => {
        const parser = new AstParser(mockModel, dbType);

        const checkConstraint = new ConstraintNode("check", {
          checkExpression: "status IN ('active', 'inactive')",
          constraintName: "status_check",
        });

        const createTableNode = new CreateTableNode(
          "test_table",
          [],
          [checkConstraint],
          false,
          {},
        );

        const result = parser.parse([createTableNode]);

        expect(result.sql).toBeTruthy();

        // Verify database-specific quoting
        switch (dbType) {
          case "postgres":
          case "sqlite":
          case "oracledb":
            expect(result.sql).toContain('"status_check"');
            break;
          case "mysql":
          case "mariadb":
            expect(result.sql).toContain("`status_check`");
            break;
          case "mssql":
            expect(result.sql).toContain("[status_check]");
            break;
        }
      });
    });
  });

  it("should generate multiple check constraints in one table", () => {
    const parser = new AstParser(mockModel, "postgres");

    const ageColumn = new ColumnTypeNode("age", "integer");
    const priceColumn = new ColumnTypeNode("price", "decimal");

    const ageCheck = new ConstraintNode("check", {
      columns: ["age"],
      checkExpression: "age >= 18",
      constraintName: "chk_age",
    });

    const priceCheck = new ConstraintNode("check", {
      columns: ["price"],
      checkExpression: "price > 0",
      constraintName: "chk_price",
    });

    const createTableNode = new CreateTableNode(
      "test_table",
      [ageColumn, priceColumn],
      [ageCheck, priceCheck],
      false,
      {},
    );

    const result = parser.parse([createTableNode]);

    expect(result.sql).toBeTruthy();
    expect(result.sql).toContain("age >= 18");
    expect(result.sql).toContain("price > 0");
    expect(result.sql).toContain("chk_age");
    expect(result.sql).toContain("chk_price");
  });
});
