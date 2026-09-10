"""Prepare generated farm illustrations after the user's explicit local-cutout authorization.

The generated RGB checkerboard is removed by connected background regions, preserving
enclosed bright details. Source pixels stay in output/imagegen, outside the shipped site.
Run from the repository root: python scripts/chicken-environment-assets.py
"""
from pathlib import Path
import json
import shutil

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'output' / 'imagegen' / 'chicken-environment'
DEST = ROOT / 'public' / 'assets' / 'chicken'
FRAMES = {
    'fence': [8, 69, 307, 234], 'fence-side': [327, 13, 292, 298],
    'gate': [632, 56, 299, 253], 'hay': [941, 54, 306, 253],
    'tree': [5, 322, 309, 321], 'bush': [320, 348, 307, 284],
    'barrel': [671, 369, 229, 259], 'wheelbarrow': [944, 356, 297, 273],
    'feeder': [10, 708, 301, 203], 'crates': [320, 696, 309, 224],
    'stump': [637, 708, 300, 228], 'scarecrow': [954, 632, 292, 318],
    'pond': [8, 953, 310, 278], 'flowers': [322, 969, 305, 263],
    'stones': [643, 1009, 293, 204], 'sign': [944, 960, 302, 272],
}


def remove_checkerboard(image: Image.Image, background_seeds=(), protected_disks=()) -> Image.Image:
    rgb = np.asarray(image.convert('RGB')).astype(np.float32)
    chroma = rgb.max(axis=2) - rgb.min(axis=2)
    luminance = rgb.mean(axis=2)
    neutral = (chroma < 16) & (luminance > 104)
    labels, count = ndimage.label(neutral, np.ones((3, 3), dtype=bool))
    border = np.unique(np.concatenate((labels[0], labels[-1], labels[:, 0], labels[:, -1])))
    accepted = np.zeros(count + 1, dtype=bool)
    accepted[border] = True
    # Inspected enclosed gaps get explicit seeds. Never classify interior silver
    # metal or white flower petals as background based on their color alone.
    for x, y in background_seeds:
        accepted[labels[y, x]] = True
    accepted[0] = False
    background = accepted[labels]
    foreground = ~background
    yy, xx = np.indices(foreground.shape)
    for cx, cy, radius in protected_disks:
        # A petal highlight can meet the matte at one antialiased pixel. These
        # inspected disks lie entirely inside the original bush silhouette.
        foreground |= (xx - cx) ** 2 + (yy - cy) ** 2 <= radius ** 2
    # Remove isolated background specks; keep thin stems attached to their artwork.
    parts, _ = ndimage.label(foreground)
    sizes = np.bincount(parts.ravel())
    foreground &= sizes[parts] > 7
    # A narrow matte antialiases cut edges. Extend actual foreground colors into
    # transparent fringe pixels, so bilinear GPU filtering cannot show gray halos.
    alpha = ndimage.gaussian_filter(foreground.astype(np.float32), .46)
    alpha[alpha < .018] = 0
    alpha[alpha > .982] = 1
    _, nearest = ndimage.distance_transform_edt(~foreground, return_indices=True)
    fringe = (~foreground) & (alpha > 0)
    rgb[fringe] = rgb[nearest[0][fringe], nearest[1][fringe]]
    rgba = np.dstack((rgb.astype(np.uint8), np.round(alpha * 255).astype(np.uint8)))
    rgba[alpha == 0, :3] = 0
    return Image.fromarray(rgba, 'RGBA')


def main():
    SOURCE.mkdir(parents=True, exist_ok=True)
    (DEST / 'props').mkdir(parents=True, exist_ok=True)
    for name in ('hero-coop', 'farm-props'):
        public_source = DEST / f'{name}-source.png'
        if public_source.exists():
            shutil.copy2(public_source, SOURCE / f'{name}-source.png')
            public_source.unlink()
    atlas = remove_checkerboard(Image.open(SOURCE / 'farm-props-source.png'),
                                [(150, 172), (453, 170), (529, 114), (573, 78), (1051, 526)],
                                [(430, 433, 26)])
    atlas.save(SOURCE / 'farm-props-alpha.png', optimize=True)
    metadata = {}
    for name, (x, y, w, h) in FRAMES.items():
        crop = atlas.crop((x, y, x + w, y + h))
        crop.save(DEST / 'props' / f'{name}.png', optimize=True)
        a = np.asarray(crop.getchannel('A'))
        metadata[name] = {'sourceBounds': [x, y, w, h], 'size': [w, h], 'transparentPixels': int((a == 0).sum()), 'opaquePixels': int((a == 255).sum())}
    coop = remove_checkerboard(Image.open(SOURCE / 'hero-coop-source.png'))
    # Resize only the final isolated hero: enough detail for DPR2 without a huge payload.
    coop = coop.resize((900, 900), Image.Resampling.LANCZOS)
    coop.save(DEST / 'hero-coop.png', optimize=True)
    (SOURCE / 'metadata.json').write_text(json.dumps(metadata, indent=2), encoding='utf-8')
    board = Image.new('RGBA', (1254, 1254), '#769e3c')
    board.alpha_composite(atlas)
    board.convert('RGB').save(SOURCE / 'props-on-green.jpg', quality=94)
    hero = Image.new('RGBA', (900, 900), '#769e3c'); hero.alpha_composite(coop)
    hero.convert('RGB').save(SOURCE / 'coop-on-green.jpg', quality=94)
    print(json.dumps({'props': len(FRAMES), 'hero': str(DEST / 'hero-coop.png'), 'review': str(SOURCE)}, indent=2))


if __name__ == '__main__':
    main()
