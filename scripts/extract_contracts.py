import os, json, re, io, difflib
import pdfplumber
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

with open('/root/.config/gdrive/oauth_token.json') as f:
    token_data = json.load(f)

creds = Credentials(
    token=token_data['token'],
    refresh_token=token_data['refresh_token'],
    token_uri=token_data['token_uri'],
    client_id=token_data['client_id'],
    client_secret=token_data['client_secret'],
    scopes=token_data['scopes']
)
if creds.expired and creds.refresh_token:
    creds.refresh(Request())

service = build('drive', 'v3', credentials=creds)
OUTPUT_FILE = '/home/circletel/contracts_extracted.json'


def get_all_pdfs():
    pdfs, page_token = [], None
    print("Searching entire Drive for PDFs...")
    while True:
        resp = service.files().list(
            q="mimeType='application/pdf' and trashed=false",
            fields="nextPageToken, files(id, name, parents)",
            pageSize=1000,
            pageToken=page_token
        ).execute()
        pdfs.extend(resp.get('files', []))
        page_token = resp.get('nextPageToken')
        if not page_token:
            break
    return pdfs


def download_pdf(file_id):
    buf = io.BytesIO()
    downloader = MediaIoBaseDownload(buf, service.files().get_media(fileId=file_id))
    done = False
    while not done:
        _, done = downloader.next_chunk()
    buf.seek(0)
    return buf


def extract_text(buf):
    text = ''
    buf.seek(0)
    with pdfplumber.open(buf) as pdf:
        for page in pdf.pages:
            t = page.extract_text()
            if t:
                text += t + '\n'

    if len(text.strip()) < 500:
        try:
            from google.cloud import vision as gcv
            from pdf2image import convert_from_bytes
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/home/circletel/circletel-drive-9afdd33bd927.json'
            vclient = gcv.ImageAnnotatorClient()
            buf.seek(0)
            images = convert_from_bytes(buf.read(), dpi=200)
            for img in images:
                ibuf = io.BytesIO()
                img.save(ibuf, format='PNG')
                image = gcv.Image(content=ibuf.getvalue())
                response = vclient.document_text_detection(image=image)
                if response.full_text_annotation.text:
                    text += response.full_text_annotation.text + '\n'
        except Exception:
            pass
    return text


def find(text, patterns, default=''):
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            return m.group(1).strip()
    return default


def extract_address(text):
    """
    Three Trusc contract layouts — all have unlabelled addresses in the intro block.

    1. New portal (2023+), residential:
       And
       <customer name>
       <street>
       <suburb/town>
       <postal code>
       ID/ Reg Number

    2. Old Rev 12.3/11.4, residential:
       Acc #: <account>
       <customer name>
       <street>
       <suburb/town>
       <postal code>
       Service Level

    3. Business contracts:
       And
       <company name>
       Reg no. <xxxxxx>
       <full address on one line>
    """

    # --- Pattern 1: New portal residential ---
    # After "And\n<name>", grab up to 4 lines until a stopper keyword
    m = re.search(
        r'\bAnd\b\s*\n\s*[A-Za-z][A-Za-z .]{1,40}\n'   # And + name line
        r'((?:[^\n]+\n){1,4}?)'                           # 1-4 address lines (lazy)
        r'(?:ID[/ ]|VIRE|Terms|Rev \d|\(\s*"We"\s*\))',   # stopper
        text
    )
    if m:
        addr = _clean_address_block(m.group(1))
        if addr:
            return addr

    # --- Pattern 2: Old Rev format residential ---
    # Acc #: line followed by name, then address lines until "Service Level"
    m = re.search(
        r'Acc\s*#[^\n]*\n'                                # Acc #: <account>
        r'[A-Za-z][^\n]{2,40}\n'                          # customer name line
        r'((?:[^\n]+\n){1,4}?)'                           # 1-4 address lines
        r'(?:Service Level|SLA|Contract)',                 # stopper
        text, re.IGNORECASE
    )
    if m:
        addr = _clean_address_block(m.group(1))
        if addr:
            return addr

    # --- Pattern 3: Business contract (Reg no. on its own line) ---
    m = re.search(
        r'\bAnd\b\s*\n[^\n]+\n'                           # And + company name
        r'Reg\s*no\.?[^\n]*\n'                             # Reg no. line
        r'([^\n]{10,120})',                                 # full address on one line
        text, re.IGNORECASE
    )
    if m:
        addr = m.group(1).strip()
        if addr:
            return addr

    # --- Pattern 4: Rev 12.x format — customer+address appears BEFORE "And" ---
    # Structure: ("We") → <company> → <address lines> → And → Rev X.X → ("You")
    m = re.search(
        r'\("We"\)\s*\n'                                   # ("We") marker
        r'(?:[^\n]+\n){1,2}'                               # 1-2 name lines
        r'((?:[^\n]+\n){1,4}?)'                            # 1-4 address lines (lazy)
        r'And\s*\n',                                        # stopper: And on its own line
        text
    )
    if m:
        addr = _clean_address_block(m.group(1))
        if addr:
            return addr

    # --- Fallback: labelled Physical Address (older digital contracts) ---
    m = re.search(r'Physical [Aa]ddress[:\s]*\n?((?:[^\n]+\n?){1,5})', text)
    if m:
        addr = _clean_address_block(m.group(1))
        if addr:
            return addr

    # --- Fallback: Installation Address ---
    m = re.search(r'Installation [Aa]ddress[:\s]+([^\n]+)', text, re.IGNORECASE)
    if m:
        return m.group(1).strip()

    return ''


