#!/usr/bin/env node

const { Command } = require('commander');
const migrationCreateConnector = require('./src/hysteria-cli/migrationCreateConnector.ts').default;
const migrationRunConnector = require('./src/hysteria-cli/migrationRunConnector.ts').default;
const migrationRollbackConnector = require('./src/hysteria-cli/migrationRollbackConnector.ts').default;

const program = new Command();

program
  .command('create-migration <name>')
  .description('Create a new migration')
  .action((name) => {
    migrationCreateConnector(name);
  });

program
  .command('run-migrations')
  .description('Run all pending migrations')
  .action(async () => {
    await migrationRunConnector();
  });

program
  .command('rollback-migration')
  .description('Rollbacks all migrations')
  .action(async () => {
    await migrationRollbackConnector();
  });

program.parse(process.argv);