import { faker } from "@faker-js/faker";
import { PostWithBigint } from "../bigint/post_bigint";
import { PostWithUuid } from "../uuid/post_uuid";
import { FactoryReturnType } from "./factory_types";

export class PostFactory {
  static async postWithBigint<T extends number>(
    userId: number,
    howMany: T,
  ): Promise<FactoryReturnType<T, PostWithBigint>> {
    const postData = PostFactory.getCommonPostData();
    if (howMany === 1) {
      return PostWithBigint.insert({
        ...postData,
        userId,
      }) as Promise<FactoryReturnType<T, PostWithBigint>>;
    }

    const array = Array.from({ length: howMany });
    return PostWithBigint.insertMany(
      array.map(() => ({
        ...postData,
        userId,
      })),
    ) as Promise<FactoryReturnType<T, PostWithBigint>>;
  }

  static async postWithUuid<T extends number>(
    userId: string,
    howMany: T,
  ): Promise<FactoryReturnType<T, PostWithUuid>> {
    const postData = PostFactory.getCommonPostData();
    if (howMany === 1) {
      return PostWithUuid.insert({ ...postData, userId }) as Promise<
        FactoryReturnType<T, PostWithUuid>
      >;
    }

    const array = Array.from({ length: howMany });
    return PostWithUuid.insertMany(
      array.map(() => ({
        ...postData,
        userId,
      })),
    ) as Promise<FactoryReturnType<T, PostWithUuid>>;
  }

  static getCommonPostData(): Record<string, string> {
    return {
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraph(),
      shortDescription: faker.lorem.sentence(),
    };
  }
}
