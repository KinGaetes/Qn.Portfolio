#!/usr/bin/env python3
"""Check translation coverage, placeholders, static HTML and project references.

Run from any folder: python i18n/check_translations.py

Not a linguistic proofreader: editorial quality requires human review.
"""
from __future__ import annotations

import csv
import json
import re
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV = ROOT / 'i18n' / 'texts.csv'
LANGS = ('es', 'en', 'id')
errors = []
with CSV.open(encoding='utf-8-sig', newline='') as f:
    rows = list(csv.DictReader(f))
ids = {}
for row in rows:
    key = row.get('ID', '')
    if not key or key in ids:
        errors.append(f'Duplicate or missing ID: {key!r}')
    ids[key] = row
    if set(row) != {'ID', *LANGS} or any(not row.get(lang, '').strip() for lang in LANGS):
        errors.append(f'Empty or malformed translation: {key}')
    params = [set(re.findall(r'\{[A-Za-z_][A-Za-z_0-9]*\}', row[lang])) for lang in LANGS]
    if not all(item == params[0] for item in params):
        errors.append(f'Placeholder mismatch: {key}: {params}')

# The generated offline catalog must exactly match the editable CSV.
compiled = (ROOT / 'i18n' / 'catalog.generated.js').read_text(encoding='utf-8')
match = re.fullmatch(r'// GENERATED from texts\.csv\. Do not edit\.\nwindow\.PORTFOLIO_CSV = ("(?:\\.|[^"\\])*");\n', compiled, re.S)
if not match:
    errors.append('Generated catalog format is invalid')
elif json.loads(match.group(1)) != CSV.read_text(encoding='utf-8-sig'):
    errors.append('The generated catalog does not match texts.csv; run build_catalog.py')

class LocalizedHTML(HTMLParser):
    def __init__(self, name):
        super().__init__(convert_charrefs=True)
        self.name = name
        self.stack = []
        self.silent = 0

    def handle_starttag(self, tag, attrs):
        attr = dict(attrs)
        for key, value in attrs:
            if key.startswith('data-i18n') and value not in ids:
                errors.append(f'{self.name}: unknown key {value!r} on <{tag}>')
        if tag not in {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'}:
            self.stack.append((tag, 'data-i18n' in attr))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if self.stack and self.stack[-1][0] == tag:
            self.stack.pop()

    def handle_endtag(self, tag):
        for j in range(len(self.stack) - 1, -1, -1):
            if self.stack[j][0] == tag:
                del self.stack[j:]
                break

    def handle_data(self, data):
        value = data.strip()
        if not value or not self.stack or any(tag in {'script', 'style'} for tag, _ in self.stack):
            return
        if any(is_bound for _, is_bound in self.stack):
            return
        # Punctuation and icons are intentionally not translated.
        if re.fullmatch(r'[\W\d_]+', value, re.UNICODE):
            return
        errors.append(f'{self.name}: nonlocalized visible text {value[:100]!r}')

for html in ROOT.glob('*.html'):
    parser = LocalizedHTML(html.name)
    parser.feed(html.read_text(encoding='utf-8'))

# Validate every locale ID referenced by structured data and detail records.
def check_key(key, where):
    if key not in ids:
        errors.append(f'{where}: key {key!r} is missing')

project_source = (ROOT / 'projects.js').read_text(encoding='utf-8')
detail_source = (ROOT / 'details.js').read_text(encoding='utf-8')
projects = json.loads(project_source.split('=', 1)[1].strip().rstrip(';'))
details = json.loads(detail_source.split('=', 1)[1].strip().rstrip(';'))

def scan(node, path='data'):
    if isinstance(node, dict):
        for k, v in node.items():
            keypath = f'{path}.{k}'
            if k.endswith('Id') and isinstance(v, str):
                check_key(v, keypath)
            if k in {'skillIds', 'did'} and isinstance(v, list):
                for i, val in enumerate(v):
                    check_key(val, f'{keypath}[{i}]')
            if path.startswith('details.') and k in {'role', 'shows', 'skills'} and isinstance(v, str):
                check_key(v, keypath)
            scan(v, keypath)
    elif isinstance(node, list):
        for i, entry in enumerate(node):
            scan(entry, f'{path}[{i}]')
scan(projects)
scan(details, 'details')
for group in ('areas', 'shortLabels', 'badgeLabels'):
    area = projects[group]
    for k, value in area.items():
        if isinstance(value, str):
            check_key(value, f'{group}.{k}')
        elif isinstance(value, list):
            for i, entry in enumerate(value[:2]):
                if isinstance(entry, str):
                    check_key(entry, f'{group}.{k}[{i}]')

# Literal translation lookups inside scripts. Computed keys are checked via
# the structured project data above, not guessed from source-code fragments.
for name in ('i18n/i18n.js', 'project-panels.js', 'explorar.js', 'interacciones.js'):
    code = (ROOT / name).read_text(encoding='utf-8')
    patterns = (
        r"I18n\.t\(\s*['\"]([^'\"]+)['\"]",
        r"I18n\.bind\([^,]+,\s*['\"]([^'\"]+)['\"]",
        r"(?:node|button|el)\(\s*['\"][^'\"]+['\"],\s*['\"]([^'\"]+)['\"]",
    )
    for pattern in patterns:
        for key in re.findall(pattern, code):
            if not key.endswith('.') and key.startswith(('text.', 'project.', 'skill.', 'gallery.', 'about.', 'share.',
                               'language.', 'contact.', 'projects.', 'catalog.', 'cv.')):
                check_key(key, name)

if errors:
    print(f'FAILED: {len(errors)} issues')
    for error in errors:
        print(' -', error)
    raise SystemExit(1)
print(f'OK: {len(rows)} complete entries × {len(LANGS)} languages; '
      f'{len(projects["projects"])} projects, {len(details)} project detail records, '
      f'{len(list(ROOT.glob("*.html")))} pages; no missing IDs or static untranslated HTML text.')
