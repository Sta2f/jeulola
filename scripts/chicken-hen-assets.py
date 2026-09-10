"""Export the generated hen artwork; local background removal authorized by user.

The image generator returned RGB with a painted checkerboard. This script only
removes that neutral background. A flood from the crop boundary preserves the
cream highlights enclosed inside feather outlines and the black hen's body.
"""
from pathlib import Path
import json

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import binary_propagation, find_objects, label

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "output/imagegen/chickens-atlas-source.png"
DESTINATION = ROOT / "public/assets/chicken/hens"
REPORT = ROOT / "output/imagegen/chickens-cutout-report.json"
PREVIEW = ROOT / "output/imagegen/chickens-cutout-preview.png"
POSES = ["idle", "peck", "walk-0", "walk-1", "panic", "captured"]
COLORS = ["white", "brown", "black"]

# The source grid is approximate: panic wing tips cross the nominal tile edge.
# Actual artwork bounds were measured from the reference-matched generated file.
BOUNDS = [
    [(38,32,254,285), (327,65,560,281), (622,34,834,282), (929,40,1151,282), (1224,17,1484,272), (1530,77,1728,286)],
    [(38,323,254,579), (327,358,560,576), (623,324,833,574), (927,328,1150,575), (1222,302,1483,560), (1528,365,1727,579)],
    [(38,617,254,871), (327,645,560,867), (622,618,834,868), (927,621,1151,869), (1222,595,1483,853), (1528,657,1727,868)],
]


def cutout(source, bounds):
    left, top, right, bottom = bounds
    crop = source.crop((left - 4, top - 4, right + 4, bottom + 4)).convert("RGBA")
    rgb = np.asarray(crop)[:, :, :3].astype(np.int16)
    lightest, darkest = rgb.max(axis=2), rgb.min(axis=2)
    # The backdrop is neutral or cool grey; feather highlights are warm cream.
    candidate = ((lightest - darkest < 35) & (darkest > 123)
                 & (rgb[:, :, 2] >= rgb[:, :, 0] - 15))
    seed = np.zeros(candidate.shape, dtype=bool)
    seed[0, :] = candidate[0, :]
    seed[-1, :] = candidate[-1, :]
    seed[:, 0] = candidate[:, 0]
    seed[:, -1] = candidate[:, -1]
    background = binary_propagation(seed, mask=candidate)

    # An outlined gap between the legs may be disconnected from the exterior.
    # Checkerboard holes have alternating light/dark values; feather highlights
    # do not. Restrict removal to sufficiently varied neutral connected regions.
    islands, count = label(candidate & ~background)
    holes = 0
    for island, slices in enumerate(find_objects(islands), start=1):
        region = islands[slices] == island
        values = lightest[slices][region]
        below_body = slices[0].start >= crop.height - 38
        if below_body and len(values) >= 20 and values.std() > 17 and values.min() < 210 and values.max() > 240:
            background[slices] |= region
            holes += 1

    rgba = np.array(crop)
    rgba[:, :, 3] = np.where(background, 0, 255)
    rgba[background, :3] = 0
    clean = Image.fromarray(rgba)
    actual = clean.getbbox()
    return clean.crop(actual), holes


def main():
    DESTINATION.mkdir(parents=True, exist_ok=True)
    source = Image.open(SOURCE).convert("RGB")
    assert source.size == (1774, 887), "Bounds belong to the selected source atlas."
    prepared = [(color, pose, *cutout(source, BOUNDS[row][col]))
                for row, color in enumerate(COLORS) for col, pose in enumerate(POSES)]
    # One scale for the entire atlas preserves character proportions across poses.
    scale = min(225 / max(image.width for _, _, image, _ in prepared),
                225 / max(image.height for _, _, image, _ in prepared))
    preview = Image.new("RGB", (6 * 272, 3 * 304), "#abc975")
    drawing = ImageDraw.Draw(preview)
    report = {"source": str(SOURCE), "source_size": source.size,
              "tile_size": [256, 256], "feet_baseline": 242, "uniform_scale": scale,
              "frames": []}
    for index, (color, pose, image, holes) in enumerate(prepared):
        width, height = max(1, round(image.width * scale)), max(1, round(image.height * scale))
        resized = image.resize((width, height), Image.Resampling.LANCZOS)
        tile = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
        tile.alpha_composite(resized, ((256 - width) // 2, 242 - height))
        path = DESTINATION / f"{color}-{pose}.png"
        tile.save(path, optimize=True)
        alpha = np.array(tile.getchannel("A"))
        row, col = divmod(index, 6)
        origin = (col * 272 + 8, row * 304 + 8)
        if col % 2:
            drawing.rectangle((origin[0], origin[1], origin[0]+255, origin[1]+255), fill="#80517a")
        preview.paste(tile, origin, tile)
        drawing.text((origin[0]+6, origin[1]+265), f"{color} / {pose}", fill="#172917")
        report["frames"].append({"file": str(path.relative_to(ROOT)), "mode": tile.mode,
                                 "bbox": tile.getbbox(), "clear_pixels": int((alpha == 0).sum()),
                                 "soft_edge_pixels": int(((alpha > 0) & (alpha < 255)).sum()),
                                 "checkerboard_holes_removed": holes})
    preview.save(PREVIEW)
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps({"exported": len(prepared), "destination": str(DESTINATION),
                      "preview": str(PREVIEW), "scale": scale}))


if __name__ == "__main__":
    main()
