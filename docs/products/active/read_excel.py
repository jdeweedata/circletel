import pandas as pd
import sys

try:
    # Read all sheets from the Excel file
    df = pd.read_excel('Copy of Circle Tel Products - 08 October 2025.xlsx', sheet_name=None)
    
    for name, sheet_df in df.items():
        print(f'=== Sheet: {name} ===')
        print(f'Shape: {sheet_df.shape}')
        print(f'Columns: {list(sheet_df.columns)}')
        print('\nData:')
        print(sheet_df.to_string())
        print('\n' + '='*80 + '\n')
        
except Exception as e:
    print(f"Error reading Excel file: {e}")
    sys.exit(1)
