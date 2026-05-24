# Firecrawl Extraction Schemas

Pre-built JSON schemas for use with the `firecrawl_extract` MCP tool. Pass these as the `schema` parameter.

> **Cost reminder**: `firecrawl_extract` costs ~15 credits per call. Use `firecrawl_search` + `firecrawl_scrape` (2 credits total) first and only escalate to `firecrawl_extract` when the scrape result is too unstructured to parse manually.

---

## 1. Hardware Product Schema

**When to use**: Individual product detail pages. Returns a single product with full specs.

```json
{
  "type": "object",
  "properties": {
    "products": {
      "type": "array",
      "description": "Array of products found on the page (usually 1 for a product detail page)",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Full product name including model number"
          },
          "sku": {
            "type": "string",
            "description": "Product SKU, part number, or item code"
          },
          "manufacturer": {
            "type": "string",
            "description": "Brand or manufacturer name"
          },
          "price_excl_vat": {
            "type": "number",
            "description": "Price excluding 15% VAT in South African Rand. If only incl. VAT is shown, divide by 1.15"
          },
          "price_incl_vat": {
            "type": "number",
            "description": "Price including 15% VAT in South African Rand"
          },
          "currency": {
            "type": "string",
            "description": "Currency code, should be ZAR for SA suppliers",
            "default": "ZAR"
          },
          "stock_status": {
            "type": "string",
            "description": "Stock availability: 'In Stock', 'Out of Stock', 'Pre-Order', or a quantity like '15 units'"
          },
          "stock_quantity": {
            "type": "integer",
            "description": "Exact stock quantity if shown"
          },
          "stock_by_branch": {
            "type": "object",
            "description": "Stock levels per warehouse/branch if shown",
            "properties": {
              "johannesburg": { "type": "integer" },
              "cape_town": { "type": "integer" },
              "durban": { "type": "integer" }
            }
          },
          "category": {
            "type": "string",
            "description": "Product category (e.g., 'Wireless Access Points', 'Routers', 'UPS')"
          },
          "subcategory": {
            "type": "string",
            "description": "Sub-category if available"
          },
          "description": {
            "type": "string",
            "description": "Full product description"
          },
          "short_description": {
            "type": "string",
            "description": "Brief one-line product description"
          },
          "specifications": {
            "type": "object",
            "description": "Key technical specifications as key-value pairs",
            "additionalProperties": { "type": "string" },
            "examples": [
              { "frequency": "5GHz", "max_speed": "1200 Mbps", "ports": "4x GbE", "power": "PoE 802.3af" }
            ]
          },
          "features": {
            "type": "array",
            "items": { "type": "string" },
            "description": "Key product features as bullet points"
          },
          "datasheet_url": {
            "type": "string",
            "description": "Direct URL to PDF datasheet if available on the page"
          },
          "manual_url": {
            "type": "string",
            "description": "Direct URL to user manual PDF if available"
          },
          "image_url": {
            "type": "string",
            "description": "URL of the main product image"
          },
          "product_url": {
            "type": "string",
            "description": "Canonical URL of this product page"
          },
          "warranty": {
            "type": "string",
            "description": "Warranty period (e.g., '2 years', '3 years limited')"
          },
          "dimensions": {
            "type": "string",
            "description": "Physical dimensions (W×D×H) if shown"
          },
          "weight": {
            "type": "string",
            "description": "Weight in kg or g if shown"
          },
          "compatible_with": {
            "type": "array",
            "items": { "type": "string" },
            "description": "Compatible products or product families"
          }
        },
        "required": ["name", "price_excl_vat"]
      }
    },
    "supplier_notes": {
      "type": "string",
      "description": "Any supplier-specific notes observed on the page (e.g., 'dealer login required for pricing', 'bulk pricing available')"
    }
  },
  "required": ["products"]
}
```

---

## 2. Product Listing Schema

**When to use**: Category pages, search results pages, or any page listing multiple products. Returns structured list with pagination info.

