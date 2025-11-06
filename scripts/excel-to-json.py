#!/usr/bin/env python3
"""Convert Excel workbook to JSON format"""

import pandas as pd
import json
import sys
from pathlib import Path
from datetime import datetime
import numpy as np

def excel_to_json(excel_path, output_path=None):
    """Convert Excel file to JSON"""
    try:
        # Read Excel file
        xls = pd.ExcelFile(excel_path)
        
        print(f"Reading Excel file: {excel_path}")
        print(f"Found {len(xls.sheet_names)} sheets: {', '.join(xls.sheet_names)}")
        print()
        
        # Store all sheets data
        workbook_data = {}
        
        # Process each sheet
        for sheet_name in xls.sheet_names:
            print(f"Processing sheet: {sheet_name}")
            df = pd.read_excel(xls, sheet_name=sheet_name)
            
            # Show preview
            print(f"  Rows: {len(df)}, Columns: {len(df.columns)}")
            print(f"  Columns: {list(df.columns)}")
            
            # Convert to records (list of dictionaries)
            # Handle NaN values and dates
            df = df.fillna('')
            
            # Convert datetime columns to string
            for col in df.columns:
                if pd.api.types.is_datetime64_any_dtype(df[col]):
                    df[col] = df[col].apply(lambda x: x.strftime('%Y-%m-%d') if pd.notna(x) and x != '' else '')
            
            records = df.to_dict('records')
            
            workbook_data[sheet_name] = {
                'rows': len(df),
                'columns': list(df.columns),
                'data': records
            }
            
            print(f"  Converted {len(records)} rows")
            print()
        
        # Create output structure
        output = {
            'filename': Path(excel_path).name,
            'sheets': list(xls.sheet_names),
            'data': workbook_data
        }
        
        # Determine output path
        if not output_path:
            excel_file = Path(excel_path)
            output_path = excel_file.with_suffix('.json')
        
        # Write JSON
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        
        print(f"[SUCCESS] Converted to JSON: {output_path}")
        print(f"Total records: {sum(sheet['rows'] for sheet in workbook_data.values())}")
        
        return output_path
        
    except Exception as e:
        print(f"[ERROR] {e}", file=sys.stderr)
        raise

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python excel-to-json.py <excel_file> [output_json]")
        sys.exit(1)
    
    excel_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None
    
    excel_to_json(excel_path, output_path)
