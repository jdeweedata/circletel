#!/usr/bin/env python3
"""
Geocode clean contract addresses and produce a KML file for Google Earth.

Reads:   contracts_clean_addresses.json
Writes:  contracts_map.kml
Cache:   contracts_geocode_cache.json  (avoids re-calling the API)

Price-tier colours (KML AABBGGRR format):
  < R300   → green  ff00aa00
  R300-500 → yellow ff00d7ff
  R500-800 → orange ff0078ff
  R800+    → red    ff0000ff
  Unknown  → grey   ff888888
"""

import json
import os
import re
import sys
import time
import urllib.request
import urllib.parse
from pathlib import Path

BASE = Path("/home/circletel")
INPUT  = BASE / "contracts_clean_addresses.json"
OUTPUT = BASE / "contracts_map.kml"
CACHE  = BASE / "contracts_geocode_cache.json"

API_KEY = "AIzaSyC-kOFKZqhhmLXgEjXV7upYs_l1s_h3VzU"

# ── price tiers ───────────────────────────────────────────────────────────────
TIERS = [
    ("Under R300",  "ff00aa00"),   # green
    ("R300 – R500", "ff00d7ff"),   # yellow
    ("R500 – R800", "ff0078ff"),   # orange
    ("R800+",       "ff0000ff"),   # red
    ("Unknown",     "ff888888"),   # grey
]

def tier_for(fee):
    """Return (tier_name, style_id) for a monthly_fee string."""
    if not fee:
        return "Unknown", "sUnknown"
    m = re.search(r"[\d,]+\.?\d*", fee.replace(" ", ""))
    if not m:
        return "Unknown", "sUnknown"
    val = float(m.group().replace(",", ""))
    if val < 300:
        return "Under R300",  "sGreen"
    if val < 500:
        return "R300 – R500", "sYellow"
    if val < 800:
        return "R500 – R800", "sOrange"
    return "R800+", "sRed"

STYLE_IDS = {
    "sGreen":   "ff00aa00",
    "sYellow":  "ff00d7ff",
    "sOrange":  "ff0078ff",
    "sRed":     "ff0000ff",
    "sUnknown": "ff888888",
}

# ── geocoding ─────────────────────────────────────────────────────────────────
def geocode(address, cache):
    key = address.strip()
    if key in cache:
        return cache[key]

    query = key + ", South Africa"
    url = (
        "https://maps.googleapis.com/maps/api/geocode/json?"
        + urllib.parse.urlencode({"address": query, "key": API_KEY})
    )
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            data = json.loads(resp.read())
        if data.get("status") == "OK":
            loc = data["results"][0]["geometry"]["location"]
            result = (loc["lat"], loc["lng"])
        else:
            result = None
    except Exception as e:
        print(f"  [geocode error] {e}", file=sys.stderr)
        result = None

    cache[key] = result
    return result

# ── KML helpers ───────────────────────────────────────────────────────────────
def xml_escape(s):
    s = str(s) if s else ""
    return (s.replace("&", "&amp;")
             .replace("<", "&lt;")
             .replace(">", "&gt;")
             .replace('"', "&quot;"))

def make_styles():
    lines = []
    for sid, colour in STYLE_IDS.items():
        lines.append(f"""  <Style id="{sid}">
    <IconStyle>
      <color>{colour}</color>
      <scale>1.0</scale>
      <Icon><href>http://maps.google.com/mapfiles/kml/paddle/wht-blank.png</href></Icon>
    </IconStyle>
    <LabelStyle><scale>0.6</scale></LabelStyle>
  </Style>""")
    return "\n".join(lines)

def make_placemark(rec, lat, lng):
    tier_name, style_id = tier_for(rec.get("monthly_fee"))
    name = xml_escape(rec.get("account_number") or rec.get("source_filename", ""))
    addr = xml_escape(rec.get("physical_address", ""))
    pkg  = xml_escape(rec.get("package_name", "—"))
    fee  = xml_escape(rec.get("monthly_fee", "—"))
    acct = xml_escape(rec.get("account_number", "—"))
    desc = (
        f"<![CDATA["
        f"<b>Account:</b> {acct}<br/>"
        f"<b>Package:</b> {pkg}<br/>"
        f"<b>Monthly fee:</b> {fee}<br/>"
        f"<b>Address:</b> {addr}"
        f"]]>"
    )
    return (
        f"    <Placemark>\n"
        f"      <name>{name}</name>\n"
        f"      <styleUrl>#{style_id}</styleUrl>\n"
        f"      <description>{desc}</description>\n"
        f"      <Point><coordinates>{lng},{lat},0</coordinates></Point>\n"
        f"    </Placemark>"
    ), tier_name

# ── main ──────────────────────────────────────────────────────────────────────
def main():
    records = json.loads(INPUT.read_text())
    print(f"Loaded {len(records)} records")

    # Load or init cache
    if CACHE.exists():
        cache = json.loads(CACHE.read_text())
        print(f"Cache: {len(cache)} entries")
    else:
        cache = {}

    # Build tier buckets
    buckets = {name: [] for name, _ in TIERS}
    skipped = 0
    geocoded = 0
    errors = 0

    total = len(records)
    for i, rec in enumerate(records, 1):
        addr = rec.get("physical_address", "").strip()
        if not addr:
            skipped += 1
            continue

        if i % 50 == 0 or i == total:
            print(f"  [{i}/{total}] geocoded={geocoded} errors={errors} skipped={skipped}")

        coords = geocode(addr, cache)

        if coords is None:
            errors += 1
            continue

        geocoded += 1
        lat, lng = coords
        placemark, tier_name = make_placemark(rec, lat, lng)
        buckets[tier_name].append(placemark)

        # Rate-limit: ~10 req/s comfortably within free tier (50 req/s limit)
        time.sleep(0.11)

    # Save cache after every run
    CACHE.write_text(json.dumps(cache, indent=2))
    print(f"\nCache saved: {len(cache)} entries → {CACHE}")

    # Assemble KML
    folder_xml = []
    for tier_name, _ in TIERS:
        pms = buckets.get(tier_name, [])
        if not pms:
            continue
        inner = "\n".join(pms)
        folder_xml.append(
            f"  <Folder>\n"
            f"    <name>{tier_name} ({len(pms)} customers)</name>\n"
            f"    <open>0</open>\n"
            f"{inner}\n"
            f"  </Folder>"
        )

    kml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<kml xmlns="http://www.opengis.net/kml/2.2">\n'
        '<Document>\n'
        '  <name>CircleTel Customer Contracts</name>\n'
        '  <description>Customer locations coloured by monthly fee tier</description>\n'
        + make_styles() + "\n"
        + "\n".join(folder_xml) + "\n"
        '</Document>\n'
        '</kml>\n'
    )

    OUTPUT.write_text(kml, encoding="utf-8")
    print(f"\nKML written → {OUTPUT}")
    print(f"  Geocoded: {geocoded}")
    print(f"  Failed:   {errors}")
    print(f"  Skipped (no address): {skipped}")
    for tier_name, _ in TIERS:
        n = len(buckets.get(tier_name, []))
        if n:
            print(f"  {tier_name}: {n}")

if __name__ == "__main__":
    main()
