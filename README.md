# Hysteria ORM

## Philosophy
- Hysteria ORM is an Object-Relational Mapping (ORM) library for TypeScript, designed to simplify interactions between your application and a SQL and NoSql databases.
- It's partially type safe by design, allowing you to have features like intellisense for you models interactions while maintaining the flexibility of shooting yourself in the foot!
- The main characteristic Is that Models classes refer to the database repository allowing you to interact with It via static methods in a concise and minimal way. While Models instances do not have anything else but what you define as Columns(sql) or Properties(noSql) and are designed to be used directly in you typescript Logic without any overhead.


## Installation
```shell
    npm install hysteria-orm
    
    yarn add hysteria-orm
```

## Supported Databases

### Sql
[Documentation](src/SQL_README.MD)
- Sql supported databases are
1) Mysql
2) MariaDB
3) Postgres
4) sqlite

### NoSQl
- [Redis](src/no_sql/redis/docs/REDIS.MD)
- [Mongo](src/no_sql/mongo/MONGO.MD)

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

- Env example with a config for each database

```dotenv
# POSTGRES
DB_TYPE=postgres
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=root
DB_DATABASE=test
DB_PORT=5432
DB_LOGS=true

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