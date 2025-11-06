import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('.env.local')
supabase = create_client(
    os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

print("\nChecking if mtn_business_deals table exists...")

try:
    response = supabase.table('mtn_business_deals').select('id', count='exact').limit(1).execute()
    print(f"[SUCCESS] Table exists! Count: {response.count}")
except Exception as e:
    print(f"[ERROR] Table doesn't exist or error: {e}")
    print("\nPlease run the migration SQL manually in Supabase SQL Editor:")
    print("File: supabase/migrations/20251104105023_create_mtn_business_deals.sql")
