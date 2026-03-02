# Prismic Page Creator

Create and publish Prismic CMS pages programmatically. This skill handles the full workflow: custom type creation, image upload, document creation, and automated publishing via browser.

## When to Use

- Creating new Prismic pages (product pages, landing pages, service pages)
- Bulk content creation
- Migrating content to Prismic
- Automating CMS workflows

**Triggers**: "create prismic page", "add page to prismic", "publish to prismic", "prismic content"

## Prerequisites

1. **Prismic Token**: Machine-to-machine token from Prismic dashboard
   - Go to Settings → API & Security → Generate Token
   - Store as `PRISMIC_WRITE_TOKEN` in `.env.local`

2. **Repository**: CircleTel Prismic repo is `circletel`

3. **Browser for Publishing**: Chrome must be available for automated publishing

## Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  1. CUSTOM TYPE                                             │
│     - Check if type exists                                  │
│     - Push to Prismic Custom Types API if needed            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  2. UPLOAD ASSETS                                           │
│     - Upload images to Prismic Asset API                    │
│     - Get asset IDs and URLs                                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  3. CREATE DOCUMENT                                         │
│     - Build document with correct slice schemas             │
│     - POST to Migration API                                 │
│     - Document saved as draft in Migration Release          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  4. PUBLISH (Browser Automation)                            │
│     - Open Prismic dashboard                                │
│     - Navigate to Migration Releases                        │
│     - Click Publish on the document                         │
│     - Verify publication                                    │
└─────────────────────────────────────────────────────────────┘
```

## API Reference

### Custom Types API

```python
# Push custom type
POST https://customtypes.prismic.io/customtypes/insert
Headers:
  Authorization: Bearer {token}
  repository: circletel
  Content-Type: application/json
Body: {custom_type_json}

# Response: 201 Created or 409 Conflict (already exists)
```

### Asset API

```python
# Upload image
POST https://asset-api.prismic.io/assets
Headers:
  Authorization: Bearer {token}
  repository: circletel
Files: multipart/form-data with image

# Response: { "id": "xxx", "url": "https://images.prismic.io/..." }
```

### Migration API

```python
# Create document (saved as draft)
POST https://migration.prismic.io/documents
Headers:
  Authorization: Bearer {token}
  repository: circletel
  x-api-key: {token}
  Content-Type: application/json
Body: {
  "title": "Page Title",
  "uid": "page-slug",
  "type": "document_type",
  "lang": "en-za",
  "data": { ...fields and slices... }
}

# Response: 201 Created with document ID
```

## Slice Schemas

When creating documents, slices must match exact field names from `/slices/{SliceName}/model.json`.

### pricing_table

```json
{
  "slice_type": "pricing_table",
  "variation": "default",
  "primary": {
    "title": [{"type": "heading2", "text": "...", "spans": []}],
    "subtitle": [{"type": "paragraph", "text": "...", "spans": []}]
  },
  "items": [
    {
      "tier_name": "Plan Name",
      "price": "R999/month",
      "description": "Description text",
      "features": [
        {"type": "list-item", "text": "Feature 1", "spans": []},
        {"type": "list-item", "text": "Feature 2", "spans": []}
      ],
      "cta_button_text": "Get Started",
      "cta_button_link": {"link_type": "Web", "url": "/path"},
      "is_featured": false
    }
  ]
}
```

### faq

```json
{
  "slice_type": "faq",
  "variation": "default",
  "primary": {
    "section_title": [{"type": "heading2", "text": "...", "spans": []}],
    "section_description": [{"type": "paragraph", "text": "...", "spans": []}]
  },
  "items": [
    {
      "question": "Question text?",
      "answer": [{"type": "paragraph", "text": "Answer text", "spans": []}]
    }
  ]
}
```

### hero_section

```json
{
  "slice_type": "hero_section",
  "variation": "default",
  "primary": {
    "headline": [{"type": "heading1", "text": "...", "spans": []}],
    "subheadline": [{"type": "paragraph", "text": "...", "spans": []}],
    "cta_button_text": "Button Text",
    "cta_button_link": {"link_type": "Web", "url": "/path"},
    "background_image": {
      "id": "asset_id",
      "url": "https://images.prismic.io/...",
      "alt": "Alt text",
      "dimensions": {"width": 1920, "height": 1080}
    }
  },
  "items": []
}
```

### feature_grid

```json
{
  "slice_type": "feature_grid",
  "variation": "default",
  "primary": {
    "section_title": [{"type": "heading2", "text": "...", "spans": []}]
  },
  "items": [
    {
      "icon": {"url": "...", "alt": "..."},
      "title": "Feature Title",
      "description": [{"type": "paragraph", "text": "...", "spans": []}]
    }
  ]
}
```

## Publishing via Browser Automation

Since Prismic doesn't offer a publish API, use chrome-devtools MCP:

```python
# 1. Navigate to Prismic
mcp__chrome-devtools__navigate_page(url="https://circletel.prismic.io")

