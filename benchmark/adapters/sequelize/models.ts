import {
  DataTypes,
  Model,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  HasManyGetAssociationsMixin,
  HasOneGetAssociationMixin,
  BelongsToGetAssociationMixin,
  BelongsToManyGetAssociationsMixin,
  NonAttribute,
} from "sequelize";

export class BenchUser extends Model<
  InferAttributes<BenchUser>,
  InferCreationAttributes<BenchUser>
> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare email: string;
  declare createdAt: CreationOptional<Date>;

  declare getPosts: HasManyGetAssociationsMixin<BenchPost>;
  declare getPost: HasOneGetAssociationMixin<BenchPost>;
  declare getAddresses: BelongsToManyGetAssociationsMixin<BenchAddress>;

  declare post?: NonAttribute<BenchPost | null>;
  declare posts?: NonAttribute<BenchPost[]>;
  declare addresses?: NonAttribute<BenchAddress[]>;
}

export class BenchPost extends Model<
  InferAttributes<BenchPost>,
  InferCreationAttributes<BenchPost>
> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare title: string;
  declare content: string;
  declare createdAt: CreationOptional<Date>;

  declare getUser: BelongsToGetAssociationMixin<BenchUser>;

  declare user?: NonAttribute<BenchUser | null>;
}

export class BenchAddress extends Model<
  InferAttributes<BenchAddress>,
  InferCreationAttributes<BenchAddress>
> {
  declare id: CreationOptional<number>;
  declare street: string;
  declare city: string;
  declare createdAt: CreationOptional<Date>;

  declare users?: NonAttribute<BenchUser[]>;
}

export class BenchUserAddress extends Model<
  InferAttributes<BenchUserAddress>,
  InferCreationAttributes<BenchUserAddress>
> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare addressId: number;
}

export function initSequelizeModels(sequelize: Sequelize): {
  BenchUser: typeof BenchUser;
  BenchPost: typeof BenchPost;
  BenchAddress: typeof BenchAddress;
  BenchUserAddress: typeof BenchUserAddress;
} {
  BenchUser.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(255), allowNull: false },
      email: { type: DataTypes.STRING(255), allowNull: false },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: "created_at",
      },
    },
    { sequelize, tableName: "bench_users", timestamps: false },
  );

  BenchPost.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: { type: DataTypes.INTEGER, allowNull: false, field: "user_id" },
      title: { type: DataTypes.STRING(255), allowNull: false },
      content: { type: DataTypes.TEXT, allowNull: false },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: "created_at",
      },
    },
    { sequelize, tableName: "bench_posts", timestamps: false },
  );

  BenchAddress.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      street: { type: DataTypes.STRING(255), allowNull: false },
      city: { type: DataTypes.STRING(255), allowNull: false },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: "created_at",
      },
    },
    { sequelize, tableName: "bench_addresses", timestamps: false },
  );

  BenchUserAddress.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: { type: DataTypes.INTEGER, allowNull: false, field: "user_id" },
      addressId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "address_id",
      },
    },
    { sequelize, tableName: "bench_user_addresses", timestamps: false },
  );

  // Associations
  BenchUser.hasOne(BenchPost, { foreignKey: "user_id", as: "post" });
  BenchUser.hasMany(BenchPost, { foreignKey: "user_id", as: "posts" });
  BenchPost.belongsTo(BenchUser, { foreignKey: "user_id", as: "user" });

  BenchUser.belongsToMany(BenchAddress, {
    through: BenchUserAddress,
    foreignKey: "user_id",
    otherKey: "address_id",
    as: "addresses",
  });
  BenchAddress.belongsToMany(BenchUser, {
    through: BenchUserAddress,
    foreignKey: "address_id",
    otherKey: "user_id",
    as: "users",
  });

  return { BenchUser, BenchPost, BenchAddress, BenchUserAddress };
}
