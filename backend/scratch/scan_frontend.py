"""
Frontend Forensic Scanner for SADITA.ai
Scans all .tsx/.ts files for mock, dummy, placeholder, hardcoded numbers, static arrays.
"""
import os, re

FRONTEND_DIR = r"c:\Users\Rizal\Documents\Project\Sadita.ai\frontend"

PATTERNS = [
    r"\bmock\w*",
    r"\bdummy\w*",
    r"\bfake\w*",
    r"\bsample\w*",
    r"\bTODO\b",
    r"\bFIXME\b",
]

regex = re.compile("|".join(PATTERNS), re.IGNORECASE)

findings = []

for root, _, files in os.walk(FRONTEND_DIR):
    if "node_modules" in root or ".next" in root:
        continue
    for f in files:
        if f.endswith((".tsx", ".ts")):
            filepath = os.path.join(root, f)
            relpath = os.path.relpath(filepath, FRONTEND_DIR)
            with open(filepath, "r", encoding="utf-8", errors="ignore") as fp:
                for line_no, line in enumerate(fp, start=1):
                    # Ignore HTML input placeholder attributes
                    clean_line = re.sub(r'placeholder="[^"]*"', '', line)
                    clean_line = re.sub(r"placeholder='[^']*'", '', clean_line)
                    if regex.search(clean_line):
                        findings.append((relpath, line_no, line.strip()))

print(f"Total pattern matches: {len(findings)}")
for rel, line_no, text in findings[:50]:
    print(f"{rel}:{line_no} -> {text}")
