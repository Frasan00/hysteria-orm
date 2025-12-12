# Testing Guide

## Prerequisites

- Docker and Docker Compose installed
- Node.js (nvm) and Yarn package manager

## Database Setup

The test suite requires multiple databases to be running. We provide a Docker Compose configuration to set up all necessary databases see [docker-compose.yaml](docker-compose.yml)

## Setup Instructions

1. Install project dependencies:
   ```bash
   yarn install
   ```

2. Start the required databases using Docker Compose:
   ```bash
   docker compose up -d
   ```

3. setup nvm with .nvmrc
  ```bash
  nvm use
  ```

4. Run the test suite:
   ```bash
   yarn test:with:migrations
   ```

## Notes

- All database credentials are set to default values for testing purposes, do not change them
- Ensure all required ports are available before starting the containers
