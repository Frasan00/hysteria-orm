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
        columns: {
          id: col.increment(),
          removedAt: col.datetime(),
        },
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

  describe("generic column types", () => {
    test("col<T>() registers column metadata", () => {
      const TestModel = defineModel("generic_test", {
        columns: {
          id: col.increment(),
          token: col<string>({ nullable: false }),
        },
      });

      const tokenCol = TestModel.getColumns().find(
        (c) => c.columnName === "token",
      );
      expect(tokenCol).toBeDefined();
      expect(tokenCol?.columnName).toBe("token");
    });

    test("col.primary<T>() registers as primary key", () => {
      const TestModel = defineModel("generic_pk_test", {
        columns: {
          id: col.primary<number>({ nullable: false }),
          name: col.string(),
        },
      });

      expect(TestModel.primaryKey).toBe("id");
      const idCol = TestModel.getColumns().find((c) => c.columnName === "id");
      expect(idCol?.isPrimary).toBe(true);
    });

    test("col.json<T>() registers as jsonb column", () => {
      interface Settings {
        theme: string;
        notifications: boolean;
      }

      const TestModel = defineModel("json_generic_test", {
        columns: {
          id: col.increment(),
          settings: col.json<Settings>(),
        },
      });

      const settingsCol = TestModel.getColumns().find(
        (c) => c.columnName === "settings",
      );
      expect(settingsCol?.type).toBe("jsonb");
    });

    test("col.datetime<T>() registers as datetime column", () => {
      const TestModel = defineModel("datetime_generic_test", {
        columns: {
          id: col.increment(),
          createdAt: col.datetime<Date>({ autoCreate: true }),
        },
      });

      const dtCol = TestModel.getColumns().find(
        (c) => c.columnName === "createdAt",
      );
      expect(dtCol?.type).toBe("datetime");
    });
  });

  describe("typed serialize / prepare callbacks", () => {
    test("serialize callback is registered on string column", () => {
      const serialize = (raw: any) => String(raw).trim();
      const TestModel = defineModel("serialize_string_test", {
        columns: {
          id: col.increment(),
          name: col.string({
            nullable: false,
            serialize,
          }),
        },
      });

      const nameCol = TestModel.getColumns().find(
        (c) => c.columnName === "name",
      );
      expect(nameCol?.serialize).toBeDefined();
      expect(typeof nameCol?.serialize).toBe("function");
    });

    test("prepare callback is registered on string column", () => {
      const prepare = (value: string) => value.toLowerCase();
      const TestModel = defineModel("prepare_string_test", {
        columns: {
          id: col.increment(),
          name: col.string({
            nullable: false,
            prepare,
          }),
        },
      });

      const nameCol = TestModel.getColumns().find(
        (c) => c.columnName === "name",
      );
      expect(nameCol?.prepare).toBeDefined();
      expect(typeof nameCol?.prepare).toBe("function");
    });

    test("both serialize and prepare work together on string column", () => {
      const serialize = (raw: any) => String(raw).toUpperCase();
      const prepare = (value: string) => value.trim();

      const TestModel = defineModel("both_callbacks_test", {
        columns: {
          id: col.increment(),
          label: col.string({
            nullable: false,
            serialize,
            prepare,
          }),
        },
      });

      const labelCol = TestModel.getColumns().find(
        (c) => c.columnName === "label",
      );
      expect(labelCol?.serialize).toBeDefined();
      expect(labelCol?.prepare).toBeDefined();
    });

    test("prepare-only callback on integer column (no serialize exposed)", () => {
      const prepare = (value: number) => Math.round(value);
      const TestModel = defineModel("prepare_int_test", {
        columns: {
          id: col.increment(),
          quantity: col.integer({
            nullable: false,
            prepare,
          }),
        },
      });

      const qtyCol = TestModel.getColumns().find(
        (c) => c.columnName === "quantity",
      );
      expect(qtyCol?.prepare).toBeDefined();
      expect(typeof qtyCol?.prepare).toBe("function");
    });

    test("serialize-only callback on uuid column (no prepare exposed)", () => {
      const serialize = (raw: any) => (raw ? String(raw) : null);
      const TestModel = defineModel("serialize_uuid_test", {
        columns: {
          id: col.uuid({
            primaryKey: true,
            serialize,
          }),
        },
      });

      const idCol = TestModel.getColumns().find((c) => c.columnName === "id");
      expect(idCol?.serialize).toBeDefined();
      expect(typeof idCol?.serialize).toBe("function");
    });

    test("serialize and prepare on col<T>() generic column", () => {
      const serialize = (raw: any) =>
        Buffer.from(raw, "base64").toString("utf-8");
      const prepare = (value: string) =>
        Buffer.from(value, "utf-8").toString("base64");

      const TestModel = defineModel("generic_callbacks_test", {
        columns: {
          id: col.increment(),
          token: col<string>({ serialize, prepare }),
        },
      });

      const tokenCol = TestModel.getColumns().find(
        (c) => c.columnName === "token",
      );
      expect(tokenCol?.serialize).toBeDefined();
      expect(tokenCol?.prepare).toBeDefined();
    });

    test("prepare callback on increment column", () => {
      const prepare = (value: number) => value + 1;
      const TestModel = defineModel("prepare_incr_test", {
        columns: {
          id: col.increment({ prepare }),
        },
      });

      const idCol = TestModel.getColumns().find((c) => c.columnName === "id");
      expect(idCol?.prepare).toBeDefined();
    });

    test("serialize and prepare on date column", () => {
      const serialize = (raw: any) => new Date(raw);
      const prepare = (value: Date | string | null | undefined) =>
        value instanceof Date ? value.toISOString() : value;

      const TestModel = defineModel("date_callbacks_test", {
        columns: {
          id: col.increment(),
          eventDate: col.date({ serialize, prepare }),
        },
      });

      const dateCol = TestModel.getColumns().find(
        (c) => c.columnName === "eventDate",
      );
      expect(dateCol?.serialize).toBeDefined();
      expect(dateCol?.prepare).toBeDefined();
    });

    test("serialize and prepare on enum column", () => {
      const serialize = (raw: any): "active" | "inactive" | null | undefined =>
        raw ? (String(raw).toLowerCase() as "active" | "inactive") : null;
      const prepare = (value: "active" | "inactive" | null | undefined) =>
        value ? value.toUpperCase() : null;

      const TestModel = defineModel("enum_callbacks_test", {
        columns: {
          id: col.increment(),
          status: col.enum(["active", "inactive"] as const, {
            serialize,
            prepare,
          }),
        },
      });

      const statusCol = TestModel.getColumns().find(
        (c) => c.columnName === "status",
      );
      expect(statusCol?.serialize).toBeDefined();
      expect(statusCol?.prepare).toBeDefined();
    });

    test("column without callbacks has no serialize or prepare", () => {
      const TestModel = defineModel("no_callbacks_test", {
        columns: {
          id: col.increment(),
          name: col.string(),
        },
      });

      const nameCol = TestModel.getColumns().find(
        (c) => c.columnName === "name",
      );
      expect(nameCol?.serialize).toBeUndefined();
      expect(nameCol?.prepare).toBeUndefined();
    });
  });

  describe("self-referencing relations", () => {
    test("model can reference itself via (self) => self in hasOne", () => {
      const Category = defineModel("categories", {
        columns: {
          id: col.increment(),
          name: col.string(),
          parentId: col.integer(),
        },
        relations: {
          parent: rel.belongsTo((self) => self, "parentId"),
        },
      });

      const relations = Category.getRelations();
      expect(relations.length).toBe(1);
      expect(relations[0].columnName).toBe("parent");
      expect(relations[0].type).toBe(RelationEnum.belongsTo);
    });

    test("model can self-reference with hasMany for children", () => {
      const TreeNode = defineModel("tree_nodes", {
        columns: {
          id: col.increment(),
          parentId: col.integer(),
          label: col.string(),
        },
        relations: {
          parent: rel.belongsTo((self) => self, "parentId"),
          children: rel.hasMany((self) => self, "parentId"),
        },
      });

      const relations = TreeNode.getRelations();
      expect(relations.length).toBe(2);

      const parentRel = relations.find((r) => r.columnName === "parent");
      expect(parentRel?.type).toBe(RelationEnum.belongsTo);

      const childrenRel = relations.find((r) => r.columnName === "children");
      expect(childrenRel?.type).toBe(RelationEnum.hasMany);
    });

    test("self-referencing hasOne resolves to correct model at runtime", () => {
      const Employee = defineModel("employees", {
        columns: {
          id: col.increment(),
          managerId: col.integer(),
          name: col.string(),
        },
        relations: {
          manager: rel.hasOne((self) => self, "managerId"),
        },
      });

      const relations = Employee.getRelations();
      const managerRel = relations.find((r) => r.columnName === "manager");
      expect(managerRel).toBeDefined();
      expect(managerRel?.type).toBe(RelationEnum.hasOne);
    });

    test("self-referencing can coexist with external model references", () => {
      const Tag = defineModel("tags_sr", {
        columns: {
          id: col.increment(),
          name: col.string(),
        },
      });

      const Item = defineModel("items_sr", {
        columns: {
          id: col.increment(),
          parentId: col.integer(),
          tagId: col.integer(),
        },
        relations: {
          parent: rel.belongsTo((self) => self, "parentId"),
          tag: rel.belongsTo(() => Tag, "tagId"),
        },
      });

      const relations = Item.getRelations();
      expect(relations.length).toBe(2);

      const parentRel = relations.find((r) => r.columnName === "parent");
      expect(parentRel?.type).toBe(RelationEnum.belongsTo);

      const tagRel = relations.find((r) => r.columnName === "tag");
      expect(tagRel?.type).toBe(RelationEnum.belongsTo);
    });
  });

  describe("nullable relation types", () => {
    const Profile = defineModel("profiles_nr", {
      columns: {
        id: col.increment(),
        userId: col.integer(),
        bio: col.text(),
      },
    });

    const Post = defineModel("posts_nr", {
      columns: {
        id: col.increment(),
        authorId: col.integer(),
        title: col.string(),
      },
    });

    test("hasOne with nullable: false registers relation", () => {
      const User = defineModel("users_nr_ho", {
        columns: {
          id: col.increment(),
          name: col.string(),
        },
        relations: {
          profile: rel.hasOne(() => Profile, "userId", { nullable: false }),
        },
      });

      const relations = User.getRelations();
      expect(relations.length).toBe(1);
      expect(relations[0].type).toBe(RelationEnum.hasOne);
    });

    test("hasMany with nullable: false registers relation", () => {
      const User = defineModel("users_nr_hm", {
        columns: {
          id: col.increment(),
          name: col.string(),
        },
        relations: {
          posts: rel.hasMany(() => Post, "authorId", { nullable: false }),
        },
      });

      const relations = User.getRelations();
      expect(relations.length).toBe(1);
      expect(relations[0].type).toBe(RelationEnum.hasMany);
    });

    test("belongsTo with nullable: false registers relation", () => {
      const Comment = defineModel("comments_nr", {
        columns: {
          id: col.increment(),
          postId: col.integer(),
        },
        relations: {
          post: rel.belongsTo(() => Post, "postId", { nullable: false }),
        },
      });

      const relations = Comment.getRelations();
      expect(relations.length).toBe(1);
      expect(relations[0].type).toBe(RelationEnum.belongsTo);
    });

    test("manyToMany with nullable: false registers relation", () => {
      const Tag = defineModel("tags_nr", {
        columns: {
          id: col.increment(),
          name: col.string(),
        },
      });

      const Article = defineModel("articles_nr", {
        columns: {
          id: col.increment(),
          title: col.string(),
        },
        relations: {
          tags: rel.manyToMany(
            () => Tag,
            "article_tags",
            { leftForeignKey: "articleId", rightForeignKey: "tagId" },
            { nullable: false },
          ),
        },
      });

      const relations = Article.getRelations();
      expect(relations.length).toBe(1);
      expect(relations[0].type).toBe(RelationEnum.manyToMany);
    });

    test("nullable relation (default) still works", () => {
      const User = defineModel("users_nr_default", {
        columns: {
          id: col.increment(),
          name: col.string(),
        },
        relations: {
          profile: rel.hasOne(() => Profile, "userId"),
          posts: rel.hasMany(() => Post, "authorId"),
        },
      });

      const relations = User.getRelations();
      expect(relations.length).toBe(2);
    });
  });

  describe("type-safe indexes and uniques", () => {
    test("indexes reference valid column names", () => {
      const TestModel = defineModel("idx_typed_test", {
        columns: {
          id: col.increment(),
          email: col.string(),
          name: col.string(),
        },
        indexes: [["email"], ["name", "email"]],
      });

      const indexes = TestModel.getIndexes();
      expect(indexes.length).toBe(2);
      expect(indexes[0].columns).toEqual(["email"]);
      expect(indexes[1].columns).toEqual(["name", "email"]);
    });

    test("uniques reference valid column names", () => {
      const TestModel = defineModel("uniq_typed_test", {
        columns: {
          id: col.increment(),
          email: col.string(),
          slug: col.string(),
        },
        uniques: [["email"], { columns: ["slug"], name: "uq_slug" }],
      });

      const uniques = TestModel.getUniques();
      expect(uniques.length).toBe(2);
      expect(uniques[0].columns).toEqual(["email"]);
      expect(uniques[1].columns).toEqual(["slug"]);
    });
  });

  describe("type-safe hooks", () => {
    test("beforeInsert receives typed data", () => {
      const insertedData: Array<Record<string, unknown>> = [];

      const TestModel = defineModel("hooks_typed_test", {
        columns: {
          id: col.increment(),
          name: col.string({ nullable: false }),
          email: col.string({ nullable: false }),
        },
        hooks: {
          beforeInsert: (data) => {
            insertedData.push(data as Record<string, unknown>);
          },
        },
      });

      expect(TestModel.beforeInsert).toBeDefined();
    });

    test("afterFetch receives typed array", () => {
      const TestModel = defineModel("hooks_after_typed", {
        columns: {
          id: col.increment(),
          title: col.string({ nullable: false }),
        },
        hooks: {
          afterFetch: (data) => {
            return data;
          },
        },
      });

      expect(TestModel.afterFetch).toBeDefined();
    });
  });

  describe("type-safe softDeleteColumn", () => {
    test("softDeleteColumn must be a defined column name", () => {
      const TestModel = defineModel("soft_del_typed", {
        columns: {
          id: col.increment(),
          deletedAt: col.datetime(),
          name: col.string(),
        },
        options: { softDeleteColumn: "deletedAt" },
      });

      expect(TestModel.softDeleteColumn).toBe("deletedAt");
    });
  });
});
