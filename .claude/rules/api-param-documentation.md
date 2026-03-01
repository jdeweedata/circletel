# API Parameter Documentation Pattern

**Trigger**: Documenting API integrations, payment providers, or external services
**Source**: 3+ sessions (netcash-paynow, feasibility-api, partner-package-display)

## Pattern

When documenting API parameters, always include a "Wrong vs Correct" table showing common mistakes and the fix.

## Template

```markdown
## API Reference

### Correct Parameters

| Parameter | Purpose | Value |
|-----------|---------|-------|
| `param1` | Description | `example_value` |
| `param2` | Description | `example_value` |

### Common Mistakes (that cause [symptom])

| Wrong | Correct | Why |
|-------|---------|-----|
| `wrongParam=value` | `correctParam=value` | Explanation |
| `Amount=89900` (cents) | `p4=899.00` (Rands) | API expects decimal format |
```

## Example: NetCash Pay Now

```markdown
### Correct Parameters

| Parameter | Purpose | Value |
|-----------|---------|-------|
| `m1` | Service Key | `65251ca3-...` |
| `m2` | **PCI Vault Key** | `6940844b-...` |
| `p4` | Amount in RANDS | `899.00` |

### Common Mistakes (that cause R0.00)

| Wrong | Correct |
|-------|---------|
| `m4` for amount | `p4` for amount |
| `Amount=89900` (cents) | `p4=899.00` (Rands) |
| `m2=vendor_key` | `m2=pci_vault_key` |
```

## DO

- Include symptom in header ("that cause R0.00")
- Show parameter name AND format differences
- Add environment variable mapping
- Reference working implementation file

## DON'T

- Only document correct usage (mistakes are more valuable)
- Skip format differences (cents vs Rands, etc.)
- Assume parameter names are obvious

## Time Savings

~30-60 min per API integration by preventing:
- Trial-and-error parameter debugging
- Silent failures from wrong formats
- Repeated mistakes across team
