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
    """Create a crisp SVG icon with pure white background and centered official brand logo."""
    import io, base64
    master = render_master_icon(512)
    buf = io.BytesIO()
    master.save(buf, format="PNG")
    b64_data = base64.b64encode(buf.getvalue()).decode("utf-8")

    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Brand Palette: Cherry Red #E30613, Leaf Green #4CAF50 -->
    <linearGradient id="brandColors">
      <stop offset="0%" stop-color="#E30613" />
      <stop offset="100%" stop-color="#4CAF50" />
    </linearGradient>
  </defs>
  <!-- Clean pure white background -->
  <rect width="512" height="512" fill="#FFFFFF" />
  <image href="data:image/png;base64,{b64_data}" x="0" y="0" width="512" height="512" preserveAspectRatio="xMidYMid meet" />
</svg>'''
    svg_path = os.path.join(PUBLIC_DIR, "icon.svg")
    with open(svg_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Created {svg_path} with pure white background and centered official logo")

def render_master_icon(size=512):
    """Render a crisp master icon using the plain official La Gaviota brand logo on a pure white background."""
    img = Image.new("RGBA", (size, size), (255, 255, 255, 255))

    # Prefer logo.jpeg (pristine white interior & background) over logo.png
    logo_jpeg_path = os.path.join(IMAGES_DIR, "logo.jpeg")
    logo_png_path = os.path.join(IMAGES_DIR, "logo.png")
    source_path = logo_jpeg_path if os.path.exists(logo_jpeg_path) else logo_png_path

    if os.path.exists(source_path):
        logo_raw = Image.open(source_path).convert("RGBA")
        # Find tight bounding box of non-white pixels (threshold < 245)
        pixels = logo_raw.load()
        w, h = logo_raw.size
        min_x, min_y, max_x, max_y = w, h, 0, 0
        for y in range(h):
            for x in range(w):
                r, g, b, a = pixels[x, y]
                if a > 20 and (r < 245 or g < 245 or b < 245):
                    if x < min_x: min_x = x
                    if y < min_y: min_y = y
                    if x > max_x: max_x = x
                    if y > max_y: max_y = y
                else:
                    # Force background pixels to pure crisp #FFFFFF
                    pixels[x, y] = (255, 255, 255, 255)

        if max_x > min_x and max_y > min_y:
            logo_cropped = logo_raw.crop((min_x, min_y, max_x + 1, max_y + 1))
        else:
            logo_cropped = logo_raw

        # Scale to 80% of canvas so pure white #FFFFFF background clearly frames the logo at 16x16 & 32x32
        target_w = int(size * 0.80)
        aspect = logo_cropped.height / logo_cropped.width
        target_h = int(target_w * aspect)
        if target_h > int(size * 0.80):
            target_h = int(size * 0.80)
            target_w = int(target_h / aspect)

        logo_resized = logo_cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)
        paste_x = (size - target_w) // 2
        paste_y = (size - target_h) // 2
        img.alpha_composite(logo_resized, (paste_x, paste_y))
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
    logo_bottom = 210
    if os.path.exists(logo_path):
        logo_raw = Image.open(logo_path).convert("RGBA")
        # Crop tight around logo
        bbox = logo_raw.getbbox()
        if bbox:
            logo_cropped = logo_raw.crop(bbox)
        else:
            logo_cropped = logo_raw
        
        # Scale cleanly to width 270 with proper height so it never overlaps text below
        logo_w = 270
        aspect = logo_cropped.height / logo_cropped.width
        logo_h = int(logo_w * aspect)
        logo_resized = logo_cropped.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
        logo_top = 40
        base.alpha_composite(logo_resized, (75, logo_top))
        logo_bottom = logo_top + logo_h
    else:
        print("Warning: logo.png not found!")

    # 3. Typography & Messaging (Left Side)
    # Load fonts
    font_bold_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    font_regular_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

    font_headline = ImageFont.truetype(font_bold_path, 40)
    font_badge = ImageFont.truetype(font_bold_path, 18)
    font_sub = ImageFont.truetype(font_regular_path, 20)
    font_sub_small = ImageFont.truetype(font_regular_path, 17)
    font_pills = ImageFont.truetype(font_bold_path, 15)

    # Primary Headline: "Frescura de Santander a tu mesa" positioned cleanly below logo
    y_text = logo_bottom + 25
    draw.text((75, y_text), "Frescura de Santander", fill=SLATE_900, font=font_headline)
    draw.text((75, y_text + 48), "a tu mesa", fill=CHERRY_RED, font=font_headline)

    # Campaign Badge Pill: "La forma chévere de mercar"
    badge_x = 75
    badge_y = y_text + 110
    badge_w = 320
    badge_h = 40
    draw.rounded_rectangle([badge_x, badge_y, badge_x + badge_w, badge_y + badge_h], radius=20, fill=CHERRY_RED)
    draw.text((badge_x + 20, badge_y + 9), "★  La forma chévere de mercar", fill=GOLD_YELLOW, font=font_badge)

    # Supporting Subtitle
    sub_y = badge_y + 55
    draw.text((75, sub_y), "Frutas y verduras seleccionadas del campo.", fill=SLATE_700, font=font_sub)
    draw.text((75, sub_y + 28), "Domicilios en Bucaramanga y área metropolitana.", fill=SLATE_500, font=font_sub_small)

    # Trust Badges (Free shipping & wholesale)
    pill_y = sub_y + 68
    # Pill 1: Envíos gratis desde $50.000
    draw.rounded_rectangle([75, pill_y, 345, pill_y + 34], radius=17, fill=(238, 242, 246, 255), outline=(203, 213, 225, 255), width=1)
    draw.text((90, pill_y + 7), "🚚 Envíos gratis desde $50.000", fill=SLATE_700, font=font_pills)
    # Pill 2: Precios mayoristas
    draw.rounded_rectangle([360, pill_y, 550, pill_y + 34], radius=17, fill=(238, 242, 246, 255), outline=(203, 213, 225, 255), width=1)
    draw.text((375, pill_y + 7), "🏷️ Tarifas para tu negocio", fill=SLATE_700, font=font_pills)

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
    og_jpg_app = os.path.join(APP_DIR, "opengraph-image.jpg")
    tw_png_app = os.path.join(APP_DIR, "twitter-image.png")
    tw_jpg_app = os.path.join(APP_DIR, "twitter-image.jpg")

    base.save(og_png_public, format="PNG")
    rgb_master.save(og_jpg_public, format="JPEG", quality=92, optimize=True)
    base.save(og_png_app, format="PNG")
    rgb_master.save(og_jpg_app, format="JPEG", quality=92, optimize=True)
    base.save(tw_png_app, format="PNG")
    rgb_master.save(tw_jpg_app, format="JPEG", quality=92, optimize=True)

    print(f"Saved {og_png_public} (1200x630)")
    print(f"Saved {og_jpg_public} (1200x630)")
    print(f"Saved {og_png_app} and {og_jpg_app} (1200x630 App Router default)")
    print(f"Saved {tw_png_app} and {tw_jpg_app} (1200x630 App Router default)")

if __name__ == "__main__":
    generate_icon_system()
    generate_social_image()
    print("All brand identity assets generated successfully!")
