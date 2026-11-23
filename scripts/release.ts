/**
 * One command to release a change safely, even when other people or agents
 * are pushing to the same repo:
 *
 *   npm run release -- patch "Fixed a typo on the Quran page"
 *   npm run release -- minor "Added a Ramadan Q&A page"
 *   npm run release -- major "Redesigned the site"
 *
 * Steps: sync with the remote (rebase, keeping your uncommitted work) →
 * build + link check → bump VERSION/CHANGELOG → commit "vXX.XX.XXX: summary"
 * → push. If the push is rejected because someone else pushed first, it
 * re-syncs, takes their version, re-bumps on top of it, re-checks, and retries.
 *
 * Flags: --skip-checks (not recommended), --dry-run (stop before committing).
 */
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const PARTS = ["patch", "minor", "major"] as const;
type Part = (typeof PARTS)[number];
const MAX_ATTEMPTS = 5;

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const [part, summary] = args.filter((a) => !a.startsWith("--")) as [Part, string];

function fail(msg: string): never {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

/** Run a command, streaming output. Returns true on success. */
function run(cmd: string, cmdArgs: string[], { allowFail = false } = {}) {
  console.log(`\n$ ${cmd} ${cmdArgs.join(" ")}`);
  const res = spawnSync(cmd, cmdArgs, { stdio: "inherit" });
  if (res.status !== 0 && !allowFail) fail(`Command failed: ${cmd} ${cmdArgs.join(" ")}`);
  return res.status === 0;
}

/** Run a command and capture its output. */
function out(cmd: string, cmdArgs: string[]) {
  try {
    return execFileSync(cmd, cmdArgs, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch {
    return "";
  }
}

const version = () => readFileSync("VERSION", "utf8").trim();

function checks() {
  if (flags.has("--skip-checks")) return console.log("\n⚠ Skipping build and link check (--skip-checks).");
  run("npm", ["run", "build"]);
  run("npm", ["run", "check-links"]);
}

/** Pull the latest remote branch under our work. Stops on real conflicts. */
function sync(branch: string) {
  if (!out("git", ["ls-remote", "--heads", "origin", branch])) return; // new branch, nothing to sync
  run("git", ["fetch", "origin", branch]);
  if (!run("git", ["rebase", "--autostash", `origin/${branch}`], { allowFail: true })) {
    run("git", ["rebase", "--abort"], { allowFail: true });
    fail(
      `Your changes conflict with what's on origin/${branch}.\n` +
        `  Resolve by hand: git pull --rebase --autostash origin ${branch}, fix the conflicted files,\n` +
        `  git add them, git rebase --continue, then run this command again.`,
    );
  }
}

function main() {
  if (!PARTS.includes(part)) fail('Usage: npm run release -- <patch|minor|major> "One-line summary"');
  if (!summary?.trim()) fail("Add a one-line summary of the change, in quotes.");

  const branch = out("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
  if (!branch || branch === "HEAD") fail("Not on a branch (detached HEAD). Check out a branch first.");
  if (out("git", ["status", "--porcelain"]) === "") fail("No changes to release. Make your edits first.");
  if (/^(VERSION|CHANGELOG\.md)$/m.test(out("git", ["diff", "--name-only", "HEAD"]))) {
    fail("VERSION or CHANGELOG.md is already edited. Undo those edits (git checkout HEAD -- VERSION CHANGELOG.md); this command bumps them for you.");
  }

  console.log(`Releasing on "${branch}" as a ${part} change: ${summary}`);
  sync(branch);
  checks();

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    run("npm", ["run", "-s", "version:bump", "--", part, summary]);
    const v = version();
    if (flags.has("--dry-run")) {
      run("git", ["checkout", "HEAD", "--", "VERSION", "CHANGELOG.md"]);
      return console.log(`\n✔ Dry run OK. Would release ${v}. Nothing committed.`);
    }

    run("git", ["add", "-A"]);
    run("git", ["commit", "-m", `${v}: ${summary.trim()}`]);
    const hasUpstream = Boolean(out("git", ["ls-remote", "--heads", "origin", branch]));
    if (run("git", ["push", ...(hasUpstream ? [] : ["-u"]), "origin", branch], { allowFail: true })) {
      console.log(`\n✔ Released ${v} on ${branch}.`);
      if (branch === "main") console.log("  Live in ~2 minutes: https://wisequest.org/  (check: gh run list --limit 1)");
      else console.log("  Open or update the pull request; it goes live when merged into main.");
      return;
    }

    // Someone pushed first: undo our commit (keep the work), take their
    // VERSION/CHANGELOG, re-sync, re-check, and bump again on top.
    console.log(`\n↻ Push rejected (attempt ${attempt}/${MAX_ATTEMPTS}); someone else pushed first. Re-syncing…`);
    run("git", ["reset", "--soft", "HEAD~1"]);
    run("git", ["restore", "--staged", "."]);
    run("git", ["checkout", "HEAD", "--", "VERSION", "CHANGELOG.md"]);
    sync(branch);
    checks();
  }
  fail(`Gave up after ${MAX_ATTEMPTS} attempts. Your changes are still in the working tree; try again in a minute.`);
}

main();