# Words that indicate a line is a place/property name rather than a person name
_ADDRESS_KEYWORDS = {
    # Afrikaans farm/land terms
    'plaas', 'boerdery', 'vlei', 'kloof', 'berg', 'rivier', 'pad', 'laan',
    # English property/place types
    'farm', 'place', 'park', 'estate', 'village', 'square', 'island', 'bay',
    'heights', 'ridge', 'valley', 'view', 'grove', 'gardens', 'manor',
    'towers', 'gate', 'hof', 'flat', 'unit', 'complex', 'centre', 'center',
    'house', 'huis', 'hoek', 'trust',
    # Street type suffixes
    'str', 'street', 'ave', 'avenue', 'road', 'rd', 'drive', 'dr', 'weg',
    'singel', 'crescent', 'close', 'court', 'loop', 'lane', 'boulevard',
    # Directional / size qualifiers
    'north', 'south', 'east', 'west', 'groot', 'klein',
    # Business / commercial
    'shop', 'business',
}


def _clean_address_block(block):
    """
    From a raw multi-line address block, drop non-address lines and
    return a comma-joined string. Address lines must have a digit
    (street number or postal code) or be a short suburb-only token.
    """
    lines = [l.strip() for l in block.splitlines() if l.strip()]
    addr_lines = []
    for l in lines[:5]:
        # Drop pure phone numbers
        if re.match(r'^[\d\s+\-()/]{7,}$', l):
            continue
        # Drop lines that look like labels (Postal Address, Physical Address, VAT, etc.)
        if re.match(r'^(Physical|Postal|VAT|Accounts|Technical|Page |RICA|ID/|VIRE|Terms|Reg no)', l, re.IGNORECASE):
            continue
        # Drop version tags (V13.1, V13.2, etc.)
        if re.match(r'^V\d+\.\d+', l):
            continue
        # Drop boilerplate tokens
        if re.match(r'^\("(You|We)"\)$', l):
            continue
        if re.match(r'^TRUSCISP$', l, re.IGNORECASE):
            continue
        # Drop RT# ticket references
        if re.match(r'^RT#\d+', l):
            continue
        # Drop account number references (e.g. "JAN052", "RT# 510724 | TEK001")
        if re.match(r'^[A-Z]{2,5}\d{3,6}$', l):
            continue
        # Drop package-speed patterns like "4M MyChoice", "10Mb/s Fibre", "20Mbps Pro"
        if re.match(r'^\d+\s*[Mm][Bb]?(?:/s|ps)?\s+\w', l):
            continue
        # Drop known package brand names that leaked into address block
        if re.match(r'^(?:MyChoice|My Choice|Socialite|Streamer|Gamer|Family|Bachelor|Minimalist|Professional)\b', l, re.IGNORECASE):
            continue
        # Drop very long all-letter lines (usually paragraph text)
        if re.match(r'^[A-Za-z\s]+$', l) and len(l) > 25:
            continue
        # Drop person-name prefix — only when no address lines collected yet
        if not addr_lines:
            # Full name: "Khayalethu Xhasa", "Albert Burger"
            if re.match(r'^[A-Z][a-z]{2,} [A-Z][a-z]{2,}$', l):
                if not set(l.lower().split()) & _ADDRESS_KEYWORDS:
                    continue
            # Initials + surname: "J Reyneke", "CV Fortuin"
            if re.match(r'^[A-Z]{1,3}\.? [A-Z][a-z]{3,}$', l):
                continue
        # Keep if it has a digit (street number, unit number, or postal code)
        if re.search(r'\d', l):
            addr_lines.append(l)
        # Also keep short suburb/town-only lines (no digit, but ≤25 chars)
        elif len(l) <= 25:
            addr_lines.append(l)
    # Deduplicate: exact substring match first, then fuzzy match for short fragments
    deduped = []
    for l in addr_lines:
        is_dup = False
        for prev in deduped:
            if l in prev or prev.startswith(l):
                is_dup = True
                break
            # Fuzzy: short fragments (≤15 chars) that are near-matches to a word in an earlier line
            if len(l) <= 15:
                for word in prev.lower().split():
                    if len(word) >= 5 and difflib.SequenceMatcher(None, l.lower(), word).ratio() >= 0.85:
                        is_dup = True
                        break
            if is_dup:
                break
        if not is_dup:
            deduped.append(l)
    result = ', '.join(deduped[:4]) if deduped else ''
    # Strip trailing noise fragments: version tags, boilerplate, account refs
    result = re.sub(r',?\s*(V\d+\.\d+|\("You"\)|\("We"\)|TRUSCISP|RT#\d[\d\s|A-Z]*)$', '', result, flags=re.IGNORECASE).strip()
    return result


