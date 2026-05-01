from google_auth_oauthlib.flow import InstalledAppFlow
import json, os

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

flow = InstalledAppFlow.from_client_secrets_file(
    '/root/.config/gdrive/oauth_client.json',
    scopes=['https://www.googleapis.com/auth/drive.readonly'],
    redirect_uri='urn:ietf:wg:oauth:2.0:oob'
)

auth_url, _ = flow.authorization_url(prompt='consent')

print("\n=== STEP 1: Open this URL in your laptop browser ===")
print(auth_url)
print("\n=== STEP 2: Sign in, grant access, copy the code shown ===\n")

code = input("Paste the authorization code here: ").strip()

flow.fetch_token(code=code)
creds = flow.credentials

with open('/root/.config/gdrive/oauth_token.json', 'w') as f:
    json.dump({
        "token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri": creds.token_uri,
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
        "scopes": list(creds.scopes)
    }, f, indent=2)

print("\n✅ Token saved to /root/.config/gdrive/oauth_token.json")
print(f"Refresh token starts with: {creds.refresh_token[:20]}...")
