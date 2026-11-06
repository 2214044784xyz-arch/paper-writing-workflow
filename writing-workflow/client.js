window.__ModuleLoader__.load({
  id: '@local/writing-workflow',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect, useMemo, useRef, useCallback } = React;

    /* ================================================================ meta */

    const NS = 'writing-workflow';
    const PANEL_ID = 'writing-workflow';
    const RULES_KEY = 'writing-workflow.rules.v1';
    const DRAFT_KEY = 'writing-workflow.draft.v1';
    const SKILL_ROOT = '.dsh/skills/paper-writing';

    const LAYERS = {
      结构: { color: '#6f5cff', bg: 'rgba(111,92,255,.14)' },
      事实: { color: '#0f9d76', bg: 'rgba(15,157,118,.14)' },
      风格: { color: '#2477d4', bg: 'rgba(36,119,212,.14)' },
      语法: { color: '#c07a12', bg: 'rgba(192,122,18,.16)' },
      硬规则: { color: '#d4483b', bg: 'rgba(212,72,59,.14)' },
      执行: { color: '#8756c9', bg: 'rgba(135,86,201,.14)' },
      前置: { color: '#2f8f9d', bg: 'rgba(47,143,157,.14)' },
    };

    const CATEGORIES = ['语气', '结构', '用词', '格式', '禁忌', '其他'];

    const SKILLS = [
      {
        id: 'humanizer-en',
        glyph: 'En',
        label: 'Humanizer',
        labelEn: 'English AI traces',
        layer: '风格',
        summary: '基于维基百科「Signs of AI writing」，专治英文里的夸大意义、宣传腔、模糊归因与破折号滥用。',
        facts: ['26 条 / A–F 六组', '管英文成稿', '只借信号，不借腔调'],
        readme: `${SKILL_ROOT}/references/01-humanizer-en.md`,
        what: '它把「读起来像模型默认输出」的英文句子，改回「某个具体的人写给某个具体读者」的句子。核心不是换同义词，而是识别一批可枚举的信号：用铺垫代替陈述（not X but Y）、单句成段的伪金句、空洞的宏大意义（stands as a testament）、借来的权威（experts argue 而不指名）、装饰性加粗与 emoji、聊天机器人残留（Great question!）。规则按「越靠前越硬」排序，弱信号需要同段再有两三处旁证才动手。',
        when: '英文摘要、英文引言、投稿信（cover letter）、回复审稿意见的英文段落。中文正文不要用它。',
        caution: '它面向的是通用英文写作，不是学术文体。论文里的正式语体、hedging、术语一致性本来就带「机器感」，不要把这三样当 AI 味删掉；单次出现的破折号、逐字引文、模板化 Methods 句式属于误判白名单。',
        apply: '只改英文段落；逐条标注命中的编号（§1–§26），给「原句 → 改句 → 命中的规则」。中文段跳过并说明原因。',
      },
      {
        id: 'humanizer-zh',
        glyph: '中',
        label: 'Humanizer-zh',
        labelEn: 'Chinese 24 traces',
        layer: '语法',
        summary: '把「去 AI 味」搬到中文：翻译腔、机械对照句、连接词轰炸、冒号破折号滥用、口号式收束，逐条列出识别信号与改法。',
        facts: ['21 条可核对 / 四类归类', '36 条六类另有分支', '中文语法层主力'],
        readme: `${SKILL_ROOT}/references/02-humanizer-zh.md`,
        what: '这是本工作流里最细的中文痕迹表。真实条目是 13 条模式（P1–P13）加 8 条核心规则（R1–R8），共 21 条，按「内容 / 语法 / 风格 / 填充词」四类归置。高频病灶包括：机械对照（不是……而是……）、翻译腔连接词（在这一背景下、基于此）、空泛大词（颠覆、赋能、里程碑）、段落末尾口号化、列表排比成瘾、判断强度失衡。它还单独标了「高危十条」，每条配论文语境的「反例 → 正例」。',
        when: '中文正文的主扫器。摘要、引言、文献综述、讨论尤其有效；方法与结果只做轻度使用（只删填充词与套话）。',
        caution: '原作者面向博客、专栏与书稿，不是学术文体。用在论文上只借「去痕迹」，不借它的作者腔调；「首先/其次/最后」在论文里有真实的枚举功能时不要一刀切。',
        apply: '按 21 条逐条扫描，命中的写出编号（如 P1、R3）；只改能明确指出信号的位置，单发命中标为「弱信号，待确认」。',
      },
      {
        id: 'stop-slop',
        glyph: 'S',
        label: 'Stop-Slop',
        labelEn: 'Hard rules',
        layer: '硬规则',
        summary: '极简硬规则路线：让模型停止写套路、删掉填充语、打碎公式化结构、多用主动语态。目标不是更漂亮，而是「不像 AI」。',
        facts: ['8 条绝对命令', '句子级手术刀', '与学术惯例有冲突'],
        readme: `${SKILL_ROOT}/references/03-stop-slop.md`,
        what: '八条命令式规则：删清嗓子开场与强调拐杖、拆公式化结构（二元对比 / 否定式清单 / 戏剧化断句）、用主动语态点名施动者、拒绝含糊断言、把读者放进现场、混用长短句、信任读者不要手把手、砍掉像 pull-quote 的金句。它的价值在于「绝对」——不留解释空间，所以执行率高。',
        when: '中文与英文都可用作句子级清理，尤其适合被审稿人点名「表述空泛」「腔调太像宣传稿」的段落。',
        caution: '和学术写作正面冲突的有四处：Methods 的被动语态、hedging（may / suggest / likely）、证据链推导、贡献三点式列表。冲突时以期刊规范与事实准确为先；不要为了「不像 AI」删 limitations 和引用。',
        apply: '逐句执行，命中即改；每处冲突（如必须保留的被动语态）单独列出并说明为什么不套用规则。',
      },
      {
        id: 'ai-flavor-remover',
        glyph: '味',
        label: 'AI-Flavor-Remover',
        labelEn: 'Actionable prompt pack',
        layer: '执行',
        summary: '中文实战 prompt 包：把「去 AI 味」拆成禁语黑名单、句式节奏改造与四段式可审查输出，先诊断再分步重写。',
        facts: ['禁语表 + 五步流程', '四段式输出', '建议配推理模型'],
        readme: `${SKILL_ROOT}/references/04-ai-flavor-remover.md`,
        what: '它把抽象的「写得自然一点」换成可执行的清单：先分析原文最突出的 2–3 个 AI 特征，再列 3–5 个优化策略，然后给亮点说明，最后才是成稿。禁令部分是可 grep 的负例词表（首先/其次/总之、值得注意的是、不难发现、基于以上分析），比抽象要求更容易被执行。作者的核心洞察是：能被列成词表的东西执行率高，抽象的「要有文采」执行率低。',
        when: '需要一份「可审查、可回退」的改写过程时；适合一次改一整节，让模型先诊断再动手。',
        caution: '作者本人提醒：「AI 味」在某些场景未必是缺点。学术写作的复现性、术语一致性、hedging 本来就是机器感的来源；不要为了躲开词表而把严谨表述改掉。',
        apply: '按「分析 → 策略 → 亮点 → 成稿」四段输出；禁语表只作用于本次改写，不写进正文说明。',
      },
      {
        id: 'shuorenhua',
        glyph: '人',
        label: 'ShuorenHua',
        labelEn: 'Say it plainly',
        layer: '事实',
        summary: '把文本从「表演式写作」拉回「真实表达」：先保护事实信息，再按场景与改写力度需求做最小必要修改。',
        facts: ['事实保护清单 12 项', '力度档位 3 档', '允许「无需修改」'],
        readme: `${SKILL_ROOT}/references/05-shuorenhua.md`,
        what: '它的顺序和别的技巧相反：先锁定谁做什么、数字对应什么、条件与否定与情态，再决定能不能删。允许的动作只有几类——删纯招呼与无承诺的预告、删只提示写法的成分、删完整重复、简化名词化、删无依据的读者身份认证。它明确区分「判断」与「事实」、「结果」与「解读」，并把删除权限拆成三档力度（bounded / in-place / rewrite-safe）。拿不准就留下该处，是它的默认值。',
        when: '任何涉及数据、引文、结论方向的段落。方法、结果、讨论这几节建议以它为主，其他技巧只做辅助。',
        caution: '它反对「为了更像人而替作者变得更自信、更热情」。不要补执行者、不要合并不同人的话、不要替作者补没说过的话；「研究表明」类无源归属默认保留并在正文外标缺来源。',
        apply: '先产出一张事实保护清单（数字 / 限定 / 否定 / 情态 / 专名），再逐句给「删除或替换」的建议；力度按任务设置执行，越界即回退。',
      },
      {
        id: 'de-ai-prompt-enhancer',
        glyph: 'P',
        label: 'De-AI-Prompt-Enhancer',
        labelEn: 'Prompt-side fix',
        layer: '前置',
        summary: '不只改文本，也改 prompt 本身：把「润色一下」重写成带场景、读者、禁忌与验收标准的执行合同。',
        facts: ['六个槽位', '人类区间而非清零', '可作全流程前置'],
        readme: `${SKILL_ROOT}/references/06-de-ai-prompt-enhancer.md`,
        what: '它改的是「需求」而不是「文字」：强制把请求归入写作 / 审阅 / 修补 / 重写四种操作之一，再补信息守恒、禁忌清单、验收标准、边界与体裁分流六个槽位。最关键的改写是把「零容忍」换成「人类区间」——单次出现且读感自然的不算问题，成簇、连段、明显替读者宣布结论时才修。它还带一份误判白名单（干净标点、正式语体、逐字引文），专门对冲过度修改。',
        when: '你自己也说不清「想要多自然」的时候；或者一个任务要反复跑很多次，值得先把指令打磨一遍。也可以作为整套流程的第一步，把本任务单再增强一轮。',
        caution: '增强 prompt 不等于让输出更长。约束加得过多会挤出正文空间；一次只选 3–5 个手法，不要把所有规则同时拉满。',
        apply: '在动笔前，先输出「本次任务的操作类型 + 五个槽位的补全」；确认后再进入改写。',
      },
      {
        id: 'writing-agent',
        glyph: 'W',
        label: 'Writing Agent',
        labelEn: 'End-to-end pipeline',
        layer: '结构',
        summary: '系统级写作流水线：主题分析、立场假说、证据账本、大纲、开头测试、草稿、隔离审稿、传播测试，最后才去 AI 味。',
        facts: ['23 阶段 / 三种模式', '文件协议 + 门禁', '适合长篇深度内容'],
        readme: `${SKILL_ROOT}/references/07-writing-agent.md`,
        what: '它不负责把句子写漂亮，负责保证三件事不塌：判断看起来有理却不可反驳、事实看起来具体却查不到出处、标题承诺的东西正文接不住。做法是把写作拆成可交付文件的阶段（简报、立场、证据账本、大纲、草稿、审稿、事实门禁），每阶段有通过标准；7/8/9 三份评审互相隔离，都不许改正文，最后由导演合并。文体是第一分叉：评论查判断与反方，解释给机制与边界，叙事保护视角，实用经验说清失败方式。',
        when: '写新稿、开题、长篇综述、需要「证据链可回溯」的章节。改一篇已有短文时属于过度配置，只取它的「立场 + 证据账本 + 隔离审稿」三件即可。',
        caution: '完整 23 阶段跑一遍成本很高，且它的传播测试面向公众号而非期刊。论文场景建议只用模式 A/B 的骨架，删掉配图、传播与平台压力测试。',
        apply: '若为「写新稿」，按 P1 立场 → P2 大纲 → P3 草稿推进，每阶段先给文件再进下一步；若为「改旧稿」，只借立场复核与隔离审稿。',
      },
    ];

    const STAGES = [
      { id: 'P0', label: 'P0 诊断', hint: '跑 ai_trace_scan.py，按节统计痕迹密度' },
      { id: 'P1', label: 'P1 立场', hint: '一句话论点 + 贡献句 + 边界句' },
      { id: 'P2', label: 'P2 骨架', hint: '三级大纲 + 开头三版测试' },
      { id: 'P3', label: 'P3 草稿', hint: '按节展开，一段一个论点' },
      { id: 'P4', label: 'P4 台账', hint: '抽出全部不可动信息' },
      { id: 'P5', label: 'P5 硬规则', hint: '机械清理填充词、套话、排比、破折号' },
      { id: 'P6', label: 'P6 还原', hint: '从表演式写作拉回真实表达' },
      { id: 'P7', label: 'P7 审稿', hint: 'claim / evidence / warrant + 摘要测试' },
      { id: 'P8', label: 'P8 前置优化', hint: '先把需求改写成带约束的指令（可选）' },
    ];

    const MODES = [
      { id: '改旧稿', stages: ['P0', 'P4', 'P5', 'P6', 'P7'], hint: '诊断 → 台账 → 清理 → 还原 → 审稿' },
      { id: '写新稿', stages: ['P1', 'P2', 'P3', 'P4', 'P7'], hint: '立场 → 骨架 → 草稿 → 台账 → 审稿' },
      { id: '只诊断', stages: ['P0'], hint: '只出扫描报告与判读，不动正文' },
      { id: '审稿视角', stages: ['P4', 'P7'], hint: '事实核对 + claim/evidence/warrant 挑刺' },
    ];

    const INTENSITIES = [
      { id: '轻', hint: '只删填充词与完整重复，不动句序' },
      { id: '中', hint: '允许重排、合句、换词性；不改主张' },
      { id: '重', hint: '允许重写段落结构；仍然不改事实' },
    ];

    /* ============================================================== styles */

    const CSS = `
.wwp-root{--wwp-gap:14px;display:flex;flex-direction:column;height:100%;min-height:0;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.55}
.wwp-head{display:flex;align-items:flex-start;gap:16px;padding:18px 24px 16px;border-bottom:1px solid var(--dsw-alias-border-l1);background:linear-gradient(180deg,var(--dsw-alias-bg-layer-1),var(--dsw-alias-bg-base))}
.wwp-head h1{font-size:17px;font-weight:650;margin:0;letter-spacing:.2px}
.wwp-head p{margin:3px 0 0;color:var(--dsw-alias-label-secondary);font-size:12.5px}
.wwp-head-meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.wwp-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);border-radius:999px;padding:2px 10px;font-size:12px;white-space:nowrap}
.wwp-chip b{color:var(--dsw-alias-label-primary);font-weight:600}
.wwp-chip.is-ok{color:var(--dsw-alias-state-success-primary)}
.wwp-chip.is-warn{color:var(--dsw-alias-state-warn-primary)}
.wwp-spacer{flex:1}
.wwp-body{display:grid;grid-template-columns:272px minmax(0,1fr) 344px;gap:0;flex:1;min-height:0;overflow:hidden}
.wwp-col{min-height:0;overflow-y:auto;padding:16px}
.wwp-col-left{border-right:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}
.wwp-col-right{border-left:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}
.wwp-sec{margin-bottom:18px}
.wwp-sec-title{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:650;color:var(--dsw-alias-label-secondary);letter-spacing:.4px;text-transform:uppercase;margin:0 0 8px}
.wwp-sec-title .wwp-count{margin-left:auto;text-transform:none;font-weight:500;letter-spacing:0}
.wwp-card{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);border-radius:10px;padding:12px}
.wwp-drop{border:1.5px dashed var(--dsw-alias-border-l2);border-radius:12px;padding:18px 14px;text-align:center;cursor:pointer;transition:border-color .15s,background .15s;background:var(--dsw-alias-bg-base)}
.wwp-drop:hover{border-color:var(--dsw-alias-brand-primary)}
.wwp-drop.is-over{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-2)}
.wwp-drop strong{display:block;font-size:13px;margin-bottom:4px}
.wwp-drop span{color:var(--dsw-alias-label-secondary);font-size:11.5px}
.wwp-file{display:flex;align-items:flex-start;gap:10px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;padding:10px 12px;background:var(--dsw-alias-bg-base)}
.wwp-file .wwp-file-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:rgba(36,119,212,.12);color:#2477d4;font-weight:700;font-size:11px;flex:none}
.wwp-file-name{font-weight:600;word-break:break-all;line-height:1.3}
.wwp-file-meta{color:var(--dsw-alias-label-secondary);font-size:11.5px;margin-top:3px}
.wwp-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);border-radius:8px;padding:6px 12px;font-size:12.5px;font-weight:500;cursor:pointer;transition:background .15s,border-color .15s,opacity .15s;white-space:nowrap}
.wwp-btn:hover{background:var(--dsw-alias-bg-layer-1);border-color:var(--dsw-alias-border-l2)}
.wwp-btn:disabled{opacity:.45;cursor:not-allowed}
.wwp-btn.is-primary{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:#fff}
.wwp-btn.is-primary:hover{filter:brightness(1.06)}
.wwp-btn.is-danger{color:var(--dsw-alias-state-error-primary)}
.wwp-btn.is-ghost{background:transparent;border-color:transparent;padding:4px 8px;color:var(--dsw-alias-label-secondary)}
.wwp-btn.is-ghost:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.wwp-btn.is-sm{padding:3px 8px;font-size:11.5px;border-radius:6px}
.wwp-row{display:flex;gap:8px;align-items:center}
.wwp-row.is-wrap{flex-wrap:wrap}
.wwp-actions{margin-left:auto;display:flex;gap:6px;align-items:center}
.wwp-field{margin-bottom:10px}
.wwp-field label{display:block;font-size:11.5px;font-weight:600;color:var(--dsw-alias-label-secondary);margin-bottom:5px}
.wwp-input,.wwp-textarea,.wwp-select{width:100%;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);border-radius:8px;padding:7px 10px;font-size:12.5px;font-family:inherit;outline:none;transition:border-color .15s,box-shadow .15s}
.wwp-textarea{resize:vertical;min-height:76px;line-height:1.55}
.wwp-input:focus,.wwp-textarea:focus,.wwp-select:focus{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px rgba(36,119,212,.14)}
.wwp-hint{color:var(--dsw-alias-label-secondary);font-size:11.5px;margin-top:4px}
.wwp-skills{display:grid;grid-template-columns:repeat(auto-fill,minmax(228px,1fr));gap:10px}
.wwp-skill{border:1.5px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);border-radius:12px;padding:11px 12px;cursor:pointer;transition:border-color .15s,box-shadow .15s,background .15s;position:relative;min-height:104px;display:flex;flex-direction:column;gap:6px}
.wwp-skill:hover{border-color:var(--dsw-alias-border-l2);box-shadow:0 1px 4px rgba(0,0,0,.06)}
.wwp-skill.is-on{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-2)}
.wwp-skill.is-on::after{content:'✓';position:absolute;top:8px;right:10px;width:16px;height:16px;border-radius:50%;background:var(--dsw-alias-brand-primary);color:#fff;font-size:11px;display:flex;align-items:center;justify-content:center;font-weight:700}
.wwp-skill-top{display:flex;align-items:center;gap:8px;padding-right:20px}
.wwp-glyph{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11.5px;flex:none}
.wwp-skill-name{font-weight:650;font-size:13px;line-height:1.25}
.wwp-skill-sub{color:var(--dsw-alias-label-secondary);font-size:11px;line-height:1.2}
.wwp-skill summary{list-style:none;cursor:pointer;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.wwp-skill summary::-webkit-details-marker{display:none}
.wwp-skill[open] summary{-webkit-line-clamp:unset;display:block}
.wwp-skill-more{font-size:12px;color:var(--dsw-alias-label-secondary);border-top:1px dashed var(--dsw-alias-border-l1);padding-top:8px;margin-top:2px;display:grid;gap:7px}
.wwp-skill-more b{color:var(--dsw-alias-label-primary);font-weight:600}
.wwp-facts{display:flex;flex-wrap:wrap;gap:4px;margin-top:auto}
.wwp-fact{border:1px solid var(--dsw-alias-border-l1);border-radius:5px;padding:1px 6px;font-size:10.5px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-1);white-space:nowrap}
.wwp-layer{font-size:10.5px;font-weight:600;border-radius:5px;padding:1px 6px;white-space:nowrap}
.wwp-rule{display:flex;gap:8px;align-items:flex-start;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;padding:8px 10px;background:var(--dsw-alias-bg-base);margin-bottom:7px}
.wwp-rule.is-off{opacity:.5}
.wwp-rule-main{min-width:0;flex:1}
.wwp-rule-name{font-weight:600;font-size:12.5px;display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.wwp-rule-text{color:var(--dsw-alias-label-secondary);font-size:11.5px;margin-top:2px;word-break:break-word}
.wwp-tag{font-size:10.5px;border-radius:4px;padding:0 5px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary);white-space:nowrap}
.wwp-switch{display:inline-flex;align-items:center;gap:6px;cursor:pointer;user-select:none;font-size:12px;color:var(--dsw-alias-label-secondary)}
.wwp-switch input{position:absolute;opacity:0;pointer-events:none}
.wwp-switch .wwp-track{width:26px;height:15px;border-radius:999px;background:var(--dsw-alias-border-l2);position:relative;transition:background .15s;flex:none}
.wwp-switch .wwp-track::after{content:'';position:absolute;top:2px;left:2px;width:11px;height:11px;border-radius:50%;background:#fff;transition:transform .15s}
.wwp-switch input:checked + .wwp-track{background:var(--dsw-alias-brand-primary)}
.wwp-switch input:checked + .wwp-track::after{transform:translateX(11px)}
.wwp-seg{display:inline-flex;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;overflow:hidden;background:var(--dsw-alias-bg-base)}
.wwp-seg button{border:0;background:transparent;color:var(--dsw-alias-label-secondary);padding:5px 10px;font-size:12px;cursor:pointer}
.wwp-seg button + button{border-left:1px solid var(--dsw-alias-border-l1)}
.wwp-seg button.is-on{background:var(--dsw-alias-brand-primary);color:#fff}
.wwp-stages{display:flex;flex-wrap:wrap;gap:5px}
.wwp-stage{border:1px solid var(--dsw-alias-border-l1);border-radius:6px;padding:2px 7px;font-size:11px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-base);white-space:nowrap}
.wwp-stage.is-on{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary);background:rgba(36,119,212,.08);font-weight:600}
.wwp-preview{white-space:pre-wrap;word-break:break-word;font-family:ui-monospace,SFMono-Regular,Consolas,'Liberation Mono',monospace;font-size:11px;line-height:1.55;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l1);border-radius:9px;padding:10px;max-height:280px;overflow:auto;margin:0}
.wwp-run{display:flex;gap:8px;align-items:baseline;padding:6px 0;border-bottom:1px dashed var(--dsw-alias-border-l1);font-size:11.5px}
.wwp-run:last-child{border-bottom:0}
.wwp-run-name{font-weight:600;color:var(--dsw-alias-label-primary);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wwp-run-meta{color:var(--dsw-alias-label-secondary);margin-left:auto;white-space:nowrap}
.wwp-empty{color:var(--dsw-alias-label-secondary);font-size:12px;border:1px dashed var(--dsw-alias-border-l1);border-radius:9px;padding:14px;text-align:center}
.wwp-note{border-left:3px solid var(--dsw-alias-state-warn-primary);background:rgba(212,72,59,.06);padding:8px 10px;border-radius:0 6px 6px 0;font-size:11.5px;color:var(--dsw-alias-label-secondary)}
.wwp-toast{position:sticky;bottom:0;margin:0 16px 12px;border-radius:9px;padding:8px 12px;font-size:12px;display:flex;gap:8px;align-items:center;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-overlay);box-shadow:0 4px 16px rgba(0,0,0,.12)}
.wwp-toast.is-error{border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}
.wwp-toast.is-ok{border-color:var(--dsw-alias-state-success-primary)}
.wwp-loading{display:flex;align-items:center;justify-content:center;height:100%;color:var(--dsw-alias-label-secondary);gap:10px;font-size:13px}
@keyframes wwp-spin{to{transform:rotate(360deg)}}
.wwp-spin{width:14px;height:14px;border:2px solid var(--dsw-alias-border-l2);border-top-color:var(--dsw-alias-brand-primary);border-radius:50%;animation:wwp-spin .8s linear infinite}
@media (max-width:1180px){.wwp-body{grid-template-columns:240px minmax(0,1fr)}.wwp-col-right{grid-column:1/-1;border-left:0;border-top:1px solid var(--dsw-alias-border-l1)}}
@media (max-width:820px){.wwp-body{grid-template-columns:1fr}.wwp-col-left{border-right:0;border-bottom:1px solid var(--dsw-alias-border-l1)}}
`;

    /* ============================================================ utilities */

    function useStyleOnce() {
      useEffect(() => {
        const tagId = 'writing-workflow/panel.css';
        let tag = document.querySelector(`style[data-plugin-css="${tagId}"]`);
        if (tag === null) {
          tag = document.createElement('style');
          tag.dataset.plugin = '@local/writing-workflow';
          tag.dataset.pluginCss = tagId;
          tag.textContent = CSS;
          document.head.appendChild(tag);
        }
        return () => {
          /* The shell keeps plugin styles across HMR reloads; remove only when the last panel unmounts. */
        };
      }, []);
    }

    function readJson(key, fallback) {
      try {
        const raw = window.localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    }

    function writeJson(key, value) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    }

    function formatChars(n) {
      if (!Number.isFinite(n) || n <= 0) return '0';
      if (n < 1000) return String(n);
      return `${(n / 1000).toFixed(1)}k`;
    }

    function countChars(text) {
      return Array.from(text || '').length;
    }

    function nowIso() {
      return new Date().toISOString();
    }

    function uid() {
      return `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    }

    function truncate(text, max) {
      const chars = Array.from(text || '');
      return chars.length <= max ? text : `${chars.slice(0, max).join('')}…`;
    }

    /* ------------------------------------------------- word / docx reading */

    function cleanRunText(text) {
      return text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    }

    function docxXmlToText(xml) {
      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      if (doc.getElementsByTagName('parsererror').length > 0) throw new Error('docx 的 XML 解析失败');
      const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
      const body = doc.getElementsByTagNameNS(W, 'body')[0];
      if (!body) throw new Error('docx 里没有 body');
      const out = [];
      const walk = (node) => {
        const name = node.localName;
        if (name === 'p') {
          const runs = [];
          const styles = node.getElementsByTagNameNS(W, 'pStyle');
          const style = styles.length > 0 ? styles[0].getAttributeNS(W, 'val') || '' : '';
          const bold = node.getElementsByTagNameNS(W, 'b').length > 0 && node.getElementsByTagNameNS(W, 'b')[0].getAttributeNS(W, 'val') !== '0';
          const texts = node.getElementsByTagNameNS(W, 't');
          for (let i = 0; i < texts.length; i += 1) runs.push(texts[i].textContent || '');
          let text = runs.join('');
          if (text.trim() !== '') {
            if (/^(Heading|标题)/i.test(style)) {
              const level = Number((style.match(/(\d+)/) || [])[1] || 1);
              text = `${'#'.repeat(Math.min(Math.max(level, 1), 6))} ${text}`;
            } else if (bold && text.length < 40) {
              text = `**${text}**`;
            }
            out.push(text);
          } else {
            out.push('');
          }
          return;
        }
        if (name === 'tbl') {
          const rows = [];
          const trs = node.getElementsByTagNameNS(W, 'tr');
          for (let r = 0; r < trs.length; r += 1) {
            const cells = [];
            const tcs = trs[r].getElementsByTagNameNS(W, 'tc');
            for (let c = 0; c < tcs.length; c += 1) {
              const t = tcs[c].textContent.replace(/\s+/g, ' ').trim();
              cells.push(t === '' ? ' ' : t);
            }
            rows.push(`| ${cells.join(' | ')} |`);
          }
          if (rows.length > 0) {
            out.push('');
            out.push(...rows);
            out.push('');
          }
          return;
        }
        const children = node.childNodes;
        for (let i = 0; i < children.length; i += 1) {
          if (children[i].nodeType === 1) walk(children[i]);
        }
      };
      walk(body);
      const joined = out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
      /* A converter bug must not ship a megabyte of duplicated text to the model. */
      if (joined.length > xml.length * 3) {
        return joined.slice(0, Math.max(xml.length, 20_000));
      }
      return cleanRunText(joined);
    }

    async function inflateRaw(bytes) {
      if (typeof DecompressionStream !== 'function') {
        throw new Error('当前浏览器不支持 DecompressionStream，请把 .docx 另存为 .md/.txt 后再放入');
      }
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      const buffer = await new Response(stream).arrayBuffer();
      return new Uint8Array(buffer);
    }

    async function readZipEntry(bytes, wantedName) {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      let eocd = -1;
      for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65_557); i -= 1) {
        if (view.getUint32(i, true) === 0x06054b50) {
          eocd = i;
          break;
        }
      }
      if (eocd < 0) throw new Error('不是有效的 zip/docx（找不到目录尾）');
      const total = view.getUint16(eocd + 10, true);
      let offset = view.getUint32(eocd + 16, true);
      for (let n = 0; n < total; n += 1) {
        if (view.getUint32(offset, true) !== 0x02014b50) throw new Error('zip 中央目录损坏');
        const method = view.getUint16(offset + 10, true);
        const compressedSize = view.getUint32(offset + 20, true);
        const nameLength = view.getUint16(offset + 28, true);
        const extraLength = view.getUint16(offset + 30, true);
        const commentLength = view.getUint16(offset + 32, true);
        const localOffset = view.getUint32(offset + 42, true);
        const nameBytes = bytes.subarray(offset + 46, offset + 46 + nameLength);
        const name = new TextDecoder('utf-8').decode(nameBytes);
        if (name === wantedName) {
          if (view.getUint32(localOffset, true) !== 0x04034b50) throw new Error('zip 本地头损坏');
          const localNameLength = view.getUint16(localOffset + 26, true);
          const localExtraLength = view.getUint16(localOffset + 28, true);
          const start = localOffset + 30 + localNameLength + localExtraLength;
          const data = bytes.subarray(start, start + compressedSize);
          if (method === 0) return new TextDecoder('utf-8').decode(data);
          if (method === 8) return new TextDecoder('utf-8').decode(await inflateRaw(data));
          throw new Error(`不支持的 zip 压缩方式：${method}`);
        }
        offset += 46 + nameLength + extraLength + commentLength;
      }
      throw new Error(`docx 中找不到 ${wantedName}`);
    }

    async function extractDocument(file) {
      const name = file.name || 'document';
      const lower = name.toLowerCase();
      if (lower.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const bytes = new Uint8Array(await file.arrayBuffer());
        return { name, format: 'docx', text: docxXmlToText(await readZipEntry(bytes, 'word/document.xml')) };
      }
      if (lower.endsWith('.doc') && !lower.endsWith('.docx')) {
        throw new Error('.doc 是旧二进制格式，浏览器无法可靠解析；请在 Word 里另存为 .docx 或 .md');
      }
      const text = await file.text();
      const format = lower.endsWith('.md') || lower.endsWith('.markdown') ? 'markdown' : 'text';
      return { name, format, text: text.replace(/\r\n?/g, '\n') };
    }

    /* --------------------------------------------------------- composition */

    function pickSkills(selectedIds) {
      return SKILLS.filter((skill) => selectedIds.includes(skill.id));
    }

    function detectLanguage(text) {
      const sample = (text || '').slice(0, 4000);
      const han = (sample.match(/[\u3400-\u9fff]/g) || []).length;
      const latin = (sample.match(/[A-Za-z]/g) || []).length;
      if (han === 0 && latin === 0) return { language: '中文', note: null };
      if (han / Math.max(1, han + latin / 2) > 0.6) {
        return latin > han * 0.35
          ? { language: '中文', note: '中英混排：英文段落单独走 Humanizer，不译成英文' }
          : { language: '中文', note: null };
      }
      return { language: '英文', note: '正文以英文为主：用 Humanizer 的 26 条，中文痕迹表仅用于中英对照说明' };
    }

    function stagesFor(mode) {
      const found = MODES.find((entry) => entry.id === mode);
      return found ? found.stages : MODES[0].stages;
    }

    /** Deterministic preview of what the host writes into request.md. */
    function composePreview({ document, skillIds, rules, mode, intensity, routing }) {
      const selected = pickSkills(skillIds);
      const stages = stagesFor(mode);
      const lines = [];
      lines.push('# 论文写作 / 修改任务单（预览）');
      lines.push('');
      lines.push(`- 文档：${document?.name || '未放入'}（${document?.format || '-'}，${formatChars(document?.chars || 0)} 字）`);
      lines.push(`- 语言路由：${routing.language}${routing.note ? `（${routing.note}）` : ''}`);
      lines.push(`- 任务模式：${mode}（${(MODES.find((m) => m.id === mode) || MODES[0]).hint}）`);
      lines.push(`- 改写力度：${intensity}`);
      lines.push('');
      lines.push('## 勾选的技巧');
      if (selected.length === 0) {
        lines.push('- 未勾选：仅走通用护栏。');
      } else {
        for (const skill of selected) lines.push(`- ${skill.label}（${skill.layer}）：${skill.summary}`);
      }
      lines.push('');
      lines.push('## 本次阶段');
      lines.push(...stages.map((id) => `- ${id}`));
      lines.push('');
      lines.push('## 追加指令');
      if (rules.length === 0) lines.push('- 无');
      else for (const rule of rules) lines.push(`- [${rule.category}] ${rule.name}：${rule.text}`);
      lines.push('');
      lines.push('## 预期产物');
      lines.push('- scan-report.md / fact-ledger.md / revised.md / revision-table.md');
      lines.push('- 每个数字可回溯、每处 [n] 原位、理由只写「删了什么」');
      lines.push('');
      lines.push('## 文档正文（片段）');
      lines.push(truncate(document?.text || '', 600));
      return lines.join('\n');
    }

    /* ================================================================= UI */

    function Chip(props) {
      return h('span', { className: `wwp-chip ${props.tone ? `is-${props.tone}` : ''}` }, props.children);
    }

    function Section(props) {
      return h(
        'section',
        { className: 'wwp-sec' },
        h('h2', { className: 'wwp-sec-title' }, props.title, props.count !== undefined ? h('span', { className: 'wwp-count' }, props.count) : null),
        props.children,
      );
    }

    function DropZone({ onFile, busy, error }) {
      const [over, setOver] = useState(false);
      const inputRef = useRef(null);
      const handle = useCallback(
        async (file) => {
          if (!file) return;
          await onFile(file);
        },
        [onFile],
      );
      return h(
        'div',
        null,
        h(
          'div',
          {
            className: `wwp-drop ${over ? 'is-over' : ''}`,
            role: 'button',
            tabIndex: 0,
            'aria-label': '放入论文文档',
            onDragOver: (event) => {
              event.preventDefault();
              setOver(true);
            },
            onDragLeave: () => setOver(false),
            onDrop: (event) => {
              event.preventDefault();
              setOver(false);
              const file = event.dataTransfer?.files?.[0];
              handle(file);
            },
            onClick: () => inputRef.current?.click(),
            onKeyDown: (event) => {
              if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
            },
          },
          busy ? h('div', { className: 'wwp-spin', style: { margin: '0 auto 8px' } }) : h(DocIcon),
          h('strong', null, busy ? '正在解析…' : '把论文拖到这里'),
          h('span', null, '支持 .md / .txt / .docx；也可以下方直接粘贴'),
        ),
        h('input', {
          ref: inputRef,
          type: 'file',
          accept: '.md,.markdown,.txt,.docx',
          style: { display: 'none' },
          onChange: (event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            handle(file);
          },
        }),
        error ? h('div', { className: 'wwp-hint', style: { color: 'var(--dsw-alias-state-error-primary)' } }, error) : null,
      );
    }

    function DocIcon() {
      return h(
        'svg',
        { width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, style: { color: 'var(--dsw-alias-brand-primary)', margin: '0 auto 8px', display: 'block' } },
        h('path', { d: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z' }),
        h('path', { d: 'M14 3v5h5' }),
        h('path', { d: 'M9 13h6M9 17h4' }),
      );
    }

    function SkillCard({ skill, selected, onToggle }) {
      const palette = LAYERS[skill.layer] || LAYERS.风格;
      return h(
        'div',
        {
          className: `wwp-skill ${selected ? 'is-on' : ''}`,
          role: 'checkbox',
          'aria-checked': selected,
          tabIndex: 0,
          onClick: () => onToggle(skill.id),
          onKeyDown: (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onToggle(skill.id);
            }
          },
        },
        h(
          'div',
          { className: 'wwp-skill-top' },
          h('span', { className: 'wwp-glyph', style: { background: palette.bg, color: palette.color } }, skill.glyph),
          h('div', { style: { minWidth: 0 } }, h('div', { className: 'wwp-skill-name' }, skill.label), h('div', { className: 'wwp-skill-sub' }, skill.labelEn)),
          h('span', { className: 'wwp-layer', style: { background: palette.bg, color: palette.color, marginLeft: 'auto' } }, skill.layer),
        ),
        h('details', { onClick: (event) => event.stopPropagation() }, h('summary', null, skill.summary), h(
          'div',
          { className: 'wwp-skill-more' },
          h('div', null, h('b', null, '它管什么'), '：', skill.what),
          h('div', null, h('b', null, '什么时候用'), '：', skill.when),
          h('div', null, h('b', null, '论文场景的坑'), '：', skill.caution),
          h('div', null, h('b', null, '本次怎么执行'), '：', skill.apply),
          h('div', { className: 'wwp-hint' }, `规则原文：${skill.readme}`),
        )),
        h('div', { className: 'wwp-facts' }, skill.facts.map((fact) => h('span', { key: fact, className: 'wwp-fact' }, fact))),
      );
    }

    function RuleRow({ rule, onToggle, onEdit, onDelete }) {
      return h(
        'div',
        { className: `wwp-rule ${rule.enabled === false ? 'is-off' : ''}` },
        h(
          'label',
          { className: 'wwp-switch', title: rule.enabled === false ? '本次不启用' : '本次启用' },
          h('input', { type: 'checkbox', checked: rule.enabled !== false, onChange: () => onToggle(rule.id) }),
          h('span', { className: 'wwp-track' }),
        ),
        h(
          'div',
          { className: 'wwp-rule-main' },
          h('div', { className: 'wwp-rule-name' }, rule.name, h('span', { className: 'wwp-tag' }, rule.category || '其他')),
          h('div', { className: 'wwp-rule-text' }, rule.text),
        ),
        h('div', { style: { display: 'flex', gap: 2 } }, h('button', { type: 'button', className: 'wwp-btn is-ghost is-sm', onClick: () => onEdit(rule), title: '编辑' }, '编辑'), h('button', { type: 'button', className: 'wwp-btn is-ghost is-sm', onClick: () => onDelete(rule.id), title: '删除' }, '删除')),
      );
    }

    function RuleEditor({ draft, onChange, onSave, onCancel, editing }) {
      return h(
        'div',
        { className: 'wwp-card', style: { marginTop: 10 } },
        h('div', { className: 'wwp-field' }, h('label', null, '指令名称'), h('input', { className: 'wwp-input', value: draft.name, placeholder: '例：不要使用「此外」开头', onChange: (event) => onChange({ ...draft, name: event.target.value }) })),
        h(
          'div',
          { className: 'wwp-field' },
          h('label', null, '归类'),
          h('div', { className: 'wwp-row is-wrap' }, CATEGORIES.map((category) => h('button', { key: category, type: 'button', className: `wwp-btn is-sm ${draft.category === category ? 'is-primary' : ''}`, onClick: () => onChange({ ...draft, category }) }, category))),
        ),
        h('div', { className: 'wwp-field' }, h('label', null, '指令内容（会原样写进任务单）'), h('textarea', { className: 'wwp-textarea', value: draft.text, placeholder: '例：段首不要用「综上所述」；结论部分禁止出现「具有重要意义」；讨论节保留所有 hedging。', onChange: (event) => onChange({ ...draft, text: event.target.value }) })),
        h(
          'div',
          { className: 'wwp-row' },
          h('button', { type: 'button', className: 'wwp-btn is-primary', disabled: draft.name.trim() === '' || draft.text.trim() === '', onClick: onSave }, editing ? '保存修改' : '存入规则库'),
          h('button', { type: 'button', className: 'wwp-btn', onClick: onCancel }, '取消'),
          h('span', { className: 'wwp-hint', style: { marginLeft: 'auto', marginTop: 0 } }, '规则库会写进工作区 .dsh/writing-workflow/memory.json'),
        ),
      );
    }

    function Panel({ ctx, t, useSessions }) {
      const [rules, setRules] = useState(() => readJson(RULES_KEY, []));
      const [doc, setDoc] = useState(null);
      const [busy, setBusy] = useState(false);
      const [docError, setDocError] = useState(null);
      const [pasted, setPasted] = useState('');
      const [showPaste, setShowPaste] = useState(false);
      const [selected, setSelected] = useState(() => readJson(DRAFT_KEY, null)?.selected || ['humanizer-zh', 'stop-slop', 'ai-flavor-remover', 'shuorenhua']);
      const [mode, setMode] = useState('改旧稿');
      const [intensity, setIntensity] = useState('中');
      const [editor, setEditor] = useState(null);
      const [toast, setToast] = useState(null);
      const [runs, setRuns] = useState([]);
      const [sending, setSending] = useState(false);
      const [hostReady, setHostReady] = useState(null);
      const [saveHint, setSaveHint] = useState(null);
      const sessionId = useCurrentSessionId(useSessions);

      useStyleOnce();

      const routing = useMemo(() => detectLanguage(doc?.text || ''), [doc]);
      const activeRules = useMemo(() => rules.filter((rule) => rule.enabled !== false), [rules]);
      const preview = useMemo(
        () => composePreview({ document: doc, skillIds: selected, rules: activeRules, mode, intensity, routing }),
        [doc, selected, activeRules, mode, intensity, routing],
      );

      /* persist the local draft of rule edits */
      useEffect(() => {
        writeJson(DRAFT_KEY, { mode, intensity, selected });
      }, [mode, intensity, selected]);

      /* mirror the rule library to the host memory file (best effort) */
      const syncMemory = useCallback(
        async (nextRules) => {
          try {
            const result = await callHost(ctx, sessionId, { action: 'memory.put', rules: nextRules });
            setHostReady(result.ok);
          } catch {
            setHostReady(false);
          }
        },
        [ctx],
      );

      useEffect(() => {
        let alive = true;
        (async () => {
          const result = await callHost(ctx, sessionId, { action: 'memory.get' }).catch(() => null);
          if (!alive) return;
          setHostReady(Boolean(result && result.ok));
          if (result && result.ok && Array.isArray(result.data?.rules) && result.data.rules.length > 0) {
            const merged = mergeRules(readJson(RULES_KEY, []), result.data.rules);
            setRules(merged);
            writeJson(RULES_KEY, merged);
          }
        })();
        return () => {
          alive = false;
        };
      }, [ctx]);

      useEffect(() => {
        setRules((current) => {
          writeJson(RULES_KEY, current);
          return current;
        });
      }, [rules]);

      const refreshRuns = useCallback(async () => {
        const result = await callHost(ctx, sessionId, { action: 'runs.list' }).catch(() => null);
        if (result && result.ok && Array.isArray(result.data?.rows)) setRuns(result.data.rows);
      }, [ctx]);

      useEffect(() => {
        refreshRuns();
      }, [refreshRuns]);

      const pushToast = useCallback((text, tone) => {
        setToast({ text, tone });
        window.setTimeout(() => setToast(null), 6000);
      }, []);

      const onFile = useCallback(async (file) => {
        setBusy(true);
        setDocError(null);
        try {
          const parsed = await extractDocument(file);
          if (parsed.text.trim() === '') throw new Error('这个文件里没有可读的文字（可能是扫描版或纯图片）');
          setDoc({ ...parsed, chars: countChars(parsed.text) });
          setShowPaste(false);
        } catch (error) {
          setDocError(error instanceof Error ? error.message : String(error));
        } finally {
          setBusy(false);
        }
      }, []);

      const applyPaste = useCallback(() => {
        const text = pasted.replace(/\r\n?/g, '\n');
        if (text.trim() === '') return;
        setDoc({ name: '粘贴的正文.md', format: 'text', text, chars: countChars(text) });
        setShowPaste(false);
        setDocError(null);
      }, [pasted]);

      const toggleSkill = useCallback((id) => {
        setSelected((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));
      }, []);

      const saveRule = useCallback(() => {
        if (!editor) return;
        const name = editor.name.trim();
        const text = editor.text.trim();
        if (name === '' || text === '') return;
        setRules((current) => {
          const next = { ...editor, id: editor.id || uid(), name, text, enabled: editor.enabled !== false, updatedAt: nowIso() };
          const merged = current.some((rule) => rule.id === next.id) ? current.map((rule) => (rule.id === next.id ? next : rule)) : [...current, next];
          syncMemory(merged);
          return merged;
        });
        setEditor(null);
        pushToast('规则已存入规则库', 'ok');
      }, [editor, syncMemory, pushToast]);

      const deleteRule = useCallback(
        (id) => {
          setRules((current) => {
            const next = current.filter((rule) => rule.id !== id);
            syncMemory(next);
            return next;
          });
        },
        [syncMemory],
      );

      const toggleRule = useCallback(
        (id) => {
          setRules((current) => {
            const next = current.map((rule) => (rule.id === id ? { ...rule, enabled: rule.enabled === false } : rule));
            syncMemory(next);
            return next;
          });
        },
        [syncMemory],
      );

      const generate = useCallback(async () => {
        if (!doc) {
          pushToast('先放入文档，或粘贴正文', 'error');
          return;
        }
        if (selected.length === 0 && activeRules.length === 0) {
          pushToast('至少勾选一套技巧，或添加一条自定义指令', 'error');
          return;
        }
        setSending(true);
        try {
          const skills = pickSkills(selected).map((skill) => ({
            id: skill.id,
            label: skill.label,
            labelEn: skill.labelEn,
            layer: skill.layer,
            summary: skill.summary,
            apply: skill.apply,
            readme: skill.readme,
          }));
          const payload = {
            action: 'compose',
            createdAt: nowIso(),
            runLabel: doc.name,
            document: { name: doc.name, format: doc.format, text: doc.text, chars: doc.chars },
            skills,
            customRules: activeRules.map((rule) => ({ name: rule.name, category: rule.category, text: rule.text })),
            routing,
            mode,
            intensity,
            stageIds: stagesFor(mode),
          };
          const result = await callHost(ctx, sessionId, payload);
          if (!result.ok) {
            pushToast(result.error || '生成失败', 'error');
            return;
          }
          setRuns((current) => [
            { runId: result.data.runId, document: doc.name, createdAt: payload.createdAt, skills: skills.map((s) => s.id), dir: result.data.runDir },
            ...current,
          ].slice(0, 12));
          pushToast(`任务单已生成：${result.data.runDir}`, 'ok');

          /* Hand the task to the live agent for this session. */
          const handed = await sendToAgent(ctx, sessionId, result.data);
          if (!handed.ok) pushToast(`任务单已落盘，但没有送达会话：${handed.reason}。可以复制右侧预览手动发送。`, 'error');
        } catch (error) {
          pushToast(error instanceof Error ? error.message : String(error), 'error');
        } finally {
          setSending(false);
        }
      }, [ctx, doc, selected, activeRules, routing, mode, intensity, sessionId, pushToast]);

      const allOn = selected.length === SKILLS.length;
      const stageIds = stagesFor(mode);

      return h(
        'div',
        { className: 'wwp-root' },
        h(
          'header',
          { className: 'wwp-head' },
          h(
            'div',
            { style: { minWidth: 0 } },
            h('h1', null, t('panel.title', '论文改写工作台')),
            h('p', null, t('panel.subtitle', '文档 · 技巧组合 · 自定义规则 · 一次生成可执行改稿任务')),
            h(
              'div',
              { className: 'wwp-head-meta' },
              h(Chip, { tone: doc ? 'ok' : 'warn' }, doc ? h('span', null, '已就绪 ', h('b', null, formatChars(doc.chars)), ' 字') : '未放入文档'),
              h(Chip, null, '技巧 ', h('b', null, String(selected.length)), ` / ${SKILLS.length}`),
              h(Chip, null, '规则 ', h('b', null, String(activeRules.length)), ' 条'),
              h(Chip, { tone: hostReady === false ? 'warn' : hostReady === true ? 'ok' : undefined }, hostReady === null ? '连接工作区…' : hostReady ? '宿主已连接' : '仅本地模式'),
              sessionId ? h(Chip, { tone: 'ok' }, '会话已连接') : h(Chip, { tone: 'warn' }, '无会话：只落盘'),
            ),
          ),
          h('div', { className: 'wwp-spacer' }),
          h(
            'div',
            { className: 'wwp-row' },
            h('button', { type: 'button', className: 'wwp-btn', onClick: () => ctx.layout?.selectPanel?.(null), title: '回到对话' }, '← 回对话'),
            h(
              'button',
              { type: 'button', className: 'wwp-btn is-primary', disabled: sending || busy || !doc, onClick: generate },
              sending ? h('span', { className: 'wwp-spin' }) : null,
              sending ? '生成中…' : '生成任务单并开始',
            ),
          ),
        ),
        h(
          'div',
          { className: 'wwp-body' },
          /* ---------------------------------------------------------- left */
          h(
            'aside',
            { className: 'wwp-col wwp-col-left' },
            h(
              Section,
              { title: '① 放入文档' },
              doc
                ? h(
                    'div',
                    { className: 'wwp-file' },
                    h('span', { className: 'wwp-file-icon' }, (doc.format || 'txt').slice(0, 3).toUpperCase()),
                    h(
                      'div',
                      { style: { minWidth: 0, flex: 1 } },
                      h('div', { className: 'wwp-file-name', title: doc.name }, doc.name),
                      h('div', { className: 'wwp-file-meta' }, `${formatChars(doc.chars)} 字 · ${doc.format}`),
                      h('div', { className: 'wwp-row', style: { marginTop: 6 } }, h('button', { type: 'button', className: 'wwp-btn is-sm', onClick: () => setDoc(null) }, '换一份'), h('button', { type: 'button', className: 'wwp-btn is-sm', onClick: () => setShowPaste((v) => !v) }, '改粘贴')),
                    ),
                  )
                : h(DropZone, { onFile, busy, error: docError }),
              !doc || showPaste
                ? h(
                    'div',
                    { style: { marginTop: 10 } },
                    h('button', { type: 'button', className: 'wwp-btn is-ghost is-sm', onClick: () => setShowPaste((v) => !v) }, showPaste ? '收起粘贴框' : '或者直接粘贴正文'),
                    showPaste
                      ? h(
                          'div',
                          { style: { marginTop: 8 } },
                          h('textarea', { className: 'wwp-textarea', style: { minHeight: 120 }, value: pasted, placeholder: '把论文正文粘贴到这里…', onChange: (event) => setPasted(event.target.value) }),
                          h('button', { type: 'button', className: 'wwp-btn is-primary is-sm', style: { marginTop: 6 }, disabled: pasted.trim() === '', onClick: applyPaste }, '使用这段正文'),
                        )
                      : null,
                  )
                : null,
              h('div', { className: 'wwp-hint' }, 'docx 会保留标题层级与表格；扫描版 PDF 请先转成文字。'),
            ),
            h(
              Section,
              { title: '② 任务设置' },
              h('div', { className: 'wwp-field' }, h('label', null, '任务模式'), h('div', { className: 'wwp-seg', style: { flexWrap: 'wrap' } }, MODES.map((entry) => h('button', { key: entry.id, type: 'button', className: mode === entry.id ? 'is-on' : '', onClick: () => setMode(entry.id), title: entry.hint }, entry.id)))),
              h('div', { className: 'wwp-field' }, h('label', null, '改写力度'), h('div', { className: 'wwp-seg', style: { flexWrap: 'wrap' } }, INTENSITIES.map((entry) => h('button', { key: entry.id, type: 'button', className: intensity === entry.id ? 'is-on' : '', onClick: () => setIntensity(entry.id), title: entry.hint }, entry.id))), h('div', { className: 'wwp-hint' }, (INTENSITIES.find((entry) => entry.id === intensity) || INTENSITIES[1]).hint)),
              h('div', { className: 'wwp-field' }, h('label', null, '本次阶段'), h('div', { className: 'wwp-stages' }, STAGES.map((stage) => h('span', { key: stage.id, className: `wwp-stage ${stageIds.includes(stage.id) ? 'is-on' : ''}`, title: stage.hint }, stage.label)))),
              h('div', { className: 'wwp-hint' }, routing.note ? `语言路由：${routing.note}` : `语言路由：${routing.language}`),
            ),
            h(
              Section,
              { title: '③ 最近任务', count: runs.length > 0 ? `${runs.length} 条` : undefined },
              runs.length === 0
                ? h('div', { className: 'wwp-empty' }, '还没有生成过任务单')
                : runs.slice(0, 8).map((run) =>
                    h(
                      'div',
                      { key: run.runId, className: 'wwp-run' },
                      h('span', { className: 'wwp-run-name', title: run.document }, run.document),
                      h('span', { className: 'wwp-run-meta' }, (run.skills || []).length > 0 ? `${run.skills.length} 套` : '自定义'),
                      h('button', { type: 'button', className: 'wwp-btn is-ghost is-sm', title: '复制任务单路径', onClick: () => copyText(`${run.dir}/request.md`) }, '路径'),
                    ),
                  ),
            ),
          ),
          /* -------------------------------------------------------- center */
          h(
            'main',
            { className: 'wwp-col' },
            h(
              Section,
              { title: '技巧组合', count: `${selected.length} / ${SKILLS.length} 已选` },
              h(
                'div',
                { className: 'wwp-row', style: { marginBottom: 10 } },
                h('button', { type: 'button', className: 'wwp-btn is-sm', onClick: () => setSelected(allOn ? [] : SKILLS.map((skill) => skill.id)) }, allOn ? '全部取消' : '全部勾选'),
                h('button', { type: 'button', className: 'wwp-btn is-sm', onClick: () => setSelected(['humanizer-zh', 'stop-slop', 'ai-flavor-remover', 'shuorenhua']) }, '中文改稿预设'),
                h('button', { type: 'button', className: 'wwp-btn is-sm', onClick: () => setSelected(['humanizer-zh', 'stop-slop', 'shuorenhua']) }, '只清理不重写'),
                h('span', { className: 'wwp-hint', style: { marginLeft: 'auto', marginTop: 0 } }, '点击卡片勾选，点摘要展开详情'),
              ),
              h('div', { className: 'wwp-skills' }, SKILLS.map((skill) => h(SkillCard, { key: skill.id, skill, selected: selected.includes(skill.id), onToggle: toggleSkill }))),
            ),
            h(
              Section,
              { title: '可扩展的指令库', count: `${rules.length} 条（本次启用 ${activeRules.length}）` },
              h(
                'div',
                { className: 'wwp-row', style: { marginBottom: 10 } },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'wwp-btn is-primary is-sm',
                    onClick: () =>
                      setEditor({
                        name: '',
                        category: '语气',
                        text: '',
                      }),
                  },
                  '+ 新增指令',
                ),
                h('span', { className: 'wwp-hint', style: { marginLeft: 'auto', marginTop: 0 } }, '这些指令会以高于技巧默认值、低于事实锁定的优先级进入下一份任务单'),
              ),
              rules.length === 0
                ? h('div', { className: 'wwp-empty' }, '规则库还是空的。可以先加一条试试，例如「段首禁用『综上所述』」或「结论节保留全部 hedging」。')
                : rules.map((rule) => h(RuleRow, { key: rule.id, rule, onToggle: toggleRule, onEdit: (target) => setEditor(target), onDelete: deleteRule })),
              editor ? h(RuleEditor, { draft: editor, editing: Boolean(editor.id), onChange: setEditor, onSave: saveRule, onCancel: () => setEditor(null) }) : null,
              saveHint ? h('div', { className: 'wwp-hint' }, saveHint) : null,
            ),
            h(
              Section,
              { title: '工作流自检' },
              h(
                'div',
                { className: 'wwp-note' },
                '事实优先：先锁台账再改表达；检测率不是验收标准；「AI 味」在学术写作里有一部分是规范（hedging、术语一致、可复现），不要为了去味把它们删掉。',
              ),
            ),
          ),
          /* --------------------------------------------------------- right */
          h(
            'aside',
            { className: 'wwp-col wwp-col-right' },
            h(
              Section,
              { title: '任务单预览', count: h('button', { type: 'button', className: 'wwp-btn is-ghost is-sm', onClick: () => copyText(preview).then((ok) => pushToast(ok ? '已复制任务单' : '复制失败', ok ? 'ok' : 'error')) }, '复制') },
              h('pre', { className: 'wwp-preview' }, preview),
            ),
            h(
              Section,
              { title: '将要落盘的文件' },
              h(
                'div',
                { style: { display: 'grid', gap: 5, fontSize: 11.5, color: 'var(--dsw-alias-label-secondary)' } },
                h('code', null, '.dsh/writing-workflow/runs/<时间>-<文档>/request.md'),
                h('code', null, '.dsh/writing-workflow/runs/<…>/document.md'),
                h('code', null, '.dsh/writing-workflow/runs/<…>/payload.json'),
                h('code', null, '.dsh/writing-workflow/runs.jsonl'),
                h('code', null, '.dsh/writing-workflow/memory.json'),
              ),
            ),
            h(
              Section,
              { title: '交付要求' },
              h(
                'ul',
                { style: { margin: 0, paddingLeft: 16, color: 'var(--dsw-alias-label-secondary)', fontSize: 11.5, lineHeight: 1.7 } },
                h('li', null, 'scan-report / fact-ledger / revised / revision-table 四份'),
                h('li', null, '每处改动「原句 → 改句 → 理由」'),
                h('li', null, '数字与 [n] 逐条回溯，不新增事实'),
                h('li', null, '结尾两句话复述主张 + 一处待确认'),
              ),
            ),
          ),
        ),
        toast
          ? h(
              'div',
              { className: `wwp-toast ${toast.tone === 'error' ? 'is-error' : toast.tone === 'ok' ? 'is-ok' : ''}` },
              h('span', null, toast.text),
              h('button', { type: 'button', className: 'wwp-btn is-ghost is-sm', style: { marginLeft: 'auto' }, onClick: () => setToast(null) }, '知道了'),
            )
          : null,
      );
    }

    function mergeRules(local, remote) {
      const byId = new Map();
      for (const rule of Array.isArray(remote) ? remote : []) if (rule && rule.id) byId.set(rule.id, rule);
      for (const rule of Array.isArray(local) ? local : []) if (rule && rule.id) byId.set(rule.id, rule);
      return Array.from(byId.values());
    }

    async function copyText(text) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        try {
          const area = document.createElement('textarea');
          area.value = text;
          area.style.position = 'fixed';
          area.style.opacity = '0';
          document.body.appendChild(area);
          area.select();
          const ok = document.execCommand('copy');
          area.remove();
          return ok;
        } catch {
          return false;
        }
      }
    }

    /* ================================================= host call plumbing */

    function normalizeResult(value) {
      if (value === undefined || value === null) return { ok: false, error: '宿主没有响应' };
      if (typeof value === 'object' && value.kind === 'success') {
        const text = typeof value.text === 'string' ? value.text : '';
        let data = null;
        try {
          data = JSON.parse(text);
        } catch {
          data = null;
        }
        if (data && typeof data === 'object' && typeof data.ok === 'boolean') return { ok: data.ok, data, error: data.error };
        return { ok: true, data: data ?? { text }, text };
      }
      if (typeof value === 'object' && value.kind === 'error') return { ok: false, error: value.text || '宿主返回错误' };
      if (typeof value === 'object' && typeof value.ok === 'boolean') return { ok: value.ok, data: value.data ?? value, error: value.error };
      return { ok: true, data: value };
    }

    /** `ctx.remote.commands.execute(sessionId, line, attachments)` → RemoteResult<CommandExecution | undefined>. */
    async function executeCommand(ctx, sessionId, line) {
      const remote = ctx.remote;
      if (!remote || !remote.commands || typeof remote.commands.execute !== 'function') {
        throw new Error('客户端没有 remote.commands 通道');
      }
      const answer = await remote.commands.execute(sessionId, line, []);
      if (answer && answer.ok === false) {
        throw new Error(answer.error?.message || answer.error?.code || '命令被宿主拒绝');
      }
      const execution = answer && Object.prototype.hasOwnProperty.call(answer, 'value') ? answer.value : answer;
      if (execution === undefined || execution === null) {
        return { ok: false, error: '命令未注册（/writing-workflow），请确认插件已启用' };
      }
      return normalizeResult(execution.result ?? execution);
    }

    /** Run one Host operation for the panel's own session. */
    async function callHost(ctx, sessionId, payload) {
      if (!sessionId) throw new Error('当前没有打开中的会话；请回到对话再试，或先在本面板复制任务单');
      return executeCommand(ctx, sessionId, `/writing-workflow ${JSON.stringify(payload)}`);
    }

    /**
     * Tell the live agent to start. The Host command already injected the full
     * instruction (agent.inject); this message is the user-visible record and a
     * wake-up, so an idle session starts immediately instead of waiting.
     */
    async function sendToAgent(ctx, sessionId, data) {
      if (!sessionId) return { ok: false, reason: '没有打开中的会话' };
      const text = `已从「论文改写工作台」生成任务单：${data.requestPath}\n\n请读取任务单，按执行顺序开始：先出诊断与事实台账，再动笔改稿。`;
      try {
        if (ctx.sessions && typeof ctx.sessions.using === 'function') {
          const result = await ctx.sessions.using(sessionId, { source: 'writingWorkflow' }, (reference) =>
            reference.binding.session.prompt([{ type: 'text', text }], 'queue'),
          );
          if (result && result.ok === false) return { ok: false, reason: result.error?.message || '会话拒收' };
          return { ok: true };
        }
        return { ok: false, reason: 'sessions 服务不可用' };
      } catch (error) {
        return { ok: false, reason: error instanceof Error ? error.message : String(error) };
      }
    }

    /**
     * Which Session the Conversation is showing: the entry holding the main view.
     * The last current id is remembered at module scope, because opening this panel
     * closes the Conversation and the main view releases with it.
     */
    let lastCurrentSessionId = null;

    function useCurrentSessionId(useSessions) {
      let current = null;
      try {
        current = useSessions
          ? useSessions((state) => {
              const byId = state?.byId || {};
              const found = Object.values(byId).find((entry) => (entry?.retainedBy?.mainView ?? 0) > 0);
              return found?.id ?? null;
            })
          : null;
      } catch {
        current = null;
      }
      if (current) lastCurrentSessionId = current;
      return current ?? lastCurrentSessionId;
    }

    /* ================================================================ boot */

    const inject = ['slots', 'layout', 'locale', 'sessions', 'remote'];

    /** One sidebar glyph: a sheet with a check pen. Rendered at 16–18px. */
    function PanelGlyph({ size = 18 }) {
      const px = typeof size === 'number' && size > 0 ? size : 18;
      return h(
        'svg',
        { width: px, height: px, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true, style: { display: 'block' } },
        h('path', { d: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z', stroke: 'currentColor', strokeWidth: 1.7, strokeLinejoin: 'round' }),
        h('path', { d: 'M14 3v5h5', stroke: 'currentColor', strokeWidth: 1.7, strokeLinejoin: 'round' }),
        h('path', { d: 'M8.6 15.4l1.7 1.7 3.4-3.7', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }),
      );
    }

    function apply(ctx) {
      ctx.effect(
        () =>
          ctx.locale.register(NS, {
            zh: {
              'panel.title': '论文改写工作台',
              'panel.subtitle': '文档 · 技巧组合 · 自定义规则 · 一次生成可执行改稿任务',
            },
            en: {
              'panel.title': 'Paper Revision Workbench',
              'panel.subtitle': 'Document · skill composition · custom rules · one executable revision task',
            },
          }),
        'writing-workflow: dictionaries',
      );

      const labelText = () => {
        try {
          const text = ctx.locale.bind(NS)('panel.title');
          return typeof text === 'string' && text !== 'panel.title' ? text : '论文改写工作台';
        } catch {
          return '论文改写工作台';
        }
      };
      const fallbackT = (key, fallback) => (key === 'panel.title' ? labelText() : fallback ?? key);

      ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
        name: 'sidebar.panellist',
        id: PANEL_ID,
        order: 50,
        locale: NS,
        label: labelText,
      }, PanelGlyph));

      ctx.slots.inject('main', () => ctx.slots.register({
        name: 'main',
        key: PANEL_ID,
        locale: NS,
      }, function WritingWorkflowPanel(props) {
        /* `ctx` and `t` come from this closure; `useSessions` is a framework share. */
        return h(Panel, {
          ctx,
          t: typeof props.t === 'function' ? props.t : fallbackT,
          useSessions: props.useSessions,
        });
      }));

      /* A compact launcher next to the composer keeps the panel one click away. */
      ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
        name: 'conversation.composer.dock',
        id: 'writing-workflow-launcher',
        order: 40,
        locale: NS,
      }, function WorkflowLauncher(props) {
        const label = typeof props.t === 'function' ? props.t('panel.title') : labelText();
        if (typeof props.sessionId === 'string' && props.sessionId !== '') lastCurrentSessionId = props.sessionId;
        return h(
          'button',
          {
            type: 'button',
            className: 'wwp-btn is-sm',
            style: { marginBottom: 6 },
            title: label,
            onClick: () => {
              try {
                ctx.layout.selectPanel(PANEL_ID);
              } catch {
                /* the panel registration is not live yet */
              }
            },
          },
          h('span', { style: { fontWeight: 700 } }, '✎'),
          ` ${label}`,
        );
      }));
    }

    return {
      inject,
      apply,
      /** Test seams: the browser-side document reader (md/txt/docx). */
      extractDocument,
      docxXmlToText,
    };
  },
});




