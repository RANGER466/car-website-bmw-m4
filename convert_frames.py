"""
NOCTIS Frame Conversion Script
Extracts ZIP archives, joins hero clips, converts to WebP at target sizes.
Never modifies or deletes original frames.
"""
import zipfile, os, io, sys, math, struct
from pathlib import Path
from PIL import Image

PYTHON = sys.executable
PROJECT = Path(r"C:\Users\rithi\OneDrive\Desktop\car website")
ASSETS  = PROJECT / "assets"

# Output directories
DIRS = {
    "hero":           (ASSETS / "frames" / "hero",          1600, 78),
    "hero-mobile":    (ASSETS / "frames" / "hero-mobile",   960,  72),
    "dismantle":      (ASSETS / "frames" / "dismantle",     1600, 78),
    "dismantle-mobile":(ASSETS/"frames" / "dismantle-mobile",960, 72),
}
for d, _, _ in DIRS.values():
    d.mkdir(parents=True, exist_ok=True)

(ASSETS / "cars").mkdir(parents=True, exist_ok=True)

# ── helpers ──────────────────────────────────────────────────────────────────

def natural_sort_key(name: str):
    """Return a sort key that sorts frame-001 before frame-010."""
    import re
    parts = re.split(r'(\d+)', name)
    return [int(p) if p.isdigit() else p.lower() for p in parts]

def load_zip_frames(zip_path: Path) -> list[bytes]:
    """Load all image entries from a zip in natural order, return raw bytes."""
    with zipfile.ZipFile(zip_path) as zf:
        names = sorted(
            [n for n in zf.namelist() if not n.endswith('/') and
             any(n.lower().endswith(ext) for ext in ('.jpg','.jpeg','.png','.webp'))],
            key=lambda n: natural_sort_key(Path(n).name)
        )
        return [zf.read(n) for n in names], names

def images_nearly_identical(b1: bytes, b2: bytes, threshold: float = 0.995) -> bool:
    """Compare two image byte buffers; True if they look almost the same."""
    img1 = Image.open(io.BytesIO(b1)).convert("L").resize((64, 36))
    img2 = Image.open(io.BytesIO(b2)).convert("L").resize((64, 36))
    p1 = list(img1.getdata())
    p2 = list(img2.getdata())
    total = len(p1)
    matches = sum(1 for a, b in zip(p1, p2) if abs(a - b) < 10)
    return matches / total >= threshold

def convert_and_save(raw_bytes: bytes, out_path: Path, width: int, quality: int):
    img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    # Resize only if wider than target
    if img.width != width:
        ratio = width / img.width
        new_h = round(img.height * ratio)
        img = img.resize((width, new_h), Image.LANCZOS)
    img.save(out_path, "WEBP", quality=quality, method=4)

# ── HERO: join clip1 + clip2 + clip3 ─────────────────────────────────────────
print("Loading hero clips …")

clip1_bytes, clip1_names = load_zip_frames(PROJECT / "cilp1 frame.zip")
clip2_bytes, clip2_names = load_zip_frames(PROJECT / "cilp2 frame.zip")
clip3_bytes, clip3_names = load_zip_frames(PROJECT / "cilp3 frame.zip")

print(f"  Clip1: {len(clip1_bytes)}, Clip2: {len(clip2_bytes)}, Clip3: {len(clip3_bytes)}")

# Check for duplicate boundary frames
hero_frames = list(clip1_bytes)

# Join clip2 — skip first frame if it matches last of clip1
if images_nearly_identical(hero_frames[-1], clip2_bytes[0]):
    print("  Skipping clip2 frame 0 (duplicate of clip1 last)")
    hero_frames.extend(clip2_bytes[1:])
else:
    hero_frames.extend(clip2_bytes)

# Join clip3 — skip first frame if it matches last so far
if images_nearly_identical(hero_frames[-1], clip3_bytes[0]):
    print("  Skipping clip3 frame 0 (duplicate of clip2 last)")
    hero_frames.extend(clip3_bytes[1:])
else:
    hero_frames.extend(clip3_bytes)

print(f"  Hero total frames: {len(hero_frames)}")

print("Converting hero frames …")
for i, raw in enumerate(hero_frames):
    idx = i + 1
    name = f"frame_{idx:04d}.webp"
    if idx % 50 == 0 or idx == 1:
        print(f"  hero {idx}/{len(hero_frames)}")
    convert_and_save(raw, ASSETS / "frames" / "hero" / name, 1600, 78)
    convert_and_save(raw, ASSETS / "frames" / "hero-mobile" / name, 960, 72)

# ── DISMANTLE ────────────────────────────────────────────────────────────────
print("Loading dismantle frames …")
dismantle_bytes, dismantle_names = load_zip_frames(PROJECT / "flow cilp frame.zip")
print(f"  Dismantle total frames: {len(dismantle_bytes)}")

print("Converting dismantle frames …")
for i, raw in enumerate(dismantle_bytes):
    idx = i + 1
    name = f"frame_{idx:04d}.webp"
    if idx % 50 == 0 or idx == 1:
        print(f"  dismantle {idx}/{len(dismantle_bytes)}")
    convert_and_save(raw, ASSETS / "frames" / "dismantle" / name, 1600, 78)
    convert_and_save(raw, ASSETS / "frames" / "dismantle-mobile" / name, 960, 72)

# ── REPORT ───────────────────────────────────────────────────────────────────
print("\n=== FRAME COUNTS ===")
hero_count      = len(hero_frames)
dismantle_count = len(dismantle_bytes)
print(f"hero:             {hero_count}")
print(f"dismantle:        {dismantle_count}")

def folder_size_mb(path: Path) -> str:
    total = sum(f.stat().st_size for f in path.rglob("*") if f.is_file())
    return f"{total/1024/1024:.1f} MB"

print("\n=== FOLDER SIZES ===")
for key, (d, _, _) in DIRS.items():
    print(f"  {key}: {folder_size_mb(d)}")

print("\n=== CONFIG VALUES ===")
print(f"  HERO_FRAME_COUNT:      {hero_count}")
print(f"  DISMANTLE_FRAME_COUNT: {dismantle_count}")
print("Done.")

