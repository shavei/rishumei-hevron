#!/usr/bin/env python3
"""
Static partial injector for בשבילנו.
Single source of truth for the shared nav + footer lives in partials/.
Each page contains a placeholder comment, e.g. <!-- @nav -->.
After build, the region becomes:
    <!-- @nav -->
    ...partial content...
    <!-- /@nav -->
Re-running re-syncs the content between the markers. Idempotent.

Usage:  python3 build.py
"""
import re, pathlib, sys

ROOT = pathlib.Path(__file__).parent
PARTIALS = {
    "nav":    (ROOT / "partials" / "nav.html").read_text(encoding="utf-8").strip(),
    "footer": (ROOT / "partials" / "footer.html").read_text(encoding="utf-8").strip(),
}

def expand(html: str) -> str:
    for name, content in PARTIALS.items():
        pattern = re.compile(r"<!-- @%s -->(?:.*?<!-- /@%s -->)?" % (name, name), re.S)
        replacement = "<!-- @%s -->\n%s\n<!-- /@%s -->" % (name, content, name)
        html = pattern.sub(lambda m: replacement, html)
    return html

def main():
    changed = 0
    for page in sorted(ROOT.glob("*.html")):
        src = page.read_text(encoding="utf-8")
        out = expand(src)
        if out != src:
            page.write_text(out, encoding="utf-8")
            changed += 1
            print("built", page.name)
    print("done — %d page(s) updated" % changed)

if __name__ == "__main__":
    main()