```json
{
  "type": "object",
  "properties": {
    "products": {
      "type": "array",
      "description": "All products listed on this page",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Product name"
          },
          "sku": {
            "type": "string",
            "description": "SKU or part number if shown in listing"
          },
          "manufacturer": {
            "type": "string",
            "description": "Brand/manufacturer"
          },
          "price_excl_vat": {
            "type": "number",
            "description": "Price excluding 15% VAT in ZAR"
          },
          "price_incl_vat": {
            "type": "number",
            "description": "Price including 15% VAT in ZAR"
          },
          "stock_status": {
            "type": "string",
            "description": "Stock status: 'In Stock', 'Out of Stock', or quantity"
          },
          "category": {
            "type": "string",
            "description": "Category as shown"
          },
          "product_url": {
            "type": "string",
            "description": "Full URL to the product detail page"
          },
          "image_url": {
            "type": "string",
            "description": "Thumbnail image URL"
          }
        },
        "required": ["name", "product_url"]
      }
    },
    "pagination": {
      "type": "object",
      "description": "Pagination information for multi-page results",
      "properties": {
        "current_page": {
          "type": "integer",
          "description": "Current page number"
        },
        "total_pages": {
          "type": "integer",
          "description": "Total number of pages"
        },
        "total_products": {
          "type": "integer",
          "description": "Total number of matching products across all pages"
        },
        "products_per_page": {
          "type": "integer",
          "description": "Number of products shown per page"
        },
        "next_page_url": {
          "type": "string",
          "description": "URL of the next page if available"
        }
      }
    },
    "filters_available": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Filter options shown on the page (e.g., manufacturer names, price ranges)"
    },
    "category_context": {
      "type": "string",
      "description": "The category or search term this listing page is for"
    }
  },
  "required": ["products"]
}
```

---

## 3. Datasheet/Spec Sheet Schema

**When to use**: When you've found a product detail page and want to specifically extract the datasheet link and key specifications for storage in a research file.

```json
{
  "type": "object",
  "properties": {
    "product_name": { "type": "string" },
    "sku": { "type": "string" },
    "manufacturer": { "type": "string" },
    "datasheet_url": {
      "type": "string",
      "description": "Direct URL to PDF datasheet"
    },
    "quick_specs": {
      "type": "object",
      "description": "The most important technical specs for a decision-maker",
      "properties": {
        "form_factor": { "type": "string" },
        "interface": { "type": "string" },
        "capacity_or_speed": { "type": "string" },
        "power_consumption": { "type": "string" },
        "operating_temperature": { "type": "string" },
        "certifications": { "type": "string" },
        "dimensions": { "type": "string" },
        "weight": { "type": "string" }
      }
    },
    "full_specifications": {
      "type": "object",
      "description": "Complete specifications table",
      "additionalProperties": { "type": "string" }
    },
    "related_accessories": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "sku": { "type": "string" },
          "product_url": { "type": "string" }
        }
      },
      "description": "Compatible accessories or frequently bought together items"
    },
    "product_family": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Other models in the same product family/series"
    }
  }
}
```

---

## 4. Cross-Supplier Comparison Schema

**When to use**: With `firecrawl_extract` on multiple URLs simultaneously to extract the same product from multiple supplier pages for direct comparison.

Pass an array of product URLs from different suppliers to `firecrawl_extract.urls`, all with this schema:

```json
{
  "type": "object",
  "properties": {
    "supplier_name": {
      "type": "string",
      "description": "Name of the supplier (Scoop, MiRO, Nology, Rectron)"
    },
    "product_name": { "type": "string" },
    "sku": { "type": "string" },
    "manufacturer": { "type": "string" },
    "price_excl_vat": { "type": "number" },
    "price_incl_vat": { "type": "number" },
    "stock_status": { "type": "string" },
    "stock_quantity": { "type": "integer" },
    "warranty": { "type": "string" },
    "datasheet_url": { "type": "string" },
    "product_url": { "type": "string" },
    "notes": {
      "type": "string",
      "description": "Any supplier-specific notes (delivery time, conditions, minimum order)"
    }
  },
  "required": ["supplier_name", "product_name", "price_excl_vat"]
}
```

---

## Usage Examples

### Search then scrape (cheap — 2 credits)

```
1. firecrawl_search: "site:miro.co.za MikroTik hAP ax3"
   → Returns URLs with snippet context

2. firecrawl_scrape: {url from step 1, formats: ["markdown"]}
   → Returns full page as markdown — parse manually
```

### Search then extract (structured but expensive — 16 credits)

```
1. firecrawl_search: "site:rectronzone.co.za Ubiquiti UniFi AP"
   → Returns product page URLs

2. firecrawl_extract: {
     urls: [url from step 1],
     schema: <Hardware Product Schema>,
     prompt: "Extract product pricing, stock status, and all specifications"
   }
   → Returns clean structured JSON
```

### Cross-supplier comparison (expensive — 15+ credits per URL)

```
1. Find product URLs on each supplier via firecrawl_search (4 × 1 credit)

2. firecrawl_extract: {
     urls: [scoop_url, miro_url, nology_url, rectron_url],
     schema: <Cross-Supplier Comparison Schema>,
     prompt: "Extract pricing and stock for this product from each supplier page"
   }
   → Returns array of 4 structured results for direct comparison
```
