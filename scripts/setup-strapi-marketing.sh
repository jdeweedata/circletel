#!/bin/bash

# CircleTel Marketing CMS Setup Script
# This script helps set up Strapi with all marketing content types

echo "🚀 CircleTel Marketing CMS Setup"
echo "================================"
echo ""

# Check if we're in the right directory
if [ ! -d "strapi-cms" ]; then
    echo "❌ Error: strapi-cms directory not found"
    echo "Please run this script from the project root"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "Please install Node.js 18 or higher"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Navigate to Strapi directory
cd strapi-cms

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Strapi dependencies..."
    npm install
    echo ""
fi

echo "🏗️  Content types have been created:"
echo "  ✓ Promotion"
echo "  ✓ Marketing Page"
echo "  ✓ Campaign"
echo "  ✓ Hero Section"
echo "  ✓ Promo Grid Section"
echo "  ✓ Feature List Section"
echo "  ✓ Text Content Section"
echo "  ✓ CTA Banner Section"
echo "  ✓ Image with Text Section"
echo ""

echo "🎯 Next Steps:"
echo ""
echo "1. Start Strapi CMS:"
echo "   cd strapi-cms"
echo "   npm run develop"
echo ""
echo "2. Open admin panel: http://localhost:1337/admin"
echo ""
echo "3. Create your first admin user (if not already done)"
echo ""
echo "4. Set up Marketing Manager role:"
echo "   - Go to Settings → Roles"
echo "   - Create 'Marketing Manager' role"
echo "   - Grant permissions for Promotion, Marketing Page, Campaign"
echo "   - See: strapi-cms/config/rbac-marketing.md"
echo ""
echo "5. Create marketing team users:"
echo "   - Go to Settings → Users"
echo "   - Add users with 'Marketing Manager' role"
echo ""
echo "6. Start creating content!"
echo "   - Read: docs/marketing/quick-start-guide.md"
echo ""
echo "📚 Documentation:"
echo "   - Full guide: docs/marketing/README.md"
echo "   - Quick start: docs/marketing/quick-start-guide.md"
echo "   - RBAC setup: strapi-cms/config/rbac-marketing.md"
echo ""
echo "✨ Setup complete! Happy marketing!"