#!/usr/bin/env python3
"""
Brand Asset & Social Image Generator
Frutas y Verduras La Gaviota
Mission ID: LG-UX-MEDIA-R1

Generates:
1. Premium Favicon & Icon System:
   - public/favicon.ico (16, 32, 48)
   - app/favicon.ico
   - public/icon-16x16.png
   - public/icon-32x32.png
   - public/icon-48x48.png
   - public/apple-touch-icon.png (180x180)
   - app/apple-icon.png
   - public/icon-192x192.png
   - public/icon-512x512.png
   - app/icon.png
   - public/icon.svg
   - public/manifest.webmanifest
2. Premium Open Graph & Twitter Social Sharing Image (1200 x 630):
   - public/IMAGES/og-lagaviota.png
   - public/IMAGES/og-lagaviota.jpg
   - app/opengraph-image.png
   - app/twitter-image.png
"""

import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PUBLIC_DIR = os.path.join(REPO_ROOT, "public")
APP_DIR = os.path.join(REPO_ROOT, "app")
IMAGES_DIR = os.path.join(PUBLIC_DIR, "IMAGES")

CHERRY_RED = (227, 6, 19)        # #E30613
DARK_RED = (180, 5, 15)          # #B4050F
LEAF_GREEN = (76, 175, 80)       # #4CAF50
DARK_GREEN = (46, 125, 50)       # #2E7D32
GOLD_YELLOW = (255, 204, 0)      # #FFCC00
WARM_WHITE = (253, 251, 247)     # #FDFBF7
SLATE_900 = (15, 23, 42)         # #0F172A
SLATE_700 = (51, 65, 85)         # #334155
SLATE_500 = (100, 116, 139)      # #64748B

def create_svg_icon():
    svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E30613" />
      <stop offset="100%" stop-color="#B4050F" />
    </linearGradient>
    <linearGradient id="greenGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#388E3C" />
      <stop offset="100%" stop-color="#4CAF50" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-opacity="0.25" />
    </filter>
  </defs>
  <!-- Background Badge -->
  <rect width="512" height="512" rx="128" fill="url(#redGrad)" />
  <rect x="16" y="16" width="480" height="480" rx="116" fill="none" stroke="#FFFFFF" stroke-opacity="0.18" stroke-width="8" />

  <!-- Stylized Soaring Seagull Body / G-curve in White -->
  <path d="M 120 340 C 140 370 200 390 270 380 C 350 370 400 300 390 220 C 385 180 350 150 310 150 C 270 150 250 180 230 200 C 200 230 150 250 120 250 C 105 250 100 270 110 290 C 115 300 115 330 120 340 Z" fill="#FFFFFF" filter="url(#shadow)" />
  
  <!-- Seagull Wing Dynamic Wave -->
  <path d="M 140 240 C 190 210 270 200 330 230 C 370 250 375 270 340 280 C 290 290 210 270 160 300 C 145 310 135 290 140 240 Z" fill="#FFFFFF" />

  <!-- Iconic Brand Green Leaf crowning top right -->
  <g transform="translate(290, 85) rotate(15)">
    <path d="M 0 110 C -20 70 -10 20 50 0 C 110 30 120 80 100 120 C 70 150 20 140 0 110 Z" fill="url(#greenGrad)" filter="url(#shadow)" />
    <!-- Leaf central vein -->
    <path d="M 10 105 Q 50 70 95 10" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.6" />
  </g>
