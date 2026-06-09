#!/usr/bin/env python3
"""
Static i18n builder for בשבילנו.

Two responsibilities:
  1) Shared partials — the single source of truth for nav + footer lives in
     partials/.  Translatable pages and the legacy Hebrew pages both pull from
     them.  Each consuming page marks the region with <!-- @nav --> / <!-- @footer -->.
  2) Multilingual pages — pages listed in TEMPLATES are rendered once per
     language from templates/<page> + the i18n/<lang>.json dictionaries.
       he → /<page>            (root, default, RTL)
       en → /en/<page>         fr → /fr/<page>      es → /es/<page>

Translation strings live in i18n/*.json (nested; flattened to dotted keys).
Template tokens use {{dotted.key}} and may contain HTML.

Usage:  python3 build.py
Idempotent — safe to re-run.
"""
import re, json, pathlib

ROOT      = pathlib.Path(__file__).parent
PART_DIR  = ROOT / "partials"
TPL_DIR   = ROOT / "templates"
I18N_DIR  = ROOT / "i18n"

LANGS     = ["he", "en", "fr", "es"]          # he is the default (root)
DEFAULT   = "he"
TEMPLATES = ["index.html"]                     # pages that are fully translated

TOKEN_RE  = re.compile(r"\{\{\s*([\w.]+)\s*\}\}")


def flatten(d, prefix=""):
    out = {}
    for k, v in d.items():
        key = f"{prefix}{k}"
        if isinstance(v, dict):
            out.update(flatten(v, key + "."))
        else:
            out[key] = v
    return out


def load_dicts():
    dicts = {}
    for lang in LANGS:
        raw = json.loads((I18N_DIR / f"{lang}.json").read_text(encoding="utf-8"))
        dicts[lang] = flatten(raw)
    return dicts


def render(text, d):
    def sub(m):
        key = m.group(1)
        if key not in d:
            raise KeyError(f"missing i18n key: {key}")
        return str(d[key])
    return TOKEN_RE.sub(sub, text)


def inject(html, name, content):
    pattern = re.compile(r"<!-- @%s -->(?:.*?<!-- /@%s -->)?" % (name, name), re.S)
    replacement = "<!-- @%s -->\n%s\n<!-- /@%s -->" % (name, content, name)
    return pattern.sub(lambda m: replacement, html)


def out_path(page, lang):
    if lang == DEFAULT:
        return ROOT / page
    return ROOT / lang / page


def main():
    dicts   = load_dicts()
    nav_tpl = (PART_DIR / "nav.html").read_text(encoding="utf-8").strip()
    foot_tpl = (PART_DIR / "footer.html").read_text(encoding="utf-8").strip()

    # Pre-render partials for every language.
    nav  = {l: render(nav_tpl,  dicts[l]) for l in LANGS}
    foot = {l: render(foot_tpl, dicts[l]) for l in LANGS}

    changed = 0

    # 1) Multilingual templated pages → one file per language.
    for page in TEMPLATES:
        tpl = (TPL_DIR / page).read_text(encoding="utf-8")
        for lang in LANGS:
            html = render(tpl, dicts[lang])
            html = inject(html, "nav", nav[lang])
            html = inject(html, "footer", foot[lang])
            dest = out_path(page, lang)
            dest.parent.mkdir(parents=True, exist_ok=True)
            if not dest.exists() or dest.read_text(encoding="utf-8") != html:
                dest.write_text(html, encoding="utf-8")
                changed += 1
                print("built", dest.relative_to(ROOT))

    # 2) Legacy Hebrew pages (not yet templated) → refresh shared partials only.
    templated = set(TEMPLATES)
    for page in sorted(ROOT.glob("*.html")):
        if page.name in templated:
            continue
        src = page.read_text(encoding="utf-8")
        out = inject(src, "nav", nav[DEFAULT])
        out = inject(out, "footer", foot[DEFAULT])
        if out != src:
            page.write_text(out, encoding="utf-8")
            changed += 1
            print("built", page.name)

    print("done — %d file(s) updated" % changed)


if __name__ == "__main__":
    main()
