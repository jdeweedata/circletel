#!/usr/bin/env python3
"""
Prismic Browser Publisher

Automates publishing via browser since Prismic doesn't offer a publish API.
Uses Playwright for browser automation.

Requirements:
    pip install playwright
    playwright install chromium

Usage:
    python publish_browser.py <document_title>
    python publish_browser.py "SkyFibre Home"
"""

import asyncio
import sys
import os
from typing import Optional

try:
    from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout
except ImportError:
    print("Playwright not installed. Run: pip install playwright && playwright install chromium")
    sys.exit(1)


async def publish_document(
    document_title: str,
    prismic_email: Optional[str] = None,
    prismic_password: Optional[str] = None,
    repository: str = "circletel",
    headless: bool = False
) -> dict:
    """
    Publish a document in Prismic via browser automation.

    Args:
        document_title: Title of the document to publish
        prismic_email: Prismic login email (or PRISMIC_EMAIL env var)
        prismic_password: Prismic login password (or PRISMIC_PASSWORD env var)
        repository: Prismic repository name
        headless: Run browser in headless mode

    Returns:
        dict with status and message
    """
    email = prismic_email or os.environ.get("PRISMIC_EMAIL")
    password = prismic_password or os.environ.get("PRISMIC_PASSWORD")

    if not email or not password:
        return {
            "status": "error",
            "message": "PRISMIC_EMAIL and PRISMIC_PASSWORD environment variables required"
        }

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless)
        context = await browser.new_context()
        page = await context.new_page()

        try:
            # 1. Navigate to Prismic
            print(f"Opening Prismic dashboard...")
            await page.goto(f"https://{repository}.prismic.io")

            # 2. Check if login is needed
            try:
                await page.wait_for_selector('input[name="email"]', timeout=5000)
                print("Logging in...")
                await page.fill('input[name="email"]', email)
                await page.fill('input[name="password"]', password)
                await page.click('button[type="submit"]')
                await page.wait_for_load_state("networkidle")
            except PlaywrightTimeout:
                print("Already logged in or redirected")

            # 3. Navigate to Migration Releases
            print("Navigating to Migration Releases...")
            try:
                # Try clicking the tab directly
                migration_tab = page.locator('text=Migration Releases')
                await migration_tab.click(timeout=10000)
            except PlaywrightTimeout:
                # Try via URL
                await page.goto(f"https://{repository}.prismic.io/migration-releases")

            await page.wait_for_load_state("networkidle")

            # 4. Find the document
            print(f"Looking for document: {document_title}")
            await page.wait_for_timeout(2000)  # Let content load

            # Find document row
            doc_row = page.locator(f'text="{document_title}"').first

            try:
                await doc_row.wait_for(timeout=10000)
                print(f"Found document: {document_title}")
            except PlaywrightTimeout:
                # Try documents list instead
                print("Not in Migration Releases, checking Documents...")
                await page.goto(f"https://{repository}.prismic.io/documents")
                await page.wait_for_load_state("networkidle")
                await page.wait_for_timeout(2000)

                # Search for document
                search = page.locator('input[placeholder*="Search"]').first
                if await search.is_visible():
                    await search.fill(document_title)
                    await page.wait_for_timeout(1000)

                doc_row = page.locator(f'text="{document_title}"').first
                await doc_row.wait_for(timeout=10000)

            # 5. Click on the document to open it
            await doc_row.click()
            await page.wait_for_load_state("networkidle")
            await page.wait_for_timeout(1000)

            # 6. Find and click Publish button
            print("Looking for Publish button...")
            publish_btn = page.locator('button:has-text("Publish")').first

            try:
                await publish_btn.wait_for(timeout=5000)

                # Check if it's enabled
                is_disabled = await publish_btn.is_disabled()
                if is_disabled:
                    return {
                        "status": "already_published",
                        "message": f"Document '{document_title}' is already published"
                    }

                await publish_btn.click()
                print("Clicked Publish button")

                # 7. Confirm publish if modal appears
                await page.wait_for_timeout(1000)
                confirm_btn = page.locator('button:has-text("Publish")').last
                if await confirm_btn.is_visible():
                    await confirm_btn.click()
                    print("Confirmed publish")

                # 8. Wait for success
                await page.wait_for_timeout(2000)

                # Check for success message
                success = page.locator('text=Published')
                if await success.is_visible():
                    print(f"✅ Document '{document_title}' published successfully!")
                    return {
                        "status": "published",
                        "message": f"Document '{document_title}' published successfully"
                    }
                else:
                    return {
                        "status": "unknown",
                        "message": "Publish button clicked but couldn't confirm success"
                    }

            except PlaywrightTimeout:
                return {
                    "status": "not_found",
                    "message": f"Could not find Publish button for '{document_title}'"
                }

        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }
        finally:
            await browser.close()


async def publish_all_migration_releases(
    prismic_email: Optional[str] = None,
    prismic_password: Optional[str] = None,
    repository: str = "circletel",
    headless: bool = False
) -> dict:
    """
    Publish all documents in the Migration Releases tab.

    Returns:
        dict with status and list of published documents
    """
    email = prismic_email or os.environ.get("PRISMIC_EMAIL")
    password = prismic_password or os.environ.get("PRISMIC_PASSWORD")

    if not email or not password:
        return {
            "status": "error",
            "message": "PRISMIC_EMAIL and PRISMIC_PASSWORD environment variables required"
        }

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless)
        context = await browser.new_context()
        page = await context.new_page()

        try:
            # Login
            print(f"Opening Prismic dashboard...")
            await page.goto(f"https://{repository}.prismic.io")

            try:
                await page.wait_for_selector('input[name="email"]', timeout=5000)
                print("Logging in...")
                await page.fill('input[name="email"]', email)
                await page.fill('input[name="password"]', password)
                await page.click('button[type="submit"]')
                await page.wait_for_load_state("networkidle")
            except PlaywrightTimeout:
                pass

            # Go to Migration Releases
            print("Navigating to Migration Releases...")
            await page.goto(f"https://{repository}.prismic.io/migration-releases")
            await page.wait_for_load_state("networkidle")
            await page.wait_for_timeout(2000)

            # Look for "Publish all" or individual publish buttons
            publish_all = page.locator('button:has-text("Publish all")').first

            if await publish_all.is_visible():
                print("Found 'Publish all' button")
                await publish_all.click()

                # Confirm
                await page.wait_for_timeout(1000)
                confirm = page.locator('button:has-text("Confirm")').first
                if await confirm.is_visible():
                    await confirm.click()

                await page.wait_for_timeout(3000)
                return {
                    "status": "published",
                    "message": "All migration releases published"
                }
            else:
                return {
                    "status": "empty",
                    "message": "No documents in Migration Releases"
                }

        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }
        finally:
            await browser.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python publish_browser.py <document_title>")
        print("       python publish_browser.py --all")
        print("")
        print("Environment variables required:")
        print("  PRISMIC_EMAIL    - Prismic login email")
        print("  PRISMIC_PASSWORD - Prismic login password")
        sys.exit(1)

    if sys.argv[1] == "--all":
        result = asyncio.run(publish_all_migration_releases(headless=False))
    else:
        document_title = " ".join(sys.argv[1:])
        result = asyncio.run(publish_document(document_title, headless=False))

    print(f"\nResult: {result}")
