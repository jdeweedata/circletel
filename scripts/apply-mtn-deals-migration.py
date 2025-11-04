#!/usr/bin/env python3
"""
Apply MTN Business Deals migration to Supabase
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv('.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

def main():
    print("\n" + "="*80)
    print("APPLYING MTN BUSINESS DEALS MIGRATION")
    print("="*80)
    
    # Connect to Supabase
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("\n[ERROR] Supabase credentials not found in .env.local")
        return
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("\n✓ Connected to Supabase")
    
    # Read migration file
    migration_path = 'supabase/migrations/20251104105023_create_mtn_business_deals.sql'
    print(f"\nReading migration: {migration_path}")
    
    with open(migration_path, 'r', encoding='utf-8') as f:
        sql = f.read()
    
    print(f"✓ Loaded migration ({len(sql)} characters)")
    
    # Split into individual statements (basic approach)
    statements = [s.strip() for s in sql.split(';') if s.strip() and not s.strip().startswith('--')]
    
    print(f"\nExecuting {len(statements)} SQL statements...")
    
    executed = 0
    errors = 0
    
    for i, statement in enumerate(statements, 1):
        if not statement:
            continue
            
        try:
            # Use raw SQL execute
            supabase.postgrest.session.post(
                f"{SUPABASE_URL}/rest/v1/rpc/exec",
                json={"query": statement},
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type": "application/json"
                }
            )
            executed += 1
            if i % 10 == 0:
                print(f"  ✓ Executed {i}/{len(statements)} statements...")
        except Exception as e:
            # Check if error is ignorable (e.g., "already exists")
            error_msg = str(e).lower()
            if 'already exists' in error_msg or 'duplicate' in error_msg:
                print(f"  ⚠ Statement {i} skipped (already exists)")
                executed += 1
            else:
                print(f"  ✗ Statement {i} failed: {e}")
                errors += 1
    
    print(f"\n{'='*80}")
    print(f"MIGRATION COMPLETE")
    print(f"{'='*80}")
    print(f"Executed: {executed}/{len(statements)}")
    print(f"Errors: {errors}")
    
    if errors == 0:
        print("\n✓ Migration applied successfully!")
    else:
        print(f"\n⚠ Migration completed with {errors} errors")
    
    print("\n" + "="*80 + "\n")

if __name__ == '__main__':
    main()
