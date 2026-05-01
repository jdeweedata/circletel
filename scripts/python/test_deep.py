from google.oauth2 import service_account
from googleapiclient.discovery import build

creds = service_account.Credentials.from_service_account_file(
    '/root/.config/gdrive/service-account.json',
    scopes=['https://www.googleapis.com/auth/drive.readonly'])
service = build('drive', 'v3', credentials=creds)

def list_folder(folder_id, depth=0):
    indent = "  " * depth
    results = service.files().list(
        q=f"'{folder_id}' in parents and trashed=false",
        fields="files(id, name, mimeType)"
    ).execute()
    items = results.get('files', [])
    for item in items:
        print(f"{indent}- {item['name']} [{item['mimeType'].split('/')[-1]}]")
        if item['mimeType'] == 'application/vnd.google-apps.folder' and depth < 2:
            list_folder(item['id'], depth + 1)

# Test just folder A
ROOT = '1C7dMq6y0Miba2nQF5a0PhrBULmiAaYyq'
top = service.files().list(
    q=f"'{ROOT}' in parents and name='A'",
    fields="files(id, name)"
).execute().get('files', [])

if top:
    print(f"Drilling into folder A (id: {top[0]['id']}):\n")
    list_folder(top[0]['id'])
else:
    print("Folder A not found!")