def _sanitize_package(name):
    """Remove trailing OCR-noise (prices, asterisks, colons) from a package name."""
    if not name:
        return name
    # Fix common OCR character substitutions before any other processing
    name = re.sub(r'\blnter', 'Inter', name)        # lnternet → Internet
    name = re.sub(r'\blntemet\b', 'Internet', name, flags=re.IGNORECASE)  # lntemet → Internet
    name = re.sub(r'(?<!\w)\$(?=[a-z])', 'P', name) # $ackage → Package ($ → P at word start)
    name = re.sub(r'\bMyGhoice\b', 'MyChoice', name, flags=re.IGNORECASE)  # MyGhoice → MyChoice
    # Strip trailing price artefacts like " 574.00" or " R499"
    name = re.sub(r'\s+R?\s*[\d,]+\.?\d*\s*$', '', name).strip()
    # Discard garbage: contains *, :, ** or is implausibly long
    if re.search(r'[*:]', name) or len(name) > 55:
        return ''
    return name


def parse(text, filename):
    # Account number: prefer filename (most reliable), fallback to body
    m = re.search(r'([A-Z]{2,4}\d{3,6})', filename)
    account = m.group(1) if m else find(text, [r'([A-Z]{2,4}\d{3,6}-\d+)', r'([A-Z]{2,4}\d{3,6})'])

    raw_pkg = find(text, [
        # SLA title (new portal + old Rev): "Service Level Agreement for<name> - Trusc..."
        r'Service Level Agreement for\s*\n?\s*([^\n]{5,60}?)(?:\s*[-–]\s*Trusc|\s*\n)',
        # New SLA format (SIM030 style): "Package Selection:\n<name>"
        r'Package Selection[:\s]*\n\s*([^\n]{5,60})',
        # Pricing table row: "Package  <name>  R <price>" (digital contracts)
        r'(?:^|\n)Package\s+([\w][\w\s/]{3,40}?)\s+R\s+[\d,]',
        # Package keyword at line start — stop before trailing price digits
        r'(?:^|\n)((?:My Choice|MyChoice|Socialite|Streamer|Gamer|Family|Bachelor|Minimalist|Professional|Fibre\s+\w|LTE|Fixed LTE|FNO|FTTH)[^,\n]{3,40}?)(?:\s+R|\s+\d{3,}|\n|$)',
        # Generic "Package: <name>" label
        r'Package\s*[:\-]\s*([A-Za-z0-9][A-Za-z0-9\s]{2,40})',
    ])
    package_name = _sanitize_package(raw_pkg)

    raw_fee = find(text, [
        # New portal table: "A-Total Package Fees" or "A - Total Package Fees"
        r'A.{0,4}Total Package Fees[\s\S]{0,400}?R\s*([\d]{2,6}(?:[,\.]\d{2})?)',
        # Old Rev table: "Total Monthly Fees ... R <amount>"
        r'Total Monthly Fees[\s\S]{0,400}?R\s*([\d]{2,6}(?:[,\.]\d{2})?)',
        # New SLA format (SIM030): "Total Recurring Costs\nR349.00"
        r'Total Recurring Costs[\s\S]{0,100}?R\s*([\d]{2,6}(?:[,\.]\d{2})?)',
        # Collapsed pricing-table row: "MyChoice 4M 574.00" or "MyChoice 4Mb/s Promo 349"
        r'(?:My Choice|MyChoice)\s+[\w\s./]{2,20}\s+([\d]{3,6}(?:[,\.]\d{2})?)',
        # Generic total line
        r'[Tt]otal [Mm]onthly[^\n]*?R\s*([\d,]+\.?\d*)',
        # "R 350 p.m" — require 3+ digits to avoid boilerplate (e.g. "R 20 p.m")
        r'R\s*([\d]{3,6}(?:[,\.]\d{2})?)\s*p\.?m',
    ])
    # Sanity: fees below R100 are false matches (reconnection fees, boilerplate)
    monthly_fee = raw_fee if raw_fee and float(re.sub(r'[,]', '', raw_fee)) >= 100 else ''

    return {
        'account_number': account,
        'package_name': package_name,
        'monthly_fee': monthly_fee,
        'physical_address': extract_address(text),
        'source_filename': filename,
    }


