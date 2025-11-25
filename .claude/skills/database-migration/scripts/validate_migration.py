#!/usr/bin/env python3
"""
Validate a Supabase migration file for common issues.
Usage: python validate_migration.py path/to/migration.sql
"""

import sys
import re
from pathlib import Path
from typing import List, Tuple


class MigrationValidator:
    """Validates Supabase migration files for common issues."""

    def __init__(self, filepath: str):
        self.filepath = Path(filepath)
        self.content = ""
        self.warnings: List[str] = []
        self.errors: List[str] = []

    def validate(self) -> Tuple[bool, List[str], List[str]]:
        """
        Validate the migration file.

        Returns:
            Tuple of (is_valid, warnings, errors)
        """
        if not self.filepath.exists():
            self.errors.append(f"File not found: {self.filepath}")
            return False, self.warnings, self.errors

        # Read file content
        try:
            with open(self.filepath, 'r', encoding='utf-8') as f:
                self.content = f.read()
        except Exception as e:
            self.errors.append(f"Error reading file: {e}")
            return False, self.warnings, self.errors

        # Run validation checks
        self._check_filename()
        self._check_syntax()
        self._check_rls()
        self._check_indexes()
        self._check_foreign_keys()
        self._check_timestamps()
        self._check_if_not_exists()
        self._check_comments()

        is_valid = len(self.errors) == 0
        return is_valid, self.warnings, self.errors

    def _check_filename(self):
        """Check if filename follows naming convention."""
        pattern = r'^\d{14}_[a-z0-9_]+\.sql$'
        if not re.match(pattern, self.filepath.name):
            self.errors.append(
                f"Filename '{self.filepath.name}' doesn't match pattern YYYYMMDDHHMMSS_description.sql"
            )

    def _check_syntax(self):
        """Check for basic SQL syntax issues."""
        # Check for common syntax errors
        if self.content.strip() == "":
            self.errors.append("Migration file is empty")

        # Check for unterminated strings
        single_quotes = self.content.count("'")
        if single_quotes % 2 != 0:
            self.warnings.append("Possible unterminated string (odd number of single quotes)")

    def _check_rls(self):
        """Check for RLS policies."""
        # Check if tables are created
        create_table_pattern = r'CREATE TABLE.*?public\.(\w+)'
        tables = re.findall(create_table_pattern, self.content, re.IGNORECASE | re.DOTALL)

        if not tables:
            return  # No tables created, skip RLS check

        # Check if RLS is enabled
        rls_pattern = r'ALTER TABLE.*?ENABLE ROW LEVEL SECURITY'
        if not re.search(rls_pattern, self.content, re.IGNORECASE):
            self.warnings.append(
                "No 'ENABLE ROW LEVEL SECURITY' found. Consider enabling RLS for user tables."
            )

        # Check for service role policy
        service_role_pattern = r"service_role"
        if not re.search(service_role_pattern, self.content, re.IGNORECASE):
            self.warnings.append(
                "No service_role policy found. API routes require service role access."
            )

    def _check_indexes(self):
        """Check for indexes on foreign keys."""
        # Check if foreign keys exist
        fk_pattern = r'FOREIGN KEY\s*\((\w+)\)'
        foreign_keys = re.findall(fk_pattern, self.content, re.IGNORECASE)

        if not foreign_keys:
            return  # No foreign keys, skip index check

        # Check if indexes exist for foreign keys
        for fk_column in foreign_keys:
            index_pattern = rf'CREATE INDEX.*?\({fk_column}\)'
            if not re.search(index_pattern, self.content, re.IGNORECASE):
                self.warnings.append(
                    f"Consider adding index for foreign key column: {fk_column}"
                )

    def _check_foreign_keys(self):
        """Check foreign key constraints."""
        # Check for ON DELETE behavior
        fk_pattern = r'FOREIGN KEY.*?REFERENCES'
        fks = re.findall(fk_pattern, self.content, re.IGNORECASE | re.DOTALL)

        for fk in fks:
            if 'ON DELETE' not in fk.upper():
                self.warnings.append(
                    f"Foreign key missing ON DELETE behavior: {fk[:50]}..."
                )

    def _check_timestamps(self):
        """Check for created_at and updated_at columns."""
        create_table_pattern = r'CREATE TABLE.*?public\.(\w+)\s*\((.*?)\);'
        tables = re.findall(create_table_pattern, self.content, re.IGNORECASE | re.DOTALL)

        for table_name, columns in tables:
            if 'created_at' not in columns.lower():
                self.warnings.append(
                    f"Table '{table_name}' missing created_at timestamp column"
                )
            if 'updated_at' not in columns.lower():
                self.warnings.append(
                    f"Table '{table_name}' missing updated_at timestamp column"
                )

    def _check_if_not_exists(self):
        """Check for IF NOT EXISTS clauses."""
        # Check CREATE TABLE
        create_table_pattern = r'CREATE TABLE\s+(?!IF NOT EXISTS)'
        if re.search(create_table_pattern, self.content, re.IGNORECASE):
            self.warnings.append(
                "Consider using 'CREATE TABLE IF NOT EXISTS' for idempotency"
            )

        # Check CREATE INDEX
        create_index_pattern = r'CREATE INDEX\s+(?!IF NOT EXISTS)'
        if re.search(create_index_pattern, self.content, re.IGNORECASE):
            self.warnings.append(
                "Consider using 'CREATE INDEX IF NOT EXISTS' for idempotency"
            )

    def _check_comments(self):
        """Check for table/column comments."""
        create_table_pattern = r'CREATE TABLE.*?public\.(\w+)'
        tables = re.findall(create_table_pattern, self.content, re.IGNORECASE)

        if tables and 'COMMENT ON TABLE' not in self.content.upper():
            self.warnings.append(
                "Consider adding COMMENT ON TABLE for documentation"
            )


def main():
    if len(sys.argv) < 2:
        print("Usage: python validate_migration.py path/to/migration.sql")
        print("\nExample:")
        print("  python validate_migration.py supabase/migrations/20251108120000_create_table.sql")
        sys.exit(1)

    filepath = sys.argv[1]
    validator = MigrationValidator(filepath)

    print(f"[VALIDATING] migration: {filepath}")
    print("=" * 70)

    is_valid, warnings, errors = validator.validate()

    # Print errors
    if errors:
        print(f"\n[ERRORS] ({len(errors)}):")
        for i, error in enumerate(errors, 1):
            print(f"  {i}. {error}")

    # Print warnings
    if warnings:
        print(f"\n[WARNINGS] ({len(warnings)}):")
        for i, warning in enumerate(warnings, 1):
            print(f"  {i}. {warning}")

    # Print result
    print("\n" + "=" * 70)
    if is_valid:
        if warnings:
            print("[VALID] Migration is valid (with warnings)")
            print("\nRecommendation: Review warnings before deploying")
        else:
            print("[VALID] Migration is valid")
            print("\nNext steps:")
            print("  1. Test locally: npx supabase db reset")
            print("  2. Apply migration: npx supabase migration up")
            print("  3. Verify: npx supabase db dump --schema public")
    else:
        print("[ERROR] Migration has errors - please fix before deploying")
        sys.exit(1)


if __name__ == "__main__":
    main()
