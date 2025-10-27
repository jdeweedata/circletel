#!/bin/bash

# ============================================================================
# Setup Vercel Environment Variables for Staging
# ============================================================================
# This script sets up all required NetCash payment environment variables
# for the circletel-staging Vercel project (Preview/Staging environment)
# ============================================================================

PROJECT_NAME="circletel-staging"
STAGING_URL="https://circletel-staging.vercel.app"

echo "=========================================="
echo "Setting up Vercel Environment Variables"
echo "Project: $PROJECT_NAME"
echo "Environment: Preview (Staging)"
echo "=========================================="
echo ""

# Function to add environment variable
add_env_var() {
    local key=$1
    local value=$2
    local env=$3

    echo "Adding: $key"
    vercel env add "$key" "$env" --force <<EOF
$value
EOF

    if [ $? -eq 0 ]; then
        echo "✅ Successfully added $key"
    else
        echo "❌ Failed to add $key"
    fi
    echo ""
}

# ============================================================================
# 1. App URL
# ============================================================================
echo "Step 1: Setting App URL..."
add_env_var "NEXT_PUBLIC_APP_URL" "$STAGING_URL" "preview"

# ============================================================================
# 2. Payment Success/Cancel URLs
# ============================================================================
echo "Step 2: Setting Payment Redirect URLs..."
add_env_var "NEXT_PUBLIC_PAYMENT_SUCCESS_URL" "${STAGING_URL}/order/confirmation" "preview"
add_env_var "NEXT_PUBLIC_PAYMENT_CANCEL_URL" "${STAGING_URL}/order/payment" "preview"

# ============================================================================
# 3. NetCash Sandbox Configuration (for staging)
# ============================================================================
echo "Step 3: Setting NetCash Sandbox Configuration..."
add_env_var "NEXT_PUBLIC_NETCASH_SERVICE_KEY" "7928c6de-219f-4b75-9408-ea0e53be8c87" "preview"
add_env_var "NETCASH_MERCHANT_ID" "52340889417" "preview"
add_env_var "NETCASH_PAYMENT_URL" "https://sandbox.netcash.co.za/paynow/process" "preview"
add_env_var "NETCASH_WEBHOOK_SECRET" "CtLE3LsjW5B76VB74goex++4poBSt/4MVX1tZyQHvEc=" "preview"

echo ""
echo "=========================================="
echo "✅ Environment Variables Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Push a new commit to trigger a deployment:"
echo "   git add ."
echo "   git commit -m 'Update environment variables'"
echo "   git push"
echo ""
echo "2. Or trigger a manual redeploy in Vercel dashboard"
echo ""
echo "3. Test the payment flow at: $STAGING_URL"
echo ""
