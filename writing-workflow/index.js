/**
 * Host half of the Paper Revision Workbench bundle.
 *
 * Responsibilities:
 *  - stage one workflow run into `.dsh/writing-workflow/runs/<runId>/`
 *    (payload, request brief, document text, index entry);
 *  - keep the durable instruction library (`memory.json`) that the panel appends to;
 *  - expose everything through the human command `/writing-workflow`, which the
 *    Client panel invokes through `ctx.remote.commands.execute`.
 *
 * The rendered panel and all document parsing live in `client.js`.
 */

import { createHash, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile, appendFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const name = '@local/writing-workflow';

export const inject = ['commands', 'fs'];

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.resolve(HERE, '..', '.dsh', 'skills', 'paper-writing');
const WORK_ROOT_NAME = path.join('.dsh', 'writing-workflow');

const MAX_DOCUMENT_CHARS = 240_000;
const MAX_INLINE_CHARS = 30_000;

/* ------------------------------------------------------------------ helpers */

function oneLine(value, fallback = '') {
  if (typeof value !== 'string') return fallback;
  const flat = value.replace(/\s+/g, ' ').trim();
  return flat === '' ? fallback : flat;
}

function safeSegment(value, fallback) {
  const flat = oneLine(value, fallback)
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-')
    .replace(/^[-. ]+|[-. ]+$/g, '')
    .slice(0, 60);
  return flat === '' ? fallback : flat;
}

function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function isInside(parent, child) {
  const rel = path.relative(parent, child);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

function timestamp(iso) {
  const date = new Date(iso);
  const valid = Number.isNaN(date.getTime()) ? new Date() : date;
  const pad = (n) => String(n).padStart(2, '0');
  return [
    valid.getFullYear(),
    pad(valid.getMonth() + 1),
    pad(valid.getDate()),
    '-',
    pad(valid.getHours()),
    pad(valid.getMinutes()),
    pad(valid.getSeconds()),
  ].join('');
}

function asciiSlug(value) {
  const direct = oneLine(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
  if (direct !== '') return direct;
  return sha256(String(value)).slice(0, 8);
}

function renderList(items, indent = '') {
  if (!items || items.length === 0) return `${indent}- （未指定）`;
  return items.map((item) => `${indent}- ${item}`).join('\n');
}

/* ------------------------------------------------------- request brief */

/**
 * Compose `request.md`, the brief the agent reads before touching the paper.
 * It restates the user's own choices so the model never has to guess.
 */
function buildRequestMarkdown({ runId, createdAt, pack, document, skills, customRules, routing, mode, intensity, stageIds }) {
  const selected = Array.isArray(skills) ? skills : [];
  const rules = Array.isArray(customRules) ? customRules : [];
  const stages = Array.isArray(stageIds) ? stageIds : [];
  const lines = [];

  lines.push(`# 论文写作 / 修改任务单（${runId}）`, '');
  lines.push(`- 生成时间：${createdAt}`);
  lines.push(`- 文档：${document.name}（${document.format}，${document.chars} 字）`);
  lines.push(`- 语言路由：${routing.language}${routing.note ? `（${routing.note}）` : ''}`);
  lines.push(`- 任务模式：${mode}`);
  lines.push(`- 改写力度：${intensity}`);
  lines.push('');

  lines.push('## 一、用户勾选的技巧组合', '');
  if (selected.length === 0) {
    lines.push('- 未勾选任何技巧：仅按本任务单的通用护栏执行。');
  } else {
    for (const skill of selected) {
      lines.push(`### ${skill.label}${skill.labelEn ? ` / ${skill.labelEn}` : ''}`, '');
      lines.push(`- 管的那一层：${skill.layer}`);
      lines.push(`- 一句话：${skill.summary}`);
      if (skill.apply) lines.push(`- 本次怎么用：${skill.apply}`);
      if (skill.readme) lines.push(`- 规则原文：\`${skill.readme}\`（动手前先读）`);
      lines.push('');
    }
  }
  lines.push('');

  if (stages.length > 0) {
    lines.push('## 二、本次要走的阶段', '');
    lines.push(stages.map((stage) => `- ${stage}`).join('\n'));
    lines.push('');
  }

  lines.push('## 三、用户追加的指令（层级高于技巧默认值，低于事实锁定）', '');
  if (rules.length === 0) {
    lines.push('- 无。不要自行发明额外规则。');
  } else {
    for (const rule of rules) {
      const tag = rule.category ? `[${rule.category}] ` : '';
      lines.push(`- **${tag}${rule.name}**：${rule.text}`);
    }
  }
  lines.push('');

  lines.push('## 四、执行顺序（合并七套技巧后的主线）', '');
  lines.push(
    [
      '1. **P0 诊断**：先跑 `.dsh/skills/paper-writing/scripts/ai_trace_scan.py --json <文档>`，按节统计痕迹密度；把结果写进报告，不要跳过。',
      '2. **P4 事实台账**：列出全部数字、年份、样本量、系数、显著性、`[n]` 引文、变量名、方法名、结论方向。改写前锁定，改写后逐条核对。',
      '3. **P5 硬规则清理**：按勾选的硬规则技巧删除填充语、套话、机械排比、破折号、名词化；不改结构主张。',
      '4. **P6 表达还原**：按勾选的「说人话 / 去味」技巧把句子拉回真实表达；只做同义重述与句序重排。',
      '5. **P7 审稿视角**：逐段问 claim / evidence / warrant，指出缺哪一环；最后给「必改 / 建议改 / 不必改」。',
      '6. **交付**：改稿正文 + 三列对照表（原句 / 改句 / 理由）+ 风险提示 + 自检 10 问结果。',
    ].join('\n'),
  );
  lines.push('');

  lines.push('## 五、不可逾越的护栏（优先于任何风格指令）', '');
  lines.push(
    [
      '- 不新增事实：不加文献、数据、因果、政策建议；不把「相关」写成「影响」。',
      '- 保护区逐字保留：数字、`[n]` 引文标记、变量名（如 `Exposure_{i,t}`）、英文术语、引号内原文、图表题注。',
      '- 分节力度：摘要 / 引言 / 综述可重写；方法 / 结果只做轻度清理；结论只改表述不改边界。',
      '- 保留学术 hedging（可能 / 在一定程度上 / 初步证据）；「去 AI 味」不得删掉认识论上的谨慎。',
      '- 每处改动给「原句 → 改句 → 理由」，理由只写删了什么、合了什么、换了什么，不写「更通顺」。',
      '- 检测率不是验收标准：不承诺、不追逐 AIGC 检测分数。',
      '- 一次一段，单段 ≤ 400 字；整篇先出报告再分批。',
      '- 只输出改稿与说明，不替作者判断结论是否成立；涉及主张时提问。',
    ].join('\n'),
  );
  lines.push('');

  lines.push('## 六、交付清单', '');
  lines.push(
    [
      '1. `scan-report.md`：诊断结果（可复用扫描脚本输出，补充你的判读）。',
      '2. `fact-ledger.md`：事实台账（每条不可动信息一行）。',
      '3. `revised.md`：改后全文或改后分节（保留原小标题编号）。',
      '4. `revision-table.md`：原句 / 改句 / 理由三列。',
      '5. 结尾两句话：复述改后主张 + 指出最需要作者确认的一处。',
    ].join('\n'),
  );
  lines.push('');

  lines.push('## 七、文档正文', '');
  const body = pack.body || '';
  if (body.length > MAX_INLINE_CHARS) {
    lines.push(
      `> 正文 ${body.length} 字，超过本单内联上限；请先完整读取 \`${pack.documentPath}\` 再动笔。以下仅为开头 ${MAX_INLINE_CHARS} 字。`,
      '',
      '```text',
      body.slice(0, MAX_INLINE_CHARS),
      '```',
      '',
      '（此处截断。）',
    );
  } else {
    lines.push('```text', body, '```');
  }
  lines.push('');
  return lines.join('\n');
}

/* ----------------------------------------------------------- run store */

async function readMemory(memoryPath) {
  try {
    const raw = await readFile(memoryPath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      rules: Array.isArray(parsed.rules) ? parsed.rules : [],
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null,
    };
  } catch {
    return { rules: [], updatedAt: null };
  }
}

async function writeJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function stageRun(rootDir, payload, baseDir = rootDir) {
  const runId = `${timestamp(payload.createdAt)}-${asciiSlug(payload.runLabel || payload.document?.name || 'run')}`;
  const runDir = path.join(rootDir, 'runs', runId);
  if (!isInside(path.join(rootDir, 'runs'), runDir)) {
    throw new Error('拒绝写入工作区之外的路径');
  }
  const documentName = safeSegment(payload.document?.name, 'document');
  const documentPath = path.join(runDir, documentName.endsWith('.md') ? documentName : `${documentName}.md`);
  const body = typeof payload.document?.text === 'string' ? payload.document.text : '';

  await mkdir(runDir, { recursive: true });

  const pack = {
    runId,
    body,
    documentPath: path.relative(baseDir, documentPath).split(path.sep).join('/'),
  };
  const requestMarkdown = buildRequestMarkdown({
    runId,
    createdAt: payload.createdAt,
    pack,
    document: {
      name: payload.document?.name || 'document',
      format: payload.document?.format || 'text',
      chars: body.length,
    },
    skills: payload.skills,
    customRules: payload.customRules,
    routing: payload.routing || { language: '中文', note: null },
    mode: payload.mode || '改旧稿',
    intensity: payload.intensity || '中',
    stageIds: payload.stageIds,
  });

  await writeFile(documentPath, body, 'utf8');
  await writeFile(path.join(runDir, 'request.md'), requestMarkdown, 'utf8');
  await writeJson(path.join(runDir, 'payload.json'), {
    ...payload,
    document: {
      ...(payload.document || {}),
      textSha256: sha256(body),
      stagedPath: pack.documentPath,
    },
    stagedAt: new Date().toISOString(),
  });

  const indexRow = {
    runId,
    createdAt: payload.createdAt,
    document: payload.document?.name || 'document',
    documentChars: body.length,
    skills: Array.isArray(payload.skills) ? payload.skills.map((skill) => skill.id) : [],
    ruleCount: Array.isArray(payload.customRules) ? payload.customRules.length : 0,
    mode: payload.mode || '改旧稿',
    intensity: payload.intensity || '中',
    dir: path.relative(rootDir, runDir).split(path.sep).join('/'),
  };
  await appendFile(path.join(rootDir, 'runs.jsonl'), `${JSON.stringify(indexRow)}\n`, 'utf8');

  return { runId, runDir, documentPath, requestPath: path.join(runDir, 'request.md'), requestMarkdown, indexRow };
}

async function readIndex(rootDir) {
  try {
    const raw = await readFile(path.join(rootDir, 'runs.jsonl'), 'utf8');
    return raw
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter((row) => row !== null)
      .slice(-40)
      .reverse();
  } catch {
    return [];
  }
}

/* --------------------------------------------------------- agent brief */

/**
 * Build a user-role message for `agent.inject`.
 *
 * `agent.inject(input)` takes a complete `UserMessage` (`{id, role, content,
 * source}`) and appends it to the next-step inbox; it reaches the model as a
 * normal user message at the next step, before the next prompt. The object is
 * hand-built on purpose: the Host's own `createUserMessage` lives in
 * `@deepseek-ai/dsh-llm`, which a profile-installed bundle must not assume it
 * can import, while the inbox path only needs exactly these four fields — a
 * non-empty `id`, `role: 'user'`, a content array, and a non-empty
 * `source.kind` (read by the agent loop when the message is consumed).
 */
function instructionMessage(text) {
  return {
    id: randomUUID(),
    role: 'user',
    content: [{ type: 'text', text }],
    source: { kind: 'writing-workflow' },
  };
}

function injectionText({ runId, requestPath, documentName, selectedCount, ruleCount, rootDir }) {
  return [
    `【论文改写工作台】已生成一次改稿任务：${runId}`,
    `文档：${documentName}；勾选技巧 ${selectedCount} 套；自定义指令 ${ruleCount} 条。`,
    '',
    `请立刻读取 \`${path.relative(rootDir, requestPath).split(path.sep).join('/')}\`，把它当作本次任务的完整合同，然后按其中「执行顺序」推进。`,
    '三条硬要求：',
    '1. 先读任务单，再读 `.dsh/skills/paper-writing/SKILL.md` 与勾选技巧对应的 `references/*.md`；不要凭记忆套规则。',
    '2. 先跑 `scripts/ai_trace_scan.py` 出诊断，再动笔；事实台账（Fact Ledger）在改写之前完成。',
    '3. 交付改稿正文 + 原句/改句/理由三列 + 风险提示；不承诺检测率。',
  ].join('\n');
}

/* ------------------------------------------------------------ plugin */

export function apply(ctx, config = {}) {
  const rootDir = path.resolve(typeof config.rootDir === 'string' && config.rootDir !== '' ? config.rootDir : process.cwd());
  const workRoot = path.join(rootDir, WORK_ROOT_NAME);
  const memoryPath = path.join(workRoot, 'memory.json');
  /* Rule table location: explicit config → DSH's skill root → sibling checkout. */
  const configuredSkills =
    typeof config.skillsRoot === 'string' && config.skillsRoot !== ''
      ? path.resolve(rootDir, config.skillsRoot)
      : existsSync(path.join(rootDir, '.dsh', 'skills', 'paper-writing'))
        ? path.join(rootDir, '.dsh', 'skills', 'paper-writing')
        : SKILL_ROOT;

  const stage = async (payload) => {
    if (typeof payload?.document?.text !== 'string' || payload.document.text.trim() === '') {
      throw new Error('没有文档正文，无法生成任务单');
    }
    if (payload.document.text.length > MAX_DOCUMENT_CHARS) {
      throw new Error(`文档超过 ${MAX_DOCUMENT_CHARS} 字，请分节提交`);
    }
    return stageRun(workRoot, payload, rootDir);
  };

  const report = (run, extra = {}) => {
    const rel = (p) => path.relative(rootDir, p).split(path.sep).join('/');
    return {
      ok: true,
      runId: run.runId,
      runDir: rel(run.runDir),
      requestPath: rel(run.requestPath),
      documentPath: rel(run.documentPath),
      summary: `${run.indexRow.document} · ${run.indexRow.skills.length} 套技巧 · ${run.indexRow.ruleCount} 条自定义指令`,
      ...extra,
    };
  };

  ctx.effect(
    () =>
      ctx.commands.register({
        name: 'writing-workflow',
        description: '论文改写工作台：接收面板生成的 JSON 任务，落盘任务单并注入执行指令（由面板调用）',
        input: { hint: '<json payload>' },
        recordInput: false,
        handler: async (invocation) => {
          let payload;
          try {
            payload = JSON.parse(invocation.rawInput);
          } catch {
            return { kind: 'error', text: 'writing-workflow：输入不是合法 JSON' };
          }
          try {
            switch (payload.action) {
              case 'compose': {
                const run = await stage(payload);
                const target = invocation.agent ?? ctx.get('agents')?.get(invocation.agent?.id);
                const selectedCount = run.indexRow.skills.length;
                if (target && typeof target.inject === 'function') {
                  try {
                    target.inject(
                      instructionMessage(
                        injectionText({
                          runId: run.runId,
                          requestPath: run.requestPath,
                          documentName: run.indexRow.document,
                          selectedCount,
                          ruleCount: run.indexRow.ruleCount,
                          rootDir,
                        }),
                      ),
                    );
                  } catch (error) {
                    ctx.logger?.warn?.(`writing-workflow: inject failed: ${error instanceof Error ? error.message : String(error)}`);
                  }
                }
                return {
                  kind: 'success',
                  text: [
                    `已生成改稿任务单：${run.indexRow.document}`,
                    `- 目录：\`${path.relative(rootDir, run.runDir).split(path.sep).join('/')}\``,
                    `- 任务单：\`${path.relative(rootDir, run.requestPath).split(path.sep).join('/')}\``,
                    `- 技巧 ${selectedCount} 套 · 自定义指令 ${run.indexRow.ruleCount} 条 · 力度 ${run.indexRow.intensity}`,
                    '',
                    '接下来：读取任务单 → 跑诊断脚本 → 建事实台账 → 按阶段改稿。',
                  ].join('\n'),
                };
              }
              case 'memory.get': {
                const memory = await readMemory(memoryPath);
                return { kind: 'success', text: JSON.stringify({ ...memory, skillsRoot: configuredSkills }) };
              }
              case 'memory.put': {
                const rules = Array.isArray(payload.rules) ? payload.rules.slice(0, 200) : [];
                const value = { rules, updatedAt: new Date().toISOString() };
                await writeJson(memoryPath, value);
                return { kind: 'success', text: JSON.stringify(value) };
              }
              case 'runs.list': {
                const rows = await readIndex(workRoot);
                return { kind: 'success', text: JSON.stringify({ rows }) };
              }
              case 'runs.delete': {
                const runId = oneLine(payload.runId, '');
                if (runId === '' || !/^[\w.-]+$/.test(runId)) {
                  return { kind: 'error', text: 'runs.delete：runId 非法' };
                }
                const target = path.join(workRoot, 'runs', runId);
                if (!isInside(path.join(workRoot, 'runs'), target)) {
                  return { kind: 'error', text: 'runs.delete：路径越界' };
                }
                if (existsSync(target)) {
                  await rm(target, { recursive: true, force: true });
                }
                return { kind: 'success', text: JSON.stringify({ deleted: runId }) };
              }
              default:
                return { kind: 'error', text: `writing-workflow：未知 action「${String(payload.action)}」` };
            }
          } catch (error) {
            return {
              kind: 'error',
              text: `writing-workflow 失败：${error instanceof Error ? error.message : String(error)}`,
            };
          }
        },
      }),
    'writing-workflow: command',
  );
}
