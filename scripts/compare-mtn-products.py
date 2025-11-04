#!/usr/bin/env python3
"""
Compare MTN products from JSON file with Supabase database
"""

import json
import os
from collections import defaultdict
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv('.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

def load_json_deals():
    """Load deals from JSON file"""
    json_path = 'docs/products/01_ACTIVE_PRODUCTS/MTN Deals/Oct-2025/Helios and iLula Business Promos - Oct 2025 - Deals.json'
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    return data['data']['Sheet1']['data']

def analyze_json_deals(deals):
    """Analyze JSON deals structure"""
    print("=" * 80)
    print("MTN DEALS JSON FILE ANALYSIS")
    print("=" * 80)
    print(f"\nTotal Deals: {len(deals):,}")
    
    # Group by Price Plan
    price_plans = defaultdict(int)
    contract_terms = defaultdict(int)
    devices = defaultdict(int)
    data_bundles = defaultdict(int)
    
    total_monthly_prices = []
    total_installation_prices = []
    
    for deal in deals:
        price_plans[deal['Price Plan']] += 1
        contract_terms[deal['Contract Term']] += 1
        devices[deal['OEM and Device']] += 1
        data_bundles[deal['Total Data']] += 1
        
        total_monthly_prices.append(deal['Total Subscription Incl Vat'])
        total_installation_prices.append(deal['Once-off Pay-in (incl VAT)'])
    
    print(f"\n{'='*80}")
    print("PRICE PLANS (Top 20)")
    print(f"{'='*80}")
    for plan, count in sorted(price_plans.items(), key=lambda x: x[1], reverse=True)[:20]:
        print(f"  {plan:50s} {count:>6,} deals")
    
    print(f"\n{'='*80}")
    print("CONTRACT TERMS")
    print(f"{'='*80}")
    for term, count in sorted(contract_terms.items()):
        print(f"  {term} months: {count:,} deals")
    
    print(f"\n{'='*80}")
    print("DATA BUNDLES (Top 15)")
    print(f"{'='*80}")
    for data, count in sorted(data_bundles.items(), key=lambda x: x[1], reverse=True)[:15]:
        print(f"  {data:20s} {count:>6,} deals")
    
    print(f"\n{'='*80}")
    print("DEVICES (Top 20)")
    print(f"{'='*80}")
    for device, count in sorted(devices.items(), key=lambda x: x[1], reverse=True)[:20]:
        print(f"  {device:40s} {count:>6,} deals")
    
    print(f"\n{'='*80}")
    print("PRICING SUMMARY")
    print(f"{'='*80}")
    print(f"  Monthly Price Range: R {min(total_monthly_prices):.2f} - R {max(total_monthly_prices):,.2f}")
    print(f"  Average Monthly Price: R {sum(total_monthly_prices)/len(total_monthly_prices):,.2f}")
    print(f"  Installation Price Range: R {min(total_installation_prices):.2f} - R {max(total_installation_prices):,.2f}")
    
    return {
        'price_plans': price_plans,
        'devices': devices,
        'data_bundles': data_bundles
    }

def get_supabase_mtn_products(supabase: Client):
    """Get MTN products from Supabase"""
    print(f"\n{'='*80}")
    print("SUPABASE DATABASE - MTN PRODUCTS")
    print(f"{'='*80}")
    
    # Get all MTN products
    response = supabase.table('service_packages').select('*').ilike('name', '%MTN%').execute()
    
    mtn_products = response.data
    print(f"\nTotal MTN Products in Database: {len(mtn_products)}")
    
    if mtn_products:
        print(f"\n{'='*80}")
        print("MTN PRODUCTS IN DATABASE")
        print(f"{'='*80}")
        for product in mtn_products[:20]:  # Show first 20
            print(f"  {product['name']:50s} | {product['service_type']:15s} | R {product['price']:>8,.2f}/mo")
    
    return mtn_products

def compare_products(json_deals, db_products):
    """Compare JSON deals with database products"""
    print(f"\n{'='*80}")
    print("COMPARISON ANALYSIS")
    print(f"{'='*80}")
    
    # Extract unique price plans from JSON
    json_price_plans = set(deal['Price Plan'] for deal in json_deals)
    
    # Extract product names from database
    db_product_names = set(product['name'] for product in db_products)
    
    print(f"\nUnique Price Plans in JSON: {len(json_price_plans)}")
    print(f"Unique Products in Database: {len(db_product_names)}")
    
    # Check for matches
    # This is tricky because naming might not match exactly
    print(f"\n{'='*80}")
    print("SAMPLE PRICE PLANS FROM JSON (First 20)")
    print(f"{'='*80}")
    for i, plan in enumerate(sorted(json_price_plans)[:20], 1):
        print(f"  {i:2d}. {plan}")
    
    print(f"\n{'='*80}")
    print("RECOMMENDATION")
    print(f"{'='*80}")
    print("""
These are MTN BUSINESS DEALS with devices bundled (Oppo, Samsung, etc.)
They are NOT the same as standalone service packages in the database.

Database products (service_packages) are:
  - Standalone connectivity services (Fibre, LTE, 5G)
  - No device bundles
  - Monthly recurring services

JSON deals are:
  - Device + Service bundles (e.g., Oppo Reno 14 5G + Made For Business SM)
  - Contract-based (12/24/36 months)
  - Once-off payment for devices
  - Different pricing structure

SUGGESTED ACTION:
1. Create a separate table: 'mtn_business_deals' or 'device_bundles'
2. Import these 17,464 deals as device+service bundles
3. Link to service_packages via price plan/tariff if needed
4. Use for B2B quotes where customers want devices + connectivity

DO NOT mix these with standalone service packages in service_packages table.
    """)

def main():
    print("\n" + "="*80)
    print("MTN PRODUCTS COMPARISON: JSON FILE vs SUPABASE DATABASE")
    print("="*80)
    
    # Load JSON deals
    deals = load_json_deals()
    
    # Analyze JSON structure
    json_analysis = analyze_json_deals(deals)
    
    # Connect to Supabase
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("\n[ERROR] Supabase credentials not found in .env.local")
        print("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        return
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Get database products
    db_products = get_supabase_mtn_products(supabase)
    
    # Compare
    compare_products(deals, db_products)
    
    print("\n" + "="*80)
    print("ANALYSIS COMPLETE")
    print("="*80 + "\n")

if __name__ == '__main__':
    main()
