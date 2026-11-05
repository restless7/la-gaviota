import urllib.request, json, base64, os, time

key = 'sk-ws-H.DILPHYI.sIjA.MEQCIFQyvrKcX4eHkdQwP4uzY2sEhcyxsD7FGb5zohjFo4UNAiAqXq0AVJJ5oFYmkRKaobUbT3xRKt8cWO9BrTFl3Ge4cA'
dir_path = 'packages/la-gaviota/public/nov 04 - 14_19'
url = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions'

files = sorted(os.listdir(dir_path))
print(f"Analyzing {len(files)} files with Qwen-VL...")

results = []
for i, f in enumerate(files, 1):
    fpath = os.path.join(dir_path, f)
    with open(fpath, 'rb') as img_f:
        b64_data = base64.b64encode(img_f.read()).decode('utf-8')
    
    prompt_text = "What is the exact product name or label printed on the pouch packaging in this image? Also, is it classified as Condimento or Aromática if visible? Respond in pure JSON format: {\"label\": \"string\", \"type\": \"string\"}"
    payload = {
        'model': 'qwen3-vl-plus',
        'messages': [{
            'role': 'user',
            'content': [
                {'type': 'text', 'text': prompt_text},
                {'type': 'image_url', 'image_url': {'url': f'data:image/jpeg;base64,{b64_data}'}}
            ]
        }]
    }
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            raw_content = data['choices'][0]['message']['content'].strip()
            # Clean possible markdown block
            if '```' in raw_content:
                parts = raw_content.split('```')
                raw_content = parts[1]
                if raw_content.startswith('json'):
                    raw_content = raw_content[4:]
            parsed = json.loads(raw_content.strip())
            label = parsed.get('label', '')
            ptype = parsed.get('type', '')
            print(f"{i:2d}. {f} -> [{label}] ({ptype})")
            results.append({'file': f, 'label': label, 'type': ptype, 'fpath': fpath})
    except Exception as e:
        print(f"{i:2d}. {f} -> ERROR: {e}")
    time.sleep(0.3)

with open('/tmp/identified_17.json', 'w') as out_f:
    json.dump(results, out_f, indent=2)

print("\nAnalysis saved to /tmp/identified_17.json")

