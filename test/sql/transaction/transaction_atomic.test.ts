import { atomic } from "../../../src/sql/transactions/atomic";
import { env } from "../../../src/env/env";
import { HysteriaError } from "../../../src/errors/hysteria_error";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { UserFactory } from "../test_models/factory/user_factory";
import { UserWithoutPk } from "../test_models/without_pk/user_without_pk";

let sql: SqlDataSource;

beforeAll(async () => {
  sql = new SqlDataSource();
  await sql.connect();
});

afterAll(async () => {
  await sql.disconnect();
});

beforeEach(async () => {
  const users = await sql.from(UserWithoutPk).many();
  expect(users.length).toBe(0);
  await sql.from(UserWithoutPk).delete();
});

afterEach(async () => {
  await sql.from(UserWithoutPk).delete();
  const users = await sql.from(UserWithoutPk).many();
  expect(users.length).toBe(0);
});

describe(`[${env.DB_TYPE}] Atomic Decorator`, () => {
  const testSkipSQLite = env.DB_TYPE === "sqlite" ? test.skip : test;

  test("Should commit on successful decorated method", async () => {
    class Service {
      sql = sql;

      @atomic()
      async createUser(): Promise<void> {
        await this.sql
          .from(UserWithoutPk)
          .insert({ ...UserFactory.getCommonUserData() });
      }
    }

    const service = new Service();
    await service.createUser();

    const users = await sql.from(UserWithoutPk).many();
    expect(users.length).toBe(1);
  });

  test("Should rollback when decorated method throws", async () => {
    class Service {
      sql = sql;

      @atomic()
      async createUser(): Promise<void> {
        await this.sql
          .from(UserWithoutPk)
          .insert({ ...UserFactory.getCommonUserData() });
        throw new Error("Atomic rollback test");
      }
    }

    const service = new Service();
    await expect(service.createUser()).rejects.toThrow("Atomic rollback test");

    const users = await sql.from(UserWithoutPk).many();
    expect(users.length).toBe(0);
  });

  test("Should auto-propagate transaction via CLS inside decorated method", async () => {
    class Service {
      sql = sql;

      @atomic()
      async createUsers(): Promise<void> {
        await this.sql.from(UserWithoutPk).insert({
          ...UserFactory.getCommonUserData(),
          email: "user1@test.com",
        });
        await this.sql.from(UserWithoutPk).insert({
          ...UserFactory.getCommonUserData(),
          email: "user2@test.com",
        });
      }
    }

    const service = new Service();
    await service.createUsers();

    const users = await sql.from(UserWithoutPk).many();
    expect(users.length).toBe(2);
  });

  test("Should resolve custom dataSource property by name", async () => {
    class Service {
      db = sql;

      @atomic({ dataSource: "db" })
      async createUser(): Promise<void> {
        await this.db
          .from(UserWithoutPk)
          .insert({ ...UserFactory.getCommonUserData() });
      }
    }

    const service = new Service();
    await service.createUser();

    const users = await sql.from(UserWithoutPk).many();
    expect(users.length).toBe(1);
  });

  test("Should resolve dataSource function", async () => {
    class Service {
      private readonly _sql = sql;

      @atomic({ dataSource: (instance: any) => instance._sql })
      async createUser(): Promise<void> {
        await this._sql
          .from(UserWithoutPk)
          .insert({ ...UserFactory.getCommonUserData() });
      }
    }

    const service = new Service();
    await service.createUser();

    const users = await sql.from(UserWithoutPk).many();
    expect(users.length).toBe(1);
  });

  test("Should resolve dataSource as direct SqlDataSource instance", async () => {
    class Service {
      @atomic({ dataSource: sql })
      async createUser(): Promise<void> {
        await sql
          .from(UserWithoutPk)
          .insert({ ...UserFactory.getCommonUserData() });
      }
    }

    const service = new Service();
    await service.createUser();

    const users = await sql.from(UserWithoutPk).many();
    expect(users.length).toBe(1);
  });

  test("Should use atomic.sqlDataSource global default when no instance property matches", async () => {
    atomic.sqlDataSource = sql;

    class Service {
      @atomic()
      async createUser(): Promise<void> {
        await sql
          .from(UserWithoutPk)
          .insert({ ...UserFactory.getCommonUserData() });
      }
    }

    const service = new Service();
    await service.createUser();

    const users = await sql.from(UserWithoutPk).many();
    expect(users.length).toBe(1);

    atomic.sqlDataSource = undefined;
  });

  test("Should use atomic.sqlDataSource and auto-propagate via CLS when class has no sql property", async () => {
    atomic.sqlDataSource = sql;

    class Service {
      @atomic()
      async createUser(): Promise<void> {
        await sql
          .from(UserWithoutPk)
          .insert({ ...UserFactory.getCommonUserData() });
      }
    }

    const service = new Service();
    await service.createUser();

    const users = await sql.from(UserWithoutPk).many();
    expect(users.length).toBe(1);

    atomic.sqlDataSource = undefined;
  });

  test("Should fallback to this.sql when atomic.sqlDataSource is undefined", async () => {
    atomic.sqlDataSource = undefined;

    class Service {
      sql = sql;

      @atomic()
      async createUser(): Promise<void> {
        await this.sql
          .from(UserWithoutPk)
          .insert({ ...UserFactory.getCommonUserData() });
      }
    }

    const service = new Service();
    await service.createUser();

    const users = await sql.from(UserWithoutPk).many();
    expect(users.length).toBe(1);
  });

  testSkipSQLite(
    "Should respect isolationLevel option on atomic decorator",
    async () => {
      class Service {
        sql = sql;

        @atomic({ isolationLevel: "SERIALIZABLE" })
        async createUser(): Promise<void> {
          await this.sql
            .from(UserWithoutPk)
            .insert({ ...UserFactory.getCommonUserData() });
        }
      }

      const service = new Service();
      await service.createUser();

      const users = await sql.from(UserWithoutPk).many();
      expect(users.length).toBe(1);
    },
  );

  test("Should propagate return value from decorated method", async () => {
    class Service {
      sql = sql;

      @atomic()
      async createUser(): Promise<string> {
        await this.sql
          .from(UserWithoutPk)
          .insert({ ...UserFactory.getCommonUserData() });
        return "success";
      }
    }

    const service = new Service();
    const result = await service.createUser();
    expect(result).toBe("success");

    const users = await sql.from(UserWithoutPk).many();
    expect(users.length).toBe(1);
  });

  test("Should accept arguments and forward them to decorated method", async () => {
    class Service {
      sql = sql;

      @atomic()
      async createUser(email: string, name: string): Promise<void> {
        await this.sql.from(UserWithoutPk).insert({ email, name, age: 30 });
      }
    }

    const service = new Service();
    await service.createUser("arg@test.com", "Arg User");

    const users = await sql.from(UserWithoutPk).many();
    expect(users.length).toBe(1);
    expect(users[0].email).toBe("arg@test.com");
    expect(users[0].name).toBe("Arg User");
  });

  testSkipSQLite(
    "Should handle nested atomic calls as savepoints",
    async () => {
      class InnerService {
        sql = sql;

        @atomic()
        async createInner(): Promise<void> {
          await this.sql.from(UserWithoutPk).insert({
            ...UserFactory.getCommonUserData(),
            email: "inner@test.com",
          });
        }
      }

      class OuterService {
        sql = sql;
        inner = new InnerService();

        @atomic()
        async createOuter(): Promise<void> {
          await this.sql.from(UserWithoutPk).insert({
            ...UserFactory.getCommonUserData(),
            email: "outer@test.com",
          });
          await this.inner.createInner();
        }
      }

      const service = new OuterService();
      await service.createOuter();

      const users = await sql.from(UserWithoutPk).many();
      expect(users.length).toBe(2);
    },
  );

  test("Should throw when dataSource property is missing and atomic.sqlDataSource is unset", async () => {
    atomic.sqlDataSource = undefined;

    class Service {
      @atomic()
      async createUser(): Promise<void> {
        // unreachable
      }
    }

    const service = new Service();
    await expect(service.createUser()).rejects.toThrow(HysteriaError);
    await expect(service.createUser()).rejects.toMatchObject({
      code: "ATOMIC_DATASOURCE_RESOLUTION_FAILED",
    });
  });

  test("Should throw when custom dataSource property does not resolve to SqlDataSource", async () => {
    class Service {
      db = "not-a-datasource";

      @atomic({ dataSource: "db" })
      async createUser(): Promise<void> {
        // unreachable
      }
    }

    const service = new Service();
    await expect(service.createUser()).rejects.toThrow(HysteriaError);
    await expect(service.createUser()).rejects.toMatchObject({
      code: "ATOMIC_DATASOURCE_RESOLUTION_FAILED",
    });
  });

  test("Should support legacy string overload for dataSource property", async () => {
    class Service {
      db = sql;

      @atomic("db")
      async createUser(): Promise<void> {
        await this.db
          .from(UserWithoutPk)
          .insert({ ...UserFactory.getCommonUserData() });
      }
    }

    const service = new Service();
    await service.createUser();

    const users = await sql.from(UserWithoutPk).many();
    expect(users.length).toBe(1);
  });

  testSkipSQLite(
    "Should support legacy string overload with isolationLevel",
    async () => {
      class Service {
        db = sql;

        @atomic("db", "READ COMMITTED")
        async createUser(): Promise<void> {
          await this.db
            .from(UserWithoutPk)
            .insert({ ...UserFactory.getCommonUserData() });
        }
      }

      const service = new Service();
      await service.createUser();

      const users = await sql.from(UserWithoutPk).many();
      expect(users.length).toBe(1);
    },
  );

  test("Should throw when SqlDataSource has clsEnabled false", async () => {
    const sqlNoCls = new SqlDataSource({
      ...(sql.inputDetails as any),
      clsEnabled: false,
    } as any);
    await sqlNoCls.connect();

    class Service {
      sql = sqlNoCls;

      @atomic()
      async createUser(): Promise<void> {
        await this.sql
          .from(UserWithoutPk)
          .insert({ ...UserFactory.getCommonUserData() });
      }
    }

    const service = new Service();
    await expect(service.createUser()).rejects.toThrow(HysteriaError);
    await expect(service.createUser()).rejects.toMatchObject({
      code: "ATOMIC_CLS_DISABLED",
    });

    await sqlNoCls.disconnect();
  });
});
