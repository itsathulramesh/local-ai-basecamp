#!/usr/bin/env python3
"""Build Local AI Basecamp from the files in content/.

Generates:
  index.html               the start page
  lessons/<id>.html        one page per lesson
  404.html                 page-not-found page (used by GitHub Pages)
  assets/js/course-data.js lesson list and search index used by assets/js/app.js

Usage (from the project folder):
  python tools/build.py

Only the Python standard library is needed.
"""
import html
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
SITE = "Local AI Basecamp"
TAGLINE = "From zero to your own model"
DESCRIPTION = ("A free, plain-English course for Windows and NVIDIA GPUs: run local AI models, "
               "understand how they work, fine-tune them with LoRA, steer and edit their weights, "
               "and build your own custom model.")
FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">'
         '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700'
         '&amp;family=Inter:wght@400;500;600&amp;family=JetBrains+Mono:wght@400;500&amp;display=swap">')
CHEVRON = ('<svg class="chev" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" '
           'stroke-width="2" aria-hidden="true"><path d="M4 2l4 4-4 4"/></svg>')
LOGO = ('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" '
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 20 10 7l4 6 2-3 5 10z"/></svg>')


def esc(s):
    return html.escape(str(s), quote=True)


def load():
    modules = json.loads((CONTENT / "modules.json").read_text(encoding="utf-8"))
    order = [m["k"] for m in modules]
    lessons = []
    for f in sorted(CONTENT.glob("*.html")):
        text = f.read_text(encoding="utf-8")
        m = re.match(r"<!--\s*(\{.*?\})\s*-->\s*", text, flags=re.S)
        if not m:
            raise SystemExit(f"{f.name}: missing the metadata comment on the first line")
        meta = json.loads(m.group(1))
        meta["body"] = text[m.end():]
        meta["file"] = f.name
        if meta["module"] not in order:
            raise SystemExit(f"{f.name}: unknown module {meta['module']!r}")
        lessons.append(meta)
    lessons.sort(key=lambda l: order.index(l["module"]))      # stable: keeps file order inside a module
    for mod in modules:
        mod["items"] = [l for l in lessons if l["module"] == mod["k"]]
        for i, l in enumerate(mod["items"], 1):
            l["num"] = "" if mod["k"] in ("0", "R") else f"{mod['k']}.{i}"
            l["module_name"] = mod["name"]
    for i, l in enumerate(lessons):
        l["index"] = i
    ids = [l["id"] for l in lessons]
    dupes = {i for i in ids if ids.count(i) > 1}
    if dupes:
        raise SystemExit(f"duplicate lesson ids: {sorted(dupes)}")
    return modules, lessons


def plain_text(body):
    text = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", body, flags=re.S)
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


def rewrite_links(body, root, ids):
    """Turn course-internal links (#lesson-id, #home) into real page links."""
    def rep(m):
        target = m.group(1)
        if target == "home":
            return f'href="{root}index.html"'
        if target in ids:
            return f'href="{root}lessons/{target}.html"'
        return m.group(0)
    return re.sub(r'href="#([a-z0-9-]+)"', rep, body)


def nav_html(modules, current, root):
    out = []
    for mod in modules:
        is_open = current is not None and current["module"] == mod["k"]
        n = "" if mod["k"] in ("0", "R") else mod["k"]
        out.append(f'<div class="mod{" open" if is_open else ""}" data-m="{esc(mod["k"])}">'
                   f'<button class="mod-h" type="button" aria-expanded="{"true" if is_open else "false"}">{CHEVRON}'
                   f'<span class="n">{n}</span><span>{esc(mod["name"])}</span><span class="c" data-count="{esc(mod["k"])}"></span></button><ul>')
        for l in mod["items"]:
            cur = ' aria-current="page"' if current is not None and current["id"] == l["id"] else ""
            num = f'<span class="ln">{l["num"]}</span> ' if l["num"] else ""
            opt = ' <span class="opt">Optional</span>' if l.get("optional") else ""
            out.append(f'<li data-id="{l["id"]}"><a href="{root}lessons/{l["id"]}.html"{cur}>'
                       f'<span class="dot"></span><span>{num}{esc(l["title"])}{opt}</span></a></li>')
        out.append("</ul></div>")
    return "".join(out)


def page(title, description, root, page_id, main, modules, current=None):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{esc(title)}</title>
<meta name="description" content="{esc(description)}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(description)}">
<link rel="icon" href="{root}assets/favicon.svg" type="image/svg+xml">
{FONTS}
<link rel="stylesheet" href="{root}assets/css/style.css">
<script>try{{var t=localStorage.getItem('basecamp-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}}catch(e){{}}</script>
</head>
<body data-root="{root}" data-page="{esc(page_id)}">
<a class="skip" href="#view">Skip to content</a>
<div class="app">
  <aside class="rail" id="rail" aria-label="Course map">
    <a class="brand" href="{root}index.html"><span class="brand-mark">{LOGO}</span><span><b>{SITE}</b><small>{TAGLINE.lower()}</small></span></a>
    <div class="prog"><div class="row"><span id="progText">Core lessons</span><span id="progPct"></span></div><div class="meter"><i id="progBar"></i></div></div>
    <nav id="nav">{nav_html(modules, current, root)}</nav>
  </aside>
  <div class="main">
    <div class="top">
      <button class="btn menu-btn" id="menuBtn" type="button" aria-label="Open course map">Menu</button>
      <button class="btn search-btn" id="searchBtn" type="button" aria-label="Search lessons">Search <kbd>Ctrl K</kbd></button>
      <span class="grow"></span>
      <a class="btn hide-s" href="{root}lessons/roadmap.html">8-week plan</a>
      <button class="btn" id="themeBtn" type="button" aria-label="Switch colour theme">Theme</button>
    </div>
    <main id="view" tabindex="-1">
{main}
    </main>
  </div>
</div>
<div class="scrim" id="scrim" role="dialog" aria-modal="true" aria-label="Search">
  <div class="sbox"><input id="sinput" type="text" placeholder="Search lessons and terms, e.g. VRAM, GGUF, LoRA" autocomplete="off"><div class="sres" id="sres"></div></div>
</div>
<script src="{root}assets/js/course-data.js"></script>
<script src="{root}assets/js/widgets.js"></script>
<script src="{root}assets/js/app.js"></script>
</body>
</html>
"""


def short(t, n=34):
    return t if len(t) <= n else re.sub(r"\s+\S*$", "", t[:n - 2]) + "…"


def lesson_main(l, lessons, ids):
    root = "../"
    prev = lessons[l["index"] - 1] if l["index"] > 0 else None
    nxt = lessons[l["index"] + 1] if l["index"] + 1 < len(lessons) else None
    is_ref = l["module"] == "R"
    crumbs = f'<span>{esc(l["module_name"])}</span>'
    if l["num"]:
        crumbs += f'<span class="pill">Lesson {l["num"]}</span>'
    if l.get("optional"):
        crumbs += '<span class="pill opt-pill">Optional</span>'
    crumbs += f'<span>{l["minutes"]} min</span>'
    done = "" if is_ref else f'<button class="btn primary" id="doneBtn" type="button" data-id="{l["id"]}">Mark lesson complete</button>'
    links = ""
    if prev:
        links += f'<a class="btn" href="{prev["id"]}.html">← {esc(short(prev["title"]))}</a>'
    if nxt:
        links += f'<a class="btn{"" if is_ref else " primary"}" href="{nxt["id"]}.html">{esc(short(nxt["title"]))} →</a>'
    else:
        links += f'<a class="btn primary" href="{root}index.html">Back to the start page →</a>'
    body = rewrite_links(l["body"], root, ids)
    return (f'<article><div class="crumbs">{crumbs}</div><h1>{esc(l["title"])}</h1>\n{body}\n'
            f'<div class="lesson-nav"><div>{done}</div><div class="nav-links">{links}</div></div></article>')


def index_main(modules, lessons):
    core = [l for l in lessons if l["module"] != "R" and not l.get("optional")]
    hours = round(sum(l["minutes"] for l in lessons if l["module"] != "R") / 60)
    cards = []
    for mod in modules:
        is_ref = mod["k"] == "R"
        label = "START" if mod["k"] == "0" else "REFERENCE" if is_ref else f"MODULE {mod['k']}"
        meter = "" if is_ref else '<div class="meter"><i></i></div>'
        cards.append(f'<a class="mcard" data-mod="{mod["k"]}" href="lessons/{mod["items"][0]["id"]}.html">'
                     f'<span class="mn">{label}</span><b>{esc(mod["name"])}</b><p>{esc(mod["blurb"])}</p>{meter}'
                     f'<small>{len(mod["items"])} lessons<span class="done-count"></span></small></a>')
    return f"""<section class="hero"><div class="eyebrow">Local AI, end to end</div>
<h1>Run, understand, train and customize AI models on your own PC</h1>
<p class="lede">A plain-English course for people who use ChatGPT, Claude and Gemini and want to know what happens underneath. It goes from the basics to fine-tuning, steering, abliteration and your own uncensored models. Built for Windows with an NVIDIA graphics card, with calculators, working scripts and an 8-week plan.</p>
<div class="hero-actions"><a class="btn primary" id="continueBtn" href="lessons/welcome.html">Start: Welcome and how to use this course</a><a class="btn" href="lessons/roadmap.html">See the 8-week plan</a></div>
<div class="facts"><span><b>{len(core)}</b> core lessons</span><span><b>{hours}</b> hours of reading, plus hands-on labs</span><span><b>11</b> modules</span><span>Needs only basic Python</span><span>Progress saved in your browser</span></div></section>
<div class="widget hero-card" data-widget="homebar"></div>
<section class="band"><h2>Your journey in four milestones</h2>
<div class="path"><span class="you">1 Running locally</span><i>→</i><span>2 Using it for real</span><i>→</i><span>3 Your first fine-tune</span><i>→</i><span>4 Your own model</span></div>
<p>Week 2: run a model on your GPU and explain every number. Week 4: use it from Python with your documents and tools. Week 7: train and evaluate your own LoRA. Week 8: steer, edit and uncensor, then build your own model. Lessons marked Optional can be skipped on a first pass.</p></section>
<h2 style="margin-top:1.6em">The modules</h2>
<div class="mgrid">{"".join(cards)}</div>"""


def course_data(modules, lessons):
    data = {
        "modules": [{"k": m["k"], "name": m["name"]} for m in modules],
        "lessons": [{"id": l["id"], "mod": l["module"], "num": l["num"], "title": l["title"],
                     "mins": l["minutes"], "optional": bool(l.get("optional")), "text": plain_text(l["body"])}
                    for l in lessons],
    }
    return ("/* Generated by tools/build.py from content/. Do not edit by hand. */\n"
            "window.COURSE = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n")


NOT_FOUND = """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page not found · Local AI Basecamp</title>
<style>body{margin:0;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:#f1f5f6;color:#11202a;display:grid;place-items:center;min-height:100vh;padding:16px;box-sizing:border-box}
@media (prefers-color-scheme:dark){body{background:#0b1216;color:#e3ecef}a{color:#4cc9c0}}
main{max-width:480px;text-align:center}a{color:#0a7a76;font-weight:600}</style></head>
<body><main><h1>Page not found</h1><p>This page does not exist. It may have been renamed.</p>
<p><a id="home" href="index.html">Go to the start page</a></p></main>
<script>
// On GitHub Pages project sites the site lives under /<repository>/, so point the link there.
var p = location.pathname.split('/').filter(Boolean);
if (location.hostname.endsWith('github.io') && p.length) document.getElementById('home').href = '/' + p[0] + '/';
</script></body></html>
"""


def main():
    modules, lessons = load()
    ids = {l["id"] for l in lessons}
    out_dir = ROOT / "lessons"
    out_dir.mkdir(exist_ok=True)
    for old in out_dir.glob("*.html"):
        if old.stem not in ids:
            old.unlink()
    for l in lessons:
        title = f'{(l["num"] + " ") if l["num"] else ""}{l["title"]} · {SITE}'
        desc = plain_text(re.search(r'<p class="lede">(.*?)</p>', l["body"], flags=re.S).group(1)) \
            if '<p class="lede">' in l["body"] else DESCRIPTION
        (out_dir / f'{l["id"]}.html').write_text(
            page(title, desc, "../", l["id"], lesson_main(l, lessons, ids), modules, l), encoding="utf-8")
    (ROOT / "index.html").write_text(
        page(f"{SITE}: run, train and customize local AI", DESCRIPTION, "", "home", index_main(modules, lessons), modules),
        encoding="utf-8")
    (ROOT / "404.html").write_text(NOT_FOUND, encoding="utf-8")
    (ROOT / "assets" / "js" / "course-data.js").write_text(course_data(modules, lessons), encoding="utf-8")
    broken = sorted({m for l in lessons for m in re.findall(r'href="#([a-z0-9-]+)"', l["body"])} - ids - {"home"})
    if broken:
        print("warning: links to unknown lessons:", broken)
    print(f"built {len(lessons)} lesson pages, index.html, 404.html and course-data.js")


if __name__ == "__main__":
    main()