# 2. Wait for login (if needed) or dashboard
mcp__chrome-devtools__wait_for(text=["Migration Releases", "Documents"])

# 3. Click Migration Releases tab
mcp__chrome-devtools__click(uid="migration-releases-tab")

# 4. Find and click Publish on the document
mcp__chrome-devtools__take_snapshot()
# Look for document title and Publish button
mcp__chrome-devtools__click(uid="publish-button-uid")

# 5. Confirm publication
mcp__chrome-devtools__wait_for(text=["Published", "Success"])
```

## Example: Create Product Page

```python
import requests
import os

PRISMIC_TOKEN = os.environ.get("PRISMIC_WRITE_TOKEN")
REPO = "circletel"

headers = {
    "Authorization": f"Bearer {PRISMIC_TOKEN}",
    "Content-Type": "application/json",
    "repository": REPO,
    "x-api-key": PRISMIC_TOKEN
}

# 1. Upload hero image
with open("hero.jpg", "rb") as f:
    response = requests.post(
        "https://asset-api.prismic.io/assets",
        headers={"Authorization": f"Bearer {PRISMIC_TOKEN}", "repository": REPO},
        files={"file": ("hero.jpg", f, "image/jpeg")}
    )
    image = response.json()

# 2. Create document
document = {
    "title": "Product Name",
    "uid": "product-slug",
    "type": "product_page",
    "lang": "en-za",
    "data": {
        "product_name": "Product Name",
        "tagline": "Product tagline",
        "hero_image": {
            "id": image["id"],
            "url": image["url"],
            "alt": "Hero image",
            "dimensions": {"width": 1920, "height": 1080}
        },
        "hero_cta_text": "Get Started",
        "hero_cta_link": {"link_type": "Web", "url": "/contact"},
        "slices": [
            # Add slices matching schemas above
        ]
    }
}

response = requests.post(
    "https://migration.prismic.io/documents",
    headers=headers,
    json=document
)

if response.status_code == 201:
    doc_id = response.json()["id"]
    print(f"Document created: {doc_id}")
    # Now use browser automation to publish
```

## Troubleshooting

### 400 Validation Error
- Check slice field names match exactly with model.json
- Ensure all required fields are present
- RichText fields need `[{"type": "...", "text": "...", "spans": []}]` format

### 409 Conflict
- Document with same UID already exists
- Use PUT to update instead of POST to create

### 403 Forbidden
- Token doesn't have write permissions
- Generate new token with "Migration API" scope

### Image Upload Fails
- Check file size (max 100MB)
- Ensure correct MIME type
- Verify token has asset API access

## Document Types Available

| Type | Route | Description |
|------|-------|-------------|
| `product_page` | `/product/:uid` | Product landing pages |
| `service_page` | `/services/:uid` | Service pages |
| `resource_page` | `/resources/:uid` | Resource/blog pages |
| `page` | `/:uid` | Generic pages |

## Rate Limits

- Migration API: 1 request/second
- Asset API: 10 requests/second
- Custom Types API: 10 requests/minute
