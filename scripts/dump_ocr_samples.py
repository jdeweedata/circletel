"""
Dump raw OCR text from 4 sample PDFs to understand address structure.
Targets: 2 new Trusc portal (7-page), 1 old Rev 12.3 (10-page), 1 business contract.
"""
import io, json, os, re
import pdfplumber
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from google.cloud import vision as gcv
from pdf2image import convert_from_bytes

os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/home/circletel/circletel-drive-9afdd33bd927.json'

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
vclient = gcv.ImageAnnotatorClient()

# Target specific accounts we want to inspect
# YON001 = new Trusc portal, WES049 = business, UNE001 = old format, XHA001 = old 10-page
TARGET_ACCOUNTS = ['YON001', 'WES049', 'UNE001', 'XHA001']

def get_all_pdfs():
    pdfs, page_token = [], None
    while True:
        resp = service.files().list(
            q="mimeType='application/pdf' and trashed=false",
            fields="nextPageToken, files(id, name)",
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

def ocr_pdf(buf):
    buf.seek(0)
    images = convert_from_bytes(buf.read(), dpi=200)
    text = ''
    for img in images:
        ibuf = io.BytesIO()
        img.save(ibuf, format='PNG')
        image = gcv.Image(content=ibuf.getvalue())
        response = vclient.document_text_detection(image=image)
        if response.full_text_annotation.text:
            text += response.full_text_annotation.text + '\n'
    return text

print("Fetching PDF list...")
all_pdfs = get_all_pdfs()

targets = {}
for f in all_pdfs:
    for acct in TARGET_ACCOUNTS:
        if acct in f['name'] and acct not in targets:
            targets[acct] = f
            break

print(f"Found {len(targets)} target PDFs\n")

for acct, f in targets.items():
    print(f"\n{'='*60}")
    print(f"FILE: {f['name']}")
    print('='*60)
    buf = download_pdf(f['id'])

    # Check pdfplumber first
    plumber_text = ''
    with pdfplumber.open(buf) as pdf:
        for page in pdf.pages:
            t = page.extract_text()
            if t:
                plumber_text += t + '\n'

    if len(plumber_text.strip()) < 500:
        print(f"pdfplumber: {len(plumber_text.strip())} chars — running OCR...")
        buf.seek(0)
        text = plumber_text + '\n' + ocr_pdf(buf)
    else:
        print(f"pdfplumber: {len(plumber_text.strip())} chars — using direct text")
        text = plumber_text

    # Print first 3000 chars — enough to see the address block
    print(text[:3000])
    print(f"\n[... {len(text)} total chars ...]")

    # Also show lines around "And" and "Physical Address" and "address"
    print("\n--- Lines containing address-related context ---")
    lines = text.splitlines()
    for i, line in enumerate(lines):
        if re.search(r'\bAnd\b|Physical|[Aa]ddress|Installation|Street|Avenue|Road|Drive|Close|\b\d{4}\b', line):
            context = lines[max(0,i-1):i+4]
            print(f"  L{i}: " + " | ".join(repr(l) for l in context))
