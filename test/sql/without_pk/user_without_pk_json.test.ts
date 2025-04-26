import { HysteriaError } from "../../../src/errors/hysteria_error";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { env } from "../../../src/env/env";
import { UserStatus } from "../test_models/bigint/user_bigint";
import { UserFactory } from "../test_models/factory/user_factory";
import { UserWithoutPk } from "../test_models/without_pk/user_without_pk";

beforeAll(async () => {
  await SqlDataSource.connect();
});

afterAll(async () => {
  await SqlDataSource.disconnect();
});

beforeEach(async () => {
  await SqlDataSource.startGlobalTransaction();
});

afterEach(async () => {
  await SqlDataSource.rollbackGlobalTransaction();
});

describe(`[${env.DB_TYPE}] Basic Cruds`, () => {
  test("should create and update a user with a json property and then retrieve a nested property", async () => {
    const user = await UserWithoutPk.insert({
      ...UserFactory.getCommonUserData(),
      json: {
        name: "John Doe",
        age: 30,
        a: [
          {
            b: 2,
          },
        ],
      },
    });

    expect(user.json).toMatchObject({
      name: "John Doe",
      age: 30,
      a: [{ b: 2 }],
    });

    await UserWithoutPk.query().update({
      json: {
        ...user.json,
        a: [{ b: 3 }],
      },
    });

    const retrievedUser = await UserWithoutPk.findOne({
      where: {
        email: user.email,
      },
    });

    expect(retrievedUser?.json).toMatchObject({
      name: "John Doe",
      age: 30,
      a: [{ b: 3 }],
    });

    const retrievedUserByNestedProperty = await UserWithoutPk.query()
      .where("json", ">=", {
        json: {
          a: [
            {
              b: 3,
            },
          ],
        },
      })
      .first();

    expect(retrievedUserByNestedProperty).not.toBeNull();
  });
});
