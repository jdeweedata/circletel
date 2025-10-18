#!/bin/bash

# MTN Session Refresh Script
# Quick reference for refreshing MTN SSO session

set -e

echo "======================================================================="
echo "MTN Session Refresh"
echo "======================================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Validate current session
echo -e "${YELLOW}Step 1: Validating current session...${NC}"
npx tsx scripts/validate-mtn-session.ts

read -p "Does session need refresh? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo -e "${GREEN}✅ Session is valid. No refresh needed.${NC}"
    exit 0
fi

# Step 2: Authenticate manually
echo ""
echo -e "${YELLOW}Step 2: Opening browser for manual authentication...${NC}"
echo "  1. Wait for browser to open"
echo "  2. Solve reCAPTCHA"
echo "  3. Click LOGIN"
echo "  4. Wait for success message"
echo ""
read -p "Press Enter to continue..."

npx tsx scripts/test-mtn-sso-auth.ts --manual

# Step 3: Export session
echo ""
echo -e "${YELLOW}Step 3: Exporting session to base64...${NC}"
npx tsx scripts/export-session-env.ts --output-only > session.txt
echo -e "${GREEN}✅ Session exported to session.txt${NC}"

# Step 4: Update Vercel
echo ""
echo -e "${YELLOW}Step 4: Updating Vercel environment variable...${NC}"
cat session.txt | vercel env rm MTN_SESSION production --yes || true
cat session.txt | vercel env add MTN_SESSION production
echo -e "${GREEN}✅ Vercel environment variable updated${NC}"

# Step 5: Update GitHub Secret (optional)
echo ""
read -p "Update GitHub Secret? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo -e "${YELLOW}Updating GitHub Secret...${NC}"
    gh secret set MTN_SESSION < session.txt
    echo -e "${GREEN}✅ GitHub Secret updated${NC}"
fi

# Step 6: Deploy
echo ""
read -p "Deploy to production now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo -e "${YELLOW}Deploying to production...${NC}"
    vercel --prod --yes
    echo -e "${GREEN}✅ Deployed to production${NC}"
fi

# Step 7: Test
echo ""
echo -e "${YELLOW}Step 7: Testing production API...${NC}"
read -p "Enter your production URL (or press Enter for default): " PROD_URL

if [ -z "$PROD_URL" ]; then
    PROD_URL="https://circletel-staging.vercel.app"
fi

echo "Testing auth endpoint..."
AUTH_RESULT=$(curl -s "$PROD_URL/api/mtn-wholesale/auth")
echo "$AUTH_RESULT" | grep -q '"authenticated":true' && echo -e "${GREEN}✅ Auth: Success${NC}" || echo -e "${RED}❌ Auth: Failed${NC}"

echo "Testing products endpoint..."
PRODUCTS_RESULT=$(curl -s "$PROD_URL/api/mtn-wholesale/products")
echo "$PRODUCTS_RESULT" | grep -q '"error_code":"200"' && echo -e "${GREEN}✅ Products: Success${NC}" || echo -e "${RED}❌ Products: Failed${NC}"

# Cleanup
echo ""
echo -e "${YELLOW}Cleaning up temporary files...${NC}"
rm -f session.txt
echo -e "${GREEN}✅ Cleanup complete${NC}"

echo ""
echo "======================================================================="
echo -e "${GREEN}✅ MTN Session Refresh Complete!${NC}"
echo "======================================================================="
echo ""
echo "Next validation: GitHub Actions (every 4 hours)"
echo "Workflow: https://github.com/jdeweedata/circletel/actions/workflows/validate-mtn-session.yml"
echo ""
