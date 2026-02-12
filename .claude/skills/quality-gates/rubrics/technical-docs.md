# Rubric: Technical Documentation

**Target**: API docs, architecture docs, implementation guides
**Critical Score**: 8/10 minimum
**Max Passes**: 2 (docs are iterative by nature)

## Criteria

| Criterion | Weight | Scoring Guide |
|-----------|--------|---------------|
| **Accuracy** | 30% | 10=100% correct; 5=Minor errors; 1=Misleading info |
| **Completeness** | 25% | 10=All sections present; 5=Missing examples; 1=Incomplete |
| **Clarity** | 20% | 10=Easy to follow; 5=Requires rereading; 1=Confusing |
| **Structure** | 15% | 10=Well-organized; 5=OK but could improve; 1=Disorganized |
| **Actionability** | 10% | 10=Can follow immediately; 5=Needs research; 1=Can't act on it |

## Documentation Types

### API Documentation
- Endpoint descriptions
- Request/response formats
- Authentication details
- Error codes

### Architecture Documentation
- System overview
- Component relationships
- Data flow
- Decision rationale

### Implementation Guides
- Step-by-step instructions
- Code examples
- Configuration details
- Troubleshooting

## Required Elements

### API Docs
- [ ] Endpoint URL and method
- [ ] Authentication requirements
- [ ] Request parameters (with types)
- [ ] Response format (with example)
- [ ] Error codes and meanings
- [ ] Code example (at least one language)

### Architecture Docs
- [ ] Purpose statement
- [ ] Component diagram or description
- [ ] Data flow explanation
- [ ] Key decisions and rationale
- [ ] Related files/systems

### Implementation Guides
- [ ] Prerequisites
- [ ] Step-by-step instructions
- [ ] Code examples (copy-paste ready)
- [ ] Expected outcomes
- [ ] Troubleshooting section

## Evaluation Prompt

```
Evaluate this technical documentation against the rubric:

[DOCUMENTATION CONTENT]

Score each criterion 1-10 with brief justification:
1. Accuracy (30%):
2. Completeness (25%):
3. Clarity (20%):
4. Structure (15%):
5. Actionability (10%):

Calculate weighted total.
List specific improvement suggestions.
Flag any technical inaccuracies.
```

## Example: High Quality API Doc (9.0/10)

```markdown
# POST /api/orders/create

Creates a new customer order.

## Authentication
Requires Bearer token in Authorization header.

## Request

```json
{
  "customerId": "cust_123",
  "packageId": "pkg_fiber_100",
  "installationAddress": {
    "street": "123 Main Road",
    "suburb": "Sandton",
    "city": "Johannesburg",
    "postalCode": "2196"
  }
}
```

## Response

### Success (201 Created)
```json
{
  "orderId": "ord_abc123",
  "status": "pending",
  "createdAt": "2026-02-12T10:30:00Z"
}
```

### Errors

| Code | Message | Cause |
|------|---------|-------|
| 400 | Invalid package | Package ID not found |
| 401 | Unauthorized | Missing or invalid token |
| 422 | Address not serviceable | No coverage at address |

## Example (TypeScript)

```typescript
const response = await fetch('/api/orders/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    customerId: 'cust_123',
    packageId: 'pkg_fiber_100',
    installationAddress: { ... }
  })
})
```
```

## Example: Low Quality (4.5/10)

```markdown
# Create Order

POST to orders endpoint with customer data.

Returns order or error.
```

**Issues**: No URL, no auth info, no request format, no examples, no error codes

## CircleTel-Specific Rules

1. **Location**: Technical docs go in `docs/` subdirectories
2. **Naming**: Use SCREAMING_SNAKE.md for doc files
3. **Code examples**: Always TypeScript, use CircleTel patterns
4. **References**: Link to related files with full paths
5. **YAML headers**: Add searchable metadata to architecture docs

## Quality Check Before Merge

```
DOC WRITTEN
     │
     ▼
QUALITY GATE (this rubric)
     │
     ├─── Score >= 8 ──► COMMIT
     │
     └─── Score < 8 ──► IMPROVE
```
