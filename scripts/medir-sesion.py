#!/usr/bin/env python3
"""Mide el consumo de una sesión de Claude Code (solo lectura). Uso: python3 scripts/medir-sesion.py [archivo.jsonl]"""
import collections, glob, json, os, sys
carpeta = os.path.expanduser("~/.claude/projects/-Users-juanpablomonsalvez")
f = sys.argv[1] if len(sys.argv) > 1 else max(glob.glob(carpeta + "/*.jsonl"), key=os.path.getmtime)
tot, tools, reads, vistos, n = collections.Counter(), collections.Counter(), collections.Counter(), set(), 0
for linea in open(f, errors="ignore"):
    try: d = json.loads(linea)
    except ValueError: continue
    m = d.get("message") or {}
    if d.get("type") != "assistant" or not isinstance(m, dict): continue
    if m.get("id") not in vistos:
        vistos.add(m.get("id")); n += 1
        for k in ("input_tokens", "cache_creation_input_tokens", "cache_read_input_tokens", "output_tokens"):
            tot[k] += (m.get("usage") or {}).get(k, 0) or 0
    for c in m.get("content") or []:
        if isinstance(c, dict) and c.get("type") == "tool_use":
            tools[c.get("name")] += 1
            if c.get("name") == "Read": reads[(c.get("input") or {}).get("file_path")] += 1
print("archivo:", os.path.basename(f), "| respuestas únicas:", n)
for k, v in tot.items(): print(f"  {k:30}{v:>16,}")
if n: print(f"  contexto medio releído por llamada: {tot['cache_read_input_tokens'] // n:,}")
print("herramientas:", tools.most_common(8))
print("archivos releídos (>1):", [(p, c) for p, c in reads.items() if c > 1][:5])
