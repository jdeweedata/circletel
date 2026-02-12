# Rubric: Customer Notification

**Target**: Service updates, account alerts, system notifications
**Critical Score**: 8/10 minimum
**Max Passes**: 3

## Criteria

| Criterion | Weight | Scoring Guide |
|-----------|--------|---------------|
| **Clarity** | 30% | 10=Instantly understood; 5=Requires re-reading; 1=Confusing |
| **Relevance** | 20% | 10=Directly affects customer; 5=Marginally relevant; 1=Spam-like |
| **Urgency** | 20% | 10=Appropriate urgency level; 5=Over/understated; 1=Misleading |
| **Action** | 15% | 10=Clear next steps if needed; 5=Vague guidance; 1=No direction |
| **Tone** | 15% | 10=Reassuring + professional; 5=Cold or alarming; 1=Inappropriate |

## Notification Types

### Service Updates
- Scheduled maintenance
- Service upgrades
- Coverage changes
- Package modifications

### Account Alerts
- Payment received
- Payment failed
- Usage warnings
- Account changes

### System Notifications
- Security alerts
- Feature announcements
- Policy updates

## Required Elements

Every notification MUST include:
- [ ] Clear subject line indicating notification type
- [ ] Customer name (when available)
- [ ] What's happening (brief, clear)
- [ ] When (if time-sensitive)
- [ ] What customer needs to do (if anything)
- [ ] Contact for help

## Evaluation Prompt

```
Evaluate this customer notification against the rubric:

[NOTIFICATION CONTENT]

Score each criterion 1-10 with brief justification:
1. Clarity (30%):
2. Relevance (20%):
3. Urgency (20%):
4. Action (15%):
5. Tone (15%):

Calculate weighted total.
List specific improvement suggestions.
```

## Example: High Quality (9.0/10)

```
Subject: Scheduled Maintenance - February 15, 2026

Dear Sarah,

We're upgrading our network to give you faster speeds!

What's happening:
Brief service interruption on February 15, 2026 from 02:00-04:00 SAST

What you'll experience:
Internet may be unavailable for up to 2 hours during this window

What you need to do:
Nothing! Service will restore automatically.

After the upgrade:
Your connection speed will improve by approximately 20%

Questions? WhatsApp us at 082 487 3900.

Thank you for your patience!
CircleTel Team
```

## Example: Low Quality (3.5/10)

```
Subject: URGENT!!! READ NOW!!!

SYSTEM MAINTENANCE HAPPENING SOON

Your internet might stop working. We don't know when exactly.

Sorry for the inconvenience.
```

**Issues**: Alarming tone, vague timing, no specifics, no contact info

## Urgency Calibration

| Situation | Tone |
|-----------|------|
| Informational (FYI) | Casual, brief |
| Action Required | Clear, direct |
| Time-Sensitive | Prominent deadline, but not alarming |
| Critical (outage) | Calm, reassuring, specific |

## CircleTel-Specific Rules

1. **Never alarm unnecessarily**: Even outages should be communicated calmly
2. **Always provide timeline**: Customers want to know "when"
3. **Include WhatsApp**: 082 487 3900 for support
4. **Use SAST**: Always specify timezone for times
5. **Positive framing**: "Upgrading to serve you better" not "System broken"
