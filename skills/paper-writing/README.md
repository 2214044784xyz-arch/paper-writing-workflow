# paper-writing：论文写作 / 修改工作流 Skill

把七个开源写作技能（Humanizer、Humanizer-zh、stop-slop、AI-Flavor-Remover、ShuorenHua、De-AI-Prompt-Enhancer、Writing Agent）拆成一套**可按阶段调用**的中文学术论文写作与改稿流程。

不是「一键去 AI 味」。它的核心主张是：**先判断这一节该不该动，再决定怎么动。**

---

## 1. 安装位置

本目录已经是 DSH 的项目级 skill 根目录下的一员，打开即可用：

```
<工作区>/.dsh/skills/paper-writing/
```

DSH 会按以下优先级扫描（前面的覆盖后面的）：

| 优先级 | 路径 | 用途 |
| --- | --- | --- |
| 100 | `<项目>/.dsh/skills/` | 当前项目（**本 skill 在这里**） |
| 200 | `<项目>/.agents/skills/` | 跨工具兼容 |
| 400 | `~/.dsh/skills/` | 个人全局 |
| 500 | `~/.agents/skills/` | 个人全局（跨工具） |

换到别的工具也能用（Agent Skills 格式通用）：

- Claude Code：复制到 `~/.claude/skills/paper-writing/`
- Codex：复制到 `~/.codex/skills/paper-writing/`
- 其他支持 `SKILL.md` + YAML frontmatter 的agent：同上

> 改名/删除后 DSH 会自动刷新目录，不需要重启。

---

## 2. 怎么用

在对话里直接说要做的事，skill 会按 `SKILL.md` 的七阶段走：

| 你说 | 它走 |
| --- | --- |
| 「帮我降 AI 味」 | 扫描 → 分节定力度 → 硬规则清理 → 表达还原 |
| 「这段读起来像机器写的」 | 单段改写（三列对照） |
| 「帮我写引言 / 开题」 | 立场 → 大纲 → 开头测试 → 草稿 |
| 「审稿人说论证跳跃」 | 审稿人视角逐段查 claim–evidence–warrant |
| 「润色英文摘要」 | 走英文 Humanizer 规则，不用中文清单 |

命令行也能单独跑扫描：

```powershell
python scripts/ai_trace_scan.py 你的论文.docx --out 扫描报告.md
python scripts/ai_trace_scan.py 你的论文.md --json
```

不需要装依赖：`.docx` 优先用 python-docx，没有就解 zip 读 XML；`.md/.txt` 直接读。

---

## 3. 目录结构

```
paper-writing/
├─ SKILL.md                       # 主流程：五条铁律 + 七阶段 + 分节力度表 + 路由
├─ references/
│  ├─ 01-humanizer-en.md          # 英文 26 条（维基百科 Signs of AI writing）
│  ├─ 02-humanizer-zh.md          # 中文 21 条（ai-zixun 分支）
│  ├─ 02b-humanizer-zh-moli-36.md # 中文 36 条六类（moli238 分支，补充口径）
│  ├─ 03-stop-slop.md             # 极简硬规则（清单里的 "Stop-Stop"）
│  ├─ 04-ai-flavor-remover.md     # 中文 prompt 包拆解 + 论文版改造
│  ├─ 05-shuorenhua.md            # 说人话：事实保护 + 力度/范围
│  ├─ 06-de-ai-prompt-enhancer.md # 改 prompt 而不是只改文本
│  ├─ 07-writing-agent.md         # 全流程阶段与提问清单
│  ├─ 08-academic-guardrails.md   # ★ 原创：学术红线、套语白名单、过度去味症状
│  └─ 09-prompt-pack.md           # ★ 原创：7 条可直接复制的 prompt
├─ scripts/ai_trace_scan.py       # 中英双语痕迹扫描器（标准库即可）
├─ assets/revision-report.md      # 改稿报告模板（Fact Ledger + 三列对照）
├─ demo/                          # 本地自留样例，不随仓库分发（见 .gitignore）
└─ vendor/                        # 七个上游的原文副本，仅供溯源，不参与运行
```

`references/08` 和 `09` 是本项目原创，其余是上游内容的提炼。

---

## 4. 为什么是这七个阶段

七个上游各自只覆盖一层，单用任何一个都会在别的层过度或不足：

- **Writing Agent** 给了结构，但不管中文语感；
- **Humanizer / Humanizer-zh** 管语感，但会把学术 hedging 和分类枚举一起删掉；
- **stop-slop** 的硬规则最有效，也最容易把论文改得不像论文；
- **ShuorenHua** 的「先锁事实再改写」是唯一能防住改坏的机制；
- **AI-Flavor-Remover** 的 prompt 结构最好用，但它的语体层绑死了「写给大众、幽默风趣」，直接套论文会出事；
- **De-AI-Prompt-Enhancer** 不改进稿质量，改进的是**你给模型的指令质量**。

所以流程设计成：**先定节 → 再锁事实 → 再拆硬规则 → 最后才谈语感**，而不是反过来。

---

## 5. 已知偏差（重要）

下载核对时发现，二手介绍文中的说法与仓库实际不符，这里如实记录：

| 说法 | 实际 |
| --- | --- |
| Humanizer-zh「24 种痕迹，分内容/语法/风格/填充词四类」 | ai-zixun 分支实为 **21 条**（13 条 patterns + 8 条 core rules，无四分类）；moli238 分支为 **36 条六类**；英文 blader 为 **26 条六节**。「24 条 + 四类」在三个仓库里都不成立 |
| 「Stop-Stop」 | GitHub 上没有独立的 stop-stop skill；你描述的「极简硬规则、删填充语、打碎公式化结构、多用主动语态」与 **hardikpandya/stop-slop** 完全对应，本项目按 stop-slop 处理 |
| AI-Flavor-Remover | 仓库只有 README，无 LICENSE，无 prompts 目录；prompt 内嵌在 README 代码块里。原文仅作学习参考，勿商用二次分发 |

对应处理：主表用 21 条（实战够用），36 条版本单列在 `02b`，两者差异写在文件里，没有为了凑数编条目。

---

## 6. 上游来源

| 技能 | 仓库 |
| --- | --- |
| Humanizer | https://github.com/blader/humanizer |
| Humanizer-zh | https://github.com/ai-zixun/humanizer-zh 、https://github.com/moli238/humanizer-zh-moli |
| stop-slop | https://github.com/hardikpandya/stop-slop |
| AI-Flavor-Remover | https://github.com/hylarucoder/ai-flavor-remover |
| ShuorenHua | https://github.com/MrGeDiao/shuorenhua |
| De-AI-Prompt-Enhancer | https://github.com/OUBIGFA/De-AI-Prompt-Enhancer-Writer-Booster-SKILL |
| Writing Agent | https://github.com/dongbeixiaohuo/writing-agent |

`vendor/` 里是抓取时的原文快照，版权归各作者；本项目的改写与整合部分（`08`、`09`、`scripts`、`SKILL.md`）可自由使用。

---

## 7. 维护

- 上游规则会迭代。更新时先改 `vendor/` 快照，再改对应 `references/NN` 的蒸馏版，最后检查 `SKILL.md` 第 7 节的资源索引有没有悬空。
- 扫描规则在 `scripts/ai_trace_scan.py` 顶部的 `RULES` 列表里，加规则只需要一行 `Rule(...)`。
- 加完规则，用一篇自己熟悉的干净稿回归一次：指数不应大幅漂移。若想验证规则是否过严，可用一段明显 AI 腔的文字做对照（应接近 100）。
