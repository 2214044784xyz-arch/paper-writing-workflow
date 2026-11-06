# stop-slop（英文硬规则：让 AI 停止套路）
> 来源：https://github.com/hardikpandya/stop-slop（SKILL.md + references/，MIT）；原文 8 条硬规则

## 一句话定位
把可预测的 AI 散文痕迹当敌人，用绝对命令式硬规则清掉填充语、公式化结构、被动语态与套话。目标不是"写得更好"，是"读起来不像 AI"。

## 硬规则清单
1. **Cut filler phrases.** 删掉开场清嗓子、强调拐杖、全部副词。"Remove throat-clearing openers, emphasis crutches, and all adverbs."
   - 杀：Here's the thing / It turns out / The uncomfortable truth is / Let me be clear / I'll say it again。
   - 杀："Full stop." "Let that sink in." "Make no mistake."。
   - 杀：At its core / In today's X / It's worth noting / When it comes to / The reality is。
   - 替换：商业黑话 → 白话。Navigate → Handle；Unpack → Explain；Deep dive → Analysis；Circle back → Revisit。
   - 杀表演式强调：creeps in / I promise / They exist, I promise。
   - 杀"宣称而非展示"：This is genuinely hard / This is what X actually looks like / actually matters。难度和重要性要靠内容证明，不许自我播报。
2. **Break formulaic structures.** "Avoid binary contrasts, negative listings, dramatic fragmentation, rhetorical setups, false agency."
3. **Use active voice.** "Every sentence needs a human subject doing something. No passive constructions."
   - 替换：X was created → 点名是谁造的；It is believed that → 点名是谁信的；Mistakes were made → 点名是谁犯的。
4. **Be specific.** "No vague declaratives." 禁止 "The reasons are structural" / "The implications are significant" / "The stakes are high"，点名具体那一件事。
   - 连带禁止懒极端词：every / always / never / everyone / nobody。用具体事实代替全称断言。
5. **Put the reader in the room.** "No narrator-from-a-distance voice." 禁 "Nobody designed this" / "People tend to…"，换成 "You don't sit down one day and decide to…"。
6. **Vary rhythm.** "Mix sentence lengths. Two items beat three. End paragraphs differently. No em dashes."（破折号一律换成逗号或句号。）
7. **Trust readers.** "State facts directly. Skip softening, justification, hand-holding." 删掉 "And that's okay." 这类发许可的句子。
8. **Cut quotables.** "If it sounds like a pull-quote, rewrite it." 听起来像金句的句子，重写。
   - 附带杀元评论：In this section, we'll… / As we'll see… / The rest of this essay explains… / Hint: / Plot twist: / But that's another post / X is a feature, not a bug。文章自己往前走，不许播报自己的结构。

## 结构层面的破坏动作
- **开头**：不许清嗓子。任何 "here's what / this / that" 结构都是"讲重点之前的铺垫"，砍掉直接给重点。段落不许以 "So" 起头，句子不许以 "Look," 起头。
- **句子起手**：禁用 Wh- 开头（What / When / Where / Which / Who / Why / How）做事。"What makes this hard is…" 改成 "The constraint is…"，更好的是直接点名那个约束。
- **中间段**：不许用二元对比造戏（"Not because X. Because Y." / "[X] isn't the problem. [Y] is."），直接陈述 Y。不许否定式清单（"Not a X… Not a Y… A Z."），读者不需要跑道。
- **断句**：不许为强调写残句（"[Noun]. That's it. That's the [thing]."），写完整句。不许堆短促句制造"深度"。
- **设问**：不许 "What if …?" 开场、不许 "Here's what I mean:" 预告、不许 "Think about it:" 提示。
- **模板叙事**："By the time X, I was Y." 是叙事模板，不许用；"X that isn't Y" 太绕，直接写 "X is broken"；"stops being X and starts being Y" 是假转变弧，直接说现在是什么。
- **节奏对冲**：禁 "Not always. Not perfectly." 这类把对冲伪装成安慰的收尾。
- **段落结尾**：每段都以 punchline 收是机械节奏；换着收。连续三句等长，打断一句。
- **小标题**：原文没给小标题专项规则，能迁移的只有两条——小标题不许是元评论（"本节将…"），列表不许凑三项（三项列表改成两项或一项）。
- **假主体**：禁止无生命物做人类动作。"the decision emerges" / "the culture shifts" / "the data tells us" 一律点名到人。无人可点时用 "you"，把读者放进座位。

## 典型反例 → 改写
1. 前："Here's the thing: building products is hard. Not because the technology is complex. Because people are complex. Let that sink in."
   后："Building products is hard. Technology is manageable. People aren't."
2. 前："In today's fast-paced landscape, we need to lean into discomfort and navigate uncertainty with clarity. This matters because your competition isn't waiting."
   后："Move faster. Your competition is."
3. 前："Speed. Quality. Cost. You can only pick two. That's it. That's the tradeoff."
   后："Speed, quality, cost—pick two."
4. 前："What if I told you that the best teams don't optimize for productivity? Here's what I mean: they optimize for learning. Think about it."
   后："The best teams optimize for learning, not productivity."
（注：例 3 的后半句带破折号，来自原文 examples.md，与"禁破折号"规则本身冲突，改写时可换成逗号。）

## 用在论文修改时的冲突点
- **被动语态**：原文 "No passive constructions" 与 Methods 节惯例（"Samples were collected"）直接对撞。处理：保留被动但补施动者，或整句改主动，不要整节硬翻。
- **hedging**：原文把 hedges（may / suggest / likely / appear）归入"软化和副词"一并杀掉；学术写作里 hedging 是认识论诚实，不是 AI 味。这条必须让步。
- **Trust readers / skip justification**：论文恰恰要求证据链与推导，不能只给断言。
- **缺口陈述**：文献综述靠 "X 不足，因此 Y" 的否定转肯定推进，正撞 "Not X. But Y." 禁令。改成直接陈述 Y 与具体 gap。
- **三项列表**：论文摘要与贡献列表习惯写三条，"Two items beat three" 与之冲突；按期刊惯例，不按本规则。
- **"you" 第二人称**：与学术第三人称规范冲突，只在博客/科普改写时用。
- **破折号**：部分期刊用 en/em dash 做插入语；排版规范优先于本规则。

## 使用注意
- 这是英语散文规则，中文写作只能借其判断，不能逐条套译，否则会写出另一种腔调。
- 8 条是绝对命令，冲突时以期刊规范、事实准确、可复核性为先，不要为了"去 AI 味"删掉引用、数据、limitations。
- 自检可用原文 5 维打分（Directness / Rhythm / Trust / Authenticity / Density，各 1–10），低于 35/50 才重写，避免过度删改把论文删空。
- 只依据原文：原文未涉及的场景（小标题、图表说明、审稿回复信）不要凭空扩展规则。
