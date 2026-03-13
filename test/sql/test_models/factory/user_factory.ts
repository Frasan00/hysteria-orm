import { faker } from "@faker-js/faker";
import { ModelQueryResult } from "../../../../src/sql/models/model_types";
import { SqlDataSource } from "../../../../src/sql/sql_data_source";
import { UserWithBigint } from "../bigint/user_bigint";
import { UserWithUuid } from "../uuid/user_uuid";
import { UserWithoutPk } from "../without_pk/user_without_pk";

export enum UserStatus {
  active = "active",
  inactive = "inactive",
}

type UserWithoutPkInstance = InstanceType<typeof UserWithoutPk>;
type UserWithUuidInstance = InstanceType<typeof UserWithUuid>;
type UserWithBigintInstance = InstanceType<typeof UserWithBigint>;

export class UserFactory {
  static async userWithoutPk(
    sql: SqlDataSource,
    howMany: 1,
    status?: UserStatus,
    isActive?: boolean,
    jsonData?: Record<string, any>,
  ): Promise<ModelQueryResult<UserWithoutPkInstance>>;
  static async userWithoutPk(
    sql: SqlDataSource,
    howMany: number,
    status?: UserStatus,
    isActive?: boolean,
    jsonData?: Record<string, any>,
  ): Promise<ModelQueryResult<UserWithoutPkInstance>[]>;
  static async userWithoutPk(
    sql: SqlDataSource,
    howMany: number,
    status: UserStatus = UserStatus.active,
    isActive: boolean = true,
    jsonData: Record<string, any> = { test: "test" },
  ) {
    const userData = UserFactory.getCommonUserData(status, isActive, jsonData);
    if (howMany === 1) {
      return await sql.from(UserWithoutPk).insert(userData, {
        returning: ["*"],
      });
    }

    const array = Array.from({ length: howMany });
    return await sql.from(UserWithoutPk).insertMany(
      array.map(() => ({
        ...userData,
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
      })),
      { returning: ["*"] },
    );
  }

  static async userWithUuid(
    sql: SqlDataSource,
    howMany: 1,
    status?: UserStatus,
    isActive?: boolean,
    jsonData?: Record<string, any>,
  ): Promise<ModelQueryResult<UserWithUuidInstance>>;
  static async userWithUuid(
    sql: SqlDataSource,
    howMany: number,
    status?: UserStatus,
    isActive?: boolean,
    jsonData?: Record<string, any>,
  ): Promise<ModelQueryResult<UserWithUuidInstance>[]>;
  static async userWithUuid(
    sql: SqlDataSource,
    howMany: number,
    status: UserStatus = UserStatus.active,
    isActive: boolean = true,
    jsonData: Record<string, any> = { test: "test" },
  ) {
    const userData = UserFactory.getCommonUserData(status, isActive, jsonData);
    if (howMany === 1) {
      return await sql.from(UserWithUuid).insert(userData, {
        returning: ["*"],
      });
    }

    const array = Array.from({ length: howMany });
    return await sql.from(UserWithUuid).insertMany(
      array.map(() => ({
        ...userData,
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
      })),
      { returning: ["*"] },
    );
  }

  static async userWithBigint(
    sql: SqlDataSource,
    howMany: 1,
    status?: UserStatus,
    isActive?: boolean,
    jsonData?: Record<string, any>,
  ): Promise<ModelQueryResult<UserWithBigintInstance>>;
  static async userWithBigint(
    sql: SqlDataSource,
    howMany: number,
    status?: UserStatus,
    isActive?: boolean,
    jsonData?: Record<string, any>,
  ): Promise<ModelQueryResult<UserWithBigintInstance>[]>;
  static async userWithBigint(
    sql: SqlDataSource,
    howMany: number,
    status: UserStatus = UserStatus.active,
    isActive: boolean = true,
    jsonData: Record<string, any> = { test: "test" },
  ) {
    const userData = UserFactory.getCommonUserData(status, isActive, jsonData);
    if (howMany === 1) {
      return await sql.from(UserWithBigint).insert(userData, {
        returning: ["*"],
      });
    }

    const array = Array.from({ length: howMany });
    return await sql.from(UserWithBigint).insertMany(
      array.map(() => ({
        ...userData,
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
      })),
      { returning: ["*"] },
    );
  }

  static getCommonUserData(
    status: UserStatus = UserStatus.active,
    isActive: boolean = true,
    jsonData: Record<string, any> = { test: "test" },
  ) {
    return {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      json: jsonData,
      isActive,
      status,
      age: faker.number.int({ min: 18, max: 65 }),
      salary: faker.number.int({ min: 1000, max: 100000 }),
      gender: "1",
      height: faker.number.int({ min: 150, max: 200 }),
      weight: faker.number.int({ min: 50, max: 100 }),
      description: faker.lorem.paragraph(),
      shortDescription: faker.lorem.sentence(),
      birthDate: faker.date.birthdate(),
    };
  }
}
