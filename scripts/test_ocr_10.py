"""
Test Vision OCR on 10 PDFs that pdfplumber can't fully read.
Shows extracted fields + lets us check GCP cost dashboard after.
"""
import os, json, re, io
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

def get_all_pdfs():
    pdfs, page_token = [], None
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

def extract_text_with_ocr(buf):
    """Extract text, always using OCR if pdfplumber gets < 500 chars."""
    text = ''
    buf.seek(0)
    with pdfplumber.open(buf) as pdf:
        for page in pdf.pages:
            t = page.extract_text()
            if t:
                text += t + '\n'

    plumber_len = len(text.strip())
    ocr_pages = 0

    if plumber_len < 500:
        from google.cloud import vision as gcv
        from pdf2image import convert_from_bytes
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/home/circletel/circletel-drive-9afdd33bd927.json'
        vclient = gcv.ImageAnnotatorClient()
        buf.seek(0)
        images = convert_from_bytes(buf.read(), dpi=200)
        ocr_pages = len(images)
        for img in images:
            ibuf = io.BytesIO()
            img.save(ibuf, format='PNG')
            image = gcv.Image(content=ibuf.getvalue())
            response = vclient.document_text_detection(image=image)
            if response.full_text_annotation.text:
                text += response.full_text_annotation.text + '\n'

    return text, plumber_len, ocr_pages

def compact(s):
    if not s:
        return s
    words = s.split()
    single = sum(1 for w in words if len(w) == 1)
    if single >= len(words) * 0.6:
        return ''.join(words)
    return s.strip()

def find(text, patterns, default=''):
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            return m.group(1).strip()
    return default

def parse(text, filename):
    m = re.search(r'([A-Z]{2,4}\d{3,6})', filename)
    account = m.group(1) if m else find(text, [r'([A-Z]{2,4}\d{3,6}-\d+)', r'([A-Z]{2,4}\d{3,6})'])

    phys = ''
    pm = re.search(r'Physical [Aa]ddress:\s*\n?((?:[^\n]+\n?){1,6})', text)
    if pm:
        lines = [l.strip() for l in pm.group(1).splitlines()
                 if l.strip() and not re.match(r'(Postal|VAT|Accounts|Technical|Page\s|\d{10,})', l.strip())]
        addr_lines = []
        for l in lines[:6]:
            if re.match(r'^[\d\s+\-()]{7,}$', l): continue
            if re.match(r'^[A-Za-z\s]+$', l) and len(l) > 20: continue
            if re.search(r'\d', l):
                addr_lines.append(l)
        phys = ', '.join(addr_lines[:4]) if addr_lines else ''
    if not phys:
        phys = find(text, [r'Installation [Aa]ddress[:\s]+([^\n]+)'])

    raw_date = find(text, [
        r'[Dd]ated\s*\n\s*(\d{1,2}\s+[A-Za-z]+\s+\d{4})',
        r'acknowledge on (\d{2}-\d{2}-\d{4})',
        r'[Dd]ated\s+(\d{1,2}\s+[A-Za-z]+\s+\d{4})',
        r'[Dd]ate\s+(\d[\d /]+\d{4})',
        r'(\d{1,2}\s+[A-Za-z]+\s+\d{4})',
    ])
    signed = re.sub(r'\s+', '', raw_date) if re.match(r'[\d /]+$', raw_date or '') else raw_date

    raw_rep = find(text, [
        r'[Vv]e[ri]+fied by\s+((?:[A-Za-z] )*[A-Za-z][A-Za-z\s]{1,28}?)(?:,|\n)',
        r'Sales Rep\s*\n\s*([A-Za-z][A-Za-z\s]{2,28})\n',
        r'[Ss]ales [Ee]xpert[:\s]+([A-Za-z][A-Za-z\s]{2,28})\n',
    ])
    sales_rep = compact(raw_rep) if raw_rep else ''

    return {
        'account_number': account,
        'customer_name': find(text, [
            r'I\s+([A-Za-z][A-Za-z\s]{2,48})\s*\(Full names',
            r'I,\s+([A-Za-z][A-Za-z\s]{2,48})\s+identity number',
            r'Accounts Contact Person:\s*([A-Za-z][A-Za-z\s]{2,40})\n',
            r'\bAnd\b\s*\n\s*([A-Za-z][A-Za-z \.]{2,40})\n',
            r'Account Holder[:\s.]+\n?\s*([A-Za-z][A-Za-z \.]{2,40})\n',
            r'Contact Person:\s*\n\s*([A-Za-z][A-Za-z\s]{2,40})\n(?!Business|After|Mobile)',
        ]),
        'physical_address': phys,
        'package_name': find(text, [
            r'Service Level Agreement for\s*\n?\s*([^\n]{5,60}?)(?:\s*[-–]\s*Trusc|\s*\n)',
            r'(?:^|\n)Package\s+([\w][\w\s/]{3,40}?)\s+R\s+[\d,]',
            r'((?:My Choice|MyChoice|Socialite|Streamer|Gamer|Family|Bachelor|Minimalist|Professional|Fibre|LTE|Fixed LTE|FNO|FTTH)[^\n]{0,40})',
            r'Package\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9\s]{2,40})',
        ]),
        'monthly_fee': find(text, [
            r'A.Total Package Fees[\s\S]{0,400}?R\s*([\d]{2,6}(?:[,\.]\d{2})?)',
            r'Total Monthly Fees[\s\S]{0,400}?R\s*([\d]{2,6}(?:[,\.]\d{2})?)',
            r'[Tt]otal [Mm]onthly[^\n]*?R\s*([\d,]+\.?\d*)',
            r'R\s*([\d,]+\.?\d*)\s*p\.?m',
        ]),
        'signed_date': signed,
        'contact_number': find(text, [
            r'[Mm]obile phone number:\s*([\d\s+]{7,15})',
            r'(0[678]\d{8})',
            r'(\+27[\d\s]{9,12})',
        ]),
        'contact_email': find(text, [
            r'Accounts Email[^\n]*?\n?\s*([a-zA-Z0-9._%+\-]+@(?!trusc|support|circletel|complaints)[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})',
            r'([a-zA-Z0-9._%+\-]+@(?!trusc|support|circletel|complaints)[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})',
        ]),
        'sales_rep': sales_rep,
    }

