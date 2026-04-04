import {
  col,
  createSchema,
  defineModel,
  defineRelations,
} from "../../../src/sql/models/define_model";

const _BenchUser = defineModel("bench_users", {
  columns: {
    id: col.integer({ primaryKey: true }),
    name: col.string(),
    email: col.string(),
    createdAt: col.datetime({ autoCreate: true }),
  },
});

const _BenchPost = defineModel("bench_posts", {
  columns: {
    id: col.integer({ primaryKey: true }),
    userId: col.integer(),
    title: col.string(),
    content: col.string(),
    createdAt: col.datetime({ autoCreate: true }),
  },
});

const _BenchAddress = defineModel("bench_addresses", {
  columns: {
    id: col.integer({ primaryKey: true }),
    street: col.string(),
    city: col.string(),
    createdAt: col.datetime({ autoCreate: true }),
  },
});

const _BenchUserAddress = defineModel("bench_user_addresses", {
  columns: {
    id: col.integer({ primaryKey: true }),
    userId: col.integer(),
    addressId: col.integer(),
  },
});

const UserRelations = defineRelations(
  _BenchUser,
  ({ hasOne, hasMany, manyToMany }) => ({
    post: hasOne(_BenchPost, { foreignKey: "userId" }),
    posts: hasMany(_BenchPost, { foreignKey: "userId" }),
    addresses: manyToMany(_BenchAddress, {
      through: _BenchUserAddress,
      leftForeignKey: "userId",
      rightForeignKey: "addressId",
    }),
  }),
);

const PostRelations = defineRelations(_BenchPost, ({ belongsTo }) => ({
  user: belongsTo(_BenchUser, { foreignKey: "userId" }),
}));

const AddressRelations = defineRelations(_BenchAddress, ({ manyToMany }) => ({
  users: manyToMany(_BenchUser, {
    through: _BenchUserAddress,
    leftForeignKey: "addressId",
    rightForeignKey: "userId",
  }),
}));

const schema = createSchema(
  {
    bench_users: _BenchUser,
    bench_posts: _BenchPost,
    bench_addresses: _BenchAddress,
    bench_user_addresses: _BenchUserAddress,
  },
  {
    bench_users: UserRelations,
    bench_posts: PostRelations,
    bench_addresses: AddressRelations,
  },
);

export const BenchUser = schema.bench_users;
export const BenchPost = schema.bench_posts;
export const BenchAddress = schema.bench_addresses;
export const BenchUserAddress = _BenchUserAddress;
