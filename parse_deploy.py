import json

with open(r'C:\Users\adi\.gemini\antigravity\brain\987d48fd-e428-43d6-918c-1540557e3243\.system_generated\steps\3009\content.md', 'r', encoding='utf-8') as f:
    data = f.read()

start = data.find('[{')
if start != -1:
    try:
        j = json.loads(data[start:])
        latest = j[0]
        print(f"State: {latest['state']}")
        print(f"Description: {latest.get('description', '')}")
    except Exception as e:
        print(f"JSON Error: {e}")