</svg>'''
    svg_path = os.path.join(PUBLIC_DIR, "icon.svg")
    with open(svg_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Created {svg_path}")

def render_master_icon(size=512):
    """Draw a rich raster master icon using PIL matching the SVG brand identity."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    corner_radius = int(size * 0.25)
    # Red rounded rectangle badge with subtle gradient
    for i in range(size):
        ratio = i / size
        r = int(CHERRY_RED[0] * (1 - ratio * 0.2) + DARK_RED[0] * (ratio * 0.2))
        g = int(CHERRY_RED[1] * (1 - ratio * 0.2) + DARK_RED[1] * (ratio * 0.2))
        b = int(CHERRY_RED[2] * (1 - ratio * 0.2) + DARK_RED[2] * (ratio * 0.2))

    # Base badge
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=corner_radius, fill=CHERRY_RED)
    
    # Subtle inner border for contrast on dark/light tabs
    border_inset = max(2, int(size * 0.03))
    border_width = max(1, int(size * 0.015))
    draw.rounded_rectangle(
        [border_inset, border_inset, size - 1 - border_inset, size - 1 - border_inset],
        radius=corner_radius - border_inset,
        outline=(255, 255, 255, 55),
        width=border_width
    )

    # Stylized White Seagull flight silhouette (G-form)
    # Scale polygon coordinates to size
    scale = size / 512.0
    pts_seagull = [
        (int(110 * scale), int(330 * scale)),
        (int(140 * scale), int(365 * scale)),
        (int(210 * scale), int(380 * scale)),
        (int(280 * scale), int(370 * scale)),
        (int(360 * scale), int(330 * scale)),
        (int(390 * scale), int(270 * scale)),
        (int(385 * scale), int(210 * scale)),
        (int(350 * scale), int(160 * scale)),
        (int(305 * scale), int(165 * scale)),
        (int(275 * scale), int(195 * scale)),
        (int(235 * scale), int(225 * scale)),
        (int(185 * scale), int(245 * scale)),
        (int(135 * scale), int(250 * scale)),
        (int(115 * scale), int(275 * scale)),
    ]
    draw.polygon(pts_seagull, fill=(255, 255, 255, 255))
    # Smooth curves with circles
    draw.ellipse([int(110 * scale), int(260 * scale), int(160 * scale), int(310 * scale)], fill=(255, 255, 255, 255))
    draw.ellipse([int(260 * scale), int(170 * scale), int(380 * scale), int(290 * scale)], fill=(255, 255, 255, 255))

    # Inner cut / wing dynamic curve
    pts_wing_cut = [
        (int(140 * scale), int(240 * scale)),
        (int(220 * scale), int(215 * scale)),
        (int(300 * scale), int(230 * scale)),
        (int(340 * scale), int(270 * scale)),
        (int(280 * scale), int(275 * scale)),
        (int(200 * scale), int(265 * scale)),
        (int(150 * scale), int(285 * scale)),
    ]
    draw.polygon(pts_wing_cut, fill=(255, 255, 255, 255))

    # Green Leaf on top right
    leaf_center_x = int(370 * scale)
    leaf_center_y = int(140 * scale)
    leaf_w = int(75 * scale)
    leaf_h = int(55 * scale)

    # Draw leaf using overlapping curves / rotated ellipse
    leaf_img = Image.new("RGBA", (int(200 * scale), int(200 * scale)), (0, 0, 0, 0))
    leaf_draw = ImageDraw.Draw(leaf_img)
    leaf_draw.ellipse([int(20 * scale), int(40 * scale), int(170 * scale), int(130 * scale)], fill=LEAF_GREEN)
    leaf_draw.polygon([
        (int(170 * scale), int(85 * scale)),
        (int(140 * scale), int(45 * scale)),
        (int(195 * scale), int(35 * scale)),
    ], fill=LEAF_GREEN)
    # Leaf stem
    leaf_draw.line([int(30 * scale), int(115 * scale), int(10 * scale), int(145 * scale)], fill=DARK_GREEN, width=int(5 * scale))
    # Leaf vein
    leaf_draw.line([int(35 * scale), int(110 * scale), int(175 * scale), int(45 * scale)], fill=(255, 255, 255, 140), width=int(4 * scale))

    # Rotate leaf ~ -25 deg
    rotated_leaf = leaf_img.rotate(-25, resample=Image.Resampling.BICUBIC)
    img.alpha_composite(rotated_leaf, (int(280 * scale), int(50 * scale)))

    return img

def generate_icon_system():
    print("Generating Favicon & Application Icon System...")
    create_svg_icon()
    master = render_master_icon(512)

    sizes = [
        (16, "icon-16x16.png", PUBLIC_DIR),
        (32, "icon-32x32.png", PUBLIC_DIR),
        (48, "icon-48x48.png", PUBLIC_DIR),
        (180, "apple-touch-icon.png", PUBLIC_DIR),
        (180, "apple-icon.png", APP_DIR),
        (192, "icon-192x192.png", PUBLIC_DIR),
        (512, "icon-512x512.png", PUBLIC_DIR),
        (512, "icon.png", APP_DIR),
    ]

    ico_images = []
    for sz, filename, out_dir in sizes:
        resized = master.resize((sz, sz), Image.Resampling.LANCZOS)
        out_path = os.path.join(out_dir, filename)
        resized.save(out_path, format="PNG")
        print(f"Saved {out_path} ({sz}x{sz})")
        if sz in (16, 32, 48):
            ico_images.append(resized)

    # Generate multi-size favicon.ico
    fav_public = os.path.join(PUBLIC_DIR, "favicon.ico")
    fav_app = os.path.join(APP_DIR, "favicon.ico")
    
    # Save ICO with 16, 32, 48 resolutions from master
    master.save(fav_public, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    master.save(fav_app, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    print(f"Saved {fav_public} and {fav_app} (Multi-res ICO: 16x16, 32x32, 48x48)")

    # PWA web manifest
    manifest_content = '''{
  "name": "Surtifruver La Gaviota",
  "short_name": "La Gaviota",
  "description": "Mercado fresco directo del campo a tu mesa en Bucaramanga y Santander.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FDFBF7",
  "theme_color": "#E30613",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/apple-touch-icon.png",
      "sizes": "180x180",
      "type": "image/png"
    }
  ]
}'''
    manifest_path = os.path.join(PUBLIC_DIR, "manifest.webmanifest")
    with open(manifest_path, "w", encoding="utf-8") as f:
        f.write(manifest_content)
    print(f"Saved {manifest_path}")

def generate_social_image():
    print("Generating Premium 1200x630 Open Graph & Social Sharing Image...")
    width, height = 1200, 630

    # 1. Base Canvas with Warm Gradient
    base = Image.new("RGBA", (width, height), WARM_WHITE)
    draw = ImageDraw.Draw(base)

    # Subtle mountain contours (Chicamocha inspired) in soft tan
    for y_offset, col in [(420, (235, 226, 212, 100)), (470, (226, 214, 196, 120)), (520, (245, 235, 220, 180))]:
        mountain_pts = [(0, height)]
        for x in range(0, width + 40, 40):
            y = y_offset - int(35 * math.sin(x * 0.005) + 20 * math.cos(x * 0.012))
            mountain_pts.append((x, y))
        mountain_pts.append((width, height))
        draw.polygon(mountain_pts, fill=col)

    # Layered Cherry-Red wave accents along bottom
    wave_pts = [(0, height)]
    for x in range(0, width + 20, 20):
        y = 575 + int(18 * math.sin(x * 0.008 + 1.2))
        wave_pts.append((x, y))
    wave_pts.append((width, height))
    draw.polygon(wave_pts, fill=CHERRY_RED)

    # Subtle yellow highlight line along red wave
    line_pts = []
    for x in range(0, width + 10, 10):
        y = 573 + int(18 * math.sin(x * 0.008 + 1.2))
        line_pts.append((x, y))
    draw.line(line_pts, fill=GOLD_YELLOW, width=5)

    # 2. Left Side: Official Logo
    logo_path = os.path.join(IMAGES_DIR, "logo.png")
    if os.path.exists(logo_path):
        logo_raw = Image.open(logo_path).convert("RGBA")
        # Crop tight around logo
        bbox = logo_raw.getbbox()
        if bbox:
            logo_cropped = logo_raw.crop(bbox)
        else:
            logo_cropped = logo_raw
        
        # Scale to max width 380, max height 130
        logo_w = 380
        aspect = logo_cropped.height / logo_cropped.width
        logo_h = int(logo_w * aspect)
        logo_resized = logo_cropped.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
        base.alpha_composite(logo_resized, (80, 70))
    else:
        print("Warning: logo.png not found!")

    # 3. Typography & Messaging (Left Side)
    # Load fonts
    font_bold_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    font_regular_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

    font_headline = ImageFont.truetype(font_bold_path, 46)
    font_badge = ImageFont.truetype(font_bold_path, 20)
    font_sub = ImageFont.truetype(font_regular_path, 21)
    font_pills = ImageFont.truetype(font_bold_path, 16)

    # Primary Headline: "Frescura de Santander a tu mesa"
    y_text = 220
    draw.text((80, y_text), "Frescura de Santander", fill=SLATE_900, font=font_headline)
    draw.text((80, y_text + 54), "a tu mesa", fill=CHERRY_RED, font=font_headline)

    # Campaign Badge Pill: "La forma chévere de mercar"
    badge_x = 80
    badge_y = y_text + 130
    badge_w = 330
    badge_h = 44
    draw.rounded_rectangle([badge_x, badge_y, badge_x + badge_w, badge_y + badge_h], radius=22, fill=CHERRY_RED)
    draw.text((badge_x + 22, badge_y + 10), "★  La forma chévere de mercar", fill=GOLD_YELLOW, font=font_badge)

    # Supporting Subtitle
    sub_y = badge_y + 64
    draw.text((80, sub_y), "Frutas y verduras seleccionadas del campo.", fill=SLATE_700, font=font_sub)
    draw.text((80, sub_y + 30), "Domicilios en Bucaramanga y área metropolitana.", fill=SLATE_500, font=font_sub)

    # Trust Badges (Free shipping & wholesale)
    pill_y = sub_y + 78
    # Pill 1: Envíos gratis desde $50.000
    draw.rounded_rectangle([80, pill_y, 350, pill_y + 36], radius=18, fill=(238, 242, 246, 255), outline=(203, 213, 225, 255), width=1)
    draw.text((95, pill_y + 8), "🚚 Envíos gratis desde $50.000", fill=SLATE_700, font=font_pills)
    # Pill 2: Precios mayoristas
    draw.rounded_rectangle([365, pill_y, 550, pill_y + 36], radius=18, fill=(238, 242, 246, 255), outline=(203, 213, 225, 255), width=1)
    draw.text((380, pill_y + 8), "🏷️ Tarifas para tu negocio", fill=SLATE_700, font=font_pills)

    # 4. Right Side: Authentic Seagull Mascot Holding Basket
    mascota_path = os.path.join(PUBLIC_DIR, "mascota.png")
    if os.path.exists(mascota_path):
        mascota_raw = Image.open(mascota_path).convert("RGBA")
        bbox_m = mascota_raw.getbbox()
        if bbox_m:
            mascota_tight = mascota_raw.crop(bbox_m)
        else:
            mascota_tight = mascota_raw

        # Target height ~500px on right side
        target_h = 500
        aspect_m = mascota_tight.width / mascota_tight.height
        target_w = int(target_h * aspect_m)
        mascota_scaled = mascota_tight.resize((target_w, target_h), Image.Resampling.LANCZOS)

        # Subtle soft circular glow behind mascot
        glow_size = 520
        glow = Image.new("RGBA", (glow_size, glow_size), (0, 0, 0, 0))
        draw_glow = ImageDraw.Draw(glow)
        draw_glow.ellipse([10, 10, glow_size - 10, glow_size - 10], fill=(255, 235, 235, 160))
        glow_blurred = glow.filter(ImageFilter.GaussianBlur(radius=25))
        base.alpha_composite(glow_blurred, (680, 50))

        # Composite Mascot
        pos_x = 1200 - target_w - 70
        pos_y = 630 - target_h - 45
        base.alpha_composite(mascota_scaled, (pos_x, pos_y))
    else:
        print("Warning: mascota.png not found!")

    # 5. Save all deliverables
    rgb_master = base.convert("RGB")

    # Outputs
    og_png_public = os.path.join(IMAGES_DIR, "og-lagaviota.png")
    og_jpg_public = os.path.join(IMAGES_DIR, "og-lagaviota.jpg")
    og_png_app = os.path.join(APP_DIR, "opengraph-image.png")
    tw_png_app = os.path.join(APP_DIR, "twitter-image.png")

    base.save(og_png_public, format="PNG")
    rgb_master.save(og_jpg_public, format="JPEG", quality=92, optimize=True)
    base.save(og_png_app, format="PNG")
    base.save(tw_png_app, format="PNG")

    print(f"Saved {og_png_public} (1200x630)")
    print(f"Saved {og_jpg_public} (1200x630)")
    print(f"Saved {og_png_app} (1200x630 App Router default)")
    print(f"Saved {tw_png_app} (1200x630 App Router default)")

if __name__ == "__main__":
    generate_icon_system()
    generate_social_image()
    print("All brand identity assets generated successfully!")
