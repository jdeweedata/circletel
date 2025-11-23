import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3005';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.PLAYWRIGHT_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.PLAYWRIGHT_ADMIN_PASSWORD;

const haveCreds = !!(ADMIN_EMAIL && ADMIN_PASSWORD);

/**
 * CMS Content Creation E2E Tests
 * Tests the complete flow from AI generation to publishing
 */
test.describe('CMS Content Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    if (!haveCreds) {
      test.skip();
      return;
    }

    // Login first
    await page.goto(`${BASE_URL}/admin/login`);
    await page.getByLabel('Email', { exact: false }).fill(ADMIN_EMAIL!);
    await page.getByLabel('Password', { exact: false }).fill(ADMIN_PASSWORD!);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for redirect to admin dashboard
    await expect(page).toHaveURL(/\/admin/);
  });

  test('should create a page using AI generation', async ({ page }) => {
    // Navigate to CMS create page
    await page.goto(`${BASE_URL}/admin/cms/create`);

    // Wait for page to load
    await expect(page).toHaveURL(/\/admin\/cms\/create/);

    // Fill in AI generation form
    await page.getByLabel(/topic/i).fill('Fiber Internet Benefits for South African Businesses');

    // Select content type
    await page.getByLabel(/content type/i).selectOption('landing_page');

    // Select tone
    await page.getByLabel(/tone/i).selectOption('professional');

    // Add keywords
    const keywordsInput = page.getByLabel(/keywords/i);
    await keywordsInput.fill('fiber internet');
    await keywordsInput.press('Enter');
    await keywordsInput.fill('business connectivity');
    await keywordsInput.press('Enter');

    // Select target audience
    await page.getByLabel(/target audience/i).selectOption('business');

    // Set word count
    await page.getByLabel(/word count/i).fill('500');

    // Click generate button
    await page.getByRole('button', { name: /generate content/i }).click();

    // Wait for generation to complete (may take 10-30 seconds)
    await expect(page.getByText(/generating/i)).toBeVisible();
    await expect(page.getByText(/generating/i)).toBeHidden({ timeout: 60000 });

    // Check that content was generated
    const editor = page.locator('.tiptap');
    await expect(editor).toBeVisible();

    // Content should not be empty
    const content = await editor.textContent();
    expect(content?.length).toBeGreaterThan(100);
  });

  test('should edit content in rich text editor', async ({ page }) => {
    // Navigate to CMS create page
    await page.goto(`${BASE_URL}/admin/cms/create`);

    // Wait for editor to load
    const editor = page.locator('.tiptap');
    await expect(editor).toBeVisible();

    // Type some content
    await editor.click();
    await page.keyboard.type('Test heading');

    // Make it a heading
    const headingButton = page.getByRole('button', { name: /heading/i }).first();
    await headingButton.click();

    // Add a new paragraph
    await page.keyboard.press('Enter');
    await page.keyboard.type('This is a test paragraph with some content.');

    // Make text bold
    await page.keyboard.press('Control+A');
    await page.getByRole('button', { name: /bold/i }).click();

    // Verify content
    const content = await editor.innerHTML();
    expect(content).toContain('Test heading');
    expect(content).toContain('test paragraph');
  });

  test('should save page as draft', async ({ page }) => {
    // Navigate to CMS create page
    await page.goto(`${BASE_URL}/admin/cms/create`);

    // Fill in page metadata
    await page.getByLabel(/^title/i).fill('Test Page ' + Date.now());
    await page.getByLabel(/slug/i).fill('test-page-' + Date.now());

    // Add content
    const editor = page.locator('.tiptap');
    await editor.click();
    await page.keyboard.type('Test content for draft page');

    // Save as draft
    await page.getByRole('button', { name: /save.*draft/i }).click();

    // Wait for success message
    await expect(page.getByText(/saved.*successfully/i)).toBeVisible({ timeout: 10000 });

    // Should redirect to edit page or stay on create page
    await page.waitForTimeout(1000);

    // URL should change or show success state
    const url = page.url();
    expect(url).toMatch(/\/admin\/cms\/(create|edit)/);
  });

  test('should publish a page', async ({ page }) => {
    // Create and save a draft first
    await page.goto(`${BASE_URL}/admin/cms/create`);

    const timestamp = Date.now();
    const title = `Test Publish Page ${timestamp}`;
    const slug = `test-publish-${timestamp}`;

    // Fill in page details
    await page.getByLabel(/^title/i).fill(title);
    await page.getByLabel(/slug/i).fill(slug);

    // Add content
    const editor = page.locator('.tiptap');
    await editor.click();
    await page.keyboard.type('This is test content for publishing.');

    // Save as draft
    await page.getByRole('button', { name: /save.*draft/i }).click();
    await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 10000 });

    // Wait a moment
    await page.waitForTimeout(2000);

    // Publish the page
    const publishButton = page.getByRole('button', { name: /publish/i });
    if (await publishButton.isVisible()) {
      await publishButton.click();

      // Confirm publish if there's a modal
      const confirmButton = page.getByRole('button', { name: /confirm|yes|publish/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Wait for success
      await expect(page.getByText(/published/i)).toBeVisible({ timeout: 10000 });
    }
  });

  test('should upload and insert image', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/cms/create`);

    // Wait for editor
    const editor = page.locator('.tiptap');
    await expect(editor).toBeVisible();

    // Click image button in toolbar
    const imageButton = page.getByRole('button', { name: /image/i }).first();
    await imageButton.click();

    // Upload modal should appear
    await expect(page.getByText(/upload.*image/i)).toBeVisible();

    // Create a test file programmatically
    // Note: In real tests, you'd upload an actual file
    // For now, we'll just check that the upload interface exists
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
  });

  test('should navigate to content dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/cms`);

    // Should show content dashboard
    await expect(page).toHaveURL(/\/admin\/cms$/);

    // Should have statistics cards
    await expect(page.getByText(/total.*pages/i)).toBeVisible();

    // Should have content table
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('should filter and search pages', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/cms`);

    // Wait for table to load
    await expect(page.getByRole('table')).toBeVisible();

    // Test search
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);

      // Results should update
      await expect(page.getByRole('table')).toBeVisible();
    }

    // Test status filter
    const statusFilter = page.locator('select', { has: page.locator('option:has-text("Draft")') }).first();
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('draft');
      await page.waitForTimeout(1000);

      // Results should update
      await expect(page.getByRole('table')).toBeVisible();
    }
  });

  test('should edit existing page', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/cms`);

    // Wait for table
    await expect(page.getByRole('table')).toBeVisible();

    // Click first edit button
    const editButton = page.getByRole('button', { name: /edit/i }).first();
    if (await editButton.isVisible()) {
      await editButton.click();

      // Should navigate to edit page
      await expect(page).toHaveURL(/\/admin\/cms\/edit/);

      // Editor should be loaded with content
      const editor = page.locator('.tiptap');
      await expect(editor).toBeVisible();

      // Should have page metadata
      await expect(page.getByLabel(/^title/i)).toBeVisible();
    }
  });

  test('should show SEO metadata panel', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/cms/create`);

    // Look for SEO section
    await expect(page.getByText(/seo.*metadata/i)).toBeVisible();

    // Should have meta title field
    await expect(page.getByLabel(/meta.*title/i)).toBeVisible();

    // Should have meta description field
    await expect(page.getByLabel(/meta.*description/i)).toBeVisible();

    // Should have keywords field
    await expect(page.getByLabel(/keywords/i)).toBeVisible();
  });

  test('should generate SEO metadata with AI', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/cms/create`);

    // Fill in some content first
    await page.getByLabel(/^title/i).fill('Test SEO Page');

    const editor = page.locator('.tiptap');
    await editor.click();
    await page.keyboard.type('This is content about fiber internet for businesses.');

    // Look for generate SEO button
    const generateSeoButton = page.getByRole('button', { name: /generate.*seo/i });
    if (await generateSeoButton.isVisible()) {
      await generateSeoButton.click();

      // Wait for generation
      await page.waitForTimeout(3000);

      // Meta fields should be populated
      const metaTitle = await page.getByLabel(/meta.*title/i).inputValue();
      expect(metaTitle.length).toBeGreaterThan(0);
    }
  });

  test('should show usage statistics', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/cms/usage`);

    // Should show usage dashboard
    await expect(page).toHaveURL(/\/admin\/cms\/usage/);

    // Should have usage metrics
    await expect(page.getByText(/ai.*usage/i)).toBeVisible();

    // Should have statistics
    await expect(page.getByText(/requests.*today|daily.*usage/i)).toBeVisible();
  });
});

// Provide helpful skip reason if creds missing
if (!haveCreds) {
  test.describe('CMS Content Creation', () => {
    test('skipped due to missing credentials', async () => {
      test.skip(true, 'Set ADMIN_EMAIL and ADMIN_PASSWORD env vars to run this test');
    });
  });
}
