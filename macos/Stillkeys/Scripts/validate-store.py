#!/usr/bin/env python3
"""Validate store text limits and PNG upload dimensions without third-party packages."""
import json, struct
from pathlib import Path
root=Path(__file__).resolve().parents[1]
metadata=json.loads((root/'Store/metadata.json').read_text())
for name, limit in [('name',30),('subtitle',30),('promotional_text',170),('description',4000),('keywords',100)]:
    count=len(metadata[name])
    assert count <= limit, f'{name}: {count} exceeds {limit}'
    print(f'{name}: {count}/{limit}')
images=sorted((root/'Store/Screenshots').glob('*.png'))
assert len(images)==4, f'Expected 4 screenshots, got {len(images)}'
for file in images:
    raw=file.read_bytes()
    assert raw[:8]==b'\x89PNG\r\n\x1a\n'
    width,height,depth,color=struct.unpack('>IIBB',raw[16:26])
    assert (width,height)==(2880,1800), (file.name,width,height)
    assert color==2, f'{file.name}: expected RGB with no alpha; PNG color type {color}'
    assert len(raw)>50000, f'{file.name}: suspiciously small image'
    print(f'{file.name}: {width} x {height}, RGB, {depth}-bit, {len(raw):,} bytes')
print('Store metadata and screenshot format checks passed.')
