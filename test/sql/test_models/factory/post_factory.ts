import { faker } from "@faker-js/faker";
import { FactoryReturnType } from "./factory_types";
import { PostWithUuid } from "../uuid/post_uuid";
import { PostWithBigint } from "../bigint/post_bigint";

export class PostFactory {
  static async postWithBigint<T extends number>(
    howMany: T,
  ): Promise<FactoryReturnType<T, PostWithBigint>> {
    const postData = PostFactory.getCommonPostData();
    if (howMany === 1) {
      return PostWithBigint.insert(postData) as FactoryReturnType<
        T,
        PostWithBigint
      >;
    }

    const array = Array.from({ length: howMany });
    return PostWithBigint.insertMany(
      array.map(() => ({
        ...postData,
      })),
    ) as FactoryReturnType<T, PostWithBigint>;
  }

  static async postWithUuid<T extends number>(
    howMany: T,
  ): Promise<FactoryReturnType<T, PostWithUuid>> {
    const postData = PostFactory.getCommonPostData();
    if (howMany === 1) {
      return PostWithUuid.insert(postData) as FactoryReturnType<
        T,
        PostWithUuid
      >;
    }

    const array = Array.from({ length: howMany });
    return PostWithUuid.insertMany(
      array.map(() => ({
        ...postData,
      })),
    ) as FactoryReturnType<T, PostWithUuid>;
  }

  static getCommonPostData(): Partial<Omit<PostWithUuid, "id">> {
    return {
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraph(),
      shortDescription: faker.lorem.sentence(),
    };
  }
}
