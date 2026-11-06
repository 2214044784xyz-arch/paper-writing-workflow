# Humanizer（英文：去除 AI 写作痕迹）

> 来源：https://raw.githubusercontent.com/blader/humanizer/main/SKILL.md；原文 26 条规则（§1–§26，分 A–F 六组）；基于维基百科「Signs of AI writing」

## 一句话定位

把"读起来像模型默认输出"的句子改回"某个具体的人写给某个具体读者"的句子：只改表达，不加事实、不删论断；编号越靠前越是硬信号。

## 规则清单

原文自述：§1–§5 见一次即可动手；标 *weak alone* 的条目需同段再有两三处旁证才改，单发不构成证据。

### A. Staging instead of stating（用铺垫代替陈述）

- **§1 Not X but Y**：`not X but Y` / `it's not X, it's Y` / `X rather than Y` / 拆成两句的对比 / 截断否尾（"...，no guessing"）→ 否定半句只是立了个没人主张过的靶子，改为直接陈述；只有否定半句在纠正读者真实旧观念时才保留对比。
- **§2 One-line closers**：单句成段重复上段、"That is the real win."、"Read that again."、每节后同一句收尾、例子后补一句"This shows the importance of..."、碎片排比（"No aesthetic prior. No nostalgia."）→ 删掉只求停顿的收尾句；收尾句带新事实或新后果才留。
- **§3 Sayings that sound deep**：the real question is / at its core / what really matters / fundamentally / X is the Y of Z / X becomes a trap → 把格言换回可核对的具体主张。
- **§4 Staged run-up**：Let's dive in / Here's what you need to know / without further ado / Honestly? / Here's the thing → 删掉起跑段，直接给内容；"Honestly" 夹在句中属正常口语，独立成句的才是指纹。
- **§5 Arguing with no one**：This isn't about / I'm not saying / To be clear / Some might say... but / A tempting approach would be → 删掉对空气的辩护与无人提出的备选方案；若其中藏着真主张，就把主张说出来。

### B. Rhythm by rule（用规则代替节奏）

- **§6 Forced triads**：三个并列（"innovation, inspiration, and insights"）、三例平行、三个短事实加一句教训 → 检查是否真有三层意思，否则合并、深写最强的一个或改结构。
- **§7 Repeated sentence openings**：连续多句同一主语（多为 she/he）→ 合并句子、换主语或让动作开头；不是禁用该词，节奏性重复（"She came. She saw."）可留。
- **§8 Dashes**：破折号（—/–）、空格破折号、双连字符 ` -- ` 当连接词 → 换成句号、逗号、冒号或括号，或重写句子；无作者样文时终稿不得出现破折号。
- **§9 Stacked qualifiers**：could potentially / might arguably / it's also possible / to be fair 层层叠加 → 只保留来源支持、语义需要的限定；常规模糊语（perhaps、tends to）是人话。
- **§10 Hyphenated pairs**：high-quality、well-documented 出现在名词后仍带连字符 → 名词前保留连字符，名词后去掉；词典固定写法（third-party）不减。
- **§11 Passive voice / missing subjects**：隐去施动者、无主语短句（"No configuration file needed."）→ 主动语态让"谁做什么"清楚。

### C. Inflation and borrowed authority（夸大与借来的权威）

- **§12 Overused AI words**：additionally / crucial / delve / enhance / pivotal / robust / showcase / tapestry / testament / underscore / vibrant 等 → 换成平常词；这些词不论出现在哪都算信号。
- **§13 Inflated significance**：stands as a testament / pivotal moment / plays a key role / reflects a broader / setting the stage，以及"挑战与展望"套节与结尾祝辞（"The future looks bright"）→ 只留事实，删掉它"意味着什么"；以最后一个具体事实收尾。
- **§14 Vague association**：associated with / linked to / in connection with 不说清是什么关系 → 写出真实关系（创办者、董事、顾问）；来源没说就保留模糊措辞，不要替它编一个身份。
- **§15 Shallow -ing riders**：highlighting / underscoring / reflecting / symbolizing / showcasing 挂在事实后 → 删掉 -ing 修饰；钉到"某位名人强调过"也不因此为真。
- **§16 Sales language**：nestled / in the heart of / breathtaking / renowned / must-visit / diverse array → 直接说它是什么（哪国哪地区的什么城镇）。
- **§17 Borrowed authority**：experts argue / industry reports / some critics；被"刊载于一串大报名单"背书；"粉丝逾 N 万"→ 指名道姓说谁说了什么，否则删掉这条支撑；仅"缺引注"本身不算 AI 证据。
- **§18 Avoiding is/are/has**：serves as / stands as / functions as / boasts / features / represents → 还原成 is、are、has。

### D. Formatting by rule（用规则代替排版判断）

