# Hysteria ORM

- Hysteria ORM is a partially type safe Object-Relational Mapping (ORM) library for TypeScript, designed to simplify interactions between your application and a SQL and NoSql databases.

## Sql
- [Documentation](src/SQL_README.MD)
- Sql supported databases are
1) Mysql
2) MariaDB
3) Postgres
4) sqlite

## NoSQl
- [Documentation](./src/NoSql/NOSQL_README.MD)


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
```