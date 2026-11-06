# Paper Writing Workflow

把七套开源写作/去 AI 味技巧整合成一个可组合的论文写作与修改工作流：一部分是给 agent 用的 **skill**（规则、阶段、扫描脚本），一部分是装进 DeepSeek Harness Web 界面的 **可视化工作台**（放文档、勾技巧、加自己的指令、一键生成改稿任务单）。

```
paper-writing-workflow/
├── skills/paper-writing/     # 可移植 skill：八阶段流水线 + 七套技巧规则 + 扫描脚本 + 样例
└── writing-workflow/         # Harness Web UI 插件：论文改写工作台（面板 + 宿主命令）
```

## 这七套技巧各自管一层

| 来源 | 它真正管的那一层 | 一句话 |
| --- | --- | --- |
| [Writing Agent](https://github.com/dongbeixiaohuo/writing-agent) | 结构 | 从选题立场到传播测试的全流程骨架，适合长篇深度内容 |
| [ShuorenHua](https://github.com/MrGeDiao/shuorenhua) | 事实 | 先锁定事实，再按场景与力度做最小必要修改 |
| [Humanizer](https://github.com/blader/humanizer) | 风格 | 英文 26 条 AI 写作痕迹（基于维基百科 "Signs of AI writing"） |
| [Humanizer-zh](https://github.com/ai-zixun/humanizer-zh) | 语法 | 中文 21 条可核对痕迹（另有 moli238 的 36 条六类分支） |
| [stop-slop](https://github.com/hardikpandya/stop-slop) | 硬规则 | 八条绝对命令：停套路、删填充、破结构、用主动语态 |
| [AI-Flavor-Remover](https://github.com/hylarucoder/ai-flavor-remover) | 执行 | 禁语黑名单 + 句式节奏改造 + 四段式可审查输出 |
| [De-AI-Prompt-Enhancer](https://github.com/OUBIGFA/De-AI-Prompt-Enhancer-Writer-Booster-SKILL) | 前置 | 先把「润色一下」改写成带约束的执行合同 |

单独用任何一套都会在别的层过度或不足，所以 `skills/paper-writing` 把它们拆成可组合的工序，而不是让你一次把所有规则拉满。

## skills/paper-writing：给 agent 的规则包

八阶段主线：**P0 诊断 → P1 立场 → P2 骨架 → P3 草稿 → P4 事实台账 → P5 硬规则 → P6 表达还原 → P7 审稿**（P8 是可选的前置 prompt 优化）。

- `SKILL.md` — 入口：五条铁律、阶段表、分节力度表、路由、执行规范、交付前 10 问
- `references/01`–`09` — 七套技巧的逐条整理 + 学术护栏 + 可直接复制的 7 条 prompt
- `scripts/ai_trace_scan.py` — 中英双语 AI 痕迹扫描器（`.md` / `.txt` / `.docx`）
- `assets/revision-report.md` — 改稿报告模板
- `demo/` — 本地自留的对照样例（真实文献综述，**不随仓库分发**，已在 `.gitignore` 中排除）
- `vendor/` — 七个上游 skill 的原文副本，便于溯源与核对出处

核心约束（也是这个仓库的主张）：

1. **事实锁定**：改写前先列 Fact Ledger（数字、年份、样本量、系数、`[n]` 引文、变量名、结论方向）。
2. **分节力度**：摘要/引言/综述可重写；方法/结果只做轻度清理；结论只改表述不改边界。
3. **不新增事实**：只做同义重述与结构重排。
4. **可回溯**：每处改动给「原句 → 改句 → 理由」。
5. **检测率不是 KPI**：目标是证据密度、逻辑链、可读性。

## writing-workflow：装进 Harness 的工作台

一个 DeepSeek Harness 插件（Host 半 + Client 半），侧边栏一个图标、中间一个三栏面板：

- **左**：拖拽/选择/粘贴文档（`.md` `.txt` `.docx`，docx 在浏览器内解压解析并保留标题层级与表格）；任务模式、力度、阶段；最近任务
- **中**：七张技巧卡（点摘要展开「它管什么 / 什么时候用 / 论文场景的坑 / 本次怎么执行 / 规则原文路径」）+ **可扩展指令库**（新增、编辑、逐条启用，持久化到 `.dsh/writing-workflow/memory.json`）
- **右**：任务单实时预览 + 将要落盘的文件 + 交付要求

点「生成任务单并开始」后，宿主会写入：

```
.dsh/writing-workflow/runs/<时间>-<文档>/request.md    # 任务合同（模型读这个）
.dsh/writing-workflow/runs/<时间>-<文档>/document.md   # 原文档全文
.dsh/writing-workflow/runs/<时间>-<文档>/payload.json  # 机器可读快照（含 sha256）
.dsh/writing-workflow/runs.jsonl                        # 任务索引
```

并用 `agent.inject()` 把「读取任务单并开始」放进下一步，空闲会话也会被唤醒。

### 安装

需要 DeepSeek Harness（`dsh` profile 形态）：

```powershell
# 在本仓库根目录
dsh plugin install ./writing-workflow
```

或在 Web GUI 的插件管理里把 `writing-workflow` 目录作为本地 bundle 安装。安装后在左侧栏「全局面板」点 **论文改写工作台**，或对话输入框上方点 **✎ 论文改写工作台**。

### 自测

```powershell
cd writing-workflow
node --check index.js
node --check client.js
node test/smoke-client.mjs   # 槽位注册、面板渲染、技巧卡/指令库/预览
node test/smoke-host.mjs     # 命令落盘、注入消息、规则库、任务索引、删除
node test/docx-parse.mjs     # 真实 .docx → 保留段落/表格的正文
```

## 扩展

- **加指令**：界面里直接加，进规则库，不需要改代码
- **加技巧**：在 `writing-workflow/client.js` 的 `SKILLS` 数组加一项（`readme` 指向 `skills/paper-writing/references/` 里的规则原文）
- **加阶段**：改 `STAGES` / `MODES`
- **改任务单模板**：改 `writing-workflow/index.js` 的 `buildRequestMarkdown()`

详见 [`writing-workflow/README.md`](writing-workflow/README.md) 与 [`skills/paper-writing/SKILL.md`](skills/paper-writing/SKILL.md)。

## 出处与许可

`skills/paper-writing` 是对七个上游开源 skill 的**再组织与中文场景适配**，不是原创规则表：上游原文副本在 `skills/paper-writing/vendor/`，各文件头注明了来源仓库与版本。`writing-workflow` 插件代码为本仓库原创，MIT。

学术写作的「机器感」有一部分是规范（hedging、术语一致、可复现），本项目的目标是证据密度和可读性，不是过检测工具。请在学术诚信的边界内使用。
