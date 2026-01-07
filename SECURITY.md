# Security Policy

## Supported Versions

⚠️ **Important**: This project is currently under active development and is not recommended for production use.

## Reporting a Vulnerability

We take the security of Hysteria ORM seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do Not Open a Public Issue

Please **do not** report security vulnerabilities through public GitHub issues, discussions, or pull requests.

### 2. Report Privately

Report security vulnerabilities by:

* Opening a private security advisory on GitHub: https://github.com/Frasan00/hysteria-orm/security/advisories/new
* Or by emailing the maintainers directly through the contact information in the repository

### 3. Include Relevant Information

When reporting a vulnerability, please include:

* **Type of vulnerability** (e.g., SQL injection, authentication bypass, etc.)
* **Full paths of source file(s)** related to the vulnerability
* **Location of the affected source code** (tag/branch/commit or direct URL)
* **Step-by-step instructions** to reproduce the issue
* **Proof-of-concept or exploit code** (if possible)
* **Impact of the vulnerability** and how it can be exploited
* **Your suggested fix** (if you have one)

### 4. Response Timeline

* We will acknowledge receipt of your vulnerability report as soon as possible

## Security Best Practices

When using Hysteria ORM, follow these security best practices:

### 1. Database Credentials

* **Never commit credentials** to version control
* Use environment variables for sensitive configuration
* Use proper access controls on your environment files

### 2. SQL Injection Prevention

* Always use **parameterized queries**
* Never concatenate user input directly into SQL queries
* Use the query builder's built-in escaping mechanisms

Example of safe query:
```typescript
// Safe - uses parameterization
await User.query().where('email', email).one();

// Unsafe - avoid raw queries with user input
await User.query().raw(`SELECT * FROM users WHERE email = '${email}'`);
```

### 3. Connection Security

* Use **SSL/TLS** for database connections in production
* Configure proper connection timeouts
* Use connection pooling to prevent resource exhaustion

### 4. Data Validation

* Always validate and sanitize user input
* Use TypeScript types and validation libraries
* Implement rate limiting for API endpoints

### 5. Dependency Management

* Keep Hysteria ORM and all dependencies up to date
* Regularly run `yarn audit` to check for known vulnerabilities
* Review security advisories for your database drivers

### 6. Error Handling

* Don't expose sensitive information in error messages
* Log errors securely without exposing credentials
* Use structured logging with appropriate redaction

### 7. Migrations

* Review migration files before running in production
* Test migrations in a staging environment first
* Backup your database before running migrations
* Never include sensitive data in migration files

## Known Security Considerations

### Development Status

* This project is in active development
* Breaking changes may occur between releases
* APIs are not yet stable
* **Not recommended for production use**

### Database Driver Security

Hysteria ORM relies on underlying database drivers:
* PostgreSQL: `pg`
* MySQL: `mysql2`
* SQLite: `better-sqlite3`
* MongoDB: `mongodb`
* Redis: `ioredis`

Ensure these drivers are kept up to date with the latest security patches.

### Query Builder Limitations

* Raw SQL queries bypass built-in protections
* Always validate input when using raw queries
* Be cautious with dynamic column/table names

## Security Updates

Security updates will be released as patch versions and announced through:
* GitHub Security Advisories
* Release notes
* CHANGELOG.md

## Acknowledgments

We appreciate the security research community's efforts in responsibly disclosing vulnerabilities. Contributors who report valid security issues will be acknowledged in the release notes (unless they prefer to remain anonymous).

## Questions?

If you have questions about security that are not sensitive in nature, feel free to open a public issue or discussion on GitHub.

