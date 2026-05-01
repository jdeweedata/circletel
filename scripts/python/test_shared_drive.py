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

ABA003_ID = '1WGWLgO1WOYK5kkyW2Iky9m4qwIT4n3PY'

# Test 1: With Shared Drive support
print("Test 1: With supportsAllDrives=True...")
r = service.files().list(
    q=f"'{ABA003_ID}' in parents and trashed=false",
    fields="files(id, name, mimeType)",
    supportsAllDrives=True,
    includeItemsFromAllDrives=True
).execute()
files = r.get('files', [])
print(f"  Found {len(files)} items")
for f in files[:5]:
    print(f"    - {f['name']}")

# Test 2: Check if ABA003 folder is itself a shortcut
print("\nTest 2: ABA003 folder metadata...")
meta = service.files().get(
    fileId=ABA003_ID,
    fields="id, name, mimeType, driveId, shortcutDetails",
    supportsAllDrives=True
).execute()
print(f"  mimeType: {meta.get('mimeType')}")
print(f"  driveId: {meta.get('driveId', 'None (personal drive)')}")
print(f"  shortcutDetails: {meta.get('shortcutDetails', 'None')}")

# Test 3: List all Shared Drives accessible
print("\nTest 3: Available Shared Drives...")
drives = service.drives().list(pageSize=10).execute()
for d in drives.get('drives', []):
    print(f"  - {d['name']} (id: {d['id']})")
if not drives.get('drives'):
    print("  No shared drives found")
