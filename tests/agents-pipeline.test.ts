import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Locks the autopilot contract (MEMORY.md D-6) so it cannot be silently undone.
// Deliberately dependency-free: js-yaml is only a transitive dep and is not
// resolvable from the repo root, so frontmatter is parsed by hand.

const AGENTS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", ".agents", "agents");
const PROTOCOL_FILE = join(dirname(AGENTS_DIR), "PROTOCOL.md");

const VALID_PERMISSION_MODES = ["always_confirm", "never_confirm", "confirm_risky"];
const ALLOWED_TOOLS = ["terminal", "file_editor", "task_tracker", "browser_tool_set"];
const WRITING_AGENTS = [
  "backend-developer",
  "frontend-developer",
  "database-migration-engineer",
  "qa-test-engineer",
];

interface Frontmatter {
  name: string;
  description: string;
  tools: string[];
  permissionMode: string | null;
  model: string | null;
}

function parseFrontmatter(source: string): Frontmatter {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match, "file must start with a YAML frontmatter block");

  const fm: Frontmatter = {
    name: "",
    description: "",
    tools: [],
    permissionMode: null,
    model: null,
  };

  const lines = match[1].split(/\r?\n/);
  let section: "none" | "tools" | "description" = "none";
  const descriptionBody: string[] = [];

  for (const line of lines) {
    const listItem = line.match(/^\s+-\s+(.+)$/);
    if (section === "tools" && listItem) {
      fm.tools.push(listItem[1].trim().replace(/^["']|["']$/g, ""));
      continue;
    }
    if (section === "description" && /^\s+\S/.test(line)) {
      descriptionBody.push(line.trim());
      continue;
    }

    const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, rawValue] = kv;
    const value = rawValue.trim();

    if (key === "tools") {
      section = "tools";
      fm.tools = [];
    } else if (key === "description") {
      section = "description";
      // `>` / `|` introduce a block scalar; the body follows on indented lines.
      if (value !== ">" && value !== "|") fm.description = value;
    } else {
      section = "none";
      if (key === "name") fm.name = value;
      else if (key === "permission_mode") fm.permissionMode = value;
      else if (key === "model") fm.model = value;
    }
  }

  if (descriptionBody.length > 0) fm.description = descriptionBody.join("\n");
  return fm;
}

function agentFiles(): string[] {
  return readdirSync(AGENTS_DIR)
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .sort();
}

function readAgent(file: string): { fm: Frontmatter; body: string; source: string } {
  const source = readFileSync(join(AGENTS_DIR, file), "utf8");
  return { fm: parseFrontmatter(source), body: source, source };
}

describe("Autopilot pipeline contract (D-6)", () => {
  it("every agent file is well-formed", () => {
    const files = agentFiles();
    assert.ok(files.length >= 6, `expected at least 6 agent files, found ${files.length}`);

    for (const file of files) {
      const { fm } = readAgent(file);
      const stem = file.replace(/\.md$/, "");

      assert.equal(fm.name, stem, `${file}: 'name' must match the filename`);
      assert.ok(fm.description.trim().length > 0, `${file}: description must not be empty`);

      const examples = fm.description.match(/<example>/g) ?? [];
      assert.ok(examples.length >= 2, `${file}: needs at least 2 <example> tags`);

      assert.ok(fm.tools.length > 0, `${file}: 'tools' must list at least one tool`);
      for (const tool of fm.tools) {
        assert.ok(ALLOWED_TOOLS.includes(tool), `${file}: unknown tool '${tool}'`);
      }
    }
  });

  it("every permission_mode is a valid value", () => {
    for (const file of agentFiles()) {
      const { fm } = readAgent(file);
      assert.ok(fm.permissionMode, `${file}: permission_mode must be set`);
      assert.ok(
        VALID_PERMISSION_MODES.includes(fm.permissionMode),
        `${file}: '${fm.permissionMode}' is not a valid permission_mode`,
      );
    }
  });

  it("no agent halts on a confirmation prompt", () => {
    for (const file of agentFiles()) {
      const { fm } = readAgent(file);
      assert.notEqual(
        fm.permissionMode,
        "always_confirm",
        `${file}: always_confirm reintroduces the halt D-6 removed`,
      );
    }
  });

  it("the writing sub-agents run with never_confirm", () => {
    for (const stem of WRITING_AGENTS) {
      const { fm } = readAgent(`${stem}.md`);
      assert.equal(
        fm.permissionMode,
        "never_confirm",
        `${stem}: must be never_confirm so the pipeline does not halt`,
      );
    }
  });

  it("the delivery-lead agent exists and delegates implementation", () => {
    const { fm, body } = readAgent("delivery-lead.md");
    assert.equal(fm.name, "delivery-lead");
    assert.equal(fm.permissionMode, "never_confirm");
    assert.match(body, /Delivery Report/);
    for (const delegate of ["backend-developer", "frontend-developer", "code-reviewer"]) {
      assert.match(body, new RegExp(delegate), `delivery-lead must delegate to ${delegate}`);
    }
  });

  it("PROTOCOL.md still declares the abort list and the merge gate", () => {
    const protocol = readFileSync(PROTOCOL_FILE, "utf8");

    assert.match(protocol, /Autonomy policy/i);
    assert.match(protocol, /Abort the item and report/i);
    assert.match(protocol, /There is no third category/i);
    assert.match(protocol, /Merge gate/i);
    assert.match(protocol, /Delivery Report/);

    // The specific invariants the abort list protects must still be named.
    for (const invariant of [
      "webhook signature",
      "fail-closed",
      "findDeletionBlockers",
      "plans.ts",
    ]) {
      assert.match(protocol, new RegExp(invariant), `abort list must name '${invariant}'`);
    }
  });

  it("the tool-managed AGENTS.md markers are intact", () => {
    const agents = readFileSync(join(dirname(AGENTS_DIR), "..", "AGENTS.md"), "utf8");
    for (const marker of [
      "BEGIN:nextjs-agent-rules",
      "END:nextjs-agent-rules",
      "BEGIN:reui-agent-rules",
      "END:reui-agent-rules",
    ]) {
      assert.ok(agents.includes(marker), `AGENTS.md is missing marker '${marker}'`);
    }
  });
});
