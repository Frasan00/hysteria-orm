import {
  createSchema,
  defineRelations,
} from "../../../../src/sql/models/define_model";
import { AddressWithUuid as _AddressWithUuid } from "./address_uuid";
import { PostWithUuid as _PostWithUuid } from "./post_uuid";
import { UserAddressWithUuid } from "./user_address_uuid";
import { UserWithUuid as _UserWithUuid } from "./user_uuid";
export { UserStatus } from "./user_uuid";

const UserRelations = defineRelations(
  _UserWithUuid,
  ({ hasOne, hasMany, manyToMany }) => ({
    post: hasOne(_PostWithUuid, { foreignKey: "userId" }),
    posts: hasMany(_PostWithUuid, { foreignKey: "userId" }),
    addresses: manyToMany(_AddressWithUuid, {
      through: UserAddressWithUuid,
      leftForeignKey: "userId",
      rightForeignKey: "addressId",
    }),
  }),
);

const PostRelations = defineRelations(_PostWithUuid, ({ belongsTo }) => ({
  user: belongsTo(_UserWithUuid, { foreignKey: "userId" }),
}));

const AddressRelations = defineRelations(
  _AddressWithUuid,
  ({ manyToMany }) => ({
    users: manyToMany(_UserWithUuid, {
      through: UserAddressWithUuid,
      leftForeignKey: "addressId",
      rightForeignKey: "userId",
    }),
  }),
);

const uuidSchema = createSchema(
  {
    users_with_uuid: _UserWithUuid,
    posts_with_uuid: _PostWithUuid,
    address_with_uuid: _AddressWithUuid,
    user_address_with_uuid: UserAddressWithUuid,
  },
  {
    users_with_uuid: UserRelations,
    posts_with_uuid: PostRelations,
    address_with_uuid: AddressRelations,
  },
);

export const UserWithUuid = uuidSchema.users_with_uuid;
export const PostWithUuid = uuidSchema.posts_with_uuid;
export const AddressWithUuid = uuidSchema.address_with_uuid;
export { UserAddressWithUuid } from "./user_address_uuid";