def main():
    pdfs = get_all_pdfs()
    print(f"Found {len(pdfs)} PDFs total. Starting extraction...\n")

    results, errors = [], []
    for i, f in enumerate(pdfs, 1):
        print(f"[{i}/{len(pdfs)}] {f['name']}...", end=' ', flush=True)
        try:
            text = extract_text(download_pdf(f['id']))
            data = parse(text, f['name'])
            data['drive_file_id'] = f['id']
            results.append(data)
            print(f"✓ ({data['account_number'] or '?'})")
        except Exception as e:
            print(f"✗ {e}")
            errors.append({'file': f['name'], 'error': str(e)})

    with open(OUTPUT_FILE, 'w') as out:
        json.dump(results, out, indent=2)

    print(f"\n✅ Done! {len(results)} extracted, {len(errors)} errors.")
    print(f"Saved to: {OUTPUT_FILE}")

    fields = ['package_name', 'monthly_fee', 'physical_address']
    print("\nExtraction coverage:")
    for field in fields:
        filled = sum(1 for r in results if r.get(field))
        pct = int(filled / len(results) * 100) if results else 0
        print(f"  {field:<22} {filled}/{len(results)} ({pct}%)")

    if errors:
        with open('/home/circletel/contracts_errors.json', 'w') as out:
            json.dump(errors, out, indent=2)


if __name__ == '__main__':
    main()
