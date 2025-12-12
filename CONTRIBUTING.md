# Contributing to Hysteria ORM

First off, thank you for considering contributing to Hysteria ORM!

## ⚠️ Development Status

This project is under active development. APIs and features may change, and breaking changes can occur between releases. Please keep this in mind when contributing.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

* **Use a clear and descriptive title**
* **Describe the exact steps to reproduce the problem**
* **Provide specific examples** (code snippets, test cases)
* **Describe the behavior you observed** and what you expected
* **Include your environment details** (Node.js version, database type and version, OS)
* **Include error messages and stack traces**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

* **Use a clear and descriptive title**
* **Provide a detailed description** of the proposed enhancement
* **Explain why this enhancement would be useful** to most users
* **Include code examples** if applicable

### Pull Requests

* **Fork the repository** and create your branch from `main`
* **Follow the existing code style** (see Code Style Guide below)
* **Write tests** for your changes
* **Ensure all tests pass** before submitting
* **Update documentation** if needed
* **Write a clear commit message** describing your changes

## Development Setup

0. Node.js 22.x is required
```bash
nvm use
```

1. Fork and clone the repository:
```bash
git clone https://github.com/Frasan00/hysteria-orm.git
cd hysteria-orm
```

1. Install dependencies:
```bash
yarn install
```

1. Set up databases for testing (using Docker):
```bash
docker-compose up -d
```

1. Run tests:
```bash
yarn test
```

## Code Style Guide

Hysteria ORM follows strict TypeScript coding standards:

### General Principles

* **Use meaningful, pronounceable variable names**
  * camelCase for variables/functions
  * PascalCase for classes/types
  * SNAKE_CASE for constants

* **Prefer functional programming** over classes where possible

* **Functions should do one thing** with 2 or fewer parameters
  * Use object destructuring for more parameters

### Error Handling

* **Always use HysteriaError class** for throwing/rejecting
* **Never throw raw strings**
* **Include relevant context** in error messages

## Testing

* Write unit tests for new features
* Ensure all existing tests pass
* Test against multiple database engines when applicable
* Use meaningful test descriptions

Run specific test suites:
```bash
yarn test
```

## Commit Message Guidelines

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests after the first line

Examples:
```
Add support for MySQL replication
Fix connection pool memory leak
Update documentation for query builder
```

## Questions?

Feel free to open an issue with your question or reach me directly i'll be happy to help you.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

