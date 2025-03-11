# Testing Guide

This document outlines the setup and execution of tests for the Hysteria ORM project.

## Prerequisites

- Docker and Docker Compose installed
- Node.js (nvm) and Yarn package manager
- SQLite3

## Database Setup

The test suite requires multiple databases to be running. We provide a Docker Compose configuration to set up all necessary databases:

```yaml
version: "3"
services:
  sql:
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

## Setup Instructions

1. Create the SQLite database file:
   ```bash
   touch sqlite.db
   ```

2. Install project dependencies:
   ```bash
   yarn install
   ```

3. Start the required databases using Docker Compose:
   ```bash
   docker compose up -d
   ```

4. setup nvm with .nvmrc
  ```bash
  nvm use
  ```

5. Run the test suite:
   ```bash
   yarn test
   ```

## Notes

- The SQLite database file is required for SQLite-specific tests
- All database credentials are set to default values for testing purposes, do not change them
- Ensure all required ports are available before starting the containers
