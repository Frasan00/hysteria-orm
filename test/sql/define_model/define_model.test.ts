import { defineModel, col, rel } from "../../../src/sql/models/define_model";
import { Model } from "../../../src/sql/models/model";
import { RelationEnum } from "../../../src/sql/models/relations/relation";

describe("defineModel", () => {
  describe("model creation and structure", () => {
    test("returns a class whose instances extend Model", () => {
      const TestModel = defineModel("test_models", {
        columns: { id: col.increment() },
      });

      const instance = new TestModel();
      expect(instance).toBeInstanceOf(Model);
    });

    test("table static property matches the provided name", () => {
      const TestModel = defineModel("my_custom_table", {
        columns: { id: col.increment() },
      });

      expect(TestModel.table).toBe("my_custom_table");
    });

    test("has all Model static methods", () => {
      const TestModel = defineModel("test_models", {
        columns: { id: col.increment() },
      });

      expect(typeof TestModel.query).toBe("function");
      expect(typeof TestModel.find).toBe("function");
      expect(typeof TestModel.findOne).toBe("function");
      expect(typeof TestModel.findOneOrFail).toBe("function");
      expect(typeof TestModel.insert).toBe("function");
      expect(typeof TestModel.insertMany).toBe("function");
      expect(typeof TestModel.updateRecord).toBe("function");
      expect(typeof TestModel.deleteRecord).toBe("function");
      expect(typeof TestModel.all).toBe("function");
      expect(typeof TestModel.save).toBe("function");
      expect(typeof TestModel.softDelete).toBe("function");
      expect(typeof TestModel.truncate).toBe("function");
    });

    test("prototype is instanceof Model", () => {
      const TestModel = defineModel("test_models", {
        columns: { id: col.increment() },
      });

      expect(TestModel.prototype).toBeInstanceOf(Model);
    });
  });

  describe("column metadata registration", () => {
    const UserModel = defineModel("users", {
      columns: {
        id: col.increment(),
        name: col.string(),
        email: col.string({ nullable: false }),
        age: col.integer(),
        salary: col.float(),
        balance: col.decimal({ precision: 10, scale: 2 }),
        isActive: col.boolean(),
        metadata: col.json(),
        createdAt: col.datetime({ autoCreate: true }),
        updatedAt: col.datetime({ autoCreate: true, autoUpdate: true }),
        birthDate: col.date(),
        loginTime: col.time(),
        lastSeen: col.timestamp(),
        bio: col.text(),
      },
    });

    test("getColumns returns all defined columns", () => {
      const columns = UserModel.getColumns();
      const columnNames = columns.map((c) => c.columnName);

      expect(columnNames).toContain("id");
      expect(columnNames).toContain("name");
      expect(columnNames).toContain("email");
      expect(columnNames).toContain("age");
      expect(columnNames).toContain("salary");
      expect(columnNames).toContain("balance");
      expect(columnNames).toContain("isActive");
      expect(columnNames).toContain("metadata");
      expect(columnNames).toContain("createdAt");
      expect(columnNames).toContain("updatedAt");
      expect(columnNames).toContain("birthDate");
      expect(columnNames).toContain("loginTime");
      expect(columnNames).toContain("lastSeen");
      expect(columnNames).toContain("bio");
      expect(columns.length).toBe(14);
    });

    test("increment column is registered as primary key", () => {
      expect(UserModel.primaryKey).toBe("id");

      const idCol = UserModel.getColumns().find((c) => c.columnName === "id");
      expect(idCol?.isPrimary).toBe(true);
      expect(idCol?.type).toBe("increment");
    });

    test("string column has correct type", () => {
      const nameCol = UserModel.getColumns().find(
        (c) => c.columnName === "name",
      );
      expect(nameCol?.type).toBe("string");
    });

    test("integer column has correct type", () => {
      const ageCol = UserModel.getColumns().find((c) => c.columnName === "age");
      expect(ageCol?.type).toBe("integer");
    });

    test("boolean column has correct type", () => {
      const boolCol = UserModel.getColumns().find(
        (c) => c.columnName === "isActive",
      );
      expect(boolCol?.type).toBe("boolean");
    });

    test("json column has correct type", () => {
      const jsonCol = UserModel.getColumns().find(
        (c) => c.columnName === "metadata",
      );
      expect(jsonCol?.type).toBe("jsonb");
    });

    test("datetime column has correct type", () => {
      const dtCol = UserModel.getColumns().find(
        (c) => c.columnName === "createdAt",
      );
      expect(dtCol?.type).toBe("datetime");
    });

    test("date column has correct type", () => {
      const dateCol = UserModel.getColumns().find(
        (c) => c.columnName === "birthDate",
      );
      expect(dateCol?.type).toBe("date");
    });

    test("text column has correct type", () => {
      const textCol = UserModel.getColumns().find(
        (c) => c.columnName === "bio",
      );
      expect(textCol?.type).toBe("longtext");
    });

    test("databaseName follows default snake_case convention", () => {
      const col = UserModel.getColumns().find(
        (c) => c.columnName === "isActive",
      );
      expect(col?.databaseName).toBe("is_active");
    });

    test("uuid column type and primary key", () => {
      const UuidModel = defineModel("uuid_items", {
        columns: {
          id: col.uuid({ primaryKey: true }),
          label: col.string(),
        },
      });

      expect(UuidModel.primaryKey).toBe("id");
      const idCol = UuidModel.getColumns().find((c) => c.columnName === "id");
      expect(idCol?.type).toBe("uuid");
    });

    test("ulid column type", () => {
      const UlidModel = defineModel("ulid_items", {
        columns: {
          id: col.ulid({ primaryKey: true }),
        },
      });

      expect(UlidModel.primaryKey).toBe("id");
      const idCol = UlidModel.getColumns().find((c) => c.columnName === "id");
      expect(idCol?.type).toBe("ulid");
    });

    test("bigIncrement column type", () => {
      const BigModel = defineModel("big_items", {
        columns: { id: col.bigIncrement() },
      });

      expect(BigModel.primaryKey).toBe("id");
      const idCol = BigModel.getColumns().find((c) => c.columnName === "id");
      expect(idCol?.type).toBe("bigIncrement");
    });

    test("enum column type", () => {
      const StatusModel = defineModel("statuses", {
        columns: {
          id: col.increment(),
          status: col.enum(["active", "inactive", "banned"] as const),
        },
      });

      const statusCol = StatusModel.getColumns().find(
        (c) => c.columnName === "status",
      );
      expect(statusCol?.type).toEqual(["active", "inactive", "banned"]);
    });

    test("binary column type", () => {
      const BinaryModel = defineModel("blobs", {
        columns: {
          id: col.increment(),
          data: col.binary(),
        },
      });

      const dataCol = BinaryModel.getColumns().find(
        (c) => c.columnName === "data",
      );
      expect(dataCol?.type).toBe("binary");
    });
  });

  describe("relation metadata registration", () => {
    const Post = defineModel("posts", {
      columns: {
        id: col.increment(),
        title: col.string(),
        userId: col.integer(),
      },
    });

    const Profile = defineModel("profiles", {
      columns: {
        id: col.increment(),
        bio: col.text(),
        userId: col.integer(),
      },
    });

    const Tag = defineModel("tags", {
      columns: {
        id: col.increment(),
        name: col.string(),
      },
    });

    const User = defineModel("users", {
      columns: {
        id: col.increment(),
        name: col.string(),
      },
      relations: {
        posts: rel.hasMany(() => Post, "userId"),
        profile: rel.hasOne(() => Profile, "userId"),
        role: rel.belongsTo(() => Tag, "tagId"),
        tags: rel.manyToMany(() => Tag, "user_tags", {
          leftForeignKey: "userId",
          rightForeignKey: "tagId",
        }),
      },
    });

    test("getRelations returns all defined relations", () => {
      const relations = User.getRelations();
      const relationNames = relations.map((r) => r.columnName);

      expect(relationNames).toContain("posts");
      expect(relationNames).toContain("profile");
      expect(relationNames).toContain("role");
      expect(relationNames).toContain("tags");
      expect(relations.length).toBe(4);
    });

    test("hasMany relation has correct type", () => {
      const relations = User.getRelations();
      const postsRel = relations.find((r) => r.columnName === "posts");
      expect(postsRel?.type).toBe(RelationEnum.hasMany);
    });

    test("hasOne relation has correct type", () => {
      const relations = User.getRelations();
      const profileRel = relations.find((r) => r.columnName === "profile");
      expect(profileRel?.type).toBe(RelationEnum.hasOne);
    });

    test("belongsTo relation has correct type", () => {
      const relations = User.getRelations();
      const roleRel = relations.find((r) => r.columnName === "role");
      expect(roleRel?.type).toBe(RelationEnum.belongsTo);
    });

    test("manyToMany relation has correct type", () => {
      const relations = User.getRelations();
      const tagsRel = relations.find((r) => r.columnName === "tags");
      expect(tagsRel?.type).toBe(RelationEnum.manyToMany);
    });
  });

  describe("index metadata", () => {
    test("registers indexes from array form", () => {
      const TestModel = defineModel("indexed_items", {
        columns: {
          id: col.increment(),
          email: col.string(),
          name: col.string(),
        },
        indexes: [["email"]],
      });

      const indexes = TestModel.getIndexes();
      expect(indexes.length).toBe(1);
      expect(indexes[0].columns).toEqual(["email"]);
    });

    test("registers indexes from object form with custom name", () => {
      const TestModel = defineModel("indexed_items_named", {
        columns: {
          id: col.increment(),
          name: col.string(),
          email: col.string(),
        },
        indexes: [{ columns: ["name", "email"], name: "custom_idx" }],
      });

      const indexes = TestModel.getIndexes();
      expect(indexes.length).toBe(1);
      expect(indexes[0].columns).toEqual(["name", "email"]);
      expect(indexes[0].name).toBe("custom_idx");
    });

    test("registers multiple indexes", () => {
      const TestModel = defineModel("multi_indexed", {
        columns: {
          id: col.increment(),
          name: col.string(),
          email: col.string(),
        },
        indexes: [["email"], ["name", "email"]],
      });

      const indexes = TestModel.getIndexes();
      expect(indexes.length).toBe(2);
    });
  });

  describe("unique metadata", () => {
    test("registers uniques from array form", () => {
      const TestModel = defineModel("unique_items", {
        columns: {
          id: col.increment(),
          email: col.string(),
        },
        uniques: [["email"]],
      });

      const uniques = TestModel.getUniques();
      expect(uniques.length).toBe(1);
      expect(uniques[0].columns).toEqual(["email"]);
    });

    test("registers uniques from object form with custom name", () => {
      const TestModel = defineModel("unique_items_named", {
        columns: {
          id: col.increment(),
          email: col.string(),
        },
        uniques: [{ columns: ["email"], name: "uq_custom_email" }],
      });

      const uniques = TestModel.getUniques();
      expect(uniques.length).toBe(1);
      expect(uniques[0].name).toBe("uq_custom_email");
    });
  });

  describe("check metadata", () => {
    test("registers checks from string form", () => {
      const TestModel = defineModel("checked_items", {
        columns: {
          id: col.increment(),
          age: col.integer(),
        },
        checks: ["age >= 0"],
      });

      const checks = TestModel.getChecks();
      expect(checks.length).toBe(1);
      expect(checks[0].expression).toBe("age >= 0");
    });

    test("registers checks from object form with custom name", () => {
      const TestModel = defineModel("checked_items_named", {
        columns: {
          id: col.increment(),
          price: col.decimal(),
        },
        checks: [{ expression: "price > 0", name: "chk_positive_price" }],
      });

      const checks = TestModel.getChecks();
      expect(checks.length).toBe(1);
      expect(checks[0].expression).toBe("price > 0");
      expect(checks[0].name).toBe("chk_positive_price");
    });
  });

  describe("hooks", () => {
    test("beforeFetch hook is assigned", () => {
      const hook = jest.fn();
      const TestModel = defineModel("hooked_items", {
        columns: { id: col.increment() },
        hooks: { beforeFetch: hook },
      });

      expect(TestModel.beforeFetch).toBe(hook);
    });

    test("afterFetch hook is assigned", () => {
      const hook = jest.fn((data) => data);
      const TestModel = defineModel("hooked_items_af", {
        columns: { id: col.increment() },
        hooks: { afterFetch: hook },
      });

      expect(TestModel.afterFetch).toBe(hook);
    });

    test("beforeInsert hook is assigned", () => {
      const hook = jest.fn();
      const TestModel = defineModel("hooked_items_bi", {
        columns: { id: col.increment() },
        hooks: { beforeInsert: hook },
      });

      expect(TestModel.beforeInsert).toBe(hook);
    });

    test("beforeInsertMany hook is assigned", () => {
      const hook = jest.fn();
      const TestModel = defineModel("hooked_items_bim", {
        columns: { id: col.increment() },
        hooks: { beforeInsertMany: hook },
      });

      expect(TestModel.beforeInsertMany).toBe(hook);
    });

    test("beforeUpdate hook is assigned", () => {
      const hook = jest.fn();
      const TestModel = defineModel("hooked_items_bu", {
        columns: { id: col.increment() },
        hooks: { beforeUpdate: hook },
      });

      expect(TestModel.beforeUpdate).toBe(hook);
    });

    test("beforeDelete hook is assigned", () => {
      const hook = jest.fn();
      const TestModel = defineModel("hooked_items_bd", {
        columns: { id: col.increment() },
        hooks: { beforeDelete: hook },
      });

      expect(TestModel.beforeDelete).toBe(hook);
    });

    test("model without hooks has no hook methods", () => {
      const TestModel = defineModel("no_hooks", {
        columns: { id: col.increment() },
      });

      expect(TestModel.beforeFetch).toBeUndefined();
      expect(TestModel.afterFetch).toBeUndefined();
      expect(TestModel.beforeInsert).toBeUndefined();
    });
  });

  describe("options", () => {
    test("modelCaseConvention is applied", () => {
      const TestModel = defineModel("case_test", {
        columns: { id: col.increment() },
        options: { modelCaseConvention: "snake" },
      });

      expect(TestModel.modelCaseConvention).toBe("snake");
    });

    test("databaseCaseConvention is applied", () => {
      const TestModel = defineModel("case_test_db", {
        columns: { id: col.increment() },
        options: { databaseCaseConvention: "camel" },
      });

      expect(TestModel.databaseCaseConvention).toBe("camel");
    });

    test("softDeleteColumn is applied", () => {
      const TestModel = defineModel("soft_del_test", {
        columns: { id: col.increment() },
        options: { softDeleteColumn: "removedAt" },
      });

      expect(TestModel.softDeleteColumn).toBe("removedAt");
    });

    test("softDeleteValue is applied", () => {
      const TestModel = defineModel("soft_del_val_test", {
        columns: { id: col.increment() },
        options: { softDeleteValue: true },
      });

      expect(TestModel.softDeleteValue).toBe(true);
    });

    test("default options are inherited from Model", () => {
      const TestModel = defineModel("defaults_test", {
        columns: { id: col.increment() },
      });

      expect(TestModel.modelCaseConvention).toBe("camel");
      expect(TestModel.databaseCaseConvention).toBe("snake");
      expect(TestModel.softDeleteColumn).toBe("deletedAt");
    });
  });

  describe("cross-model relations", () => {
    test("two defineModel models can reference each other", () => {
      const Author = defineModel("authors", {
        columns: {
          id: col.increment(),
          name: col.string(),
        },
      });

      const Book = defineModel("books", {
        columns: {
          id: col.increment(),
          title: col.string(),
          authorId: col.integer(),
        },
        relations: {
          author: rel.belongsTo(() => Author, "authorId"),
        },
      });

      const AuthorWithBooks = defineModel("authors_with_books", {
        columns: {
          id: col.increment(),
          name: col.string(),
        },
        relations: {
          books: rel.hasMany(() => Book, "authorId"),
        },
      });

      const bookRelations = Book.getRelations();
      expect(bookRelations.length).toBe(1);
      expect(bookRelations[0].type).toBe(RelationEnum.belongsTo);

      const authorRelations = AuthorWithBooks.getRelations();
      expect(authorRelations.length).toBe(1);
      expect(authorRelations[0].type).toBe(RelationEnum.hasMany);
    });
  });

  describe("columns-only minimal model", () => {
    test("model with only columns and no relations/indexes/hooks", () => {
      const Simple = defineModel("simple_items", {
        columns: {
          id: col.increment(),
          value: col.string(),
        },
      });

      expect(Simple.table).toBe("simple_items");
      expect(Simple.getColumns().length).toBe(2);
      expect(Simple.getRelations().length).toBe(0);
      expect(Simple.getIndexes().length).toBe(0);
      expect(Simple.getUniques().length).toBe(0);
      expect(Simple.getChecks().length).toBe(0);
    });
  });
});
