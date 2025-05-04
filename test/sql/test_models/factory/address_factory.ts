import { faker } from "@faker-js/faker";
import { AddressWithBigint } from "../bigint/address_bigint";
import { AddressWithUuid } from "../uuid/address_uuid";
import { FactoryReturnType } from "./factory_types";

export class AddressFactory {
  static async addressWithBigint<T extends number>(
    howMany: T,
  ): Promise<FactoryReturnType<T, AddressWithBigint>> {
    const addressData = AddressFactory.getCommonAddressData();
    if (howMany === 1) {
      return AddressWithBigint.insert(addressData) as Promise<
        FactoryReturnType<T, AddressWithBigint>
      >;
    }

    const array = Array.from({ length: howMany });
    return AddressWithBigint.insertMany(
      array.map(() => ({
        ...addressData,
      })),
    ) as Promise<FactoryReturnType<T, AddressWithBigint>>;
  }

  static async addressWithUuid<T extends number>(
    howMany: T,
  ): Promise<FactoryReturnType<T, AddressWithUuid>> {
    const addressData = AddressFactory.getCommonAddressData();
    if (howMany === 1) {
      return AddressWithUuid.insert(addressData) as Promise<
        FactoryReturnType<T, AddressWithUuid>
      >;
    }

    const array = Array.from({ length: howMany });
    return AddressWithUuid.insertMany(
      array.map(() => ({
        ...addressData,
      })),
    ) as Promise<FactoryReturnType<T, AddressWithUuid>>;
  }

  static getCommonAddressData(): {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  } {
    return {
      street: faker.location.street(),
      city: faker.location.city(),
      state: faker.location.state(),
      zip: faker.location.zipCode(),
      country: faker.location.country(),
    };
  }
}
