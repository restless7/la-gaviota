import urllib.request, json, os, time, datetime, sys
from PIL import Image

KEY = 'sk-ws-H.DILPHYI.sIjA.MEQCIFQyvrKcX4eHkdQwP4uzY2sEhcyxsD7FGb5zohjFo4UNAiAqXq0AVJJ5oFYmkRKaobUbT3xRKt8cWO9BrTFl3Ge4cA'
API_URL = 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'
TARGET_DIR = 'packages/la-gaviota/public/PRODUCTS'
LOGO_PATH = 'packages/la-gaviota/public/IMAGES/logo.png'
MANIFEST_PATH = 'packages/la-gaviota/docs/audit-evidence/2026-10-27/generated-product-images-manifest.csv'

os.makedirs(TARGET_DIR, exist_ok=True)

def generate_single_product(item):
    sku = item['sku']
    name = item['name']
    cat = item['category']
    subcat = item.get('subcategory', '')
    unit = item.get('unit', '')
    prompt = item['prompt']
    
    slug = name.lower().replace(' ', '-').replace('/', '-')
    out_filename = f"{sku}-{slug}.jpg"
    out_path = os.path.join(TARGET_DIR, out_filename)
    
    if os.path.exists(out_path) and os.path.getsize(out_path) > 10000:
        print(f"Skipping {sku} - already exists: {out_filename}")
        return True

    payload = {
        'model': 'qwen-image-3.0',
        'input': {
            'messages': [{'role': 'user', 'content': [{'text': prompt}]}]
        }
    }
    
    req = urllib.request.Request(
        API_URL,
        data=json.dumps(payload).encode('utf-8'),
        headers={
            'Authorization': f'Bearer {KEY}',
            'Content-Type': 'application/json'
        }
    )
    
    print(f"\n[QWEN] Generating {sku} — {name} ({unit})...")
    start_t = time.time()
    
    for attempt in range(1, 4):
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                res = json.loads(resp.read().decode('utf-8'))
            img_url = res['output']['choices'][0]['message']['content'][0]['image']
            elapsed = time.time() - start_t
            print(f"[{sku}] Generated successfully in {elapsed:.1f}s. Downloading...")
            
            tmp_file = f"/tmp/{sku}_raw.png"
            urllib.request.urlretrieve(img_url, tmp_file)
            
            # Post-process: resize to 1600x1600 & overlay official La Gaviota logo
            bg = Image.open(tmp_file).convert('RGBA')
            bg = bg.resize((1600, 1600), Image.Resampling.LANCZOS)
            
            logo = Image.open(LOGO_PATH).convert('RGBA')
            logo_w = 240
            logo_h = int(logo.height * (logo_w / logo.width))
            logo = logo.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
            
            x = bg.width - logo_w - 40
            y = bg.height - logo_h - 40
            bg.paste(logo, (x, y), logo)
            
            final_img = bg.convert('RGB')
            final_img.save(out_path, quality=90, optimize=True)
            
            size_bytes = os.path.getsize(out_path)
            print(f"[{sku}] Saved {out_filename} ({size_bytes / 1024:.1f} KB, 1600x1600)")
            
            # Update manifest
            import csv
            fields = ['sku', 'name', 'category', 'subcategory', 'unit', 'filename', 'status', 'resolution', 'file_size_bytes', 'created_at']
            with open(MANIFEST_PATH, 'a', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fields)
                writer.writerow({
                    'sku': sku,
                    'name': name,
                    'category': cat,
                    'subcategory': subcat,
                    'unit': unit,
                    'filename': out_filename,
                    'status': 'GENERATED_AND_MAPPED',
                    'resolution': '1600x1600',
                    'file_size_bytes': size_bytes,
                    'created_at': datetime.datetime.now().isoformat()
                })
            
            # Clean up tmp
            if os.path.exists(tmp_file):
                os.remove(tmp_file)
            return True
            
        except Exception as e:
            print(f"[{sku}] Attempt {attempt} failed: {e}")
            time.sleep(3)
            
    print(f"[{sku}] FAILED after 3 attempts.")
    return False

if __name__ == '__main__':
    items_to_run = json.loads(sys.stdin.read())
    print(f"Starting batch of {len(items_to_run)} products...")
    success_count = 0
    for item in items_to_run:
        ok = generate_single_product(item)
        if ok:
            success_count += 1
        time.sleep(1)
    print(f"\nBatch completed: {success_count}/{len(items_to_run)} products processed.")

