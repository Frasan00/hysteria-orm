import {
  createSchema,
  defineRelations,
} from "../../../../src/sql/models/define_model";
import { AddressWithBigint as _AddressWithBigint } from "./address_bigint";
import { PostWithBigint as _PostWithBigint } from "./post_bigint";
import { UserAddressWithBigint } from "./user_address_bigint";
import { UserWithBigint as _UserWithBigint } from "./user_bigint";
export { UserStatus } from "./user_bigint";

const UserRelations = defineRelations(
  _UserWithBigint,
  ({ hasOne, hasMany, manyToMany }) => ({
    post: hasOne(_PostWithBigint, { foreignKey: "userId" }),
    posts: hasMany(_PostWithBigint, { foreignKey: "userId" }),
    addresses: manyToMany(_AddressWithBigint, {
      through: UserAddressWithBigint,
      leftForeignKey: "userId",
      rightForeignKey: "addressId",
    }),
  }),
);

const PostRelations = defineRelations(_PostWithBigint, ({ belongsTo }) => ({
  user: belongsTo(_UserWithBigint, { foreignKey: "userId" }),
}));

const AddressRelations = defineRelations(
  _AddressWithBigint,
  ({ manyToMany }) => ({
    users: manyToMany(_UserWithBigint, {
      through: UserAddressWithBigint,
      leftForeignKey: "addressId",
      rightForeignKey: "userId",
    }),
  }),
);

const bigintSchema = createSchema(
  {
    users_with_bigint: _UserWithBigint,
    posts_with_bigint: _PostWithBigint,
    address_with_bigint: _AddressWithBigint,
    user_address_with_bigint: UserAddressWithBigint,
  },
  {
    users_with_bigint: UserRelations,
    posts_with_bigint: PostRelations,
    address_with_bigint: AddressRelations,
  },
);

export const UserWithBigint = bigintSchema.users_with_bigint;
export const PostWithBigint = bigintSchema.posts_with_bigint;
export const AddressWithBigint = bigintSchema.address_with_bigint;
export { UserAddressWithBigint } from "./user_address_bigint";
