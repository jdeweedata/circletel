import { test, expect } from '@playwright/test'

test.describe('Admin Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login')
    // Wait for React to fully load and render the login form
    await page.waitForSelector('[data-testid="shield-icon"]', { timeout: 15000 })
  })

  test('should display login form', async ({ page }) => {
    // Wait for login form to be fully rendered - target the actual heading element
    await page.waitForSelector('text=Admin Login', { timeout: 15000 })

    // Check if login form is visible - use the actual heading level (h3 from CardTitle)
    await expect(page.locator('h3')).toContainText('Admin Login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()

    // Check for CircleTel branding
    await expect(page.locator('text=CircleTel Product Management System')).toBeVisible()

    // Check for shield icon
    await expect(page.locator('[data-testid="shield-icon"]')).toBeVisible()
  })

  test('should show validation for empty fields', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"]')

    // Check for HTML5 validation or custom validation
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')

    await expect(emailInput).toHaveAttribute('required')
    await expect(passwordInput).toHaveAttribute('required')
  })

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for error message (this will depend on actual API response)
    await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 10000 })
  })

  test('should redirect to admin dashboard on successful login', async ({ page }) => {
    // Note: This test would need valid test credentials
    // For now, we'll test the UI flow

    await page.fill('input[type="email"]', 'admin@circletel.co.za')
    await page.fill('input[type="password"]', 'testpassword')

    // Mock successful login response
    await page.route('**/functions/v1/admin-auth', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: '1',
            email: 'admin@circletel.co.za',
            full_name: 'Test Admin',
            role: 'super_admin',
            permissions: {}
          },
          session: {
            access_token: 'test-token',
            refresh_token: 'test-refresh'
          }
        })
      })
    })

    await page.click('button[type="submit"]')

    // Should redirect to admin dashboard
    await expect(page).toHaveURL('/admin')
  })

  test('should show loading state during login', async ({ page }) => {
    await page.fill('input[type="email"]', 'admin@circletel.co.za')
    await page.fill('input[type="password"]', 'testpassword')

    // Mock slow API response
    await page.route('**/functions/v1/admin-auth', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: null })
      })
    })

    await page.click('button[type="submit"]')

    // Check for loading state
    await expect(page.locator('text=Signing in...')).toBeVisible()
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()
  })

  test('should redirect unauthorized users to login', async ({ page }) => {
    // Try to access admin dashboard without authentication
    await page.goto('/admin')

    // Should redirect to login page
    await expect(page).toHaveURL('/admin/login')
  })

  test('should have proper accessibility attributes', async ({ page }) => {
    // Check form accessibility
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const submitButton = page.locator('button[type="submit"]')

    // Check for proper labels
    await expect(page.locator('label[for="email"]')).toBeVisible()
    await expect(page.locator('label[for="password"]')).toBeVisible()

    // Check ARIA attributes
    await expect(emailInput).toHaveAttribute('id', 'email')
    await expect(passwordInput).toHaveAttribute('id', 'password')

    // Check button is properly labeled
    await expect(submitButton).toContainText('Sign In')
  })
})