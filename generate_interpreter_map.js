import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const baseDir = path.join(__dirname, 'src/sql/interpreter');
const output = [];

function walk(dir, dbType, scope) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, dbType || file, scope || (dbType ? file : null));
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      if (file.includes('interpreter')) {
        return;
      }

      const type = file.replace('.ts', '');
      const importName = [dbType, scope, type].join('_');
      const importPath = `../interpreter/${dbType}/${scope}/${type}`;
      output.push(`import ${importName} from '${importPath}';`);
    }
  });
}

walk(baseDir);

let map = `export const interpreterMap = {\n`;
const dbTypes = fs.readdirSync(baseDir).filter(f => fs.statSync(path.join(baseDir, f)).isDirectory());
for (const dbType of dbTypes) {
  map += `  ${dbType}: {\n`;
  const scopes = fs.readdirSync(path.join(baseDir, dbType)).filter(f => fs.statSync(path.join(baseDir, dbType, f)).isDirectory());
  for (const scope of scopes) {
    map += `    ${scope}: {\n`;
    const types = fs.readdirSync(path.join(baseDir, dbType, scope)).filter(f => f.endsWith('.ts') && !f.endsWith('.d.ts'));
    for (const typeFile of types) {
      const type = typeFile.replace('.ts', '');
      const importName = [dbType, scope, type].join('_');
      map += `      ${type}: ${importName},\n`;
    }
    map += `    },\n`;
  }
  map += `  },\n`;
}
map += `} as any;\n`;

fs.writeFileSync(path.join(__dirname, 'src/sql/ast/interpreter_map.ts'), output.join('\n') + '\n\n' + map);
