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

# Check what's at the root of this account's Drive
results = service.files().list(
    q="'root' in parents and trashed=false",
    pageSize=10,
    fields="files(id, name, mimeType)"
).execute()
files = results.get('files', [])
print(f"Root Drive contents ({len(files)} items):")
for f in files:
    print(f"  - {f['name']} [{f['mimeType'].split('.')[-1]}]")

# Also check shared with me
shared = service.files().list(
    q="sharedWithMe=true",
    pageSize=10,
    fields="files(id, name, mimeType)"
).execute()
sfiles = shared.get('files', [])
print(f"\nShared with me ({len(sfiles)} items):")
for f in sfiles:
    print(f"  - {f['name']}")
