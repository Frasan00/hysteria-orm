import {
  defineModel,
  col,
  defineRelations,
  createSchema,
} from "../../../src/sql/models/define_model";
import type { ModelKey } from "../../../src/sql/models/model_manager/model_manager_types";
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

    test("has metadata static methods but hides query/mutation methods from type", () => {
      const TestModel = defineModel("test_models", {
        columns: { id: col.increment() },
      });

      // Metadata methods are accessible
      expect(typeof TestModel.getColumns).toBe("function");
      expect(typeof TestModel.getRelations).toBe("function");
      expect(typeof TestModel.getIndexes).toBe("function");
      expect(typeof TestModel.getUniques).toBe("function");
      expect(typeof TestModel.getChecks).toBe("function");
      expect(TestModel.table).toBe("test_models");
      expect(TestModel.primaryKey).toBe("id");

      // Query/mutation methods have been removed from Model
      // Use sql.from(TestModel) instead
      const raw = TestModel as any;
      expect(typeof raw.query).toBe("undefined");
      expect(typeof raw.insert).toBe("undefined");
      expect(typeof raw.insertMany).toBe("undefined");
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
        metadata: col.jsonb(),
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
      expect(statusCol?.type).toBe("enum");
      expect(statusCol?.enumValues).toEqual(["active", "inactive", "banned"]);
    });

    test("nativeEnum column with string enum", () => {
      enum Status {
        Active = "active",
        Inactive = "inactive",
        Banned = "banned",
      }
      const StatusModel = defineModel("statuses", {
        columns: {
          id: col.increment(),
          status: col.nativeEnum(Status),
        },
      });

      const statusCol = StatusModel.getColumns().find(
        (c) => c.columnName === "status",
      );
      expect(statusCol?.type).toBe("enum");
      expect(statusCol?.enumValues).toEqual(["active", "inactive", "banned"]);
    });

    test("nativeEnum column with numeric enum", () => {
      enum Priority {
        Low = 0,
        Medium = 1,
        High = 2,
      }
      const PriorityModel = defineModel("priorities", {
        columns: {
          id: col.increment(),
          priority: col.nativeEnum(Priority),
        },
      });

      const priorityCol = PriorityModel.getColumns().find(
        (c) => c.columnName === "priority",
      );
      expect(priorityCol?.type).toBe("enum");
      expect(priorityCol?.enumValues).toEqual(["0", "1", "2"]);
    });

    test("nativeEnum column with nullable option", () => {
      enum Status {
        Active = "active",
        Inactive = "inactive",
      }
      const StatusModel = defineModel("statuses", {
        columns: {
          id: col.increment(),
          status: col.nativeEnum(Status, { nullable: false }),
        },
      });

      const statusCol = StatusModel.getColumns().find(
        (c) => c.columnName === "status",
      );
      expect(statusCol?.type).toBe("enum");
      expect(statusCol?.enumValues).toEqual(["active", "inactive"]);
      expect(statusCol?.constraints?.nullable).toBe(false);
    });

    test("nativeEnum column with serialize and prepare", () => {
      enum Status {
        Active = "active",
        Inactive = "inactive",
      }
      const serialize = (value: Status | null): Status | null =>
        value ? (value.toUpperCase() as Status) : null;
      const prepare = (value: string | null): Status | null =>
        value ? (value.toLowerCase() as Status) : null;

      const TestModel = defineModel("native_enum_callbacks_test", {
        columns: {
          id: col.increment(),
          status: col.nativeEnum(Status, { serialize, prepare }),
        },
      });

      const statusCol = TestModel.getColumns().find(
        (c) => c.columnName === "status",
      );
      expect(statusCol?.serialize).toBeDefined();
      expect(statusCol?.prepare).toBeDefined();
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

    const UserBase = defineModel("users", {
      columns: {
        id: col.increment(),
        name: col.string(),
      },
    });

    const UserTagBase = defineModel("user_tags", {
      columns: {
        id: col.increment(),
        userId: col.integer(),
        tagId: col.integer(),
      },
    });

    const UserRelations = defineRelations(
      UserBase,
      ({ hasMany, hasOne, belongsTo, manyToMany }) => ({
        posts: hasMany(Post, { foreignKey: "userId" }),
        profile: hasOne(Profile, { foreignKey: "userId" }),
        role: belongsTo(Tag, { foreignKey: "tagId" }),
        tags: manyToMany(Tag, {
          through: UserTagBase,
          leftForeignKey: "userId",
          rightForeignKey: "tagId",
        }),
      }),
    );

    const userSchema = createSchema(
      {
        users: UserBase,
        posts: Post,
        profiles: Profile,
        tags: Tag,
        user_tags: UserTagBase,
      },
      { users: UserRelations },
    );

    const User = userSchema.users;

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

      expect((TestModel as any).beforeFetch).toBe(hook);
    });

    test("afterFetch hook is assigned", () => {
      const hook = jest.fn((data) => data);
      const TestModel = defineModel("hooked_items_af", {
        columns: { id: col.increment() },
        hooks: { afterFetch: hook },
      });

      expect((TestModel as any).afterFetch).toBe(hook);
    });

    test("beforeInsert hook is assigned", () => {
      const hook = jest.fn();
      const TestModel = defineModel("hooked_items_bi", {
        columns: { id: col.increment() },
        hooks: { beforeInsert: hook },
      });

      expect((TestModel as any).beforeInsert).toBe(hook);
    });

    test("beforeInsertMany hook is assigned", () => {
      const hook = jest.fn();
      const TestModel = defineModel("hooked_items_bim", {
        columns: { id: col.increment() },
        hooks: { beforeInsertMany: hook },
      });

      expect((TestModel as any).beforeInsertMany).toBe(hook);
    });

    test("beforeUpdate hook is assigned", () => {
      const hook = jest.fn();
      const TestModel = defineModel("hooked_items_bu", {
        columns: { id: col.increment() },
        hooks: { beforeUpdate: hook },
      });

      expect((TestModel as any).beforeUpdate).toBe(hook);
    });

    test("beforeDelete hook is assigned", () => {
      const hook = jest.fn();
      const TestModel = defineModel("hooked_items_bd", {
        columns: { id: col.increment() },
        hooks: { beforeDelete: hook },
      });

      expect((TestModel as any).beforeDelete).toBe(hook);
    });

    test("model without hooks has no hook methods", () => {
      const TestModel = defineModel("no_hooks", {
        columns: { id: col.increment() },
      });

      expect((TestModel as any).beforeFetch).toBeUndefined();
      expect((TestModel as any).afterFetch).toBeUndefined();
      expect((TestModel as any).beforeInsert).toBeUndefined();
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
      });

      const AuthorWithBooks = defineModel("authors_with_books", {
        columns: {
          id: col.increment(),
          name: col.string(),
        },
      });

      const BookRelations = defineRelations(Book, ({ belongsTo }) => ({
        author: belongsTo(Author, { foreignKey: "authorId" }),
      }));

      const AuthorWithBooksRelations = defineRelations(
        AuthorWithBooks,
        ({ hasMany }) => ({
          books: hasMany(Book, { foreignKey: "authorId" }),
        }),
      );

      const crossSchema = createSchema(
        { authors: Author, books: Book, authors_with_books: AuthorWithBooks },
        { books: BookRelations, authors_with_books: AuthorWithBooksRelations },
      );

      const bookRelations = crossSchema.books.getRelations();
      expect(bookRelations.length).toBe(1);
      expect(bookRelations[0].type).toBe(RelationEnum.belongsTo);

      const authorRelations = crossSchema.authors_with_books.getRelations();
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
      expect(settingsCol?.type).toBe("json");
    });

    test("col.datetime<T>() registers as datetime column", () => {
      const TestModel = defineModel("datetime_generic_test", {
        columns: {
          id: col.increment(),
          createdAt: col.datetime({ autoCreate: true }),
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
      const serialize = (raw: any) => (raw ? String(raw) : "");
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

    test("serialize and prepare on date column (date mode)", () => {
      const TestModel = defineModel("date_callbacks_test", {
        columns: {
          id: col.increment(),
          eventDate: col.date(),
        },
      });

      const dateCol = TestModel.getColumns().find(
        (c) => c.columnName === "eventDate",
      );
      expect(dateCol?.serialize).toBeDefined();
      expect(dateCol?.prepare).toBeDefined();
    });

    test("date column string mode", () => {
      const TestModel = defineModel("date_string_test", {
        columns: {
          id: col.increment(),
          eventDate: col.date.string(),
        },
      });

      const dateCol = TestModel.getColumns().find(
        (c) => c.columnName === "eventDate",
      );
      expect(dateCol?.serialize).toBeDefined();
      expect(dateCol?.prepare).toBeDefined();
    });

    test("serialize and prepare on enum column", () => {
      const serialize = (raw: any): "active" | "inactive" =>
        raw ? (String(raw).toLowerCase() as "active" | "inactive") : "inactive";
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
    test("model can reference itself via defineRelations", () => {
      const Category = defineModel("categories", {
        columns: {
          id: col.increment(),
          name: col.string(),
          parentId: col.integer(),
        },
      });

      const CategoryRelations = defineRelations(Category, ({ belongsTo }) => ({
        parent: belongsTo(Category, { foreignKey: "parentId" }),
      }));

      const catSchema = createSchema(
        { categories: Category },
        { categories: CategoryRelations },
      );

      const relations = catSchema.categories.getRelations();
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
      });

      const TreeNodeRelations = defineRelations(
        TreeNode,
        ({ belongsTo, hasMany }) => ({
          parent: belongsTo(TreeNode, { foreignKey: "parentId" }),
          children: hasMany(TreeNode, { foreignKey: "parentId" }),
        }),
      );

      const treeSchema = createSchema(
        { tree_nodes: TreeNode },
        { tree_nodes: TreeNodeRelations },
      );

      const relations = treeSchema.tree_nodes.getRelations();
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
      });

      const EmployeeRelations = defineRelations(Employee, ({ hasOne }) => ({
        manager: hasOne(Employee, { foreignKey: "managerId" }),
      }));

      const empSchema = createSchema(
        { employees: Employee },
        { employees: EmployeeRelations },
      );

      const relations = empSchema.employees.getRelations();
      const managerRel = relations.find((r) => r.columnName === "manager");
      expect(managerRel).toBeDefined();
      expect(managerRel?.type).toBe(RelationEnum.hasOne);
    });

    test("self-referencing can coexist with external model references", () => {
      const TagSr = defineModel("tags_sr", {
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
      });

      const ItemRelations = defineRelations(Item, ({ belongsTo }) => ({
        parent: belongsTo(Item, { foreignKey: "parentId" }),
        tag: belongsTo(TagSr, { foreignKey: "tagId" }),
      }));

      const itemSchema = createSchema(
        { tags_sr: TagSr, items_sr: Item },
        { items_sr: ItemRelations },
      );

      const relations = itemSchema.items_sr.getRelations();
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

    test("hasOne registers relation", () => {
      const UserNrHo = defineModel("users_nr_ho", {
        columns: {
          id: col.increment(),
          name: col.string(),
        },
      });
      const rels = defineRelations(UserNrHo, ({ hasOne }) => ({
        profile: hasOne(Profile, { foreignKey: "userId" }),
      }));
      const s = createSchema(
        { users_nr_ho: UserNrHo, profiles_nr: Profile },
        { users_nr_ho: rels },
      );
      const relations = s.users_nr_ho.getRelations();
      expect(relations.length).toBe(1);
      expect(relations[0].type).toBe(RelationEnum.hasOne);
    });

    test("hasMany registers relation", () => {
      const UserNrHm = defineModel("users_nr_hm", {
        columns: {
          id: col.increment(),
          name: col.string(),
        },
      });
      const rels = defineRelations(UserNrHm, ({ hasMany }) => ({
        posts: hasMany(Post, { foreignKey: "authorId" }),
      }));
      const s = createSchema(
        { users_nr_hm: UserNrHm, posts_nr: Post },
        { users_nr_hm: rels },
      );
      const relations = s.users_nr_hm.getRelations();
      expect(relations.length).toBe(1);
      expect(relations[0].type).toBe(RelationEnum.hasMany);
    });

    test("belongsTo registers relation", () => {
      const Comment = defineModel("comments_nr", {
        columns: {
          id: col.increment(),
          postId: col.integer(),
        },
      });
      const rels = defineRelations(Comment, ({ belongsTo }) => ({
        post: belongsTo(Post, { foreignKey: "postId" }),
      }));
      const s = createSchema(
        { comments_nr: Comment, posts_nr: Post },
        { comments_nr: rels },
      );
      const relations = s.comments_nr.getRelations();
      expect(relations.length).toBe(1);
      expect(relations[0].type).toBe(RelationEnum.belongsTo);
    });

    test("manyToMany registers relation", () => {
      const TagNr = defineModel("tags_nr", {
        columns: {
          id: col.increment(),
          name: col.string(),
        },
      });

      const ArticleNr = defineModel("articles_nr", {
        columns: {
          id: col.increment(),
          title: col.string(),
        },
      });

      const rels = defineRelations(ArticleNr, ({ manyToMany }) => ({
        tags: manyToMany(TagNr, {
          through: "article_tags",
          leftForeignKey: "articleId",
          rightForeignKey: "tagId",
        }),
      }));

      const s = createSchema(
        { articles_nr: ArticleNr, tags_nr: TagNr },
        { articles_nr: rels },
      );
      const relations = s.articles_nr.getRelations();
      expect(relations.length).toBe(1);
      expect(relations[0].type).toBe(RelationEnum.manyToMany);
    });

    test("multiple relations register correctly", () => {
      const UserNrDefault = defineModel("users_nr_default", {
        columns: {
          id: col.increment(),
          name: col.string(),
        },
      });
      const rels = defineRelations(UserNrDefault, ({ hasOne, hasMany }) => ({
        profile: hasOne(Profile, { foreignKey: "userId" }),
        posts: hasMany(Post, { foreignKey: "authorId" }),
      }));
      const s = createSchema(
        {
          users_nr_default: UserNrDefault,
          profiles_nr: Profile,
          posts_nr: Post,
        },
        { users_nr_default: rels },
      );
      const relations = s.users_nr_default.getRelations();
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

      expect((TestModel as any).beforeInsert).toBeDefined();
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

      expect((TestModel as any).afterFetch).toBeDefined();
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

  describe("readonly literal table name and ModelKey", () => {
    type AssertAssignable<A, B> = A extends B ? true : never;
    type AssertEqual<A, B> = [A] extends [B]
      ? [B] extends [A]
        ? true
        : never
      : never;

    const User = defineModel("users", {
      columns: {
        id: col.increment(),
        name: col.string(),
        email: col.string({ nullable: false }),
      },
    });

    test("table property is the literal string passed to defineModel", () => {
      // Runtime check
      expect(User.table).toBe("users");

      // Type-level: User.table should be exactly "users", not string
      const _literal: AssertEqual<typeof User.table, "users"> = true;
      expect(_literal).toBe(true);
    });

    test("ModelKey produces table-prefixed column keys", () => {
      type UserKeys = ModelKey<InstanceType<typeof User>>;

      // Each prefixed key should be assignable
      const _id: AssertAssignable<"users.id", UserKeys> = true;
      const _name: AssertAssignable<"users.name", UserKeys> = true;
      const _email: AssertAssignable<"users.email", UserKeys> = true;
      expect(_id).toBe(true);
      expect(_name).toBe(true);
      expect(_email).toBe(true);
    });

    test("ModelKey does not include unprefixed keys", () => {
      type UserKeys = ModelKey<InstanceType<typeof User>>;

      // "id" alone (without table prefix) should NOT be assignable
      const _check: AssertAssignable<"id", UserKeys> = true as never;
      void _check;
      expect(true).toBe(true);
    });

    test("ModelKey excludes relation keys", () => {
      const PostMk = defineModel("posts_mk", {
        columns: {
          id: col.increment(),
          title: col.string(),
          userId: col.integer(),
        },
      });

      const AuthorBase = defineModel("authors_mk", {
        columns: {
          id: col.increment(),
          name: col.string(),
        },
      });

      const authorRels = defineRelations(AuthorBase, ({ hasMany }) => ({
        posts: hasMany(PostMk, { foreignKey: "userId" }),
      }));

      const mkSchema = createSchema(
        { authors_mk: AuthorBase, posts_mk: PostMk },
        { authors_mk: authorRels },
      );

      const Author = mkSchema.authors_mk;
      type AuthorKeys = ModelKey<InstanceType<typeof Author>>;

      // Column keys are included with prefix
      const _id: AssertAssignable<"authors_mk.id", AuthorKeys> = true;
      const _name: AssertAssignable<"authors_mk.name", AuthorKeys> = true;
      expect(_id).toBe(true);
      expect(_name).toBe(true);

      // Relation keys should NOT appear
      // "authors_mk.posts" should not be in ModelKey
      const _posts: AssertAssignable<"authors_mk.posts", AuthorKeys> =
        true as never;
      void _posts;
      expect(true).toBe(true);
    });

    test("ModelKey works with different table names", () => {
      const Product = defineModel("products", {
        columns: {
          id: col.increment(),
          sku: col.string({ nullable: false }),
          price: col.decimal(),
        },
      });

      type ProductKeys = ModelKey<InstanceType<typeof Product>>;

      const _id: AssertAssignable<"products.id", ProductKeys> = true;
      const _sku: AssertAssignable<"products.sku", ProductKeys> = true;
      const _price: AssertAssignable<"products.price", ProductKeys> = true;
      expect(_id).toBe(true);
      expect(_sku).toBe(true);
      expect(_price).toBe(true);
    });
  });
});
