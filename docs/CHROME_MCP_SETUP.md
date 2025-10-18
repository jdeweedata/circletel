# Chrome DevTools MCP Server Setup

## Overview
Chrome DevTools MCP server is configured for debugging CircleTel's telecommunications platform with focus on network inspection, performance tracing, and PWA analysis.

## Installation Status
✅ **Installed globally**: `npm install -g chrome-devtools-mcp@latest`
✅ **Configured**: `~/.factory/config.json`
✅ **Tested**: Browser launch successful on port 62611

## Configuration
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["chrome-devtools-mcp@latest"],
      "type": "stdio",
      "env": {
        "CHROME_PATH": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "HEADLESS": "false",
        "TEMP_PROFILE": "true"
      }
    }
  }
}
```

## Telecom-Specific Debugging Features

### Network Inspection
- **MTN API Calls**: Monitor real-time coverage checking requests
- **Coverage Aggregation**: Track multi-provider API response times
- **Geographic Queries**: Inspect PostGIS query performance
- **PWA Cache**: Analyze service worker caching strategies

### Performance Tracing
- **Coverage Maps**: Track Google Maps API loading and rendering
- **RP Engine**: Monitor permission checking performance
- **Component Loading**: Analyze bundle splitting effectiveness
- **Database Queries**: PostGIS geographic query optimization

### PWA Service Worker Analysis
- **Cache Strategy**: Inspect 5-minute TTL caching for coverage APIs
- **Offline Functionality**: Test IndexedDB storage and retrieval
- **Background Sync**: Monitor offline data synchronization
- **Asset Caching**: Verify SWR patterns for static resources

## Security Isolation
- **Temporary Profile**: Each session uses isolated browser profile
- **No Sync**: Chrome sync disabled to prevent data cross-contamination
- **Sandbox Mode**: Isolated environment for development debugging
- **Auto Cleanup**: Temporary user data directory cleaned after sessions

## Usage Examples

### 1. Debug MTN Coverage API
```javascript
// Monitor network requests for coverage checking
// Look for requests to: https://mtnsi.mtn.co.za/cache/geoserver/wms
// Check response times and anti-bot bypass effectiveness
```

### 2. Performance Profiling
```javascript
// Analyze coverage aggregation service performance
// Monitor: 5-minute TTL cache effectiveness
// Track: Geographic coordinate validation overhead
```

### 3. PWA Cache Inspection
```javascript
// Test service worker caching strategies
// Verify: Coverage API responses cached for 5 minutes
// Check: Static assets using SWR pattern
```

## CI/CD Configuration
For headless mode in pipelines:
```bash
export HEADLESS=true
export CHROME_PATH=/usr/bin/google-chrome-stable
```

## Troubleshooting

### Common Issues
1. **Chrome not found**: Verify `CHROME_PATH` environment variable
2. **Port conflicts**: Check if Chrome is already running
3. **Profile cleanup**: Windows may lock temp files - ignore cleanup errors
4. **MCP Connection**: Restart MCP server if connection fails

### Debug Commands
```bash
# Test MCP server directly
npx chrome-devtools-mcp@latest

# Verify Chrome installation
"C:\Program Files\Google\Chrome\Application\chrome.exe" --version

# Test with headless mode
HEADLESS=true npx chrome-devtools-mcp@latest
```

## Integration with Development Workflow

### CircleTel Specific Use Cases
1. **Coverage System Debugging**: Monitor MTN API anti-bot bypass
2. **Performance Optimization**: Analyze bundle loading for Google Maps
3. **PWA Functionality**: Test offline coverage checking
4. **RBAC Development**: Debug permission query performance
5. **Geographic Queries**: Optimize PostGIS coverage area calculations

### Code Quality Integration
- Use with AGENTS.md development guidelines
- Complements TypeScript strict mode checking
- Works alongside Playwright E2E testing
- Integrates with Vercel deployment monitoring

## Environment Variables
```env
CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe  # Chrome binary path
HEADLESS=false                                                    # Show browser (development true, CI false)
TEMP_PROFILE=true                                                 # Use temporary profile (security)
```

## Notes for Developers
- Browser launches with isolated profile for security
- Temporary data directory auto-cleanup (ignore Windows cleanup errors)
- Configured for telecom-specific debugging scenarios
- Integrates with existing MCP servers (Zoho, Supabase, etc.)
