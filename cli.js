#!/usr/bin/env node

const { Command } = require('commander');
const { execSync } = require('child_process');
const { resolve } = require('path');

const program = new Command();

const migrationCreateConnectorPath = resolve(process.cwd(), 'node_modules/hysteria-orm/src/hysteria_cli/migration_create_connector.ts');
const migrationRunConnectorPath = resolve(process.cwd(), 'node_modules/hysteria-orm/src/hysteria_cli/migration_run_connector.ts');
const migrationRollbackConnectorPath = resolve(process.cwd(), 'node_modules/hysteria-orm/src/hysteria_cli/migration_rollback_connector.ts');

program
  .command('create:migration <name>')
  .description('Create a new migration file, standard folder is database/migrations from the current directory you are now, you can change it in the env MIGRATION_PATH')
  .action((name) => {
    if (!name) {
      console.error('Error: migrations name is required.');
      process.exit(1);
    }

    execSync(`${resolve(`${process.cwd()}/node_modules/.bin/ts-node`)} -T ${migrationCreateConnectorPath} ${name}`, { stdio: 'inherit' });
  });

program
  .command('run:migrations [runUntil]')
  .description('Run pending migrations')
  .action((runUntil) => {
    execSync(`${resolve(`${process.cwd()}/node_modules/.bin/ts-node`)} -T ${migrationRunConnectorPath} ${runUntil}`, { stdio: 'inherit' });
  });

program
  .command('rollback:migrations [rollbackUntil]')
  .description('Rollbacks every migration that has been run')
  .action((rollbackUntil) => {
    execSync(`${resolve(`${process.cwd()}/node_modules/.bin/ts-node`)} -T ${migrationRollbackConnectorPath} ${rollbackUntil}`, { stdio: 'inherit' });
  });

program
  .command('refresh:migrations')
  .description('Rollbacks every migration that has been run and then run the migrations')
  .action(() => {
    execSync(`${resolve(`${process.cwd()}/node_modules/.bin/ts-node`)} -T ${migrationRollbackConnectorPath} && ${resolve(`${process.cwd()}/node_modules/.bin/ts-node`)} -T ${migrationRunConnectorPath}`, { stdio: 'inherit' });
  });

program.parse(process.argv);
