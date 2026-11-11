"""
NOCTIS — Generate placeholder car images for the lineup section.
Uses the first dismantle frame as a base, tinting each with a different
colour overlay to represent the 5 models. Saves as WebP 1600px wide.
"""
import io
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

PYTHON_PATH = r"C:\Users\rithi\AppData\Local\Temp\noctis-venv\Scripts\python.exe"
PROJECT     = Path(r"C:\Users\rithi\OneDrive\Desktop\car website")
ASSETS      = PROJECT / "assets"
CARS_DIR    = ASSETS / "cars"
CARS_DIR.mkdir(parents=True, exist_ok=True)

# Source: first dismantle frame (fully assembled car)
SOURCE = ASSETS / "frames" / "dismantle" / "frame_0001.webp"

# Car definitions: id, name, tint (RGBA), brightness, saturation
CARS = [
    # GT-E: graphite, slight warm grey
    dict(id="gt-e",  tint=(40, 42, 46,  60), brightness=0.90, sat=0.55),
    # S: satin bone white
    dict(id="s",     tint=(220,215,205, 80), brightness=1.15, sat=0.30),
    # X: midnight blue
    dict(id="x",     tint=(20, 30, 60,  90), brightness=0.80, sat=0.60),
    # R: satin black with slight red
    dict(id="r",     tint=(30,  8,  8, 100), brightness=0.70, sat=0.40),
    # ONE: liquid silver
    dict(id="one",   tint=(180,185,195, 70), brightness=1.10, sat=0.20),
]

TARGET_W = 1600
QUALITY  = 80

if not SOURCE.exists():
    print(f"Source frame not found: {SOURCE}")
    print("Creating dark placeholder instead.")
    for car in CARS:
        img = Image.new("RGB", (TARGET_W, 900), (7, 8, 10))
        out = CARS_DIR / f"{car['id']}.webp"
        img.save(out, "WEBP", quality=QUALITY)
        print(f"  Created placeholder: {out.name}")
else:
    base = Image.open(SOURCE).convert("RGB")
    # Resize to 1600 wide
    ratio  = TARGET_W / base.width
    new_h  = round(base.height * ratio)
    base   = base.resize((TARGET_W, new_h), Image.LANCZOS)

    for car in CARS:
        img = base.copy()

        # Adjust saturation
        enhancer = ImageEnhance.Color(img)
        img = enhancer.enhance(car["sat"])

        # Adjust brightness
        enhancer = ImageEnhance.Brightness(img)
        img = enhancer.enhance(car["brightness"])

        # Apply tint overlay
        tint_layer = Image.new("RGBA", img.size, car["tint"])
        img = img.convert("RGBA")
        img = Image.alpha_composite(img, tint_layer).convert("RGB")

        out = CARS_DIR / f"{car['id']}.webp"
        img.save(out, "WEBP", quality=QUALITY)
        print(f"  Saved: {out.name}  ({img.width}×{img.height})")

print("Done generating car images.")

