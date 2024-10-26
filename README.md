# Hysteria ORM

## Philosophy
- Hysteria ORM is an Object-Relational Mapping (ORM) library for TypeScript, designed to simplify interactions between your application and a SQL and NoSql databases.
- It's partially type safe by design, allowing you to have features like intellisense for you models interactions while maintaining the flexibility of shooting yourself in the foot!
- The main characteristic Is that Models classes refer to the database repository allowing you to interact with It via static methods in a concise and minimal way. While Models instances do not have anything else but what you define as Columns(sql) or Properties(noSql) and are designed to be used directly in you typescript Logic without any overhead.

- [Installation](#installation)
- [Prerequisites](#prerequisites)
- [Supported Databases](#supported-databases)
- [Env example with a config for each database](#env-example-with-a-config-for-each-database)
- [TypeScript Configuration example](#typescript-configuration-example)
- [Javascript](#javascript)
- [Setup Example](#setup-example)

## Installation
```shell
    npm install hysteria-orm
    
    yarn add hysteria-orm
```

## Prerequisites

- A JavaScript runtime environment (e.g., Node.js, deno or bun).
- The driver for you database, supported drivers are:
```bash
### Sql

# postgres
yarn add pg

# mysql or mariadb
yarn add mysql2

# sqlite
yarn add sqlite3

### NoSql

# mongo
yarn add mongodb

# redis
yarn add ioredis
```

## Supported Databases

### Sql
[Documentation For Sql Databases](src/sql/docs/SQL_README.MD)
- Sql supported databases are
1) Mysql
2) MariaDB
3) Postgres
4) SQLite

### NoSQl
- [Redis](src/no_sql/redis/docs/REDIS.MD)
- [Mongo](src/no_sql/mongo/docs/MONGO.MD)

### Env example with a config for each database
```dotenv
# POSTGRES
DB_TYPE=postgres
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=root
DB_DATABASE=test
DB_PORT=5432
DB_LOGS=true
MIGRATION_PATH=./migrations # default is database/migrations

# MYSQL
DB_TYPE=mysql
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=root
DB_DATABASE=test
DB_PORT=3306
DB_LOGS=true

# MARIADB
DB_TYPE=mariadb
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=root
DB_DATABASE=test
DB_PORT=3307
DB_LOGS=true

# SQLITE
DB_TYPE=sqlite
DB_DATABASE="./sqlite.db"
DB_LOGS=true

# REDIS
DB_TYPE=redis
DB_HOST=127.0.0.1
DB_USER=default
DB_PASSWORD=root
DB_DATABASE=0
DB_PORT=6379
DB_LOGS=true

# MONGO
MONGO_URL=mongodb://root:root@localhost:27017
```

### TypeScript Configuration example

```json 
{
  "compilerOptions": {
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "module": "commonjs",
    "outDir": "lib",
    "rootDirs": ["src", "test"],
    "skipLibCheck": true,
    "strict": true,
    "target": "ES2020",
    "moduleResolution": "node",
    "declaration": true,
    // Must set decorators support
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
  },
  "include": ["src/**/*.ts", "test/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Javascript
#### Hysteria ORM is written and designed for TypeScript, but It can still be used in JavaScript with some configurations:
1. Install the necessary dependencies:
```shell
npm install --save-dev reflect-metadata @babel/core @babel/cli @babel/preset-env @babel/plugin-proposal-decorators
yarn add --dev reflect-metadata @babel/core @babel/cli @babel/preset-env @babel/plugin-proposal-decorators
```

2. Create a babel.config.js file in the root of your project with the following content:
```javascript
module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          node: "current",
        },
      },
    ],
  ],
  plugins: [
    ["@babel/plugin-proposal-decorators", { legacy: true }],
  ],
};
```

3. Add a build script to your package.json file:
```json
{
  "scripts": {
    "build": "babel src --out-dir dist"
  }
}
```

4. Run the build script:
```shell
npm run build
```

5. Run your application:
```shell
node dist/index.js
```

- Your js Model definition may look like this:
```javascript
require('reflect-metadata');
const { Model, SqlDataSource, column } =  require("hysteria-orm");

class User extends Model {
  @column({ primaryKey: true })
  id

  @column()
  name

  @column()
  email

  @column()
  signupSource

  @column()
  isActive

  @column()
  createdAt

  @column()
  updatedAt
}
```

#### JS without decorators
- If you don't want to use decorators, you can define your models like this:
- Aside decorators, all other features are available in JavaScript

```javascript
import {Model, SqlDataSource, getModelColumns} from 'hysteria-orm';
import Profile from './Profile';
import Post from './Post';
import Role from './Role';
import Address from './Address';

class User extends Model {
  static {
    this.column('id', { primaryKey: true });
    this.column('name');
    this.column('email');
    this.column('signupSource');
    this.column('isActive', { booleanColumn: true });

    this.hasOne('profile', () => Profile, "userId");
    this.hasMany('posts', () => Post, "userId");
    this.belongsToMany('roles', () => Role, "roleId");
    this.manyToMany('addresses', () => Address, "user_addresses", "userId");
  }
}
```

## Setup Example
- Docker compose example with the database versions used in the development

```yml
version: "3"
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: test
    ports:
      - "3306:3306"

  postgres:
    image: postgres:13
    environment:
      POSTGRES_USER: root
      POSTGRES_PASSWORD: root
      POSTGRES_DB: test
    ports:
      - "5432:5432"

  mariadb:
    image: mariadb:10.5
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: test
    ports:
      - "3307:3306" 

  redis:
    image: redis:6
    environment:
      - REDIS_PASSWORD=root
    ports:
      - "6379:6379"

  mongo:
    image: mongo:4.4
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: root
    ports:
      - "27017:27017"
```
