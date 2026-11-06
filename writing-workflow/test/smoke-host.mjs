/**
 * Smoke test for writing-workflow/index.js.
 *
 * Exercises the Host command directly: compose → files on disk, memory
 * round-trip, runs list, and deletion. No Harness runtime is required.
 */
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile, mkdir, stat, readdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.join(HERE, '..', 'index.js');

const root = await mkdtemp(path.join(os.tmpdir(), 'wwp-host-'));
const skillRoot = path.join(root, '.dsh', 'skills', 'paper-writing', 'references');
await mkdir(skillRoot, { recursive: true });
await writeFile(path.join(skillRoot, '02-humanizer-zh.md'), '# reference stub\n', 'utf8');

const mod = await import(`${pathToFileURL(PLUGIN).href}?t=${Date.now()}`);

let definition = null;
const injected = [];
const agent = {
  id: 'session-test',
  session: { id: 'session-test' },
  inject(message) {
    injected.push(message);
  },
};
const ctx = {
  effect(fn) {
    const disposer = fn();
    return typeof disposer === 'function' ? disposer : () => {};
  },
  commands: {
    register(candidate) {
      definition = candidate;
      return () => {};
    },
  },
  get(name) {
    if (name === 'agents') return { get: (id) => (id === agent.id ? agent : undefined) };
    return undefined;
  },
  logger: { warn() {} },
};

mod.apply(ctx, { rootDir: root });
assert.ok(definition, 'plugin must register a command');
assert.equal(definition.name, 'writing-workflow');

const invoke = (payload) => definition.handler({ rawInput: JSON.stringify(payload), agent, signal: new AbortController().signal, attachments: [], commandId: 'c1' });

/* ---- compose ------------------------------------------------------------ */

const payload = {
  action: 'compose',
  createdAt: '2026-11-06T12:00:00.000Z',
  runLabel: 'fixture-paper.docx',
  document: {
    name: 'fixture-paper.docx',
    format: 'docx',
    text: '# 一、引言\n\n这是一段用于离线测试的示例正文。近年来，相关研究不断积累。研究表明，变量 A 与变量 B 存在相关关系。\n\n本研究具有重要的理论意义。',
  },
  skills: [
    { id: 'humanizer-zh', label: 'Humanizer-zh', labelEn: 'Chinese 24 traces', layer: '语法', summary: '中文 AI 痕迹', apply: '逐条扫描并标注编号', readme: '.dsh/skills/paper-writing/references/02-humanizer-zh.md' },
  ],
  customRules: [{ name: '禁用综上所述', category: '用词', text: '段首不得出现「综上所述」。' }],
  routing: { language: '中文', note: null },
  mode: '改旧稿',
  intensity: '中',
  stageIds: ['P0', 'P4', 'P5', 'P6', 'P7'],
};

const result = await invoke(payload);
assert.equal(result.kind, 'success', result.text);
assert.ok(result.text.includes('已生成改稿任务单'), result.text);

const runsDir = path.join(root, '.dsh', 'writing-workflow', 'runs');
const runIds = await readdir(runsDir);
assert.equal(runIds.length, 1, 'one run directory');
const runDir = path.join(runsDir, runIds[0]);
const request = await readFile(path.join(runDir, 'request.md'), 'utf8');
assert.ok(request.includes('禁用综上所述'), 'custom rule reaches the brief');
assert.ok(request.includes('P0 诊断'), 'stage plan reaches the brief');
assert.ok(request.includes('不可逾越的护栏'), 'guardrails reach the brief');
assert.ok(request.includes('02-humanizer-zh.md'), 'reference path reaches the brief');
assert.ok(request.includes('这是一段用于离线测试的示例正文'), 'document body reaches the brief');
assert.equal(injected.length, 1, 'agent receives one injected user message');
const message = injected[0];
assert.ok(message && message.role === 'user', 'injected object is a user message');
assert.ok(Array.isArray(message.content) && message.content[0].type === 'text', 'injected content is a text block');
assert.ok(String(message.content[0].text).includes('request.md'), 'injection points at the brief');
assert.ok(message.source && typeof message.source.kind === 'string' && message.source.kind.length > 0, 'source kind present');

const stored = JSON.parse(await readFile(path.join(runDir, 'payload.json'), 'utf8'));
assert.equal(stored.document.textSha256.length, 64);
assert.ok(stored.document.stagedPath.startsWith('.dsh/writing-workflow/runs/'));
assert.ok((await stat(path.join(root, stored.document.stagedPath))).size > 0);
assert.ok(stored.document.stagedPath.length > 0);

/* ---- memory ------------------------------------------------------------- */

const put = await invoke({ action: 'memory.put', rules: [{ id: 'r1', name: '禁用综上所述', category: '用词', text: '段首不得出现。' }] });
assert.equal(put.kind, 'success');
const got = JSON.parse((await invoke({ action: 'memory.get' })).text);
assert.equal(got.rules.length, 1);
assert.ok(got.skillsRoot.includes('paper-writing'), 'skills root reported');

/* ---- runs --------------------------------------------------------------- */

const list = JSON.parse((await invoke({ action: 'runs.list' })).text);
assert.equal(list.rows.length, 1);
assert.equal(list.rows[0].document, 'fixture-paper.docx');
assert.deepEqual(list.rows[0].skills, ['humanizer-zh']);

const removed = await invoke({ action: 'runs.delete', runId: runIds[0] });
assert.equal(removed.kind, 'success');
assert.equal((await readdir(runsDir)).length, 0);

/* ---- failures stay explicit -------------------------------------------- */

const empty = await invoke({ action: 'compose', document: { name: 'x', text: '   ' } });
assert.equal(empty.kind, 'error');
const illegal = await invoke({ action: 'runs.delete', runId: '../../etc' });
assert.equal(illegal.kind, 'error');

await rm(root, { recursive: true, force: true });
console.log('host smoke test: OK');








