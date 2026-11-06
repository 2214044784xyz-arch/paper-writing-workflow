# 论文改写工作台（Paper Revision Workbench）

一个装进 DeepSeek Harness Web 界面的工作流面板：把论文放进去、勾选七套写作技巧、追加你自己的指令，一键生成可执行的改稿任务单，并直接交给当前会话的模型执行。

它把 `.dsh/skills/paper-writing` 里的七套技巧（Humanizer、Humanizer-zh、Stop-Slop、AI-Flavor-Remover、ShuorenHua、De-AI-Prompt-Enhancer、Writing Agent）做成可勾选的组合，而不是每次重新贴 prompt。

> 规则表位置默认按 `<工作区>/.dsh/skills/paper-writing` 解析；如果 skill 放在别处（例如本仓库的 `skills/paper-writing`），在插件的 Loader 行里加 `config.skillsRoot`，或把 `skills/paper-writing` 复制到工作区 `.dsh/skills/paper-writing`。

---

## 怎么打开

- 左侧栏「全局面板」里点 **论文改写工作台**（排在插件、定时任务之后）；或
- 对话输入框上方点 **✎ 论文改写工作台**。

面板内部三栏：

| 栏 | 内容 |
| --- | --- |
| 左 | ① 放入文档（拖拽 / 选择 / 直接粘贴）· ② 任务设置（模式、力度、阶段）· ③ 最近任务 |
| 中 | 七张技巧卡（点击勾选，点摘要展开详情）· 可扩展指令库 · 工作流自检 |
| 右 | 任务单实时预览 · 将要落盘的文件 · 交付要求 |

## 文档怎么进来

- `.md` / `.txt`：直接读。
- `.docx`：浏览器内解压 zip 并解析 `word/document.xml`，**保留标题层级（Heading → `#`）与表格（→ 管道行）**，不联网、不上传第三方。
- `.doc`、扫描版 PDF：面板会明确报错，请另存为 `.docx` 或 `.md`。
- 任何格式都可以直接粘贴正文。

超长文档会被自动截断为 30k 字内联进任务单，完整正文始终保存在 `document.md`。

## 生成后发生什么

1. 面板把 JSON 任务（文档、勾选技巧、自定义指令、模式、力度、阶段）通过客户端 `remote.commands.execute` 交给宿主命令 `/writing-workflow`。
2. 宿主写入：
   ```
   .dsh/writing-workflow/runs/<时间>-<文档>/request.md      ← 任务合同（模型读这个）
   .dsh/writing-workflow/runs/<时间>-<文档>/document.md     ← 原文档全文
   .dsh/writing-workflow/runs/<时间>-<文档>/payload.json    ← 机器可读快照（含 sha256）
   .dsh/writing-workflow/runs.jsonl                          ← 任务索引
   .dsh/writing-workflow/memory.json                         ← 自定义指令库（跨会话）
   ```
3. 宿主用 `agent.inject()` 把一段「读取任务单并开始」的用户消息放进下一步，因此即使会话空闲也会被唤醒。

任务单里已经写死了：语言路由、勾选技巧各自的「怎么用」、本次阶段、你的追加指令、五条不可逾越的护栏（事实锁定 / 保护区 / 分节力度 / 保留 hedging / 不追检测率），以及五份交付物（scan-report / fact-ledger / revised / revision-table + 风险提示）。

## 七套技巧各自管哪一层

| 技巧 | 层 | 一句话 |
| --- | --- | --- |
| Writing Agent | 结构 | 从选题立场到传播测试的完整流水线，适合长篇深度内容 |
| ShuorenHua | 事实 | 先保护事实信息，再按场景与力度做最小必要修改 |
| Humanizer（EN） | 风格 | 维基百科「Signs of AI writing」的 26 条，专治英文 AI 腔 |
| Humanizer-zh | 语法 | 中文 21 条可核对痕迹（另有 36 条六类分支） |
| Stop-Slop | 硬规则 | 八条绝对命令：停套路、删填充、破结构、用主动语态 |
| AI-Flavor-Remover | 执行 | 禁语黑名单 + 四段式可审查输出 |
| De-AI-Prompt-Enhancer | 前置 | 先把「润色一下」改写成带约束的执行合同 |

每张卡片里的「论文场景的坑」是这套组合最重要的部分：沿用上游原规则在学术写作里会出事的地方（被动语态、hedging、三点贡献、破折号规范）都单独标注了。

## 往上加东西（可扩展模块）

三种加法，都不需要改代码：

1. **加指令**：面板中部「+ 新增指令」→ 填名称、归类、内容 → 存入规则库。
   规则库同步到 `.dsh/writing-workflow/memory.json`，跨会话保留；每条可单独启用/停用。
   写入任务单时，自定义指令的优先级高于技巧默认值、低于事实锁定。
2. **加技巧**：编辑 `client.js` 里的 `SKILLS` 数组，加一项
   `{ id, glyph, label, labelEn, layer, summary, facts, readme, what, when, caution, apply }`，
   面板、预览、任务单三处会同时生效。`readme` 指向 `.dsh/skills/paper-writing/references/` 里的规则原文。
3. **加阶段**：编辑 `STAGES`（阶段列表）与 `MODES`（每种模式默认跑哪些阶段）。

任务单的正文模板在宿主 `index.js` 的 `buildRequestMarkdown()`：要改「执行顺序」「护栏」「交付清单」，改这里一处即可。

## 开发与自测

```powershell
$node = "C:\Users\15919\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe"
$node --check index.js
$node --check client.js
$node test\smoke-client.mjs   # 槽位注册、面板渲染、技巧卡/指令库/预览
$node test\smoke-host.mjs     # 命令落盘、注入消息、规则库、任务索引、删除
$node test\docx-parse.mjs     # 真实 .docx → 保留段落/表格的正文
```

`test/docx-parse.mjs` 用 Node 24 原生的 `Blob/Response/DecompressionStream` 加一个只读的假 XML DOM，跑的是面板里**同一份** `extractDocument` 代码。

## 安装状态

- 包名：`@local/writing-workflow`（本地 link 安装，profile: `desktop`）
- 宿主半：注册 `/writing-workflow` 命令（`compose` / `memory.get` / `memory.put` / `runs.list` / `runs.delete`）
- 客户端半：`sidebar.panellist`（图标）、`main`（面板）、`conversation.composer.dock`（启动按钮）
- 只使用主题 token（`--dsw-alias-*`），不依赖任何 Harness Client 包
