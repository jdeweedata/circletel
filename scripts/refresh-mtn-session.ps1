# MTN Session Refresh Script (PowerShell)
# Quick reference for refreshing MTN SSO session on Windows

Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host "MTN Session Refresh" -ForegroundColor Cyan
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Validate current session
Write-Host "Step 1: Validating current session..." -ForegroundColor Yellow
npx tsx scripts/validate-mtn-session.ts

$refresh = Read-Host "Does session need refresh? (y/n)"
if ($refresh -ne "y") {
    Write-Host "✅ Session is valid. No refresh needed." -ForegroundColor Green
    exit 0
}

# Step 2: Authenticate manually
Write-Host ""
Write-Host "Step 2: Opening browser for manual authentication..." -ForegroundColor Yellow
Write-Host "  1. Wait for browser to open"
Write-Host "  2. Solve reCAPTCHA"
Write-Host "  3. Click LOGIN"
Write-Host "  4. Wait for success message"
Write-Host ""
Read-Host "Press Enter to continue..."

npx tsx scripts/test-mtn-sso-auth.ts --manual

# Step 3: Export session
Write-Host ""
Write-Host "Step 3: Exporting session to base64..." -ForegroundColor Yellow
npx tsx scripts/export-session-env.ts --output-only | Out-File -FilePath session.txt -Encoding UTF8
Write-Host "✅ Session exported to session.txt" -ForegroundColor Green

# Step 4: Update Vercel
Write-Host ""
Write-Host "Step 4: Updating Vercel environment variable..." -ForegroundColor Yellow
Get-Content session.txt | vercel env rm MTN_SESSION production --yes
Get-Content session.txt | vercel env add MTN_SESSION production
Write-Host "✅ Vercel environment variable updated" -ForegroundColor Green

# Step 5: Update GitHub Secret (optional)
Write-Host ""
$updateGitHub = Read-Host "Update GitHub Secret? (y/n)"
if ($updateGitHub -eq "y") {
    Write-Host "Updating GitHub Secret..." -ForegroundColor Yellow
    Get-Content session.txt | gh secret set MTN_SESSION
    Write-Host "✅ GitHub Secret updated" -ForegroundColor Green
}

# Step 6: Deploy
Write-Host ""
$deploy = Read-Host "Deploy to production now? (y/n)"
if ($deploy -eq "y") {
    Write-Host "Deploying to production..." -ForegroundColor Yellow
    vercel --prod --yes
    Write-Host "✅ Deployed to production" -ForegroundColor Green
}

# Step 7: Test
Write-Host ""
Write-Host "Step 7: Testing production API..." -ForegroundColor Yellow
$prodUrl = Read-Host "Enter your production URL (or press Enter for default)"

if ([string]::IsNullOrWhiteSpace($prodUrl)) {
    $prodUrl = "https://circletel-staging.vercel.app"
}

Write-Host "Testing auth endpoint..."
$authResult = Invoke-RestMethod -Uri "$prodUrl/api/mtn-wholesale/auth" -Method Get -ErrorAction SilentlyContinue
if ($authResult.authenticated -eq $true) {
    Write-Host "✅ Auth: Success" -ForegroundColor Green
} else {
    Write-Host "❌ Auth: Failed" -ForegroundColor Red
}

Write-Host "Testing products endpoint..."
$productsResult = Invoke-RestMethod -Uri "$prodUrl/api/mtn-wholesale/products" -Method Get -ErrorAction SilentlyContinue
if ($productsResult.error_code -eq "200") {
    Write-Host "✅ Products: Success" -ForegroundColor Green
} else {
    Write-Host "❌ Products: Failed" -ForegroundColor Red
}

# Cleanup
Write-Host ""
Write-Host "Cleaning up temporary files..." -ForegroundColor Yellow
Remove-Item session.txt -ErrorAction SilentlyContinue
Write-Host "✅ Cleanup complete" -ForegroundColor Green

Write-Host ""
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host "✅ MTN Session Refresh Complete!" -ForegroundColor Green
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next validation: GitHub Actions (every 4 hours)"
Write-Host "Workflow: https://github.com/jdeweedata/circletel/actions/workflows/validate-mtn-session.yml"
Write-Host ""
