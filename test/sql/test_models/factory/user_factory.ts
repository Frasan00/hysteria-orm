import { faker } from "@faker-js/faker";
import { UserWithBigint } from "../bigint/user_bigint";
import { UserWithUuid } from "../uuid/user_uuid";
import { UserStatus, UserWithoutPk } from "../without_pk/user_without_pk";
import { FactoryReturnType } from "./factory_types";

export class UserFactory {
  static async userWithoutPk<T extends number>(
    howMany: T,
    status: UserStatus = UserStatus.active,
    isActive: boolean = true,
    jsonData: Record<string, any> = { test: "test" },
  ): Promise<FactoryReturnType<T, UserWithoutPk>> {
    const userData = UserFactory.getCommonUserData(status, isActive, jsonData);
    if (howMany === 1) {
      return (await UserWithoutPk.insert(userData)) as FactoryReturnType<
        T,
        UserWithoutPk
      >;
    }

    const array = Array.from({ length: howMany });
    return (await UserWithoutPk.insertMany(
      array.map(() => ({
        ...userData,
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
      })),
    )) as FactoryReturnType<T, UserWithoutPk>;
  }

  static async userWithUuid<T extends number>(
    howMany: T,
    status: UserStatus = UserStatus.active,
    isActive: boolean = true,
    jsonData: Record<string, any> = { test: "test" },
  ): Promise<FactoryReturnType<T, UserWithUuid>> {
    const userData = UserFactory.getCommonUserData(status, isActive, jsonData);
    if (howMany === 1) {
      return (await UserWithUuid.insert(userData)) as FactoryReturnType<
        T,
        UserWithUuid
      >;
    }

    const array = Array.from({ length: howMany });
    return (await UserWithUuid.insertMany(
      array.map(() => ({
        ...userData,
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
      })),
    )) as FactoryReturnType<T, UserWithUuid>;
  }

  static async userWithBigint<T extends number>(
    howMany: T,
    status: UserStatus = UserStatus.active,
    isActive: boolean = true,
    jsonData: Record<string, any> = { test: "test" },
  ): Promise<FactoryReturnType<T, UserWithBigint>> {
    const userData = UserFactory.getCommonUserData(status, isActive, jsonData);
    if (howMany === 1) {
      return (await UserWithBigint.insert(userData)) as FactoryReturnType<
        T,
        UserWithBigint
      >;
    }

    const array = Array.from({ length: howMany });
    return (await UserWithBigint.insertMany(
      array.map(() => ({
        ...userData,
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
      })),
    )) as FactoryReturnType<T, UserWithBigint>;
  }

  static getCommonUserData(
    status: UserStatus = UserStatus.active,
    isActive: boolean = true,
    jsonData: Record<string, any> = { test: "test" },
  ): Partial<UserWithoutPk> {
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
