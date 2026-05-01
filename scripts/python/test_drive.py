from google.oauth2 import service_account
from googleapiclient.discovery import build

creds = service_account.Credentials.from_service_account_file(
    '/root/.config/gdrive/service-account.json',
    scopes=['https://www.googleapis.com/auth/drive.readonly'])
service = build('drive', 'v3', credentials=creds)

FOLDER_ID = '1C7dMq6y0Miba2nQF5a0PhrBULmiAaYyq'

results = service.files().list(
    q=f"'{FOLDER_ID}' in parents",
    fields="files(id, name, mimeType)"
).execute()

files = results.get('files', [])
print(f"Found {len(files)} items:")
for f in files:
    print(f"  - {f['name']} ({f['mimeType']})")

