import re

with open(r'src/app/student-dashboard/page.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

div_count = 0
for i, line in enumerate(lines[:838]): # up to 838
    # simple heuristic, ignoring comments and strings for a quick check
    # to be safer, we can just print lines that contain <div or </div
    open_divs = len(re.findall(r'<div\b[^>]*>', line))
    close_divs = len(re.findall(r'</div\s*>', line))
    div_count += open_divs - close_divs
    if div_count < 0:
        print(f"Line {i+1}: Negative div count! {line.strip()}")

print(f"Div count before line 838: {div_count}")
