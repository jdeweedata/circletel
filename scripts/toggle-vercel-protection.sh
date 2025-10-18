#!/bin/bash
# Toggle Vercel Deployment Protection
# Usage:
#   ./toggle-vercel-protection.sh disable
#   ./toggle-vercel-protection.sh enable

PROJECT_ID="prj_QfDHiOnpJ5MIEB3NgTBcprBNkhvN"
TEAM_ID="team_FTCtPsYMEIizj3T0kT24SQAz"
VERCEL_TOKEN="${VERCEL_TOKEN:-}"

if [ -z "$VERCEL_TOKEN" ]; then
  echo "❌ Error: VERCEL_TOKEN environment variable not set"
  echo ""
  echo "Get your token from: https://vercel.com/account/tokens"
  echo ""
  echo "Then run:"
  echo "  export VERCEL_TOKEN=your_token_here"
  echo "  ./toggle-vercel-protection.sh disable"
  exit 1
fi

ACTION="${1:-status}"

case $ACTION in
  disable)
    echo "🔓 Disabling deployment protection..."
    curl -X PATCH "https://api.vercel.com/v1/projects/${PROJECT_ID}" \
      -H "Authorization: Bearer ${VERCEL_TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{
        "protection": {
          "deploymentType": "none"
        }
      }'
    echo ""
    echo "✅ Protection disabled"
    ;;

  enable)
    echo "🔒 Enabling deployment protection..."
    curl -X PATCH "https://api.vercel.com/v1/projects/${PROJECT_ID}" \
      -H "Authorization: Bearer ${VERCEL_TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{
        "protection": {
          "deploymentType": "standard"
        }
      }'
    echo ""
    echo "✅ Protection enabled"
    ;;

  status)
    echo "📊 Checking deployment protection status..."
    curl -s "https://api.vercel.com/v9/projects/${PROJECT_ID}?teamId=${TEAM_ID}" \
      -H "Authorization: Bearer ${VERCEL_TOKEN}" \
      | grep -i "protection" || echo "Could not fetch status"
    ;;

  *)
    echo "Usage: $0 {disable|enable|status}"
    exit 1
    ;;
esac
