#!/bin/bash

# MTN WMS Direct Testing Script
# Tests coverage API directly, bypassing web interface

set -e

echo "=================================="
echo "MTN WMS Direct Coverage Testing"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_wms() {
  local city=$1
  local lat=$2
  local lng=$3
  local layer=$4

  echo -e "${YELLOW}Testing $layer coverage in $city ($lat, $lng)${NC}"

  # Calculate bounding box (±0.001 degrees ≈ 100m)
  local minX=$(echo "$lng - 0.001" | bc -l)
  local maxX=$(echo "$lng + 0.001" | bc -l)
  local minY=$(echo "$lat - 0.001" | bc -l)
  local maxY=$(echo "$lat + 0.001" | bc -l)

  # Build WMS URL
  local url="https://mtnsi.mtn.co.za/coverage/dev/v3/wms"
  url+="?SERVICE=WMS"
  url+="&VERSION=1.3.0"
  url+="&REQUEST=GetFeatureInfo"
  url+="&LAYERS=$layer"
  url+="&QUERY_LAYERS=$layer"
  url+="&INFO_FORMAT=application/json"
  url+="&CRS=CRS:84"
  url+="&BBOX=$minX,$minY,$maxX,$maxY"
  url+="&WIDTH=256"
  url+="&HEIGHT=256"
  url+="&I=128"
  url+="&J=128"
  url+="&FEATURE_COUNT=10"
  url+="&EXCEPTIONS=application/json"

  # Make request with browser-like headers
  local response=$(curl -s -w "\n%{http_code}" "$url" \
    -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36" \
    -H "Accept: application/json, text/plain, */*" \
    -H "Accept-Language: en-ZA,en;q=0.9" \
    -H "Referer: https://mtnsi.mtn.co.za/" \
    -H "Origin: https://mtnsi.mtn.co.za" \
    -H "Sec-Fetch-Dest: empty" \
    -H "Sec-Fetch-Mode: cors" \
    -H "Sec-Fetch-Site: same-origin")

  # Extract status code
  local http_code=$(echo "$response" | tail -n1)
  local body=$(echo "$response" | sed '$d')

  if [ "$http_code" = "200" ]; then
    echo -e "  ${GREEN}✓ Success (HTTP $http_code)${NC}"

    # Parse response if jq is available
    if command -v jq &> /dev/null; then
      local feature_count=$(echo "$body" | jq -r '.features | length' 2>/dev/null || echo "N/A")
      echo "  Features found: $feature_count"

      if [ "$feature_count" != "N/A" ] && [ "$feature_count" -gt 0 ]; then
        echo "  Response sample:"
        echo "$body" | jq -C '.' 2>/dev/null | head -20
      fi
    else
      echo "  Response: ${body:0:200}..."
    fi
  elif [ "$http_code" = "418" ]; then
    echo -e "  ${RED}✗ Bot Protection (HTTP $http_code)${NC}"
    echo "  Response: $body"
  else
    echo -e "  ${RED}✗ Failed (HTTP $http_code)${NC}"
    echo "  Response: $body"
  fi

  echo ""
}

# Test GeoServer (Consumer API)
test_geoserver() {
  local city=$1
  local lat=$2
  local lng=$3
  local layer=$4

  echo -e "${YELLOW}Testing GeoServer $layer in $city ($lat, $lng)${NC}"

  # Convert to Spherical Mercator (EPSG:900913)
  local x=$(echo "$lng * 20037508.34 / 180" | bc -l)
  local y_temp=$(echo "scale=10; l(t((90 + $lat) * 3.14159265359 / 360)) / (3.14159265359 / 180)" | bc -l)
  local y=$(echo "$y_temp * 20037508.34 / 180" | bc -l)

  local buffer=100
  local minX=$(echo "$x - $buffer" | bc -l)
  local maxX=$(echo "$x + $buffer" | bc -l)
  local minY=$(echo "$y - $buffer" | bc -l)
  local maxY=$(echo "$y + $buffer" | bc -l)

  # Build GeoServer URL
  local url="https://mtnsi.mtn.co.za/cache/geoserver/wms"
  url+="?SERVICE=WMS"
  url+="&VERSION=1.1.1"
  url+="&REQUEST=GetFeatureInfo"
  url+="&LAYERS=$layer"
  url+="&QUERY_LAYERS=$layer"
  url+="&STYLES="
  url+="&INFO_FORMAT=application/json"
  url+="&SRS=EPSG:900913"
  url+="&BBOX=$minX,$minY,$maxX,$maxY"
  url+="&WIDTH=200"
  url+="&HEIGHT=200"
  url+="&X=100"
  url+="&Y=100"
  url+="&FEATURE_COUNT=50"

  # Make request
  local response=$(curl -s -w "\n%{http_code}" "$url" \
    -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
    -H "Accept: application/json" \
    -H "Referer: https://mtnsi.mtn.co.za/")

  local http_code=$(echo "$response" | tail -n1)
  local body=$(echo "$response" | sed '$d')

  if [ "$http_code" = "200" ]; then
    echo -e "  ${GREEN}✓ Success (HTTP $http_code)${NC}"

    if command -v jq &> /dev/null; then
      local feature_count=$(echo "$body" | jq -r '.features | length' 2>/dev/null || echo "N/A")
      echo "  Features found: $feature_count"
    fi
  else
    echo -e "  ${RED}✗ Failed (HTTP $http_code)${NC}"
  fi

  echo ""
}

# Test coordinates
echo "Testing Business API (WMS)..."
echo ""

# Johannesburg
test_wms "Johannesburg" "-26.2041" "28.0473" "FTTBCoverage"
test_wms "Johannesburg" "-26.2041" "28.0473" "PMPCoverage"
test_wms "Johannesburg" "-26.2041" "28.0473" "FLTECoverageEBU"
test_wms "Johannesburg" "-26.2041" "28.0473" "UncappedWirelessEBU"

# Cape Town
test_wms "Cape Town" "-33.9249" "18.4241" "FTTBCoverage"

echo "=================================="
echo "Testing Consumer API (GeoServer)..."
echo ""

test_geoserver "Johannesburg" "-26.2041" "28.0473" "mtnsi:SUPERSONIC-CONSOLIDATED"
test_geoserver "Johannesburg" "-26.2041" "28.0473" "mtnsi:MTNSA-Coverage-5G-5G"

echo "=================================="
echo "Testing Complete!"
echo "=================================="
