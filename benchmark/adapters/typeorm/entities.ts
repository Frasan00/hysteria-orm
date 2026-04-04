import { EntitySchema } from "typeorm";

export interface IBenchUser {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
  posts?: IBenchPost[];
  userAddresses?: IBenchUserAddress[];
}

export interface IBenchPost {
  id: number;
  userId: number;
  title: string;
  content: string;
  createdAt: Date;
  user?: IBenchUser;
}

export interface IBenchAddress {
  id: number;
  street: string;
  city: string;
  createdAt: Date;
  userAddresses?: IBenchUserAddress[];
}

export interface IBenchUserAddress {
  id: number;
  userId: number;
  addressId: number;
  user?: IBenchUser;
  address?: IBenchAddress;
}

export const BenchUserSchema = new EntitySchema<IBenchUser>({
  name: "BenchUser",
  tableName: "bench_users",
  columns: {
    id: { type: "int", primary: true, generated: "increment" },
    name: { type: "varchar", length: 255 },
    email: { type: "varchar", length: 255 },
    createdAt: { type: "timestamp", createDate: true, name: "created_at" },
  },
  relations: {
    posts: {
      target: "BenchPost",
      type: "one-to-many",
      inverseSide: "user",
    },
    userAddresses: {
      target: "BenchUserAddress",
      type: "one-to-many",
      inverseSide: "user",
    },
  },
});

export const BenchPostSchema = new EntitySchema<IBenchPost>({
  name: "BenchPost",
  tableName: "bench_posts",
  columns: {
    id: { type: "int", primary: true, generated: "increment" },
    userId: { type: "int", name: "user_id" },
    title: { type: "varchar", length: 255 },
    content: { type: "text" },
    createdAt: { type: "timestamp", createDate: true, name: "created_at" },
  },
  relations: {
    user: {
      target: "BenchUser",
      type: "many-to-one",
      joinColumn: { name: "user_id" },
      inverseSide: "posts",
    },
  },
});

export const BenchAddressSchema = new EntitySchema<IBenchAddress>({
  name: "BenchAddress",
  tableName: "bench_addresses",
  columns: {
    id: { type: "int", primary: true, generated: "increment" },
    street: { type: "varchar", length: 255 },
    city: { type: "varchar", length: 255 },
    createdAt: { type: "timestamp", createDate: true, name: "created_at" },
  },
  relations: {
    userAddresses: {
      target: "BenchUserAddress",
      type: "one-to-many",
      inverseSide: "address",
    },
  },
});

export const BenchUserAddressSchema = new EntitySchema<IBenchUserAddress>({
  name: "BenchUserAddress",
  tableName: "bench_user_addresses",
  columns: {
    id: { type: "int", primary: true, generated: "increment" },
    userId: { type: "int", name: "user_id" },
    addressId: { type: "int", name: "address_id" },
  },
  relations: {
    user: {
      target: "BenchUser",
      type: "many-to-one",
      joinColumn: { name: "user_id" },
      inverseSide: "userAddresses",
    },
    address: {
      target: "BenchAddress",
      type: "many-to-one",
      joinColumn: { name: "address_id" },
      inverseSide: "userAddresses",
    },
  },
});
