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

def find_folder(name, parent_id):
    r = service.files().list(
        q=f"'{parent_id}' in parents and name='{name}' and mimeType='application/vnd.google-apps.folder' and trashed=false",
        fields="files(id, name)"
    ).execute()
    files = r.get('files', [])
    return files[0] if files else None

def list_folder(folder_id, limit=5):
    r = service.files().list(
        q=f"'{folder_id}' in parents and trashed=false",
        pageSize=limit,
        fields="files(id, name, mimeType)"
    ).execute()
    return r.get('files', [])

# Step 1: Find snapshot folder directly by ID
print("Step 1: Querying snapshot folder directly...")
items = list_folder('1C7dMq6y0Miba2nQF5a0PhrBULmiAaYyq', limit=3)
print(f"  Found {len(items)} items (first 3): {[i['name'] for i in items]}")

# Step 2: Find folder A inside snapshot
print("\nStep 2: Finding folder A...")
a_folder = find_folder('A', '1C7dMq6y0Miba2nQF5a0PhrBULmiAaYyq')
if a_folder:
    print(f"  Folder A id: {a_folder['id']}")
    # Step 3: Find ABA003 inside A
    aba = find_folder('ABA003', a_folder['id'])
    if aba:
        print(f"\nStep 3: ABA003 id: {aba['id']}")
        contents = list_folder(aba['id'], limit=10)
        print(f"  ABA003 contents ({len(contents)} items):")
        for f in contents:
            print(f"    - {f['name']} [{f['mimeType'].split('.')[-1]}]")
    else:
        print("  ABA003 not found inside A")
else:
    print("  Folder A not found in snapshot folder")
