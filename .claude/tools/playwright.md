# Playwright Browser Automation Tool

Use the Playwright MCP server for browser automation and E2E testing.

## Available Commands

### Navigation
- `browser_navigate` - Navigate to a URL
- `browser_snapshot` - Take an accessibility snapshot of the page

### Interaction
- `browser_click` - Click an element
- `browser_type` - Type text into an element
- `browser_fill_form` - Fill form fields
- `browser_press_key` - Press keyboard keys
- `browser_hover` - Hover over an element
- `browser_handle_dialog` - Handle browser dialogs

### Inspection
- `browser_console_messages` - Get console messages
- `browser_network_requests` - Get network requests
- `browser_evaluate` - Execute JavaScript in the browser
- `browser_take_screenshot` - Capture a screenshot

### Management
- `browser_tabs` - List open tabs
- `browser_resize` - Resize the browser window
- `browser_wait_for` - Wait for an element or condition
- `browser_close` - Close the browser
- `browser_install` - Install browser binaries

## Usage Examples

### Test a page load
```
1. browser_navigate to https://circletel.co.za
2. browser_snapshot to verify content
3. browser_take_screenshot for visual verification
```

### Test form submission
```
1. browser_navigate to the form page
2. browser_fill_form with test data
3. browser_click the submit button
4. browser_wait_for success message
```

## Configuration

The Playwright MCP server is configured in `.mcp.json`:
```json
"playwright": {
  "command": "cmd",
  "args": ["/c", "npx", "-y", "@anthropic/mcp-server-playwright"]
}
```

## Documentation
- Official: https://playwright.dev/
- MCP Server: https://github.com/anthropics/mcp-server-playwright
