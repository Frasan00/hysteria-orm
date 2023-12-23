# Hysteria-orm

- Hysteria ORM is a simple ORM for node.js built with typescript.
- This ORM allows you to create models and use them to interact with your database.
- For now, only MySQL is supported, but more databases will be supported in the future.

## Software Requirements

- Node.js
- Compatible Database (Mysql)

## Configuration Requirements

- *IMPORTANT* must set "useDefineForClassFields": true, in tsconfig.json in order for the ORM to work!

### Code Examples

- Create a connection

```typescript
import { MysqlDatasource } from "hysteria-orm";

const mysqlConfig = {
    type: 'mysql',
    host: MYSQL_HOST,
    port: MYSQL_PORT,
    username: MYSQL_USERNAME,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    logs: true, // query-logs (optional) - default: false
}

const datasource = new MysqlDatasource(mysqlConfig)
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
        * Table name and primary key are not required.
        * If you don't set the table name, the ORM will use the class name for the table name.
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

- Create, Update and Delete (Optional transaction)

```typescript
import {MysqlDatasource} from "hysteria-orm";
import {mysqlConfig} from "path/to/mysqlConfig";
import { User } from "./models/User";

const datasource = new MysqlDatasource(mysqlConfig)
const userManager = datasource.getModelManager(User);

await userManager.startTransaction();
// Create
try{
    const user = new User();
    user.name = "John Doe";
    user.email = "john@gmail.com";
    const newUser: User = await userManager.save(user);

// Update
    newUser.name = "John Doe Updated";
    const updatedUser = await userManager.update(newUser);

// Delete
    await userManager.delete(updatedUser);
    await userManager.deleteByColumn("email", "john@gmail.com");

    await userManager.commitTransaction();  
} catch (error) {
    await userManager.rollbackTransaction();
    throw new Error(error);
}
```

- Read (standard methods)

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

// Get by ID
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
import {MysqlDatasource} from "hysteria-orm";
import {mysqlConfig} from "path/to/mysqlConfig";
import { User } from "./models/User";

const datasource = new MysqlDatasource(mysqlConfig)
const userManager = datasource.getModelManager(User);

const queryBuilder = userManager.queryBuilder();
const user: User | null = await queryBuilder
    .where("name", "John Doe")
    .andWhere("email", "john@gmail.com")
    .first();

const users: User[] = await queryBuilder
    .where("name", "John Doe")
    .andWhere("email", "john@gmail.com")
    .orderBy("name", "ASC")
    .limit(10)
    .many();
```


# Under Development
- *Migrations* (advised raw queries since alter table is still under development and may not work as expected)

#### You can use hysteria create:migration {migrationName} to create a migration file

- Create a migration

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

- Raw Migration

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

- Run migrations

```typescript
await datasource.connect();
const migrationController = await datasource.getMigrationController(true); // logs (optional) - default: false
await migrationController.run();
```