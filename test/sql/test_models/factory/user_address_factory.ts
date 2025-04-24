import { UserAddressWithBigint } from "../bigint/user_address_bigint";
import { UserAddressWithUuid } from "../uuid/user_address_uuid";
import { FactoryReturnType } from "./factory_types";

export class UserAddressFactory {
  static async userAddressWithUuid<T extends number>(
    howMany: T,
    userId: string,
    addressId: string,
  ): Promise<FactoryReturnType<T, UserAddressWithUuid>> {
    if (howMany === 1) {
      return UserAddressWithUuid.insert({
        userId,
        addressId,
      }) as Promise<FactoryReturnType<T, UserAddressWithUuid>>;
    }

    const array = Array.from({ length: howMany });
    return UserAddressWithUuid.insertMany(
      array.map(() => ({
        userId,
        addressId,
      })),
    ) as Promise<FactoryReturnType<T, UserAddressWithUuid>>;
  }

  static async userAddressWithBigint<T extends number>(
    howMany: T,
    userId: number,
    addressId: number,
  ): Promise<FactoryReturnType<T, UserAddressWithBigint>> {
    if (howMany === 1) {
      return UserAddressWithBigint.insert({
        userId,
        addressId,
      }) as Promise<FactoryReturnType<T, UserAddressWithBigint>>;
    }

    const array = Array.from({ length: howMany });
    return UserAddressWithBigint.insertMany(
      array.map(() => ({
        userId,
        addressId,
      })),
    ) as Promise<FactoryReturnType<T, UserAddressWithBigint>>;
  }
}
