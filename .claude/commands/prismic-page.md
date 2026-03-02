# /prismic-page - Create Prismic CMS Page

Create and optionally publish a page in Prismic CMS.

## Usage

```
/prismic-page <type> <uid> <title> [options]
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `type` | Yes | Document type: `product`, `service`, `resource`, `page` |
| `uid` | Yes | URL slug (e.g., `skyfibre-home`) |
| `title` | Yes | Page title |

## Options

| Option | Description |
|--------|-------------|
| `--image <path>` | Path to hero image |
| `--tagline <text>` | Product/service tagline |
| `--publish` | Attempt to publish via browser automation |

## Examples

```bash
# Create product page
/prismic-page product skyfibre-smb "SkyFibre SMB" --tagline "Business Connectivity"

# Create with hero image
/prismic-page product workconnect "WorkConnect SOHO" --image .design/images/hero.jpg

# Create and publish
/prismic-page product cloudwifi "CloudWiFi WaaS" --publish
```

## Workflow

1. **Check prerequisites**
   - Verify `PRISMIC_WRITE_TOKEN` is set
   - Check custom type exists (push if needed)

2. **Upload assets**
   - Upload hero image to Prismic Asset API
   - Get asset ID and URL

3. **Create document**
   - Build document with slices
   - POST to Migration API
   - Document saved as draft

4. **Publish (optional)**
   - If `--publish` flag: use browser automation
   - Otherwise: provide dashboard link

## Environment Variables

```bash
# Required for document creation
PRISMIC_WRITE_TOKEN=eyJ...

# Required for browser publishing
PRISMIC_EMAIL=your@email.com
PRISMIC_PASSWORD=your-password
```

## Output

```json
{
  "status": "created",
  "document_id": "xxx",
  "uid": "skyfibre-smb",
  "url": "/product/skyfibre-smb",
  "dashboard": "https://circletel.prismic.io/documents/xxx",
  "next_steps": ["Publish via dashboard or use --publish flag"]
}
```

## Related

- `/skill prismic-page-creator` - Full skill documentation
- `python .claude/skills/prismic-page-creator/prismic_client.py` - Python client
- `python .claude/skills/prismic-page-creator/publish_browser.py` - Browser publisher
