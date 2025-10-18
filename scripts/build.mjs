import { execSync, execFileSync } from "node:child_process";
import { mkdir, rm, cp, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, "..");

function readCommitHash() {
  if (process.env.COMMIT_SHA) {
    return process.env.COMMIT_SHA;
  }
  try {
    return execSync("git rev-parse --short=12 HEAD", { cwd: repoRoot, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch (error) {
    console.warn("[build] Unable to determine git commit, falling back to 'dev'.");
    return "dev";
  }
}

function run(command, args, extraEnv = {}) {
  execFileSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "production",
      COMMIT_SHA: extraEnv.COMMIT_SHA ?? extraEnv.commitHash ?? baseHash
    }
  });
}

const baseHash = readCommitHash();

console.log(`[build] Using version ${baseHash}`);

run("npm", ["run", "build", "--workspace", "@banner/live-editor"], { COMMIT_SHA: baseHash });
run("npm", ["run", "build", "--workspace", "@banner/main"], { COMMIT_SHA: baseHash });

const distRoot = join(repoRoot, "dist");
const versionedDist = join(distRoot, baseHash);

await rm(versionedDist, { recursive: true, force: true });
await mkdir(versionedDist, { recursive: true });
await mkdir(join(versionedDist, "live-editor"), { recursive: true });

await cp(join(repoRoot, "packages/main/dist"), versionedDist, { recursive: true });
await cp(join(repoRoot, "packages/live-editor/dist"), join(versionedDist, "live-editor"), { recursive: true });

const manifest = {
  version: baseHash,
  builtAt: new Date().toISOString(),
  artifacts: {
    main: "main.js",
    liveEditor: "live-editor/live-editor.js"
  }
};

await writeFile(join(versionedDist, "manifest.json"), JSON.stringify(manifest, null, 2));

console.log(`[build] Files are ready in dist/${baseHash}`);
