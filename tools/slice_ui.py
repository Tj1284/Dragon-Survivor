#!/usr/bin/env python3
"""Turns the ChatGPT UI images into the exact game files in art/ui/.

Usage:
  python3 tools/slice_ui.py icons SOURCE      -> art/ui/icons.png   (12 icons, 16x16 each, left to right)
  python3 tools/slice_ui.py kit SOURCE        -> art/ui/panel.png (48x48), button.png (3 x 48x16), card.png (2 x 48x64)
  python3 tools/slice_ui.py logo SOURCE       -> art/ui/logo.png    (240x40)
  python3 tools/slice_ui.py bg SOURCE         -> art/ui/bg.png      (600x270, opaque)
Requires Pillow, numpy and scipy (same as slice_sprites.py).
"""
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from slice_sprites import SOLID, bands, load  # noqa: E402

OUT = 'art/ui'


def content(a):
    ys, xs = np.nonzero(a[..., 3] >= SOLID)
    return a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def shrink(a, w, h):
    small = np.asarray(Image.fromarray(a).resize((w, h), Image.BOX)).copy()
    small[..., 3] = np.where(small[..., 3] >= 110, 255, 0)
    return Image.fromarray(small)


def groups(a, n):
    cols = bands((a[..., 3] >= SOLID).sum(0), n)
    return [content(a[:, x0:x1]) for x0, x1 in cols]


def icons(src):
    a = load(src, False)
    parts = groups(a, 12)
    big = max(max(p.shape[0], p.shape[1]) for p in parts)
    sheet = Image.new('RGBA', (16 * 12, 16), (0, 0, 0, 0))
    for i, p in enumerate(parts):
        s = 15 / big
        w, h = max(1, round(p.shape[1] * s)), max(1, round(p.shape[0] * s))
        sheet.alpha_composite(shrink(p, w, h), (i * 16 + (16 - w) // 2, (16 - h) // 2))
    sheet.save(f'{OUT}/icons.png')


def kit(src):
    a = load(src, False)
    panel, b1, b2, b3, card, gold = groups(a, 6)
    shrink(panel, 48, 48).save(f'{OUT}/panel.png')
    btn = Image.new('RGBA', (48 * 3, 16), (0, 0, 0, 0))
    for i, b in enumerate([b1, b2, b3]):
        btn.alpha_composite(shrink(b, 48, 16), (i * 48, 0))
    # grey version, so the game can tint one button art to any colour (play orange, gold, purple...)
    b = np.asarray(btn).astype(float)
    lum = b[..., :3] @ np.array([0.299, 0.587, 0.114])
    body = np.median(lum[(b[..., 3] > 0) & (lum > 40)])
    grey = np.clip(lum / body * 200, 0, 255)
    b[..., 0] = b[..., 1] = b[..., 2] = grey
    Image.fromarray(b.astype(np.uint8)).save(f'{OUT}/button.png')
    cards = Image.new('RGBA', (48 * 2, 64), (0, 0, 0, 0))
    for i, c in enumerate([card, gold]):
        cards.alpha_composite(shrink(c, 48, 64), (i * 48, 0))
    cards.save(f'{OUT}/card.png')


def logo(src):
    p = content(load(src, False))
    w = 240
    h = min(40, round(p.shape[0] * w / p.shape[1]))
    out = Image.new('RGBA', (240, 40), (0, 0, 0, 0))
    out.alpha_composite(shrink(p, w, h), (0, (40 - h) // 2))
    out.save(f'{OUT}/logo.png')


def bg(src):
    im = Image.open(src).convert('RGB')
    target = 600 / 270
    w, h = im.size
    if w / h > target:  # crop the sides to the game's widest aspect
        nw = round(h * target)
        im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else:
        nh = round(w / target)
        im = im.crop((0, h - nh, w, h))
    im.resize((600, 270), Image.BOX).convert('RGBA').save(f'{OUT}/bg.png')


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    {'icons': icons, 'kit': kit, 'logo': logo, 'bg': bg}[sys.argv[1]](sys.argv[2])
    print('ok', sys.argv[1])
