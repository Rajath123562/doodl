#!/usr/bin/env python3
"""Verify handoff files and SHA manifest (does not test the game)."""
from __future__ import annotations
import hashlib
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'MANIFEST_SHA256.txt'


def sha256(path: pathlib.Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def main() -> int:
    if not MANIFEST.is_file():
        print('FAIL: MANIFEST_SHA256.txt missing')
        return 1
    errors = []
    listed = {}
    for line in MANIFEST.read_text(encoding='utf-8').splitlines():
        if not line.strip() or line.startswith('#'):
            continue
        try:
            digest, relative = line.split('  ', 1)
        except ValueError:
            errors.append(f'Malformed manifest line: {line[:100]}')
            continue
        listed[relative] = digest
        target = (ROOT / relative).resolve()
        if not target.is_relative_to(ROOT):
            errors.append(f'Unsafe path: {relative}')
        elif not target.is_file():
            errors.append(f'Missing file: {relative}')
        elif sha256(target) != digest:
            errors.append(f'Hash mismatch: {relative}')
    actual = {str(p.relative_to(ROOT)).replace('\\', '/') for p in ROOT.rglob('*') if p.is_file() and p != MANIFEST}
    for missing in sorted(actual - listed.keys()):
        errors.append(f'File not in manifest: {missing}')
    for extra in sorted(listed.keys() - actual):
        errors.append(f'Manifest lists absent file: {extra}')
    for error in errors:
        print('FAIL:', error)
    if errors:
        print(f'{len(errors)} errors found; this checks only package integrity, not production software.')
        return 1
    print(f'PASS: {len(actual)} files match SHA-256 manifest. This does not verify a runnable multiplayer game.')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
