from google.oauth2 import service_account
from googleapiclient.discovery import build

creds = service_account.Credentials.from_service_account_file(
    '/root/.config/gdrive/service-account.json',
    scopes=['https://www.googleapis.com/auth/drive.readonly'])
service = build('drive', 'v3', credentials=creds)

# Check inside ABA003 folder
ABA003_ID = None
folder_a = service.files().list(
    q="'1lV17FL0sWS2sEMU5lS-s9fWhL40rR_Hp' in parents and name='ABA003'",
    fields="files(id, name)"
).execute().get('files', [])

if folder_a:
    ABA003_ID = folder_a[0]['id']
    print(f"ABA003 folder ID: {ABA003_ID}")
    contents = service.files().list(
        q=f"'{ABA003_ID}' in parents",
        fields="files(id, name, mimeType)"
    ).execute().get('files', [])
    print(f"Contents ({len(contents)} items):")
    for f in contents:
        print(f"  - {f['name']} [{f['mimeType']}]")
else:
    print("ABA003 not found")
