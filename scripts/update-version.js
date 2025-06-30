#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const versionPath = path.join(__dirname, '../src/config/version.ts');
const packagePath = path.join(__dirname, '../package.json');

// Leer package.json para sincronizar la versión
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const currentVersion = packageJson.version;

// Leer el archivo de versión actual
let versionContent = fs.readFileSync(versionPath, 'utf8');

// Actualizar la versión en el archivo
versionContent = versionContent.replace(
  /version: '[^']*'/,
  `version: '${currentVersion}'`
);

// Actualizar la fecha de build
versionContent = versionContent.replace(
  /buildDate: new Date\(\)\.toISOString\(\)/,
  `buildDate: '${new Date().toISOString()}'`
);

// Escribir el archivo actualizado
fs.writeFileSync(versionPath, versionContent);

console.log(`✅ Version updated to ${currentVersion}`);
console.log(`📅 Build date updated to ${new Date().toISOString()}`);
