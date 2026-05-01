import json
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

with open('/root/.config/gdrive/oauth_token.json') as f:
    t = json.load(f)

creds = Credentials(token=t['token'], refresh_token=t['refresh_token'],
    token_uri=t['token_uri'], client_id=t['client_id'],
    client_secret=t['client_secret'], scopes=t['scopes'])
if creds.expired:
    creds.refresh(Request())

service = build('drive', 'v3', credentials=creds)

# Search for ANY PDF with ABA003 in the name
print("Searching for ABA003 PDFs anywhere in Drive...")
r = service.files().list(
    q="name contains 'ABA003' and mimeType='application/pdf'",
    fields="files(id, name, parents)",
    pageSize=10
).execute()
files = r.get('files', [])
print(f"Found {len(files)} PDFs with 'ABA003' in name:")
for f in files:
    print(f"  - {f['name']} (parent: {f.get('parents', ['?'])[0]})")

# Also search for any PDF contract
print("\nSearching for any PDF with 'Contract' in name...")
r2 = service.files().list(
    q="name contains 'Contract' and mimeType='application/pdf'",
    fields="files(id, name, parents)",
    pageSize=5
).execute()
files2 = r2.get('files', [])
print(f"Found {len(files2)} PDFs:")
for f in files2:
    print(f"  - {f['name']} (parent: {f.get('parents', ['?'])[0]})")

# Check total PDF count in entire Drive
print("\nTotal PDFs in entire Drive (first 5)...")
r3 = service.files().list(
    q="mimeType='application/pdf'",
    fields="files(id, name)",
    pageSize=5
).execute()
files3 = r3.get('files', [])
print(f"Found {len(files3)} PDFs (showing first 5):")
for f in files3:
    print(f"  - {f['name']}")
