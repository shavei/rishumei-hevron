#!/usr/bin/env python3
"""
Static i18n builder for בשבילנו.

Pipeline
--------
1) Shared partials — single source of truth for nav + footer (partials/).
   Consuming pages mark the region with <!-- @nav --> / <!-- @footer -->.
2) Multilingual pages — every file in templates/ is rendered once per language
   from templates/<page> + the i18n dictionaries:
       he → /<page>            (root, default, RTL)
       en → /en/<page>   fr → /fr/<page>   es → /es/<page>

Strings
-------
- Global strings: i18n/<lang>.json (nav, footer, meta scaffolding, aria…).
- Per-page strings: i18n/fragments/<page>.<lang>.json — merged on top of the
  global dict when rendering that page.  Keeps page content modular.
- Dictionaries are nested JSON, flattened to dotted keys.  Tokens are
  {{dotted.key}} and may contain HTML.

URLs & language persistence (computed here, never hand-maintained)
------------------------------------------------------------------
For every (page, language) build.py injects:
  - url.*       internal nav/footer links, pointing at the SAME language when
                that page exists there, else falling back to Hebrew.
  - lang_url.*  the language-switcher targets: the current page in each of the
                four languages (or that language's home if not yet translated).
This is what makes a chosen language "stick" across the whole site: once a page
has a template, every link to it in every language resolves automatically.

Usage:  python3 build.py   (idempotent)
"""
import re, json, pathlib

ROOT     = pathlib.Path(__file__).parent
PART_DIR = ROOT / "partials"
TPL_DIR  = ROOT / "templates"
I18N_DIR = ROOT / "i18n"
FRAG_DIR = I18N_DIR / "fragments"

LANGS    = ["he", "en", "fr", "es"]
DEFAULT  = "he"
TOKEN_RE = re.compile(r"\{\{\s*([\w.]+)\s*\}\}")

# Internal link targets → (Hebrew relative href, slug[, optional #anchor]).
# The slug's page part decides which translated file the link can resolve to.
NAV_TARGETS = {
    "home":             ("index",            "index"),
    "about":            ("about",            "about"),
    "team":             ("team",             "team"),
    "how":              ("how",              "how"),
    "stories":          ("stories",          "stories"),
    "join":             ("join",             "join"),
    "contact":          ("contact",          "contact"),
    "donate":           ("donate",           "donate"),
    "join_communities": ("join#communities", "join#communities"),
    "join_families":    ("join#families",    "join#families"),
    "join_donors":      ("join#donors",      "join#donors"),
}


def flatten(d, prefix=""):
    out = {}
    for k, v in d.items():
        key = f"{prefix}{k}"
        if isinstance(v, dict):
            out.update(flatten(v, key + "."))
        else:
            out[key] = v
    return out


def page_url(page, lang, available):
    """Absolute URL of <page> in <lang>. `available` = pages that exist in <lang>."""
    has = page in available
    if lang == DEFAULT:
        base = "/" if page == "index" else "/" + page
    elif has:
        base = "/%s/" % lang if page == "index" else "/%s/%s" % (lang, page)
    else:  # not translated yet → that language's home
        base = "/%s/" % lang
    return base


def link_url(slug, lang, available):
    """Resolve a nav/footer target (slug may carry a #anchor) for <lang>."""
    page, _, anchor = slug.partition("#")
    anchor = ("#" + anchor) if anchor else ""
    if lang == DEFAULT:
        return slug  # keep Hebrew root links relative, exactly as authored
    if page in available:
        base = "/%s/" % lang if page == "index" else "/%s/%s" % (lang, page)
    else:
        base = "/" if page == "index" else "/" + page  # Hebrew fallback
    return base + anchor


def build_link_tokens(page, lang, available):
    """url.* (nav/footer) + lang_url.* (switcher) for one rendered page."""
    d = {}
    for name, (he_rel, slug) in NAV_TARGETS.items():
        d["url." + name] = he_rel if lang == DEFAULT else link_url(slug, lang, available)
    for tl in LANGS:
        d["lang_url." + tl] = page_url(page, tl, AVAILABLE[tl])
    return d


def render(text, d):
    def sub(m):
        key = m.group(1)
        if key not in d:
            raise KeyError("missing i18n key: %s" % key)
        return str(d[key])
    return TOKEN_RE.sub(sub, text)


def inject(html, name, content):
    pattern = re.compile(r"<!-- @%s -->(?:.*?<!-- /@%s -->)?" % (name, name), re.S)
    repl = "<!-- @%s -->\n%s\n<!-- /@%s -->" % (name, content, name)
    return pattern.sub(lambda m: repl, html)


# ── Discover pages & languages ──────────────────────────────────────────────
TEMPLATES = sorted(p.name for p in TPL_DIR.glob("*.html"))
TPL_PAGES = {p[:-5] for p in TEMPLATES}            # basenames without .html
# Pages available per language: he has all root pages (templated + legacy);
# other languages have exactly the templated pages.
LEGACY_PAGES = {p.stem for p in ROOT.glob("*.html")}
AVAILABLE = {DEFAULT: LEGACY_PAGES | TPL_PAGES}
for l in LANGS:
    if l != DEFAULT:
        AVAILABLE[l] = set(TPL_PAGES)

GLOBAL = {l: flatten(json.loads((I18N_DIR / f"{l}.json").read_text(encoding="utf-8"))) for l in LANGS}


def frag(page, lang):
    f = FRAG_DIR / f"{page}.{lang}.json"
    if f.exists():
        return flatten(json.loads(f.read_text(encoding="utf-8")))
    return {}


def dict_for(page, lang, available):
    d = dict(GLOBAL[lang])
    d.update(frag(page, lang))
    d.update(build_link_tokens(page, lang, available))
    return d


def main():
    nav_tpl  = (PART_DIR / "nav.html").read_text(encoding="utf-8").strip()
    foot_tpl = (PART_DIR / "footer.html").read_text(encoding="utf-8").strip()

    changed = 0

    # 1) Multilingual templated pages → one file per language.
    for fname in TEMPLATES:
        page = fname[:-5]
        tpl = (TPL_DIR / fname).read_text(encoding="utf-8")
        for lang in LANGS:
            d = dict_for(page, lang, AVAILABLE)
            html = render(tpl, d)
            html = inject(html, "nav", render(nav_tpl, d))
            html = inject(html, "footer", render(foot_tpl, d))
            dest = ROOT / fname if lang == DEFAULT else ROOT / lang / fname
            dest.parent.mkdir(parents=True, exist_ok=True)
            if not dest.exists() or dest.read_text(encoding="utf-8") != html:
                dest.write_text(html, encoding="utf-8")
                changed += 1
                print("built", dest.relative_to(ROOT))

    # 2) Legacy Hebrew pages (not yet templated) → refresh shared partials only.
    for page_file in sorted(ROOT.glob("*.html")):
        page = page_file.stem
        if page_file.name in TEMPLATES:
            continue
        d = dict(GLOBAL[DEFAULT])
        d.update(build_link_tokens(page, DEFAULT, AVAILABLE))
        src = page_file.read_text(encoding="utf-8")
        out = inject(src, "nav", render(nav_tpl, d))
        out = inject(out, "footer", render(foot_tpl, d))
        if out != src:
            page_file.write_text(out, encoding="utf-8")
            changed += 1
            print("built", page_file.name)

    print("done — %d file(s) updated" % changed)


if __name__ == "__main__":
    main()
