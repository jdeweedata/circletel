#!/usr/bin/env python3
"""
Prismic Page Creator Client

Programmatically create and manage Prismic CMS content.
Publishing requires browser automation (see skill.md).
"""

import os
import json
import requests
from pathlib import Path
from typing import Optional, Dict, List, Any

class PrismicClient:
    """Client for Prismic Migration and Asset APIs."""

    def __init__(self, token: Optional[str] = None, repository: str = "circletel"):
        self.token = token or os.environ.get("PRISMIC_WRITE_TOKEN")
        if not self.token:
            raise ValueError("PRISMIC_WRITE_TOKEN not set")

        self.repository = repository
        self.base_headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
            "repository": self.repository,
            "x-api-key": self.token
        }

    # =========================================================================
    # Custom Types API
    # =========================================================================

    def push_custom_type(self, type_path: str) -> Dict[str, Any]:
        """Push a custom type definition to Prismic."""
        with open(type_path, "r") as f:
            custom_type = json.load(f)

        url = "https://customtypes.prismic.io/customtypes/insert"
        response = requests.post(url, headers=self.base_headers, json=custom_type)

        if response.status_code == 201:
            return {"status": "created", "id": custom_type["id"]}
        elif response.status_code == 409:
            # Already exists, try update
            url = "https://customtypes.prismic.io/customtypes/update"
            response = requests.post(url, headers=self.base_headers, json=custom_type)
            if response.status_code == 204:
                return {"status": "updated", "id": custom_type["id"]}

        return {"status": "error", "code": response.status_code, "message": response.text}

    # =========================================================================
    # Asset API
    # =========================================================================

    def upload_image(self, file_path: str, alt_text: str = "") -> Dict[str, Any]:
        """Upload an image to Prismic media library."""
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Image not found: {file_path}")

        # Determine MIME type
        mime_types = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".gif": "image/gif",
            ".webp": "image/webp"
        }
        mime_type = mime_types.get(path.suffix.lower(), "image/jpeg")

        with open(file_path, "rb") as f:
            response = requests.post(
                "https://asset-api.prismic.io/assets",
                headers={
                    "Authorization": f"Bearer {self.token}",
                    "repository": self.repository
                },
                files={"file": (path.name, f, mime_type)}
            )

        if response.status_code in [200, 201]:
            asset = response.json()
            return {
                "status": "uploaded",
                "id": asset.get("id"),
                "url": asset.get("url", asset.get("main", {}).get("url")),
                "alt": alt_text
            }

        return {"status": "error", "code": response.status_code, "message": response.text}

    # =========================================================================
    # Migration API
    # =========================================================================

    def create_document(
        self,
        doc_type: str,
        uid: str,
        title: str,
        data: Dict[str, Any],
        lang: str = "en-za"
    ) -> Dict[str, Any]:
        """Create a new document (saved as draft)."""
        document = {
            "title": title,
            "uid": uid,
            "type": doc_type,
            "lang": lang,
            "data": data
        }

        response = requests.post(
            "https://migration.prismic.io/documents",
            headers=self.base_headers,
            json=document
        )

        if response.status_code == 201:
            result = response.json()
            return {
                "status": "created",
                "id": result.get("id"),
                "uid": uid,
                "message": "Document created as draft. Publish via Prismic dashboard."
            }

        return {"status": "error", "code": response.status_code, "message": response.text}

    def update_document(self, doc_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing document."""
        response = requests.put(
            f"https://migration.prismic.io/documents/{doc_id}/",
            headers=self.base_headers,
            json={"data": data}
        )

        if response.status_code in [200, 204]:
            return {"status": "updated", "id": doc_id}

        return {"status": "error", "code": response.status_code, "message": response.text}

    # =========================================================================
    # Slice Builders
    # =========================================================================

    @staticmethod
    def rich_text(text: str, text_type: str = "paragraph") -> List[Dict]:
        """Create a RichText field value."""
        return [{"type": text_type, "text": text, "spans": []}]

    @staticmethod
    def rich_text_list(items: List[str]) -> List[Dict]:
        """Create a RichText list field value."""
        return [{"type": "list-item", "text": item, "spans": []} for item in items]

    @staticmethod
    def link(url: str, link_type: str = "Web") -> Dict:
        """Create a Link field value."""
        return {"link_type": link_type, "url": url}

    @staticmethod
    def image(image_id: str, url: str, alt: str = "", width: int = 1920, height: int = 1080) -> Dict:
        """Create an Image field value."""
        return {
            "id": image_id,
            "url": url,
            "alt": alt,
            "dimensions": {"width": width, "height": height}
        }

    def build_pricing_table_slice(
        self,
        title: str,
        subtitle: str,
        tiers: List[Dict[str, Any]]
    ) -> Dict:
        """Build a pricing_table slice with correct schema."""
        return {
            "slice_type": "pricing_table",
            "slice_label": None,
            "variation": "default",
            "version": "initial",
            "primary": {
                "title": self.rich_text(title, "heading2"),
                "subtitle": self.rich_text(subtitle)
            },
            "items": [
                {
                    "tier_name": tier["name"],
                    "price": tier["price"],
                    "description": tier.get("description", ""),
                    "features": self.rich_text_list(tier.get("features", [])),
                    "cta_button_text": tier.get("cta_text", "Get Started"),
                    "cta_button_link": self.link(tier.get("cta_link", "/contact")),
                    "is_featured": tier.get("featured", False)
                }
                for tier in tiers
            ]
        }

    def build_faq_slice(
        self,
        title: str,
        description: str,
        questions: List[Dict[str, str]]
    ) -> Dict:
        """Build a faq slice with correct schema."""
        return {
            "slice_type": "faq",
            "slice_label": None,
            "variation": "default",
            "version": "initial",
            "primary": {
                "section_title": self.rich_text(title, "heading2"),
                "section_description": self.rich_text(description)
            },
            "items": [
                {
                    "question": q["question"],
                    "answer": self.rich_text(q["answer"])
                }
                for q in questions
            ]
        }

    def build_hero_section_slice(
        self,
        headline: str,
        subheadline: str,
        cta_text: str,
        cta_link: str,
        background_image: Optional[Dict] = None
    ) -> Dict:
        """Build a hero_section slice with correct schema."""
        primary = {
            "headline": self.rich_text(headline, "heading1"),
            "subheadline": self.rich_text(subheadline),
            "cta_button_text": cta_text,
            "cta_button_link": self.link(cta_link)
        }

        if background_image:
            primary["background_image"] = background_image

        return {
            "slice_type": "hero_section",
            "slice_label": None,
            "variation": "default",
            "version": "initial",
            "primary": primary,
            "items": []
        }


# =============================================================================
# CLI Interface
# =============================================================================

def create_product_page(
    uid: str,
    product_name: str,
    tagline: str,
    hero_image_path: Optional[str] = None,
    pricing_tiers: Optional[List[Dict]] = None,
    faqs: Optional[List[Dict]] = None
) -> Dict[str, Any]:
    """
    Create a complete product page in Prismic.

    Args:
        uid: URL slug (e.g., "skyfibre-home")
        product_name: Product title
        tagline: Product subtitle/tagline
        hero_image_path: Path to hero image file
        pricing_tiers: List of pricing tier dictionaries
        faqs: List of FAQ dictionaries

    Returns:
        Result dictionary with status and document ID
    """
    client = PrismicClient()
    results = {"steps": []}

    # 1. Upload hero image if provided
    hero_image = None
    if hero_image_path:
        print(f"Uploading hero image: {hero_image_path}")
        img_result = client.upload_image(hero_image_path, f"{product_name} hero image")
        results["steps"].append({"upload_image": img_result})

        if img_result["status"] == "uploaded":
            hero_image = client.image(
                img_result["id"],
                img_result["url"],
                img_result["alt"]
            )

    # 2. Build slices
    slices = []

    if pricing_tiers:
        slices.append(client.build_pricing_table_slice(
            "Choose Your Plan",
            "All plans include professional installation and local support.",
            pricing_tiers
        ))

    if faqs:
        slices.append(client.build_faq_slice(
            "Frequently Asked Questions",
            f"Common questions about {product_name}.",
            faqs
        ))

    # 3. Build document data
    data = {
        "product_name": product_name,
        "tagline": tagline,
        "hero_cta_text": "Check Your Coverage",
        "hero_cta_link": client.link("/coverage-check"),
        "meta_title": f"{product_name} | CircleTel",
        "meta_description": tagline,
        "slices": slices
    }

    if hero_image:
        data["hero_image"] = hero_image

    # 4. Create document
    print(f"Creating document: {uid}")
    doc_result = client.create_document(
        doc_type="product_page",
        uid=uid,
        title=product_name,
        data=data
    )
    results["steps"].append({"create_document": doc_result})
    results["document_id"] = doc_result.get("id")
    results["status"] = doc_result["status"]

    if doc_result["status"] == "created":
        results["next_steps"] = [
            "Go to https://circletel.prismic.io",
            "Click 'Migration Releases' tab",
            f"Find '{product_name}' and click Publish",
            f"Page will be live at /product/{uid}"
        ]

    return results


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 3:
        print("Usage: python prismic_client.py <uid> <product_name> [tagline]")
        print("Example: python prismic_client.py skyfibre-smb 'SkyFibre SMB' 'Business Connectivity'")
        sys.exit(1)

    uid = sys.argv[1]
    product_name = sys.argv[2]
    tagline = sys.argv[3] if len(sys.argv) > 3 else f"Fast, reliable {product_name}"

    result = create_product_page(uid, product_name, tagline)
    print(json.dumps(result, indent=2))
