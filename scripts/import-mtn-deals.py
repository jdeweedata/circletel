#!/usr/bin/env python3
"""
Import MTN Business Deals from JSON to Supabase
"""

import json
import os
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv('.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

def parse_date(date_str):
    """Parse date string to YYYY-MM-DD format"""
    if not date_str:
        return None
    try:
        # Format: "2025-11-07" (already ISO format from JSON)
        return date_str
    except:
        return None

def parse_boolean(value):
    """Convert Yes/No to boolean"""
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() == 'yes'

def clean_text(value):
    """Clean text fields"""
    if not value or value == '':
        return None
    return str(value).strip()

def calculate_ex_vat(incl_vat):
    """Calculate ex VAT from incl VAT (15% VAT)"""
    if not incl_vat:
        return 0
    return round(incl_vat / 1.15, 2)

def map_deal_to_db(deal):
    """Map JSON deal to database record"""
    
    # Calculate ex VAT if not provided or is 0
    monthly_ex_vat = deal.get('Total Subscription Ex Vat', 0)
    if monthly_ex_vat == 0:
        monthly_ex_vat = calculate_ex_vat(deal.get('Total Subscription Incl Vat', 0))
    
    return {
        # Deal identification
        'deal_id': deal['Deal ID'],
        'deal_name': f"{deal['Price Plan']} + {deal['OEM and Device']} ({deal['Contract Term']}M)",
        
        # Device information
        'device_name': clean_text(deal.get('OEM and Device')),
        'device_status': clean_text(deal.get('Device Status')),
        
        # Service package
        'price_plan': deal['Price Plan'],
        'tariff_code': clean_text(deal.get('Eppix Tariff')),
        'package_code': clean_text(deal.get('Eppix Package')),
        'package_description': clean_text(deal.get('Package description')),
        'tariff_description': clean_text(deal.get('Tariff description')),
        
        # Contract
        'contract_term': int(deal['Contract Term']),
        
        # Pricing
        'monthly_price_incl_vat': float(deal.get('Total Subscription Incl Vat', 0)),
        'monthly_price_ex_vat': float(monthly_ex_vat),
        'device_payment_incl_vat': float(deal.get('Once-off Pay-in (incl VAT)', 0)),
        
        # Data & bundles
        'total_data': clean_text(deal.get('Total Data')),
        'data_bundle': clean_text(deal.get('Data Bundle')),
        'total_minutes': clean_text(deal.get('Total Minutes')),
        'anytime_minute_bundle': clean_text(deal.get('Anytime Minute Bundle')),
        'onnet_minute_bundle': clean_text(deal.get('On-Net Minute Bundle')),
        'sms_bundle': clean_text(deal.get('SMS Bundle')),
        'bundle_description': clean_text(deal.get('Bundle description')),
        
        # Inclusive features
        'inclusive_data': clean_text(deal.get('Inclusive Price Plan Data')),
        'inclusive_minutes': clean_text(deal.get('Inclusive Price Plan Minutes')),
        'inclusive_sms': clean_text(deal.get('Inclusive Price Plan SMS')),
        'inclusive_onnet_minutes': clean_text(deal.get('Inclusive Price Plan On-net Minutes')),
        'inclusive_ingroup_calling': clean_text(deal.get('Inclusive Price Plan In-Group Calling')),
        
        # Freebies
        'free_sim': parse_boolean(deal.get('Free Sim', False)),
        'free_cli': parse_boolean(deal.get('Free CLI', False)),
        'free_itb': parse_boolean(deal.get('Free ITB', False)),
        'freebie_devices': clean_text(deal.get('Freebies description 1\\n(Devices)')),
        'freebie_priceplan': clean_text(deal.get('Freebie description 2\\n(Priceplan)')),
        
        # Availability
        'available_helios': parse_boolean(deal.get('Available on Helios', True)),
        'available_ilula': parse_boolean(deal.get('Available on iLula', True)),
        'channel_visibility': clean_text(deal.get('Channel Deal Visibility')),
        'device_range_applicability': clean_text(deal.get('Device Range Applicability')),
        
        # Inventory
        'inventory_status_main': clean_text(deal.get('EBU Inventory Status (Main device)')),
        'inventory_status_freebie': clean_text(deal.get('EBU Inventory Status (Freebie)')),
        
        # Dates
        'promo_start_date': parse_date(deal.get('Promo Start date (mm/dd/yyyy)')),
        'promo_end_date': parse_date(deal.get('Promo End date (mm/dd/yyyy)')),
        
        # Active if promo hasn't ended
        'active': True,  # Will be set based on end date
        
        # Store original deal as metadata
        'metadata': {
            'import_date': datetime.now().isoformat(),
            'source': 'Helios and iLula Business Promos - Oct 2025',
            'original_deal_id': deal['Deal ID']
        }
    }

def import_deals(supabase: Client, deals, batch_size=100, test_mode=False):
    """Import deals to Supabase in batches"""
    
    total = len(deals)
    if test_mode:
        deals = deals[:batch_size]
        total = len(deals)
        print(f"\n[TEST MODE] Importing {total} deals only")
    
    print(f"\nStarting import of {total:,} deals...")
    print(f"Batch size: {batch_size}")
    
    imported = 0
    errors = 0
    
    for i in range(0, total, batch_size):
        batch = deals[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        total_batches = (total + batch_size - 1) // batch_size
        
        print(f"\nProcessing batch {batch_num}/{total_batches} ({len(batch)} deals)...")
        
        # Map deals to database format
        db_records = []
        for deal in batch:
            try:
                db_record = map_deal_to_db(deal)
                db_records.append(db_record)
            except Exception as e:
                print(f"  [ERROR] Failed to map deal {deal.get('Deal ID', 'UNKNOWN')}: {e}")
                errors += 1
        
        # Insert batch
        try:
            response = supabase.table('mtn_business_deals').insert(db_records).execute()
            imported += len(db_records)
            print(f"  ✓ Imported {len(db_records)} deals (Total: {imported:,}/{total:,})")
        except Exception as e:
            print(f"  [ERROR] Batch insert failed: {e}")
            errors += len(db_records)
    
    print(f"\n{'='*80}")
    print(f"IMPORT COMPLETE")
    print(f"{'='*80}")
    print(f"Total Deals: {total:,}")
    print(f"Imported: {imported:,}")
    print(f"Errors: {errors:,}")
    print(f"Success Rate: {(imported/total*100):.1f}%")
    
    return imported, errors

def verify_import(supabase: Client):
    """Verify imported data"""
    print(f"\n{'='*80}")
    print("VERIFICATION")
    print(f"{'='*80}")
    
    # Count total deals
    response = supabase.table('mtn_business_deals').select('id', count='exact').execute()
    total = response.count
    print(f"\nTotal deals in database: {total:,}")
    
    # Count by contract term
    for term in [1, 3, 6, 12, 18, 24, 36]:
        response = supabase.table('mtn_business_deals').select('id', count='exact').eq('contract_term', term).execute()
        print(f"  {term} months: {response.count:,} deals")
    
    # Sample deals
    response = supabase.table('mtn_business_deals').select('*').limit(5).execute()
    print(f"\nSample deals:")
    for deal in response.data:
        print(f"  - {deal['deal_name']} | R{deal['monthly_price_incl_vat']}/mo")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Import MTN Business Deals to Supabase')
    parser.add_argument('--test', action='store_true', help='Test mode: import only 100 deals')
    parser.add_argument('--batch-size', type=int, default=100, help='Batch size (default: 100)')
    parser.add_argument('--verify-only', action='store_true', help='Only verify existing data')
    
    args = parser.parse_args()
    
    print("\n" + "="*80)
    print("MTN BUSINESS DEALS IMPORT")
    print("="*80)
    
    # Connect to Supabase
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("\n[ERROR] Supabase credentials not found in .env.local")
        print("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        return
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print(f"\n✓ Connected to Supabase")
    
    if args.verify_only:
        verify_import(supabase)
        return
    
    # Load JSON deals
    json_path = 'docs/products/01_ACTIVE_PRODUCTS/MTN Deals/Oct-2025/Helios and iLula Business Promos - Oct 2025 - Deals.json'
    print(f"\nLoading deals from: {json_path}")
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    deals = data['data']['Sheet1']['data']
    print(f"✓ Loaded {len(deals):,} deals from JSON")
    
    # Import
    imported, errors = import_deals(
        supabase, 
        deals, 
        batch_size=args.batch_size,
        test_mode=args.test
    )
    
    # Verify
    if imported > 0:
        verify_import(supabase)
    
    print("\n" + "="*80 + "\n")

if __name__ == '__main__':
    main()
