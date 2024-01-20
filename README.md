# Hysteria-orm

- Hysteria is an ORM for javascript/typescript that allows you to create models and use them to interact with your database in a more direct and simple way.
- For now it supports MySQL and Postgres.

## Software Requirements

- Javascript Runtime environment (es. nodejs)
- SQL library as dependency (es. mysql2, pg based on your Database)

## Configuration Requirements

- *IMPORTANT* if using typescript, must set *"useDefineForClassFields": true* in tsconfig.json in order for the ORM to work!

## Envs
- MIGRATION_PATH - default: database/migrations - value [path/to/migration/folder]
- DATABASE_TYPE - default: mysql - value [mysql, postgres]

### Code Examples

- Create a connection

```typescript
import { MysqlDatasource, DatasourceInput } from "hysteria-orm";

const mysqlConfig: DatasourceInput = {
    type: 'mysql' | 'postgres',
    host: HOST,
    port: PORT,
    username: USERNAME,
    password: PASSWORD,
    database: DATABASE,
    logs: true, // query-logs (optional) - default: false
}

const datasource = new SqlDatasource(mysqlConfig)
await datasource.connect()
```

- Create a model

```typescript
import { Model } from "hysteria-orm";
export class User extends Model {
    public id!: number;
    public name!: string;
    public email!: string;
    
    constructor() {
        /*
        * Table name and primary key are optional.
        * If you don't set them, the table name will be the class name and the model won't have a primary key.
        */
        super('User', 'id');
    }
}
```

- Create a model with relationships

```typescript
import {Model, HasOne, HasMany} from "hysteria-orm";
import {Profile} from "./Profile";
import {Post} from "./Post";

export class User extends Model {
    public id!: number;
    public name!: string;
    public email!: string;
    // Relations take as params (TableName, foreignKey)
    public profile: Profile | HasOne = new HasOne("Profile", "userId");
    public posts: Post[] | HasMany = new HasMany("Post", "userId");

    constructor() {
        super('User', 'id');
    }
}
```

- Create, Update and Delete (with transaction)

```typescript
import { User } from "./models/User";

// Transaction is optional in all those methods
const trx = userManager.createTransaction()
// Create
try{
    await trx.start();
    const user = new User();
    user.name = "John Doe";
    user.email = "john@gmail.com";
    const newUser: User = await userManager.save(user, trx);

// Update
    newUser.name = "John Doe Updated";
    const updatedUser = await userManager.update(newUser, trx);

// Delete
    await userManager.delete(updatedUser, trx);
    await userManager.deleteByColumn("email", "john@gmail.com");

    await trx.commit();
} catch (error) {
    await trx.rollback();
    throw new Error(error);
}
```

- Read (standard methods used for simple queries)

```typescript
import {MysqlDatasource} from "hysteria-orm";
import {mysqlConfig} from "path/to/mysqlConfig";
import { User } from "./models/User";

const datasource = new MysqlDatasource(mysqlConfig)
const userManager = datasource.getModelManager(User);

// Get all
const users: User[] = await userManager.find();

// Get with optional parameters
const filteredUsers: User[] = await userManager.find({
    relations: ["profile"],
    where: {
        name: "John Doe"
    },
    orderBy: {
        name: "ASC"
    },
    limit: 10,
    offset: 0
});

// Get by id requires the `id` property to exist on the model in order to work
const user: User | null = await userManager.findOneById(5);

// Get One
const otherUser: User | null = await userManager.findOne({
    where: {
        id: 1,
        name: "John Doe"
    }
});
```

- Query Builder
- It's used to create more complex queries that are not supported by the standard methods

```typescript
import { User } from "./models/User";

const queryBuilder = userManager.queryBuilder();
const user: User | null = await queryBuilder
    .select(['id'])
    .addRelations(['post'])
    .where("name", "John Doe")
    .andWhere("email", "john@gmail.com")
    .one();

const users: User[] = await queryBuilder
    .where("name", "John Doe")
    .andWhere("email", "john@gmail.com")
    .orderBy("name", "ASC")
    .limit(10)
    .many();
```


# Under Development
- *Migrations* (advised raw queries and create table only since `alter table` is still under development and may not work as expected)
- Environment variable *MIGRATION_PATH*, default if not set: "database/migrations"

Create a migration (hysteria create:migration {migrationName})

```typescript
import {Migration} from "hysteria-orm";

export default class extends Migration {
    public up(): void {
        // useTable allows you to target a specific Table in your database in order to create, alter or drop
        this.useTable("User", "create")

        this.table.column().bigInt("id").primary().autoIncrement().commit();
        this.table.column().string("name").notNullable().commit();
    }

    public down(): void {
        this.useTable("User", "drop")
        this.table.drop();
    }
}
```

Raw Migration

```typescript
import {Migration} from "hysteria-orm";

export default class extends Migration {
    public up(): void {
        this.useRawQuery('YOUR RAW QUERY HERE');
    }

    public down(): void {
        this.useRawQuery('YOUR RAW QUERY HERE');
    }
}
```

- hysteria cli for Migrations

1) npm run | yarn create:migration {migrationName}
2) npm run | yarn run:migrations
3) npm run | yarn rollback:migrations