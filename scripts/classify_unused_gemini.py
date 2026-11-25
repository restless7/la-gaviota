import urllib.request, json, base64, os, time, io, csv
from PIL import Image

KEY = 'sk-ws-H.DILPHYI.sIjA.MEQCIFQyvrKcX4eHkdQwP4uzY2sEhcyxsD7FGb5zohjFo4UNAiAqXq0AVJJ5oFYmkRKaobUbT3xRKt8cWO9BrTFl3Ge4cA'
url = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions'

with open('packages/la-gaviota/docs/audit-evidence/2026-10-27/asset-recovery-candidates.csv') as f:
    used = set(r['candidate_local_path'].replace('public/PRODUCTS/', '') for r in csv.DictReader(f))

all_gemini = [f for f in os.listdir('packages/la-gaviota/public/PRODUCTS') if f.startswith('Gemini_')]
unused_gemini = [f for f in all_gemini if f not in used]

missing_items = [
    'Zanahoria', 'Cebolla larga', 'Lechuga romana', 'Lechuga crespa', 'Rúgula', 'Cogollo europeo', 
    'Arveja desgranada', 'Arveja en concha', 'Batata', 'Ahuyamín', 'Apio arracacha', 'Agraz', 
    'Banano criollo', 'Breva', 'Curuba', 'Limón mandarina', 'Aromáticas Albahaca', 'Vísceras Chanfaina picada',
    'Adobo completo', 'Ajo molido', 'Ajo mix', 'Bicarbonato', 'Ajonjolí', 'Coco acaramelado', 
    'Almendra', 'Arándanos deshidratados', 'Ají botella', 'Ají en pepa', 'Arveja remojada', 'Carbón bolsa', 'Morcilla'
]

print(f"Analyzing {len(unused_gemini)} unused Gemini images...")
results = {}

for i, filename in enumerate(unused_gemini, 1):
    filepath = os.path.join('packages/la-gaviota/public/PRODUCTS', filename)
    with Image.open(filepath) as img:
        img.thumbnail((400, 400))
        buf = io.BytesIO()
        img.convert('RGB').save(buf, format='JPEG', quality=75)
        b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
        
    payload = {
        'model': 'qwen3-vl-plus',
        'messages': [{
            'role': 'user',
            'content': [
                {'type': 'text', 'text': f"Identify the fruit, vegetable or grocery item in this image. Is it one of: {missing_items}? Return JSON: {{\"item\": \"name\", \"confidence\": \"high|medium|low\"}}"},
                {'type': 'image_url', 'image_url': {'url': f"data:image/jpeg;base64,{b64}"}}
            ]
        }]
    }
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={
        'Authorization': f"Bearer {KEY}",
        'Content-Type': 'application/json'
    })
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            raw = data['choices'][0]['message']['content'].strip()
            if '```' in raw:
                parts = raw.split('```')
                raw = parts[1]
                if raw.startswith('json'):
                    raw = raw[4:]
            parsed = json.loads(raw.strip())
            print(f"{i:2d}/{len(unused_gemini)} {filename} -> {parsed}")
            results[filename] = parsed
    except Exception as e:
        print(f"{i:2d}/{len(unused_gemini)} {filename} -> ERROR {e}")
    time.sleep(0.15)

with open('/tmp/gemini_identified.json', 'w') as out_f:
    json.dump(results, out_f, indent=2)

print("\nDone! Output saved to /tmp/gemini_identified.json")

