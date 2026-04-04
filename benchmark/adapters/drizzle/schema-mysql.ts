import {
  mysqlTable,
  int,
  varchar,
  text,
  timestamp,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

export const benchUsers = mysqlTable("bench_users", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const benchPosts = mysqlTable("bench_posts", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const benchAddresses = mysqlTable("bench_addresses", {
  id: int("id").primaryKey().autoincrement(),
  street: varchar("street", { length: 255 }).notNull(),
  city: varchar("city", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const benchUserAddresses = mysqlTable("bench_user_addresses", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  addressId: int("address_id").notNull(),
});

export const benchUsersRelations = relations(benchUsers, ({ many }) => ({
  posts: many(benchPosts),
  userAddresses: many(benchUserAddresses),
}));

export const benchPostsRelations = relations(benchPosts, ({ one }) => ({
  user: one(benchUsers, {
    fields: [benchPosts.userId],
    references: [benchUsers.id],
  }),
}));

export const benchAddressesRelations = relations(
  benchAddresses,
  ({ many }) => ({
    userAddresses: many(benchUserAddresses),
  }),
);

export const benchUserAddressesRelations = relations(
  benchUserAddresses,
  ({ one }) => ({
    user: one(benchUsers, {
      fields: [benchUserAddresses.userId],
      references: [benchUsers.id],
    }),
    address: one(benchAddresses, {
      fields: [benchUserAddresses.addressId],
      references: [benchAddresses.id],
    }),
  }),
);

export type DrizzleMysqlSchema = {
  benchUsers: typeof benchUsers;
  benchPosts: typeof benchPosts;
  benchAddresses: typeof benchAddresses;
  benchUserAddresses: typeof benchUserAddresses;
  benchUsersRelations: typeof benchUsersRelations;
  benchPostsRelations: typeof benchPostsRelations;
  benchAddressesRelations: typeof benchAddressesRelations;
  benchUserAddressesRelations: typeof benchUserAddressesRelations;
};
