const { readFileSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");

const root = join(__dirname, "..");
const rootPkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));
const version = rootPkg.version;

for (const pkg of ["apps/web/package.json", "packages/core/package.json"]) {
  const path = join(root, pkg);
  const json = JSON.parse(readFileSync(path, "utf-8"));
  const old = json.version;
  if (old !== version) {
    json.version = version;
    writeFileSync(path, JSON.stringify(json, null, 2) + "\n");
    console.log(`  ✓ ${pkg}: ${old} → ${version}`);
  } else {
    console.log(`  – ${pkg}: already ${version}`);
  }
}