def main():
    print("Fetching PDF list...")
    all_pdfs = get_all_pdfs()
    print(f"Total PDFs: {len(all_pdfs)}")

    # Find 10 PDFs that need OCR (pdfplumber returns < 500 chars)
    test_candidates = []
    print("\nScanning for PDFs that need OCR (pdfplumber < 500 chars)...")
    for f in all_pdfs:
        if len(test_candidates) >= 10:
            break
        try:
            buf = download_pdf(f['id'])
            text = ''
            with pdfplumber.open(buf) as pdf:
                for page in pdf.pages:
                    t = page.extract_text()
                    if t:
                        text += t + '\n'
            if len(text.strip()) < 500:
                test_candidates.append(f)
                print(f"  Found: {f['name']} ({len(text.strip())} chars)")
        except Exception as e:
            print(f"  Skip {f['name']}: {e}")

    print(f"\nRunning Vision OCR on {len(test_candidates)} PDFs...\n")
    total_ocr_pages = 0
    results = []

    for i, f in enumerate(test_candidates, 1):
        print(f"[{i}/10] {f['name']}")
        try:
            buf = download_pdf(f['id'])
            text, plumber_len, ocr_pages = extract_text_with_ocr(buf)
            total_ocr_pages += ocr_pages
            data = parse(text, f['name'])
            data['drive_file_id'] = f['id']
            data['_ocr_pages'] = ocr_pages
            data['_plumber_chars'] = plumber_len
            data['_total_chars'] = len(text.strip())
            results.append(data)

            filled = sum(1 for v in [data.get('customer_name'), data.get('package_name'),
                                      data.get('monthly_fee'), data.get('contact_email')] if v)
            print(f"  pdfplumber: {plumber_len} chars → OCR: {ocr_pages} pages → total: {len(text.strip())} chars")
            print(f"  account={data['account_number']} | name={data['customer_name'] or '—'} | "
                  f"pkg={data['package_name'] or '—'} | fee={data['monthly_fee'] or '—'} | "
                  f"email={data['contact_email'] or '—'}")
            print(f"  Fields filled: {filled}/4\n")
        except Exception as e:
            print(f"  ERROR: {e}\n")

    print(f"{'='*60}")
    print(f"Total Vision OCR pages consumed: {total_ocr_pages}")
    print(f"Estimated cost (after 1000 free/month): "
          f"${max(0, total_ocr_pages - 1000) * 0.0015:.4f}")
    print(f"\nCheck GCP dashboard for actual usage:")
    print(f"  https://console.cloud.google.com/apis/api/vision.googleapis.com/metrics?project=909282881074")

if __name__ == '__main__':
    main()
