import os
import re

directory = "client/src"

replacements = {
    # Fix Backgrounds
    r"\bg-white/5\b": "bg-secondary/30",
    r"\bg-white/10\b": "bg-secondary/50",
    r"\bg-black/20\b": "bg-card/50",
    r"\bg-black/40\b": "bg-card/80",
    r"\bg-slate-900\b": "bg-background",
    r"\bg-slate-950\b": "bg-background",
    
    # Fix Text Colors
    r"\btext-white\b": "text-foreground",
    r"\btext-slate-400\b": "text-muted-foreground",
    r"\btext-slate-300\b": "text-muted-foreground",
    r"\btext-slate-500\b": "text-muted-foreground",
    
    # Fix Borders
    r"\bborder-white/10\b": "border-border/40",
    r"\bborder-white/20\b": "border-border/60",
    r"\bborder-white/5\b": "border-border/20",
    r"\bborder-slate-800\b": "border-border",
    
    # Fix Gradients
    r"\bfrom-slate-900\b": "from-background",
    r"\bto-slate-950\b": "to-background",
    r"\bvia-black\b": "via-background",
    r"from-white": "from-foreground",
    r"to-white/70": "to-foreground/70"
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    for pattern, replacement in replacements.items():
        # Match class names perfectly using regex
        content = re.sub(pattern, replacement, content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {filepath}")

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith(".tsx") or file.endswith(".ts") or file.endswith(".jsx"):
            process_file(os.path.join(root, file))

print("Visuals clean complete!")
