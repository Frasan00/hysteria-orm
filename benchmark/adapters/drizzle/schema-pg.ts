import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const benchUsers = pgTable("bench_users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const benchPosts = pgTable("bench_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const benchAddresses = pgTable("bench_addresses", {
  id: serial("id").primaryKey(),
  street: varchar("street", { length: 255 }).notNull(),
  city: varchar("city", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const benchUserAddresses = pgTable("bench_user_addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  addressId: integer("address_id").notNull(),
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

export type DrizzlePgSchema = {
  benchUsers: typeof benchUsers;
  benchPosts: typeof benchPosts;
  benchAddresses: typeof benchAddresses;
  benchUserAddresses: typeof benchUserAddresses;
  benchUsersRelations: typeof benchUsersRelations;
  benchPostsRelations: typeof benchPostsRelations;
  benchAddressesRelations: typeof benchAddressesRelations;
  benchUserAddressesRelations: typeof benchUserAddressesRelations;
};
