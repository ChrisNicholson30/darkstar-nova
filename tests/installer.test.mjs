import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { repositoryRoot } from "../generators/lib/design.mjs";

async function installerFixture(t) {
  // Stay inside the real HOME and workspace; never redirect HOME or use live app directories.
  const root = await mkdtemp(resolve(repositoryRoot, ".installer-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(resolve(root, "scripts"));
  await mkdir(resolve(root, "bin"));
  await mkdir(resolve(root, "IDE with spaces/plugins"), { recursive: true });
  for (const file of ["install.sh", "uninstall.sh", "scripts/install-common.sh", "scripts/installer-ui.sh"]) {
    await copyFile(resolve(repositoryRoot, file), resolve(root, file));
  }
  for (const target of ["zed", "zed-icons", "xcode", "terminal", "jetbrains"]) {
    await mkdir(resolve(root, "install", target), { recursive: true });
    await writeFile(resolve(root, "install", target, "install.sh"), `#!/bin/sh
printf '%s\\t%s\\n' '${target}' "\${1:-}" >> "$DARKSTAR_NOVA_TEST_LOG"
[ "\${DARKSTAR_NOVA_TEST_FAIL_TARGET:-}" != '${target}' ]
`);
  }
  await writeFile(resolve(root, "bin/uname"), '#!/bin/sh\nprintf "%s\\n" "$DARKSTAR_NOVA_TEST_OS"\n', { mode: 0o755 });
  const env = {
    ...process.env,
    TERM: "xterm-256color",
    COLUMNS: "80",
    NO_COLOR: "1",
    DARKSTAR_NOVA_ASCII: "0",
    DARKSTAR_NOVA_STATE_HOME: resolve(root, "state"),
    DARKSTAR_NOVA_JETBRAINS_PLUGINS_DIR: resolve(root, "IDE with spaces/plugins"),
    DARKSTAR_NOVA_TEST_LOG: resolve(root, "dispatch.tsv"),
    DARKSTAR_NOVA_TEST_OS: "Darwin",
    DARKSTAR_NOVA_TEST_FAIL_TARGET: "",
    PATH: `${resolve(root, "bin")}:${process.env.PATH}`,
  };
  return {
    root,
    env,
    run(args = [], input = "", overrides = {}, script = "install.sh") {
      return spawnSync("sh", [resolve(root, script), ...args], {
        cwd: root,
        env: { ...env, ...overrides },
        input,
        encoding: "utf8",
        timeout: 10000,
      });
    },
    async calls() {
      const log = await readFile(env.DARKSTAR_NOVA_TEST_LOG, "utf8").catch((error) => {
        if (error.code === "ENOENT") return "";
        throw error;
      });
      return log.trimEnd().split("\n").filter(Boolean).map((line) => line.split("\t"));
    },
  };
}

test("numbered menu dispatches comma-separated choices once each", async (t) => {
  const fixture = await installerFixture(t);
  const result = fixture.run([], "3,1,2,1\n");
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual((await fixture.calls()).map(([name]) => name), ["zed", "xcode", "terminal"]);
  assert.match(result.stdout, /3 succeeded \/ 0 failed/);
  assert.match(result.stdout, /CHOOSE YOUR DESTINATIONS/);
});

test("named choices and All compatible respect the operating system", async (t) => {
  const fixture = await installerFixture(t);
  let result = fixture.run(["zed", "xcode"]);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual((await fixture.calls()).map(([name]) => name), ["zed", "xcode"]);
  await rm(fixture.env.DARKSTAR_NOVA_TEST_LOG);
  result = fixture.run(["6"]);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual((await fixture.calls()).map(([name]) => name), ["zed", "zed-icons", "xcode", "terminal", "jetbrains"]);
  await rm(fixture.env.DARKSTAR_NOVA_TEST_LOG);
  result = fixture.run(["6"], "", { DARKSTAR_NOVA_TEST_OS: "Linux" });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(await fixture.calls(), [
    ["zed", ""],
    ["zed-icons", ""],
    ["jetbrains", fixture.env.DARKSTAR_NOVA_JETBRAINS_PLUGINS_DIR],
  ]);
});

test("invalid or unsupported choices never start a partial installation", async (t) => {
  const fixture = await installerFixture(t);
  for (const args of [["1,99"], ["0,1"], ["*"], [""], ["--unknown"]]) {
    const result = fixture.run(args);
    assert.notEqual(result.status, 0);
    assert.deepEqual(await fixture.calls(), []);
  }
  const result = fixture.run(["1,2"], "", { DARKSTAR_NOVA_TEST_OS: "Linux" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /require macOS/);
  assert.deepEqual(await fixture.calls(), []);
});

test("exit, EOF, help, and menu previews do not install anything", async (t) => {
  const fixture = await installerFixture(t);
  for (const [args, input] of [[[], "0\n"], [[], ""], [["--help"], ""], [["--list"], ""]]) {
    const result = fixture.run(args, input);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(await fixture.calls(), []);
  }
});

test("JetBrains reads a plugins path with spaces and requires it for scripted installs", async (t) => {
  const fixture = await installerFixture(t);
  const overrides = { DARKSTAR_NOVA_JETBRAINS_PLUGINS_DIR: "" };
  let result = fixture.run(["4"], "", overrides);
  assert.notEqual(result.status, 0);
  assert.deepEqual(await fixture.calls(), []);
  result = fixture.run([], `4\n${fixture.env.DARKSTAR_NOVA_JETBRAINS_PLUGINS_DIR}\n`, overrides);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(await fixture.calls(), [["jetbrains", fixture.env.DARKSTAR_NOVA_JETBRAINS_PLUGINS_DIR]]);
});

test("a failed target is reported while remaining selected targets still run", async (t) => {
  const fixture = await installerFixture(t);
  const result = fixture.run(["1,2,3"], "", { DARKSTAR_NOVA_TEST_FAIL_TARGET: "xcode" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Could not install xcode/);
  assert.match(result.stdout, /2 succeeded \/ 1 failed/);
  assert.deepEqual((await fixture.calls()).map(([name]) => name), ["zed", "xcode", "terminal"]);
});

test("shared artwork is UCS-2 compatible with compact, ASCII, and color-free output", async (t) => {
  const fixture = await installerFixture(t);
  const wide = fixture.run(["--list"]).stdout;
  assert.match(wide, /██████/);
  assert.match(wide, /◇✦◇/);
  assert.doesNotMatch(wide, /\x1b/);
  assert.ok([...wide].every((character) => character.codePointAt(0) <= 0xffff));
  const narrow = fixture.run(["--list"], "", { COLUMNS: "40" }).stdout;
  assert.match(narrow, /D A R K S T A R/);
  assert.doesNotMatch(narrow, /██████/);
  for (const overrides of [{ DARKSTAR_NOVA_ASCII: "1" }, { TERM: "dumb" }]) {
    assert.doesNotMatch(fixture.run(["--list"], "", overrides).stdout, /[^\x00-\x7f]/);
  }
});

test("branded uninstaller preserves modified and untracked files", async (t) => {
  const fixture = await installerFixture(t);
  await mkdir(fixture.env.DARKSTAR_NOVA_STATE_HOME);
  const unchanged = resolve(fixture.root, "unchanged.theme");
  const modified = resolve(fixture.root, "modified.theme");
  const untracked = resolve(fixture.root, "untracked.theme");
  await writeFile(unchanged, "original");
  await writeFile(modified, "custom edits");
  await writeFile(untracked, "untracked");
  const digest = createHash("sha256").update("original").digest("hex");
  const manifest = resolve(fixture.env.DARKSTAR_NOVA_STATE_HOME, "installed-files.tsv");
  await writeFile(manifest, `${digest}\t${unchanged}\n${digest}\t${modified}\n`);
  let result = fixture.run(["--help"], "", {}, "uninstall.sh");
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await readFile(unchanged, "utf8"), "original");
  result = fixture.run([], "", {}, "uninstall.sh");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /DARKSTAR NOVA \/ UNINSTALLER/);
  assert.match(result.stdout, /Uninstalled 1 unchanged file\(s\); preserved 1/);
  await assert.rejects(readFile(unchanged), { code: "ENOENT" });
  assert.equal(await readFile(modified, "utf8"), "custom edits");
  assert.equal(await readFile(untracked, "utf8"), "untracked");
  assert.equal(await readFile(manifest, "utf8"), `${digest}\t${modified}\n`);
});
