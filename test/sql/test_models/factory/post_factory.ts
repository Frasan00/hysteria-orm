import { faker } from "@faker-js/faker";
import { UserStatus } from "../without_pk/user_without_pk";
import { FactoryReturnType } from "./factory_types";
import { UserFactory } from "./user_factory";
import { PostWithUuid } from "../uuid/post_uuid";
import { PostWithBigint } from "../bigint/post_bigint";

export class PostFactory {
  static async postWithBigint<T extends number>(
    howMany: T,
    status: UserStatus = UserStatus.active,
    isActive: boolean = true,
    jsonData: Record<string, any> = { test: "test" },
  ): Promise<FactoryReturnType<T, PostWithBigint>> {
    const userData = UserFactory.getCommonUserData(status, isActive, jsonData);
    if (howMany === 1) {
      return PostWithBigint.insert(userData) as FactoryReturnType<
        T,
        PostWithBigint
      >;
    }

    const array = Array.from({ length: howMany });
    return PostWithBigint.insertMany(
      array.map(() => ({
        ...userData,
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
      })),
    ) as FactoryReturnType<T, PostWithBigint>;
  }

  static async postWithUuid<T extends number>(
    howMany: T,
    status: UserStatus = UserStatus.active,
    isActive: boolean = true,
    jsonData: Record<string, any> = { test: "test" },
  ): Promise<FactoryReturnType<T, PostWithUuid>> {
    const userData = UserFactory.getCommonUserData(status, isActive, jsonData);
    if (howMany === 1) {
      return PostWithUuid.insert(userData) as FactoryReturnType<
        T,
        PostWithUuid
      >;
    }

    const array = Array.from({ length: howMany });
    return PostWithUuid.insertMany(
      array.map(() => ({
        ...userData,
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
      })),
    ) as FactoryReturnType<T, PostWithUuid>;
  }

  static getCommonPostData(): Partial<PostWithUuid> {
    return {
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraph(),
      shortDescription: faker.lorem.sentence(),
    };
  }
}
