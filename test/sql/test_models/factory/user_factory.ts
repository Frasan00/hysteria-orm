import { faker } from "@faker-js/faker";
import { UserStatus, UserWithoutPk } from "../without_pk/user_without_pk";
import { FactoryReturnType } from "./factory_types";

export class UserFactory {
  static async userWithoutPk<T extends number>(
    howMany: T,
    status: UserStatus = UserStatus.active,
    isActive: boolean = true,
    jsonData: Record<string, any> = { test: "test" },
  ): Promise<FactoryReturnType<T, UserWithoutPk>> {
    const userData = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      json: jsonData,
      isActive,
      status,
    };

    if (howMany === 1) {
      return UserWithoutPk.insert(userData) as FactoryReturnType<
        T,
        UserWithoutPk
      >;
    }

    const array = Array.from({ length: howMany });
    return Promise.all(
      array.map(() =>
        UserWithoutPk.insert({
          ...userData,
          name: faker.person.fullName(),
          email: faker.internet.email(),
          password: faker.internet.password(),
        }),
      ),
    ) as FactoryReturnType<T, UserWithoutPk>;
  }
}
