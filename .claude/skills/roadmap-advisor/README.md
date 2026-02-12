# Roadmap Advisor

Strategic feature planning skill for CircleTel.

## Quick Start

```bash
# Full platform audit
/roadmap full

# Quick top 10 recommendations
/roadmap quick

# Domain deep-dive
/roadmap billing
/roadmap customer
/roadmap network
```

## Commands

| Command | Duration | Description |
|---------|----------|-------------|
| `/roadmap full` | 15-30 min | Complete audit across all domains |
| `/roadmap quick` | 5-10 min | Top 10 prioritized recommendations |
| `/roadmap [domain]` | 10-15 min | Deep-dive on specific domain |
| `/roadmap status` | 2 min | Show in-progress specs |

## Available Domains

- `billing` - Invoicing, payments, dunning, reconciliation
- `customer` - Self-service, dashboard, support, communication
- `network` - Monitoring, diagnostics, SLA, uptime
- `operations` - Provisioning, activation, technician workflows
- `analytics` - Reporting, forecasting, churn prediction
- `partner` - Commission, onboarding, compliance
- `integration` - CRM, accounting, provider APIs

## Output

### Maturity Scorecard
Each domain scored against ISP industry standards (82 capabilities).

### Priority Tiers
1. **Critical** (This Quarter) - Must-haves with high impact
2. **High-Value** (Next Quarter) - Important improvements
3. **Strategic** (Future) - Long-term enhancements

### Quick Wins
2-3 items achievable in <1 week.

## RSI Integration

This skill learns from corrections:
- Corrections stored in `corrections/roadmap/`
- Rules extracted to `extracted-rules/`
- Metrics tracked via `stats-tracker`

## Files

```
roadmap-advisor/
├── SKILL.md                    # Main skill definition
├── README.md                   # This file
├── rubrics/                    # Evaluation criteria
│   ├── backend-services.md
│   ├── frontend-components.md
│   ├── integrations.md
│   ├── billing-system.md
│   └── customer-experience.md
├── benchmarks/                 # Industry standards
│   └── isp-industry-standard.md
├── templates/                  # Output formats
│   ├── full-audit-output.md
│   ├── quick-scan-output.md
│   └── domain-analysis-output.md
├── heuristics/                 # CircleTel patterns
│   ├── domain-detection.md
│   ├── maturity-assessment.md
│   ├── effort-calibration.md
│   └── load-bearing-code.md
├── extracted-rules/            # RSI learnings
└── corrections/                # RSI corrections
```

## Version

- **Version**: 1.0.0
- **Created**: 2026-02-12
- **Author**: CircleTel Engineering