- **§19 Bold as decoration**：通篇加粗关键词、每个列表项都是"粗体标签 + 冒号"→ 去掉加粗；标签本身不携带信息就把列表改成散文。
- **§20 Decorative headings**：标题逐词大写、标题或列表挂 emoji 与箭头（如 `→`）、每节之间加分隔横线、开篇一级标题重复文档名、为效果而写的标题（"The decision, on one screen"）→ 改句首大写、去装饰、让标题说出这一节装了什么。
- **§21 Curly quotes**：目标格式用直引号却出现 “ ” → 换成直引号；编辑器自动弯引号，故单发不算证据。

### E. Leftovers from the chat and the draft（聊天与草稿残留）

- **§22 Chatbot residue**：Great question! / Certainly! / I hope this helps / Let me know / Want me to...? → 整体删除外壳，只留内容；这是清单里最确定的信号。
- **§23 Knowledge-limit disclaimers**：as of [date] / up to my last training update / not publicly available / likely grew up in... → 明说来源没有这条，或删句；不要用"想必是……"把空白填平。
- **§24 Heading repeated in first sentence**：标题下先来一句复述标题的一行段 → 删掉复述句，直接进内容。
- **§25 Writing about the document**：交代"这函数是为替换旧写法而加"、"本文由……汇编"、"下表比较"、"本节按负责人组织"→ 只写主题，不写自己怎么写的；改动说明留在 changelog。
- **§26 Re-explaining what the reader knows**：回复里先复述问题、走一遍诊断、摆完证据，结论落在最后一行 → 先给决定，只留能改变对方判断的那一条理由。

## 典型反例 → 改写

**例 1（§1 Not X but Y）**

- 原文：`It's not just about the beat riding under the vocals; it's part of the aggression and atmosphere. It's not merely a song, it's a statement.`
- 改写：`The heavy beat adds to the aggressive tone.`
- 要点：两句"不是……而是……"实际只传递一个信息（鼓点加重了攻击性），否定的那一半没有任何人主张过。

**例 2（§15 Shallow -ing riders）**

- 原文：`The temple's color palette of blue, green, and gold resonates with the region's natural beauty, symbolizing Texas bluebonnets, the Gulf of Mexico, and the diverse Texan landscapes, reflecting the community's deep connection to the land.`
- 改写：`The temple is painted blue, green, and gold, colors meant to evoke Texas bluebonnets and the Gulf of Mexico.`
- 要点：两个 -ing 从句（symbolizing / reflecting）都是在给一句"涂了三种颜色"的事实加深度；删掉后信息量不减，且"三种颜色"的三段式也随之消失。

## 迁移到中文学术论文

1. **可直接迁移**：§1（"不是A而是B"是中文 AI 腔第一号特征）、§2（"这，才是关键"式单句收尾）、§3（"本质上/归根结底"）、§6（"首先、其次、最后"的三段强迫症）、§12（关键/深刻/赋能/维度/生态 等词滥用）、§13（把普通数据说成"具有重要意义"）、§17（"研究表明""学界普遍认为"却无出处，直接违反引注规范）、§19（通篇加粗）。这些在中文论文里同样是硬伤。
2. **需改造后迁移**：§18（serves as → "起到了……的作用/作为一个……存在"，改回"是/有"即可）；§11 被动语态要区分——方法节"样本被随机分为两组"是学科规范，不该一律改主动；§25 中"本文认为""本节安排如下"属中文论文惯例，只在通篇自述写作过程时才删。
3. **基本不能迁移**：§8 破折号、§10 连字符位置、§21 弯/直引号、§20 英文标题大小写、§7 的 she/he 重复主语——都是英文形态问题，中文对应物（——、"……"、标题层级）规则不同，只能借用"是否通篇机械一律"的判断原则，不能照抄字面规则。
4. **必须反向调整**：§26（写给已知背景的读者）在论文中恰恰相反，读者需要完整背景与可复现细节，删背景是违规；§9（限定语堆叠）与学术 hedging 冲突，"可能""在一定程度上"是严谨而非 AI 味，只有"可能在一定程度上或许"这种叠加才该改；§23 的"知识截止"在论文里应改写为写进 limitations 的数据可得性说明，而不是删句。

## 使用注意

- 先判强度再动手：§1–§5 一票即改；带 *weak alone* 的条目（§9、§10、§11、§21、§25）需同段旁证。中文文本单词级线索更弱、误伤率更高，宜多看段落形状（对比拆成两句、三例平行、每节同一收尾）。
- 只改表达，不改事实：不得新增人名、数字、日期、引文、排名；改结构时最易丢的是"几件事同时发生"这类断言（原文点名 §6、§9、§19 的整形操作最常丢）。
- 破折号规则有明确例外：作者提供了样文就按样文的破折号频率保留；代码块、行内代码、命令、路径、URL 内的连字符一律不动（中文对应：公式、变量名、文献条目）。
- 引用、术语、标题、专名里出现的"可疑词"不动；讨论该说法本身的段落也不算使用该说法。2022-11-30 之前的文本不适用。
- 保留承载作者声音的细节：具体到古怪的细节、矛盾情绪、年代梗、第一人称的选择、真诚的自我更正。
- 本 skill 面向英文博文/维基体写作，是"去 AI 味"清单而非学术规范；中文论文成稿仍以 paper-writing 主流程的学术要求与引注规范为准。
