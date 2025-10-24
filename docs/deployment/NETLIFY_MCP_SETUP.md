# Netlify MCP Server Setup

**Date**: 2025-10-20
**Status**: ✅ Configured
**Project**: CircleTel Next.js Platform

## Overview

The Netlify MCP (Model Context Protocol) server enables AI agents to interact directly with Netlify's deployment platform through natural language commands. This integration allows Claude Code and other MCP-compatible agents to:

- Create and manage Netlify projects
- Deploy applications directly
- Manage environment variables
- Configure build settings
- Monitor deployment status
- Access site analytics

## Installation

### Prerequisites

1. **Node.js 22+** (recommended for best results)
   ```bash
   nvm install 22
   nvm use 22
   ```

2. **Netlify CLI** (installed globally)
   ```bash
   npm install -g netlify-cli
   ```

3. **Netlify Authentication**
   ```bash
   netlify login
   ```

### MCP Configuration

The Netlify MCP server is configured in `.mcp.json`:

```json
{
  "mcpServers": {
    "netlify": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "@netlify/mcp"
      ],
      "env": {
        "NETLIFY_PERSONAL_ACCESS_TOKEN": "${NETLIFY_PERSONAL_ACCESS_TOKEN}"
      }
    }
  }
}
```

### Environment Setup

**Option 1: CLI Authentication (Recommended)**
- Netlify CLI authentication is automatically used
- No additional token required
- Already configured via `netlify login`

**Option 2: Personal Access Token (Fallback)**
If you encounter authentication issues:

1. Create a Personal Access Token:
   - Go to [Netlify User Settings](https://app.netlify.com/user/applications#personal-access-tokens)
   - Click "New access token"
   - Give it a descriptive name (e.g., "MCP Server Access")
   - Copy the generated token

2. Add to your environment:
   ```bash
   # .env.local (NOT committed to git)
   NETLIFY_PERSONAL_ACCESS_TOKEN=your_token_here
   ```

3. The MCP server will pick up the token from the environment variable

## Current Project Status

### Netlify Account
- **User**: Jeffrey De Wee (jdewee@live.com)
- **Team**: canzadigital
- **Project**: circletel
- **Project ID**: `af81b4b6-db92-4c6f-a838-aa0b06c07d3c`

### Deployment Details
- **Admin URL**: https://app.netlify.com/projects/circletel
- **Project URL**: https://circletel.netlify.app
- **Config File**: `netlify.toml` (project root)

### Configuration
```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "22"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

## Usage Examples

### With Claude Code

Once configured, you can use natural language commands:

```
"Deploy the current project to Netlify"
"Check the status of my latest Netlify deployment"
"Add an environment variable to my Netlify site"
"Show me the deployment logs"
"Create a new Netlify site for this project"
```

### Available MCP Tools

The Netlify MCP server provides access to:

1. **Site Management**
   - Create new sites
   - List all sites
   - Update site settings
   - Delete sites

2. **Deployment Operations**
   - Deploy code directly
   - Check deployment status
   - View deployment logs
   - Roll back deployments

3. **Environment Variables**
   - Set environment variables
   - List environment variables
   - Update environment variables
   - Delete environment variables

4. **Build Configuration**
   - Update build settings
   - Configure build hooks
   - Manage build plugins

5. **Analytics & Monitoring**
   - View site analytics
   - Check build history
   - Monitor site performance

## Integration with CircleTel

### Current Setup
The CircleTel platform is already deployed on Netlify with:
- ✅ GitHub integration (automatic deployments)
- ✅ All 50 environment variables configured
- ✅ Next.js App Router support via `@netlify/plugin-nextjs`
- ✅ Build command: `npm run build`
- ✅ Node version: 22

### Environment Variables (Configured)
All required environment variables are set in Netlify:
- Supabase configuration (URL, keys)
- Google Maps API key
- Resend API key for email
- MTN API credentials
- Payment gateway keys (Netcash)
- All other platform-specific variables

See: `docs/deployment/NETLIFY_ENV_VARS.md` for complete list

## Troubleshooting

### Authentication Issues

**Problem**: MCP server can't authenticate with Netlify

**Solutions**:
1. Verify Netlify CLI is logged in:
   ```bash
   netlify status
   ```

2. If not authenticated:
   ```bash
   netlify logout
   netlify login
   ```

3. Use Personal Access Token (fallback):
   - Create token in Netlify dashboard
   - Add to `.env.local`
   - Restart Claude Code

### Connection Issues

**Problem**: MCP server fails to connect

**Solutions**:
1. Check Node.js version (22+ recommended):
   ```bash
   node --version
   ```

2. Clear npm cache and reinstall:
   ```bash
   npx clear-npx-cache
   ```

3. Verify MCP configuration in `.mcp.json`

4. Restart Claude Code or your MCP client

### Deployment Failures

**Problem**: Deployment fails through MCP

**Solutions**:
1. Check build logs in Netlify dashboard
2. Verify environment variables are set
3. Test build locally:
   ```bash
   npm run build
   ```
4. Use direct CLI deployment as fallback:
   ```bash
   netlify deploy --prod
   ```

## Security Considerations

### Token Storage
- ❌ **NEVER** commit Personal Access Tokens to git
- ✅ Store tokens in `.env.local` (in `.gitignore`)
- ✅ Use environment variable references in `.mcp.json`
- ✅ Rotate tokens periodically (every 90 days recommended)

### Access Control
- Use team-specific tokens when possible
- Grant minimum required permissions
- Revoke unused tokens immediately
- Monitor token usage in Netlify dashboard

### Best Practices
1. Use CLI authentication when possible (more secure)
2. Only create tokens when CLI auth fails
3. Set token expiration dates
4. Use descriptive token names
5. Audit token usage regularly

## Resources

### Documentation
- [Netlify MCP Server Docs](https://docs.netlify.com/build/build-with-ai/netlify-mcp-server/)
- [Netlify MCP GitHub](https://github.com/netlify/netlify-mcp)
- [Model Context Protocol Spec](https://modelcontextprotocol.io/)
- [Netlify API Reference](https://docs.netlify.com/api/get-started/)

### CircleTel Docs
- `docs/deployment/NETLIFY_DEPLOYMENT_GUIDE.md` - Full deployment guide
- `docs/deployment/NETLIFY_ENV_VARS.md` - Environment variables
- `docs/deployment/NETLIFY_STATUS_2025-10-20.md` - Current status

### Support
- [Netlify Support](https://www.netlify.com/support/)
- [Netlify Community Forums](https://answers.netlify.com/)
- [GitHub Issues](https://github.com/netlify/netlify-mcp/issues)

## Next Steps

1. **Test MCP Integration**
   - Try deploying through Claude Code
   - Test environment variable management
   - Verify deployment logs access

2. **Automation Workflows**
   - Set up automated deployments on push
   - Configure build notifications
   - Implement preview deployments

3. **Monitoring**
   - Set up deployment alerts
   - Monitor build times
   - Track deployment success rates

---

**Configured by**: Claude Code
**Date**: 2025-10-20
**Status**: ✅ Ready for use
**Project**: CircleTel (circletel.netlify.app)
