#!/usr/bin/env python3
"""Build the Inbox page's single-file artifacts from web/inbox.html.

Usage: python3 web/build.py [--out DIR]
  Writes <out>/inbox.html (live: reads the viewer's Notion and this page's db) and
  <out>/inbox-demo.html (demo: sample data, no capabilities needed). <out> defaults to dist/.

The template carries one `<!-- INBOX_BUILD -->` marker. The live build puts INBOX_MODE there; the demo
build also inlines web/demo-adapters.js and web/demo-data.js, so sample data never reaches a live page.
"""
import argparse
import os
import sys

WEB = os.path.dirname(os.path.abspath(__file__))
MARKER = "<!-- INBOX_BUILD -->"


def read(name):
    with open(os.path.join(WEB, name), encoding="utf-8") as f:
        return f.read()


def build(template, mode, scripts=()):
    n = template.count(MARKER)
    if n != 1:
        raise ValueError("expected one %s marker in the template, found %d" % (MARKER, n))
    parts = ['<script>const INBOX_MODE = "%s";</script>' % mode]
    parts += ["<script>\n%s</script>" % s.replace("</script", "<\\/script") for s in scripts]
    return template.replace(MARKER, "\n".join(parts))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default=os.path.join(os.path.dirname(WEB), "dist"))
    a = ap.parse_args()
    try:
        template = read("inbox.html")
        pages = {"inbox.html": build(template, "live"),
                 "inbox-demo.html": build(template, "demo", (read("demo-adapters.js"), read("demo-data.js")))
                 .replace("<title>Inbox</title>", "<title>Life Agents Inbox</title>", 1)}
    except (ValueError, OSError) as e:
        sys.exit("build: %s" % e)
    os.makedirs(a.out, exist_ok=True)
    for name, html in pages.items():
        with open(os.path.join(a.out, name), "w", encoding="utf-8") as f:
            f.write(html)
        print("build: wrote %s (%d KB)" % (os.path.join(a.out, name), len(html.encode()) // 1024))


if __name__ == "__main__":
    main()
