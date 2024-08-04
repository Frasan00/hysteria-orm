#!/usr/bin/env node

const { Command } = require('commander');
const { createMigrationSql } = require('./src/hysteria-cli/mysql/create-migration');
const { runMigrationsSql } = require('./src/hysteria-cli/mysql/run-migration');
const { migrationRollBackSql } = require('./src/hysteria-cli/mysql/rollback-migration');

const program = new Command();

program
  .command('create-migration <name>')
  .description('Create a new migration')
  .action((name) => {
    createMigrationSql(name);
  });

program
  .command('run-migrations')
  .description('Run all pending migrations')
  .action(async () => {
    await runMigrationsSql();
  });

program
  .command('rollback-migration')
  .description('Rollbacks all migrations')
  .action(async () => {
    await migrationRollBackSql();
  });

program.parse(process.argv);