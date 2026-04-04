#!/bin/bash
# CircleTel Cron Job Installer
# Run on VPS as root after CircleTel container is verified live.
#
# Prerequisites:
#   1. Create /root/.cron-env (chmod 600) with:
#      CRON_SECRET=your_secret_here
#      APP_URL=https://www.circletel.co.za
#
#   2. Create log file:
#      touch /var/log/circletel-cron.log && chmod 644 /var/log/circletel-cron.log
#
# Usage: bash scripts/install-crontab.sh

set -e

CRON_ENV_FILE="/root/.cron-env"
LOG_FILE="/var/log/circletel-cron.log"

# Verify prereqs
if [ ! -f "$CRON_ENV_FILE" ]; then
  echo "ERROR: $CRON_ENV_FILE not found. Create it first:"
  echo "  echo 'CRON_SECRET=your_secret' > $CRON_ENV_FILE"
  echo "  echo 'APP_URL=https://www.circletel.co.za' >> $CRON_ENV_FILE"
  echo "  chmod 600 $CRON_ENV_FILE"
  exit 1
fi

# Create log file if missing
touch "$LOG_FILE" && chmod 644 "$LOG_FILE"

echo "Installing CircleTel cron jobs..."

crontab - << 'CRONTAB'
# CircleTel Cron Jobs — All times UTC
# Logs to /var/log/circletel-cron.log

# Daily: Generate invoices (midnight)
0 0 * * *     . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/generate-invoices >> /var/log/circletel-cron.log 2>&1

# Daily: Expire deals (2am)
0 2 * * *     . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/expire-deals >> /var/log/circletel-cron.log 2>&1

# Daily: Price changes (2am)
0 2 * * *     . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/price-changes >> /var/log/circletel-cron.log 2>&1

# Daily: Zoho CRM sync (midnight)
0 0 * * *     . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/zoho-sync >> /var/log/circletel-cron.log 2>&1

# Every 30 min: Integration health check
*/30 * * * *  . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/integrations-health-check >> /var/log/circletel-cron.log 2>&1

# Weekly: Cleanup webhook logs (Sunday 3am)
0 3 * * 0     . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/cleanup-webhook-logs >> /var/log/circletel-cron.log 2>&1

# Daily: Competitor scrape (1am)
0 1 * * *     . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/competitor-scrape >> /var/log/circletel-cron.log 2>&1

# Daily: Payment reconciliation (7am)
0 7 * * *     . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/payment-reconciliation >> /var/log/circletel-cron.log 2>&1

# Every 4 hours: Payment sync retry
0 */4 * * *   . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/payment-sync-retry >> /var/log/circletel-cron.log 2>&1

# Every 4 hours: Payment sync monitor
0 2,6,10,14,18,22 * * * . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/payment-sync-monitor >> /var/log/circletel-cron.log 2>&1

# Daily: Invoice SMS reminders (8am)
0 8 * * *     . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/invoice-sms-reminders >> /var/log/circletel-cron.log 2>&1

# Daily: AR snapshot (9pm)
0 21 * * *    . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/ar-snapshot >> /var/log/circletel-cron.log 2>&1

# Daily: Submit debit orders (6am)
0 6 * * *     . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/submit-debit-orders >> /var/log/circletel-cron.log 2>&1

# Daily: Submit credit card debit orders (6am)
0 6 * * *     . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/submit-cc-debit-orders >> /var/log/circletel-cron.log 2>&1

# Daily: Process billing day (5am)
0 5 * * *     . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/process-billing-day >> /var/log/circletel-cron.log 2>&1

# Daily: Stats snapshot (1am)
0 1 * * *     . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/stats-snapshot >> /var/log/circletel-cron.log 2>&1

# Every 6 hours: Diagnostics health check
0 0,6,12,18 * * * . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/diagnostics-health-check >> /var/log/circletel-cron.log 2>&1

# Monthly: Generate monthly invoices (1st of month, 4am)
0 4 1 * *     . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/generate-monthly-invoices >> /var/log/circletel-cron.log 2>&1

# Monthly: Generate invoices 25th (25th of month, 4am)
0 4 25 * *    . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/generate-invoices-25th >> /var/log/circletel-cron.log 2>&1

# Daily: PayNow reconciliation (6am)
0 6 * * *     . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/paynow-reconciliation >> /var/log/circletel-cron.log 2>&1

# Daily: Zoho Books sync (3am)
0 3 * * *     . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/zoho-books-sync >> /var/log/circletel-cron.log 2>&1

# Every 15 min: Zoho Books retry
*/15 * * * *  . /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/zoho-books-retry >> /var/log/circletel-cron.log 2>&1
CRONTAB

echo "Cron jobs installed. Verify with: crontab -l"
echo "Log file: $LOG_FILE"

# Add logrotate config
cat > /etc/logrotate.d/circletel-cron << 'EOF'
/var/log/circletel-cron.log {
    weekly
    rotate 4
    compress
    missingok
    notifempty
}
EOF

echo "Logrotate configured for $LOG_FILE (weekly, 4 rotations)"
