#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""ai_trace_scan.py —— 论文 AI 痕迹扫描器（paper-writing skill 的诊断阶段工具）

用法：
    python ai_trace_scan.py 论文.docx
    python ai_trace_scan.py 稿子.md --out report.md
    python ai_trace_scan.py 稿子.md --json

设计原则：
1. 只做「提示」，不做判决。命中不等于必须改，学术写作里很多套语是合法的。
2. 区分「可改」与「不可动」：数字、引用标记 [12]、变量名、英文术语原样保护。
3. 输出按分节给建议：摘要/引言/综述可以重写，方法/结果只做轻度清理。

依赖：标准库即可；.docx 用 python-docx（若装了）否则用 zipfile 兜底解析。
"""

from __future__ import annotations

import argparse
import json
import re
import statistics
import sys
import zipfile
from dataclasses import dataclass, field
from pathlib import Path

CITATION = re.compile(r"\[\s*\d+(?:\s*[-–,，]\s*\d+)*\s*\]|（\s*\d{4}\s*）|\(\s*\d{4}\s*\)")


@dataclass
class Rule:
    cid: str
    name: str
    category: str
    patterns: list[str]
    weight: float
    note: str
    flags: int = re.M
    english_only: bool = False


@dataclass
class Hit:
    rule: Rule
    text: str
    line: int
    para: int


RULES: list[Rule] = [
    # ---------- 中文：内容层 ----------
    Rule("zh-01", "宏大时代开场", "内容", [
        r"在当今[^。]{0,20}(?:背景|时代|环境)下",
        r"随着[^。]{0,15}(?:的)?(?:快速|飞速|迅猛|不断)发展",
        r"近年来[，,]?\s*随着",
        r"众所周知",
        r"不难发现",
        r"不可否认",
    ], 2.0, "论文引言不需要「时代背景铺垫」，直接给事实与缺口。"),
    Rule("zh-02", "空泛价值判断", "内容", [
        r"具有(?:重要|深远|重大)(?:的)?(?:理论|现实|实践)?意义",
        r"发挥(?:着)?(?:重要|关键|积极)(?:的)?作用",
        r"至关重要",
        r"意义重大",
        r"产生了深远(?:的)?影响",
        r"提供了(?:有力|重要)(?:的)?(?:支撑|参考|借鉴)",
    ], 2.0, "把「很重要」换成「对谁、在哪一步、影响多大」。"),
    Rule("zh-03", "升华式收尾", "内容", [
        r"只有[^。]{2,20}才能",
        r"让我们[^。]{0,15}",
        r"共同(?:谱写|开创|迈向)",
        r"未来可期",
        r"新高度",
    ], 2.5, "论文结论落在「边界与未解问题」，不落在口号。"),
    Rule("zh-04", "绝对化表述", "内容", [
        r"极大(?:地)?(?:提升|提高|改善|促进)",
        r"全面(?:地)?(?:提升|解决|覆盖)",
        r"彻底(?:解决|改变)",
        r"完美(?:地)?(?:解决|契合)",
        r"显著(?:地)?(?:提升|提高)(?![^。]{0,12}(?:p\s*[<=]|系数|回归))",
    ], 2.0, "实证论文里「显著」只属于统计结果，不能拿来做修辞。"),
    Rule("zh-05", "模糊归因", "内容", [
        r"(?<![，。；\s])(?:研究表明|研究发现|数据显示|调查显示)(?![^。]{0,8}\[\d)",
        r"有学者(?:认为|指出)(?![^。]{0,8}\[\d)",
        r"业界(?:普遍)?认为",
        r"专家(?:指出|表示)",
    ], 2.5, "每个「研究表明」后面必须能落到具体文献或数据。"),
    # ---------- 中文：语法层 ----------
    Rule("zh-06", "连接词轰炸", "语法", [
        r"值得注意的是",
        r"综上所述",
        r"总而言之",
        r"由此可见",
        r"换言之",
        r"换句话说",
        r"一方面[^。]{0,60}另一方面",
        r"不仅[^。]{0,40}(?:而且|还|更)",
    ], 1.5, "删掉 70%，逻辑靠内容承接而不是靠路牌。"),
    Rule("zh-07", "三步式排比", "语法", [
        r"既要[^。]{2,25}又要[^。]{2,25}(?:还要|更要)",
        r"(?:是|为)[^。，]{2,12}，是[^。，]{2,12}，也是[^。，]{2,12}",
        r"从[^。，]{2,10}看[^。]{0,40}从[^。，]{2,10}看",
    ], 1.5, "三段式排比是最典型的「模型节奏」，改成两段或散句。"),
    Rule("zh-08", "名词化与虚动词", "语法", [
        r"(?:进行|开展|实施)(?:了)?(?:一(?:次|项|个))?[^。，]{0,10}(?:分析|研究|探讨|梳理|论述)",
        r"对[^。，]{2,20}进行[^。，]{0,8}",
        r"(?:予以|加以)[^。，]{2,8}",
    ], 1.0, "「对X进行分析」→「分析X」，动词回到前台。"),
    Rule("zh-09", "被动与无主句", "语法", [
        r"被(?:认为|视为|看作|广泛)(?:为)?",
        r"得到了?(?:广泛|充分)(?:的)?(?:关注|讨论|验证)",
    ], 1.0, "能补主语就补主语：谁发现、谁验证、谁提出。"),
    # ---------- 中文：风格层 ----------
    Rule("zh-10", "破折号滥用", "风格", [r"——"], 1.0, "一段里出现两次以上就要拆句。"),
    Rule("zh-11", "分号串联长句", "风格", [r"；[^。]{20,}"], 0.3, "分号连着三句以上，说明句子该拆了。"),
    Rule("zh-12", "引号强调滥用", "风格", [r"[“”][^“”]{1,6}[“”][^。]{0,3}[“”]"], 0.3, "引号用来标术语，不用来加重语气。"),
    Rule("zh-13", "列表化正文", "风格", [r"^\s*[-*•·]\s+\S"], 1.2, "论文正文成段，罗列交给表格。"),
    Rule("zh-14", "标题党小标题", "风格", [r"^#{1,6}\s+.*[：:].*[？?！!]", r"^(?:一|二|三|四|五|六|七|八|九|十)、.{0,20}[：:]"], 0.6, "小标题写结论名词，不写悬念。"),
    # ---------- 中文：填充词 ----------
    Rule("zh-15", "填充词", "填充词", [
        r"在某种程度上",
        r"从某种意义上(?:说|讲)",
        r"毋庸置疑",
        r"事实上[，,]",
        r"毫无疑问",
        r"需要指出的是",
        r"应当看到",
    ], 1.2, "直接删，删完读一遍，语义没丢就是纯填充。"),
    Rule("zh-16", "元话语", "填充词", [
        r"本文(?:将|拟)?(?:试图|旨在)(?:探讨|分析|研究)",
        r"接下来[，,]?(?:本文|我们)",
        r"如前所述",
        r"回到.{0,10}问题",
    ], 0.8, "「本文旨在」留一次即可，其余删。"),
    # ---------- 英文 ----------
    Rule("en-01", "英文 AI 高频词", "英文", [
        r"\b(?:delve|delves|delving)\b",
        r"\b(?:delve|delves|delving)\b",
        r"\btapestry\b",
        r"\b(?:landscape|realm|testament)\b",
        r"\b(?:pivotal|crucial|paramount|intricate)\b",
        r"\bunderscor(?:e|es|ing)\b",
        r"\b(?:seamless|seamlessly|robustly)\b",
        r"\bfoster(?:s|ing)?\b",
    ], 1.5, "替换成具体动词：show / measure / raise / reduce。"),
    Rule("en-02", "英文过渡词", "英文", [
        r"\b(?:Moreover|Furthermore|Additionally|Notably|Importantly),",
        r"\bIn conclusion\b",
        r"\bIt is worth noting that\b",
        r"\bIt is important to note\b",
    ], 1.2, "学术英文允许 moreover，但一段一个上限。"),
    Rule("en-03", "英文排比结构", "英文", [
        r"\bnot only\b[^.]{0,80}\bbut also\b",
        r"\b(?:Firstly|Secondly|Thirdly|Lastly),",
    ], 1.0, "三段式 First/Second/Third 是模型指纹。"),
    Rule("en-04", "英文破折号", "英文", [r"(?<=\s)—(?=\s)"], 1.0, "英文学术写作里 em dash 用得极少。", english_only=True),
]

# 保护性模式：命中这些区域的内容不参与「删改」建议，只做提示
PROTECTED = [
    (re.compile(r"^\s*(?:表|图|Table|Figure)\s*\d"), "图表题注"),
    (re.compile(r"^\s*(?:注|Note)[:：]"), "表注"),
    (re.compile(r"^(?:参考文献|References)\b"), "参考文献"),
]


def read_docx(path: Path) -> str:
    try:
        import docx  # type: ignore

        d = docx.Document(str(path))
        parts = [p.text for p in d.paragraphs]
        for t in d.tables:
            for row in t.rows:
                parts.append(" | ".join(c.text.strip() for c in row.cells))
        return "\n".join(parts)
    except Exception:
        # 兜底：直接解 zip 里的 document.xml
        with zipfile.ZipFile(path) as z:
            xml = z.read("word/document.xml").decode("utf-8", "ignore")
        xml = re.sub(r"</w:p>", "\n", xml)
        xml = re.sub(r"<w:tab[^>]*/>", "\t", xml)
        return re.sub(r"<[^>]+>", "", xml)


def read_text(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix == ".docx":
        return read_docx(path)
    for enc in ("utf-8-sig", "utf-8", "gb18030"):
        try:
            return path.read_text(encoding=enc)
        except UnicodeDecodeError:
            continue
    return path.read_text(encoding="utf-8", errors="replace")


def split_paragraphs(text: str) -> list[str]:
    paras = [re.sub(r"\s+", " ", p).strip() for p in re.split(r"\n\s*\n|\n", text)]
    return [p for p in paras if p and not CITATION.fullmatch(p)]


def is_protected(para: str) -> bool:
    return any(p.search(para) for p, _ in PROTECTED)


def is_english(text: str) -> bool:
    cjk = len(re.findall(r"[\u4e00-\u9fff]", text))
    latin = len(re.findall(r"[A-Za-z]", text))
    return latin > cjk * 2


def scan(text: str) -> tuple[list[Hit], dict]:
    paras = split_paragraphs(text)
    english = is_english(text)
    hits: list[Hit] = []
    for idx, para in enumerate(paras, start=1):
        if is_protected(para):
            continue
        for rule in RULES:
            if rule.english_only and not english:
                continue
            for pat in rule.patterns:
                for m in re.finditer(pat, para, rule.flags):
                    start = max(0, m.start() - 12)
                    end = min(len(para), m.end() + 18)
                    snippet = ("…" if start else "") + para[start:end] + ("…" if end < len(para) else "")
                    hits.append(Hit(rule, snippet, idx, idx))

    # 结构指标：只统计「正文句」，过滤标题与超长未断句
    lengths = [len(p) for p in paras]
    raw_sentences = [s.strip() for s in re.split(r"[。！？!?]", text)]
    sent_len = [len(s) for s in raw_sentences if 10 <= len(s) <= 150]
    metrics = {
        "paragraphs": len(paras),
        "chars": len(re.sub(r"\s", "", text)),
        "para_len_mean": round(statistics.mean(lengths), 1) if lengths else 0,
        "para_len_cv": round(statistics.pstdev(lengths) / statistics.mean(lengths), 3)
        if len(lengths) > 1 and statistics.mean(lengths)
        else 0,
        "sent_len_mean": round(statistics.mean(sent_len), 1) if sent_len else 0,
        "sent_len_stdev": round(statistics.pstdev(sent_len), 1) if len(sent_len) > 1 else 0,
        "em_dash": text.count("——"),
        "citations": len(CITATION.findall(text)),
        "bullets": len(re.findall(r"^\s*[-*•·]\s+", text, re.M)),
    }
    return hits, metrics


def score(hits: list[Hit], metrics: dict) -> dict:
    # 同一规则最多计 5 处，避免「一个高频标点淹没全篇」
    per_rule: dict[str, int] = {}
    for h in hits:
        per_rule[h.rule.cid] = per_rule.get(h.rule.cid, 0) + 1
    by_cat: dict[str, float] = {}
    for h in hits:
        if per_rule.get(h.rule.cid, 0) > 5:
            continue
        by_cat[h.rule.category] = by_cat.get(h.rule.category, 0) + h.rule.weight
    for cid, n in per_rule.items():
        if n > 5:
            rule = next(r for r in RULES if r.cid == cid)
            by_cat[rule.category] = by_cat.get(rule.category, 0) + rule.weight * 5
    base = sum(by_cat.values())
    # 归一：按千字密度
    per_k = 1000 / max(metrics["chars"], 1)
    density = base * per_k
    raw = min(100, round(density * 6))
    flags = []
    if metrics["para_len_cv"] and metrics["para_len_cv"] < 0.22:
        flags.append("段落长度过于均匀（CV<0.22），像按模板填出来的")
        raw = min(100, raw + 8)
    if metrics["sent_len_stdev"] and metrics["sent_len_stdev"] < 9:
        flags.append("句长方差过小（stdev<9），缺少长短句交替")
        raw = min(100, raw + 6)
    if metrics["para_len_cv"] > 0.9:
        flags.append("段长差异过大（CV>0.9），可能有标题/表格混入正文，建议按节分段扫描")
    if metrics["em_dash"] >= 3:
        flags.append(f"双破折号「——」{metrics['em_dash']} 处，超出中文论文常规")
    return {"index": raw, "by_category": {k: round(v, 1) for k, v in by_cat.items()}, "flags": flags}


def section_hint(para: str) -> str:
    if re.match(r"^\s*(?:摘\s*要|Abstract)", para):
        return "摘要"
    if re.search(r"引\s*言|研究背景|问题的提出", para):
        return "引言"
    if re.search(r"文献综述|研究现状|文献回顾", para):
        return "综述"
    if re.search(r"研究(?:设计|方法)|数据(?:来源|说明)|变量(?:定义|测量)", para):
        return "方法"
    if re.search(r"(?:实证|回归|结果)分析|稳健性", para):
        return "结果"
    if re.search(r"结论|讨论|研究局限|政策(?:建议|含义)", para):
        return "结论"
    return ""


def render_markdown(path: Path, hits: list[Hit], metrics: dict, sc: dict) -> str:
    hits_sorted = sorted(hits, key=lambda h: (-h.rule.weight, h.rule.cid))
    agg: dict[str, list[Hit]] = {}
    for h in hits_sorted:
        agg.setdefault(h.rule.cid, []).append(h)

    out = []
    out.append(f"# AI 痕迹扫描报告：{path.name}\n")
    out.append("> 扫描器只提供线索。命中 ≠ 必须改；请按 `references/08-academic-guardrails.md` 的分节力度表处理。\n")
    out.append("## 一、总体\n")
    out.append("| 指标 | 数值 |")
    out.append("| --- | --- |")
    out.append(f"| AI 痕迹指数 | **{sc['index']} / 100**（0–30 低，31–55 中，56+ 高） |")
    out.append(f"| 段落数 / 字数 | {metrics['paragraphs']} / {metrics['chars']} |")
    out.append(f"| 平均段长 / 段长 CV | {metrics['para_len_mean']} / {metrics['para_len_cv']} |")
    out.append(f"| 平均句长 / 句长标准差 | {metrics['sent_len_mean']} / {metrics['sent_len_stdev']} |")
    out.append(f"| 引文标记数 | {metrics['citations']} |")
    out.append("")
    if sc["by_category"]:
        out.append("分类权重（越高越该先处理）：\n")
        for cat, w in sorted(sc["by_category"].items(), key=lambda x: -x[1]):
            out.append(f"- {cat}：{w}")
        out.append("")
    if sc["flags"]:
        out.append("结构信号：\n")
        for f in sc["flags"]:
            out.append(f"- {f}")
        out.append("")

    out.append("## 二、命中明细\n")
    if not agg:
        out.append("未命中任何规则。\n")
    for cid, hs in agg.items():
        r = hs[0].rule
        out.append(f"### {cid} {r.name}（{r.category}，{len(hs)} 处）\n")
        out.append(f"- 为什么算痕迹：{r.note}")
        seen = set()
        for h in hs[:6]:
            key = h.text[:40]
            if key in seen:
                continue
            seen.add(key)
            out.append(f"  - 第 {h.para} 段：`{h.text}`")
        if len(hs) > 6:
            out.append(f"  - …… 另有 {len(hs) - 6} 处")
        out.append("")

    out.append("## 三、下一步\n")
    out.append("1. 把上面的命中按「分节」归类：摘要在意信息密度，引言在意缺口陈述，方法/结果只清理填充词。")
    out.append("2. 打开 `references/09-prompt-pack.md`，用 Prompt B（单段改写）逐段处理，力度选「轻/中」。")
    out.append("3. 改完再跑一次本脚本，指数不一定要归零——学术语体本身就有复现性。")
    out.append("")
    return "\n".join(x for x in out if x is not None)


def main() -> int:
    ap = argparse.ArgumentParser(description="论文 AI 痕迹扫描器")
    ap.add_argument("path", help="待扫描文件（.md/.txt/.docx）")
    ap.add_argument("--out", help="输出 Markdown 报告路径")
    ap.add_argument("--json", action="store_true", help="输出 JSON")
    args = ap.parse_args()

    p = Path(args.path)
    if not p.exists():
        print(f"文件不存在：{p}", file=sys.stderr)
        return 2
    text = read_text(p)
    hits, metrics = scan(text)
    sc = score(hits, metrics)

    if args.json:
        payload = {
            "file": str(p),
            "score": sc,
            "metrics": metrics,
            "hits": [
                {"rule": h.rule.cid, "name": h.rule.name, "category": h.rule.category, "para": h.para, "text": h.text}
                for h in hits
            ],
        }
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return 0

    report = render_markdown(p, hits, metrics, sc)
    if args.out:
        Path(args.out).write_text(report, encoding="utf-8")
        print(f"报告已写入：{args.out}")
    else:
        try:
            sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
        except Exception:
            pass
        print(report)
    print(
        f"\n[摘要] AI 痕迹指数 {sc['index']}/100；命中 {len(hits)} 处；"
        f"段落 {metrics['paragraphs']}，字数 {metrics['chars']}",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
