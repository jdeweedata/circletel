#!/usr/bin/env python3
"""
Token usage analysis utility for Claude Code context management.
Estimates token usage of files and provides recommendations for context optimization.
"""

import sys
import os
import argparse
from pathlib import Path
from typing import List, Tuple, Dict
import json


def estimate_tokens(text: str) -> int:
    """
    Estimate token count using a simple heuristic.
    Claude typically uses ~4 characters per token for English text.
    This is an approximation - actual tokenization varies.
    """
    return len(text) // 4


def analyze_file(filepath: Path) -> Dict:
    """Analyze a single file and return token statistics."""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        tokens = estimate_tokens(content)
        lines = content.count('\n') + 1
        
        return {
            'path': str(filepath),
            'tokens': tokens,
            'lines': lines,
            'size': len(content),
            'readable': True
        }
    except Exception as e:
        return {
            'path': str(filepath),
            'tokens': 0,
            'lines': 0,
            'size': 0,
            'readable': False,
            'error': str(e)
        }


def analyze_directory(directory: Path, exclude_patterns: List[str] = None) -> List[Dict]:
    """Recursively analyze all files in a directory."""
    if exclude_patterns is None:
        exclude_patterns = [
            'node_modules', '.git', '__pycache__', '.venv', 'venv',
            '.env', 'dist', 'build', '.next', 'coverage', '.pytest_cache'
        ]
    
    results = []
    
    for item in directory.rglob('*'):
        # Skip excluded patterns
        if any(pattern in item.parts for pattern in exclude_patterns):
            continue
        
        # Only analyze files
        if item.is_file():
            results.append(analyze_file(item))
    
    return results


def format_size(num_bytes: int) -> str:
    """Format bytes into human-readable format."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if num_bytes < 1024.0:
            return f"{num_bytes:.1f}{unit}"
        num_bytes /= 1024.0
    return f"{num_bytes:.1f}TB"


def print_summary(results: List[Dict], budget: int = 190000):
    """Print summary statistics and recommendations."""
    total_tokens = sum(r['tokens'] for r in results if r['readable'])
    total_files = len([r for r in results if r['readable']])
    unreadable = len([r for r in results if not r['readable']])
    
    # Sort by token count
    sorted_results = sorted(
        [r for r in results if r['readable']],
        key=lambda x: x['tokens'],
        reverse=True
    )
    
    print("\n" + "="*70)
    print("TOKEN USAGE ANALYSIS")
    print("="*70)
    print(f"\nTotal files analyzed: {total_files}")
    if unreadable > 0:
        print(f"Unreadable files: {unreadable}")
    print(f"Total estimated tokens: {total_tokens:,}")
    print(f"Token budget: {budget:,}")
    print(f"Usage: {(total_tokens/budget)*100:.1f}%")
    print(f"Remaining: {budget - total_tokens:,} tokens")
    
    if total_tokens > budget:
        print(f"\n⚠️  WARNING: Exceeds budget by {total_tokens - budget:,} tokens!")
    elif total_tokens > budget * 0.8:
        print(f"\n⚠️  WARNING: Using {(total_tokens/budget)*100:.1f}% of budget")
    
    print("\n" + "-"*70)
    print("TOP 10 LARGEST FILES")
    print("-"*70)
    print(f"{'Tokens':<10} {'Lines':<8} {'Size':<10} {'Path'}")
    print("-"*70)
    
    for result in sorted_results[:10]:
        print(f"{result['tokens']:<10,} {result['lines']:<8} "
              f"{format_size(result['size']):<10} {result['path']}")
    
    # Provide recommendations
    print("\n" + "-"*70)
    print("RECOMMENDATIONS")
    print("-"*70)
    
    large_files = [r for r in sorted_results if r['tokens'] > 5000]
    if large_files:
        print(f"\n📊 {len(large_files)} files exceed 5,000 tokens:")
        print("   Consider splitting or summarizing these files")
        for r in large_files[:5]:
            print(f"   - {r['path']} ({r['tokens']:,} tokens)")
    
    if total_tokens > budget * 0.7:
        print("\n🎯 Context optimization suggestions:")
        print("   - Use focused queries to load only relevant files")
        print("   - Consider splitting large files into smaller modules")
        print("   - Use .view() with line ranges for large files")
        print("   - Exclude generated files and dependencies")
    
    print("\n" + "="*70 + "\n")


def main():
    parser = argparse.ArgumentParser(
        description='Analyze token usage for Claude Code context management'
    )
    parser.add_argument(
        'path',
        nargs='?',
        default='.',
        help='File or directory to analyze (default: current directory)'
    )
    parser.add_argument(
        '--budget',
        type=int,
        default=190000,
        help='Token budget to compare against (default: 190000)'
    )
    parser.add_argument(
        '--json',
        action='store_true',
        help='Output results as JSON'
    )
    parser.add_argument(
        '--exclude',
        nargs='*',
        help='Additional patterns to exclude'
    )
    
    args = parser.parse_args()
    path = Path(args.path)
    
    if not path.exists():
        print(f"Error: Path '{path}' does not exist", file=sys.stderr)
        sys.exit(1)
    
    # Analyze
    if path.is_file():
        results = [analyze_file(path)]
    else:
        exclude_patterns = args.exclude or []
        results = analyze_directory(path, exclude_patterns)
    
    # Output
    if args.json:
        print(json.dumps({
            'results': results,
            'summary': {
                'total_tokens': sum(r['tokens'] for r in results if r['readable']),
                'total_files': len([r for r in results if r['readable']]),
                'budget': args.budget
            }
        }, indent=2))
    else:
        print_summary(results, args.budget)


if __name__ == '__main__':
    main()
