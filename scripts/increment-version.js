const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const pkg = require(packageJsonPath);

const versionRegex = /^v?(\d+\.\d+\.\d+)[\s-]*beta\.?(\d*)$/i;
let newVersion;

if (versionRegex.test(pkg.version)) {
  const match = pkg.version.match(versionRegex);
  const base = match[1];
  const buildNum = parseInt(match[2] || '0', 10) + 1;
  newVersion = `${base}-beta.${buildNum}`;
} else {
  newVersion = '1.0.0-beta.1';
}

pkg.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`\n\x1b[32m✔ Incremented build version to Pinny v${newVersion}\x1b[0m\n`);
