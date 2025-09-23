import { test, expect } from '@playwright/test'

test.describe('Admin Navigation and Layout', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('admin_session', JSON.stringify({
        access_token: 'test-token',
        refresh_token: 'test-refresh'
      }))
      localStorage.setItem('admin_user', JSON.stringify({
        id: '1',
        email: 'admin@circletel.co.za',
        full_name: 'Test Admin',
        role: 'super_admin',
        permissions: {}
      }))
    })

    // Mock session validation
    await page.route('**/functions/v1/admin-auth', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          valid: true,
          user: {
            id: '1',
            email: 'admin@circletel.co.za',
            full_name: 'Test Admin',
            role: 'super_admin',
            permissions: {}
          }
        })
      })
    })

    await page.goto('/admin')
  })

  test('should display sidebar with all navigation items', async ({ page }) => {
    // Check sidebar is visible
    await expect(page.locator('text=Admin Panel')).toBeVisible()

    // Check main navigation items
    await expect(page.locator('a[href="/admin"]')).toContainText('Dashboard')
    await expect(page.locator('text=Products')).toBeVisible()
    await expect(page.locator('a[href="/admin/approvals"]')).toContainText('Approvals')
    await expect(page.locator('a[href="/admin/analytics"]')).toContainText('Analytics')

    // Check products submenu
    await expect(page.locator('a[href="/admin/products"]')).toContainText('All Products')
    await expect(page.locator('a[href="/admin/products/new"]')).toContainText('Add Product')
    await expect(page.locator('a[href="/admin/products/drafts"]')).toContainText('Drafts')
    await expect(page.locator('a[href="/admin/products/archived"]')).toContainText('Archived')

    // Check admin-only items (for super admin)
    await expect(page.locator('a[href="/admin/users"]')).toContainText('Users')
    await expect(page.locator('a[href="/admin/settings"]')).toContainText('Settings')
  })

  test('should highlight active navigation item', async ({ page }) => {
    // Dashboard should be active by default
    const dashboardLink = page.locator('a[href="/admin"]')
    await expect(dashboardLink).toHaveClass(/bg-circleTel-orange/)

    // Navigate to products
    await page.click('a[href="/admin/products"]')
    await expect(page).toHaveURL('/admin/products')

    // Products link should now be active
    const productsLink = page.locator('a[href="/admin/products"]')
    await expect(productsLink).toHaveClass(/bg-circleTel-orange/)
  })

  test('should collapse and expand sidebar', async ({ page }) => {
    // Sidebar should be expanded by default
    const sidebar = page.locator('[data-testid="sidebar"]')
    await expect(sidebar).toHaveClass(/w-64/)

    // Click toggle button
    const toggleButton = page.locator('button').filter({ hasText: '❮' })
    await toggleButton.click()

    // Sidebar should be collapsed
    await expect(sidebar).toHaveClass(/w-16/)

    // Click toggle again to expand
    await toggleButton.click()
    await expect(sidebar).toHaveClass(/w-64/)
  })

  test('should show user info in sidebar footer', async ({ page }) => {
    // Check user info in sidebar
    await expect(page.locator('text=Test Admin')).toBeVisible()
    await expect(page.locator('text=super admin')).toBeVisible()

    // Check user avatar
    await expect(page.locator('text=T')).toBeVisible() // First letter of name
  })

  test('should display header with title and user menu', async ({ page }) => {
    // Check header title
    await expect(page.locator('h1')).toContainText('Product Catalogue Management')
    await expect(page.locator('text=Manage your CircleTel product offerings')).toBeVisible()

    // Check notifications
    const notificationButton = page.locator('[data-testid="notification-bell"]')
    await expect(notificationButton).toBeVisible()

    // Check user menu in header
    await expect(page.locator('text=Test Admin')).toBeVisible()
  })

  test('should handle navigation breadcrumbs', async ({ page }) => {
    // Navigate to product details
    await page.goto('/admin/products/1')

    // Should show breadcrumb-like navigation
    await expect(page.locator('text=Product Management')).toBeVisible()
  })

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Sidebar should be collapsed on mobile
    const sidebar = page.locator('[data-testid="sidebar"]')
    await expect(sidebar).toHaveClass(/w-16/)

    // Header should be responsive
    await expect(page.locator('h1')).toBeVisible()

    // Mobile menu button should be visible
    const mobileMenuButton = page.locator('[data-testid="mobile-menu"]')
    await expect(mobileMenuButton).toBeVisible()
  })

  test('should handle logout functionality', async ({ page }) => {
    // Click user menu
    const userMenuButton = page.locator('text=Test Admin').locator('..')
    await userMenuButton.click()

    // Mock logout
    await page.route('**/auth/v1/logout', async route => {
      await route.fulfill({ status: 200 })
    })

    // Click sign out
    await page.click('text=Sign out')

    // Should redirect to login
    await expect(page).toHaveURL('/admin/login')
  })

  test('should show pending approvals badge', async ({ page }) => {
    // Check for pending approvals badge in navigation
    const approvalsLink = page.locator('a[href="/admin/approvals"]')
    await expect(approvalsLink.locator('text=3')).toBeVisible() // Mock pending count
  })

  test('should handle keyboard navigation', async ({ page }) => {
    // Focus on first navigation item
    await page.keyboard.press('Tab')

    // Should be able to navigate with keyboard
    const dashboardLink = page.locator('a[href="/admin"]')
    await expect(dashboardLink).toBeFocused()

    // Press Enter to navigate
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL('/admin')
  })

  test('should show admin-only items based on role', async ({ page }) => {
    // Super admin should see all items
    await expect(page.locator('a[href="/admin/users"]')).toBeVisible()
    await expect(page.locator('a[href="/admin/settings"]')).toBeVisible()

    // Test with editor role
    await page.addInitScript(() => {
      localStorage.setItem('admin_user', JSON.stringify({
        id: '2',
        email: 'editor@circletel.co.za',
        full_name: 'Test Editor',
        role: 'editor',
        permissions: {}
      }))
    })

    await page.reload()

    // Editor should not see admin-only items
    await expect(page.locator('a[href="/admin/users"]')).not.toBeVisible()
    await expect(page.locator('a[href="/admin/settings"]')).not.toBeVisible()
  })

  test('should persist sidebar state', async ({ page }) => {
    // Collapse sidebar
    const toggleButton = page.locator('button').filter({ hasText: '❮' })
    await toggleButton.click()

    // Navigate to another page
    await page.click('a[href="/admin/products"]')

    // Sidebar should remain collapsed
    const sidebar = page.locator('[data-testid="sidebar"]')
    await expect(sidebar).toHaveClass(/w-16/)
  })

  test('should handle navigation errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/functions/v1/admin-product-management', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      })
    })

    // Navigate to products
    await page.click('a[href="/admin/products"]')

    // Should handle error gracefully (show error message or fallback)
    await expect(page).toHaveURL('/admin/products')
  })
})