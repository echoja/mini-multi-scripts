// @ts-check

import { execFileSync } from "node:child_process";
import { mkdir, rm, cp, writeFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, "..");

/**
 * @param {string} command
 * @param {string[]} args
 */
function run(command, args) {
  execFileSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "production",
    },
  });
}

run("npm", ["run", "build", "--workspace", "@banner/live-locator"]);
run("npm", ["run", "build", "--workspace", "@banner/main"]);

await generateMainIndexHtml();

const distRoot = join(repoRoot, "dist");

await rm(distRoot, { recursive: true, force: true });
await mkdir(distRoot, { recursive: true });
await mkdir(join(distRoot, "live-locator"), { recursive: true });

await cp(join(repoRoot, "packages/main/dist"), distRoot, { recursive: true });
await cp(
  join(repoRoot, "packages/live-locator/dist"),
  join(distRoot, "live-locator"),
  { recursive: true }
);

const manifest = {
  version: "dev",
  builtAt: new Date().toISOString(),
  artifacts: {
    main: "main.js",
    liveLocator: "live-locator/live-locator.js",
  },
};

await writeFile(
  join(distRoot, "manifest.json"),
  JSON.stringify(manifest, null, 2)
);

console.log("[build] Files are ready in dist/");

async function generateMainIndexHtml() {
  const sourcePath = join(repoRoot, "packages/main/index.html");
  const targetPath = join(repoRoot, "packages/main/dist/index.html");
  const html = await readFile(sourcePath, "utf8");
  const withBundledScript = html.replace(
    /src="\/src\/main\.ts"/g,
    'src="./main.js"'
  );
  await mkdir(dirname(targetPath), { recursive: true });
  await writeFile(targetPath, withBundledScript);
}
