"""Turn a phone photo of a pencil drawing into something that reads like a scan.

    python3 tools/clean-sketch.py PHOTO.jpg src/content/log/NAME.jpg [--trim-bottom=PCT] [--raw]

Needs Pillow and numpy (pip install pillow numpy). The photo itself is only
read; keep it in a backup, not in git.

Steps, in order:
  1. Convert from the phone's Display P3 profile to sRGB (what browsers assume),
     so the colours don't shift when the profile is dropped.
  2. Flat-field: estimate the lighting across the sheet (the paper, with the
     pencil marks filtered out, then blurred) and divide it out. This removes
     the lamp's warm cast, the fall-off toward the edges and the hand shadow,
     while leaving every mark exactly where and how dark it was relative to
     the paper around it.
  3. Put the paper back as a soft warm white, and darken the marks slightly
     (a gentle power curve) so faint construction lines survive downscaling.
  4. Resize to a 2000px long edge and save as an sRGB JPEG with no metadata.

--trim-bottom=PCT crops that percentage off the bottom edge after cleaning:
for a shadow so steep at the very edge that flattening it would also flatten
the hatching. --raw skips 2-3: same colour conversion, resize and metadata
strip only, for comparison.
"""

import io
import sys

import numpy as np
from PIL import Image, ImageCms, ImageFilter, ImageOps

PAPER = np.array([246, 242, 235], dtype=np.float32) / 255.0  # soft warm white
MARK_CURVE = 1.35  # >1 darkens marks; 1.0 leaves the photo's own contrast
LONG_EDGE = 2000


def to_srgb(im: Image.Image) -> Image.Image:
    im = ImageOps.exif_transpose(im)
    icc = im.info.get("icc_profile")
    if icc:
        src = ImageCms.ImageCmsProfile(io.BytesIO(icc))
        dst = ImageCms.ImageCmsProfile(ImageCms.createProfile("sRGB"))
        im = ImageCms.profileToProfile(
            im, src, dst, renderingIntent=ImageCms.Intent.PERCEPTUAL, outputMode="RGB"
        )
    return im.convert("RGB")


def lighting(im: Image.Image) -> np.ndarray:
    """The illumination falling on blank paper, as floats in 0..1."""
    w, h = im.size
    k = 8  # work at 1/8 scale: fast, and the lighting is smooth anyway
    small = im.resize((w // k, h // k), Image.Resampling.BOX)
    # A morphological closing (max, then min, same window) erases anything
    # darker than its surroundings and narrower than the window -- every
    # stroke, and the hatched bands -- but, unlike a max filter and a wide
    # blur, it puts a lighting edge (the hand's shadow) back exactly where it
    # was. 11px at 1/8 scale is ~88px at full size. A light blur then removes
    # the blockiness of the small image.
    paper = (
        small.filter(ImageFilter.MaxFilter(11))
        .filter(ImageFilter.MinFilter(11))
        .filter(ImageFilter.GaussianBlur(2))
    )
    paper = paper.resize((w, h), Image.Resampling.BICUBIC)
    return np.asarray(paper, dtype=np.float32) / 255.0


def clean(im: Image.Image) -> Image.Image:
    a = np.asarray(im, dtype=np.float32) / 255.0
    bg = lighting(im)
    # Ratio of each pixel to the paper under the same light: 1 = bare paper.
    r = np.clip(a / np.maximum(bg, 1e-3), 0.0, 1.0)
    # Graphite is grey; judge marks by their luminance so the result is a
    # neutral pencil on warm paper rather than a residue of the lamp's colour.
    lum = r @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    lum = np.clip(lum, 0.0, 1.0) ** MARK_CURVE
    out = lum[..., None] * PAPER
    return Image.fromarray(np.round(np.clip(out, 0, 1) * 255).astype(np.uint8), "RGB")


def fit(im: Image.Image) -> Image.Image:
    w, h = im.size
    s = LONG_EDGE / max(w, h)
    if s >= 1:
        return im
    return im.resize((round(w * s), round(h * s)), Image.Resampling.LANCZOS)


def main() -> None:
    src, dst, *flags = sys.argv[1:]
    im = to_srgb(Image.open(src))
    if "--raw" not in flags:
        im = clean(im)
    # --trim-bottom=PCT: drop a sliver of the bottom edge (a shadow too steep
    # to flatten without also flattening the hatching).
    for f in flags:
        if f.startswith("--trim-bottom="):
            pct = float(f.split("=", 1)[1])
            im = im.crop((0, 0, im.width, round(im.height * (1 - pct / 100))))
    im = fit(im)
    # No exif/icc passed through: an sRGB JPEG with no metadata at all.
    im.save(dst, "JPEG", quality=84, optimize=True, progressive=True, subsampling="4:2:0")
    print(dst, im.size)


if __name__ == "__main__":
    main()
