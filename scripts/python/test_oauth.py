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

result = service.files().list(
    q="'1WGWLgO1WOYK5kkyW2Iky9m4qwIT4n3PY' in parents",
    fields="files(id, name, mimeType)"
).execute()

files = result.get('files', [])
print(f"ABA003 contents ({len(files)} items):")
for f in files:
    print(f"  - {f['name']} [{f['mimeType']}]")
