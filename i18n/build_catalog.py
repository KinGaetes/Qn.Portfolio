#!/usr/bin/env python3
"""Regenerate catalog.generated.js from texts.csv for offline/file:// access.
Run: python i18n/build_catalog.py
Only the CSV should be edited when changing translations.
"""
import csv
import json
from pathlib import Path

folder = Path(__file__).resolve().parent
source = folder / 'texts.csv'
with source.open(encoding='utf-8-sig', newline='') as f:
    records = list(csv.DictReader(f))
ids = [row['ID'] for row in records]
if not records or len(set(ids)) != len(ids):
    raise ValueError('Translation IDs must be unique and non-empty')
if any(not all(row.get(lang) for lang in ('ID', 'es', 'en', 'id')) for row in records):
    raise ValueError('Every translation needs an ID and text in es, en, id')
if any(set(row.keys()) != {'ID', 'es', 'en', 'id'} for row in records):
    raise ValueError('Unexpected CSV fields')
# Preserve the existing CSV bytes, including embedded quotes/newlines.
csv_text = source.read_text(encoding='utf-8-sig')
(folder / 'catalog.generated.js').write_text(
    '// GENERATED from texts.csv. Do not edit.\n'
    'window.PORTFOLIO_CSV = ' + json.dumps(csv_text, ensure_ascii=False) + ';\n',
    encoding='utf-8',
)
print(f'Built catalog.generated.js with {len(records)} translations.')
