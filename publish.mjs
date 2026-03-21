#!/usr/bin/env node

/**
 * publish.mjs
 *
 * Usage:
 *   node publish.mjs patch    → bump patch, publish to npm, NO git tag
 *   node publish.mjs minor    → bump minor, publish to npm, NO git tag
 *   node publish.mjs major    → bump major, publish to npm, git tag + push to GitHub
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const log = {
  info: (msg) => console.log(`\x1b[36mℹ\x1b[0m  ${msg}`),
  success: (msg) => console.log(`\x1b[32m✔\x1b[0m  ${msg}`),
  warn: (msg) => console.log(`\x1b[33m⚠\x1b[0m  ${msg}`),
  error: (msg) => console.error(`\x1b[31m✖\x1b[0m  ${msg}`),
  step: (msg) => console.log(`\n\x1b[1m${msg}\x1b[0m`),
};

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, {
      stdio: opts.silent ? "pipe" : "inherit",
      encoding: "utf8",
    });
  } catch {
    if (opts.throws === false) return null;
    throw new Error(cmd);
  }
}

function runSilent(cmd) {
  return run(cmd, { silent: true, throws: false })?.trim() ?? "";
}

// ─── Validate release type arg ────────────────────────────────────────────────

const VALID_TYPES = ["patch", "minor", "major"];
const releaseType = process.argv[2]?.toLowerCase();

if (!VALID_TYPES.includes(releaseType)) {
  log.error(`Invalid release type: "${releaseType ?? ""}"`);
  log.info("Usage: node publish.mjs <patch|minor|major>");
  process.exit(1);
}

// ─── Load package.json ────────────────────────────────────────────────────────

const pkgPath = resolve(process.cwd(), "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));

// ─── Guard: uncommitted changes ───────────────────────────────────────────────

log.step("Checking working tree...");

const dirty = runSilent("git status --porcelain");
if (dirty) {
  log.error(
    "Working tree has uncommitted changes. Commit or stash them first.",
  );
  process.exit(1);
}
log.success("Working tree is clean.");

// ─── Guard: on main/master branch ────────────────────────────────────────────

const branch = runSilent("git rev-parse --abbrev-ref HEAD");
if (!["main", "master"].includes(branch)) {
  log.error(
    `Releases must be made from main/master. Currently on: "${branch}"`,
  );
  process.exit(1);
}
log.success(`On branch: ${branch}`);

// ─── Compute next version ─────────────────────────────────────────────────────

const currentVersion = pkg.version;
const [major, minor, patch] = currentVersion.split(".").map(Number);
let nextVersion;

if (releaseType === "patch") {
  nextVersion = `${major}.${minor}.${patch + 1}`;
} else if (releaseType === "minor") {
  nextVersion = `${major}.${minor + 1}.0`;
} else {
  nextVersion = `${major + 1}.0.0`;
}

// ─── Rollback helper ──────────────────────────────────────────────────────────

function rollback(reason) {
  log.error(`${reason} — rolling back package.json to v${currentVersion}.`);
  pkg.version = currentVersion;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
  log.warn(
    `Rolled back to ${currentVersion}. Nothing was committed or pushed.`,
  );
  process.exit(1);
}

// ─── Bump version in package.json ────────────────────────────────────────────
// Written now so npm publish picks up the new version.
// Will be restored by rollback() if anything below fails.

log.step(`Bumping ${releaseType} version...`);
pkg.version = nextVersion;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
log.success(`Version bumped: ${pkg.name}@${nextVersion}`);

// ─── Build ────────────────────────────────────────────────────────────────────

if (pkg.scripts?.build) {
  log.step("Running build...");
  try {
    run("npm run build");
  } catch {
    rollback("Build failed");
  }
  log.success("Build complete.");
} else {
  log.warn("No build script found in package.json, skipping.");
}

// ─── Publish to npm ───────────────────────────────────────────────────────────

log.step("Publishing to npm...");
try {
  // --no-git-checks because we manage git ourselves
  run("npm publish --no-git-checks --access public");
} catch {
  rollback("Publish failed");
}
log.success(`Published ${pkg.name}@${nextVersion} to npm.`);

// ─── Commit version bump ──────────────────────────────────────────────────────
// Only reached if publish succeeded — safe to commit now.

log.step("Committing version bump...");
run("git add package.json");
run(`git commit -m "chore: release v${nextVersion}"`);
log.success(`Committed: chore: release v${nextVersion}`);

// ─── Tag + push — major only ──────────────────────────────────────────────────

if (releaseType === "major") {
  log.step("Major release — creating git tag and pushing to GitHub...");

  const tag = `v${nextVersion}`;
  run(`git tag ${tag}`);
  log.success(`Tag created: ${tag}`);

  run(`git push origin ${branch}`);
  run(`git push origin ${tag}`);
  log.success(`Pushed branch and tag ${tag} to GitHub.`);
} else {
  log.step("Pushing commit (no tag)...");
  run(`git push origin ${branch}`);
  log.success("Pushed commit to GitHub without a tag.");

  log.warn(
    releaseType === "patch"
      ? "Patch release: no git tag created."
      : "Minor release: no git tag created.",
  );
}

// ─── Done ─────────────────────────────────────────────────────────────────────

console.log(`
\x1b[32m-------------------------------------\x1b[0m
  \x1b[1m${pkg.name}@${nextVersion}\x1b[0m published successfully
  Release type : ${releaseType}
  Git tag      : ${releaseType === "major" ? `v${nextVersion} (pushed)` : "skipped"}
  GitHub push  : branch pushed
\x1b[32m-------------------------------------\x1b[0m
`);
