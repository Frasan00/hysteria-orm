export const createMigrationTableTemplate: string = `
CREATE TABLE IF NOT EXISTS \`migrations\`(
    \`id\` INT NOT NULL AUTO_INCREMENT,
    \`name\` VARCHAR(255) NOT NULL,
    \`timestamp\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;
