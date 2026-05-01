from google.oauth2 import service_account
from googleapiclient.discovery import build

creds = service_account.Credentials.from_service_account_file(
    '/root/.config/gdrive/service-account.json',
    scopes=['https://www.googleapis.com/auth/drive.readonly'])
service = build('drive', 'v3', credentials=creds)

# Search ALL accessible PDFs instead of traversing folders
results = service.files().list(
    q="mimeType='application/pdf'",
    fields="files(id, name, parents)",
    pageSize=10,
    supportsAllDrives=True,
    includeItemsFromAllDrives=True
).execute()

files = results.get('files', [])
print(f"Found {len(files)} PDFs accessible to service account:")
for f in files:
    print(f"  - {f['name']} (id: {f['id']})")
