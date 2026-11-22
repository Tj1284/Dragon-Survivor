#!/usr/bin/env python3
"""Turns a big AI-generated sprite sheet (frames in rows, any spacing) into exact game sheets.

Usage:
  python3 tools/slice_sprites.py SOURCE --rows NAME:SIZE[,NAME:SIZE...] --frames N --kind dragon|walker [--white-bg] [--out art/dragons]

Each row of the source becomes art/<out>/<NAME>.png: N frames of SIZE x SIZE in one row.
- The background must be transparent, or white/light grey with --white-bg (removed from the edges inwards,
  so white areas inside a character, enclosed by its outline, are kept).
- Frames are found by the gaps between them, so the spacing doesn't need to be even.
- All frames of a row share one scale and are aligned on the head (dragons) or the feet (walkers),
  so the animation doesn't jitter.
Requires Pillow, numpy and scipy.
"""
import argparse
import os

import numpy as np
from PIL import Image
from scipy import ndimage

SOLID = 128


def load(path, white_bg):
    a = np.asarray(Image.open(path).convert('RGBA')).copy()
    if white_bg:
        rgb = a[..., :3].astype(int)
        light = (rgb.min(-1) > 180) & (rgb.max(-1) - rgb.min(-1) < 28)
        labels, _ = ndimage.label(light)
        border = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))) - {0}
        a[np.isin(labels, list(border)), 3] = 0
    a[a[..., 3] < 40, 3] = 0
    return a


def bands(profile, n, min_count=2):
    """Splits a 1-D occupancy profile into n bands, merging across the smallest gaps."""
    on = profile >= min_count
    runs, start = [], None
    for i, v in enumerate(on):
        if v and start is None:
            start = i
        if not v and start is not None:
            runs.append([start, i]); start = None
    if start is not None:
        runs.append([start, len(on)])
    if len(runs) < n:
        raise SystemExit(f'found {len(runs)} groups, expected {n}: check --frames / --rows')
    while len(runs) > n:
        gaps = [runs[i + 1][0] - runs[i][1] for i in range(len(runs) - 1)]
        i = int(np.argmin(gaps))
        runs[i] = [runs[i][0], runs[i + 1][1]]
        del runs[i + 1]
    return runs


def anchor(alpha, kind):
    ys, xs = np.nonzero(alpha >= SOLID)
    if kind == 'dragon':
        # the head: rightmost part of the body, robust to a few sparkles
        ax = np.percentile(xs, 99)
        strip = xs >= np.percentile(xs, 80)
        ay = np.median(ys[strip])
    else:
        ax = np.median(xs)
        ay = np.percentile(ys, 99.5)
    return ax, ay


def clear_gaps_between_feet(cell):
    """Background trapped between the legs is enclosed by the outline, so the edge fill misses it."""
    ys, _ = np.nonzero(cell[..., 3] >= SOLID)
    top, bottom = ys.min(), ys.max()
    rgb = cell[..., :3].astype(int)
    white = (cell[..., 3] >= SOLID) & (rgb.min(-1) > 232) & (rgb.max(-1) - rgb.min(-1) < 16)
    labels, n = ndimage.label(white)
    for i in range(1, n + 1):
        cy = np.nonzero(labels == i)[0].mean()
        if cy > bottom - (bottom - top) * 0.2:
            cell[labels == i, 3] = 0


def build_row(a, y0, y1, frames, size, kind):
    band = a[y0:y1]
    cols = bands((band[..., 3] >= SOLID).sum(0), frames)
    cells = []
    for x0, x1 in cols:
        cell = band[:, x0:x1].copy()
        if kind == 'walker':
            clear_gaps_between_feet(cell)
        ax, ay = anchor(cell[..., 3], kind)
        ys, xs = np.nonzero(cell[..., 3] >= SOLID)
        cells.append((cell, ax, ay, xs.min(), xs.max() + 1, ys.min(), ys.max() + 1))
    # union extent around the anchor
    left = max(ax - x0 for _, ax, _, x0, _, _, _ in cells)
    right = max(x1 - ax for _, ax, _, _, x1, _, _ in cells)
    top = max(ay - y0 for _, _, ay, _, _, y0, _ in cells)
    bottom = max(y1 - ay for _, _, ay, _, _, _, y1 in cells)
    w, h = left + right, top + bottom
    scale = (size - 2) / max(w, h)
    tw, th = max(1, round(w * scale)), max(1, round(h * scale))
    sheet = Image.new('RGBA', (size * frames, size), (0, 0, 0, 0))
    for i, (cell, ax, ay, *_rest) in enumerate(cells):
        canvas = Image.new('RGBA', (int(np.ceil(w)), int(np.ceil(h))), (0, 0, 0, 0))
        canvas.alpha_composite(Image.fromarray(cell), (int(round(left - ax)), int(round(top - ay))))
        small = np.asarray(canvas.resize((tw, th), Image.BOX)).copy()
        small[..., 3] = np.where(small[..., 3] >= 110, 255, 0)
        ox = (size - tw) // 2
        oy = size - 1 - th if kind == 'walker' else (size - th) // 2
        sheet.alpha_composite(Image.fromarray(small), (i * size + ox, max(0, oy)))
    return sheet


def main():
    p = argparse.ArgumentParser()
    p.add_argument('source')
    p.add_argument('--rows', required=True, help='NAME:SIZE per row, top to bottom; use - to skip a row')
    p.add_argument('--frames', type=int, required=True)
    p.add_argument('--kind', choices=['dragon', 'walker'], required=True)
    p.add_argument('--white-bg', action='store_true')
    p.add_argument('--out', default='art/dragons')
    args = p.parse_args()
    rows = [r.split(':') for r in args.rows.split(',')]
    a = load(args.source, args.white_bg)
    row_bands = bands((a[..., 3] >= SOLID).sum(1), len(rows), min_count=3)
    os.makedirs(args.out, exist_ok=True)
    for (name, *size), (y0, y1) in zip(rows, row_bands):
        if name == '-':
            continue
        sheet = build_row(a, y0, y1, args.frames, int(size[0]), args.kind)
        path = os.path.join(args.out, f'{name}.png')
        sheet.save(path)
        print(f'{path}: {sheet.width}x{sheet.height}')


if __name__ == '__main__':
    main()
