#!/bin/bash
set -e

echo "Waiting for CockroachDB to be ready..."
until cockroach sql --insecure --host=cockroachdb:26257 -e "SELECT 1" >/dev/null 2>&1; do
  echo "Waiting for CockroachDB..."
  sleep 2
done

echo "Creating test database..."
cockroach sql --insecure --host=cockroachdb:26257 -e "CREATE DATABASE IF NOT EXISTS test;"

echo "Database initialization complete!"
