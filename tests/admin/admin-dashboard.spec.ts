import { test, expect } from '@playwright/test'

test.describe('Admin Dashboard', () => {
  // Mock authentication for dashboard tests
  test.beforeEach(async ({ page }) => {
    // Mock successful authentication
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

  test('should display dashboard with welcome message', async ({ page }) => {
    // Check welcome message
    await expect(page.locator('h1')).toContainText('Welcome back, Test!')
    await expect(page.locator('text=Here\'s what\'s happening with your product catalogue today')).toBeVisible()

    // Check role badge
    await expect(page.locator('text=SUPER ADMIN')).toBeVisible()
  })

  test('should display statistics cards', async ({ page }) => {
    // Check for stats cards
    await expect(page.locator('text=Total Products')).toBeVisible()
    await expect(page.locator('text=Pending Approvals')).toBeVisible()
    await expect(page.locator('text=Approved Products')).toBeVisible()
    await expect(page.locator('text=Revenue Impact')).toBeVisible()

    // Check for stat values (these would be mocked data)
    await expect(page.locator('text=12')).toBeVisible() // Total products
    await expect(page.locator('text=3')).toBeVisible() // Pending approvals
    await expect(page.locator('text=9')).toBeVisible() // Approved products
  })

  test('should display urgent badge for pending approvals', async ({ page }) => {
    // If there are pending approvals, should show urgent badge
    const pendingCard = page.locator('text=Pending Approvals').locator('..')
    await expect(pendingCard.locator('text=Urgent')).toBeVisible()
  })

  test('should display quick action buttons', async ({ page }) => {
    // Check for quick action buttons
    await expect(page.locator('text=Add New Product')).toBeVisible()
    await expect(page.locator('text=Review Approvals')).toBeVisible()
    await expect(page.locator('text=View Analytics')).toBeVisible()
    await expect(page.locator('text=Manage Users')).toBeVisible()

    // Check that Add New Product button works
    await page.click('text=Add New Product')
    await expect(page).toHaveURL('/admin/products/new')
  })

  test('should display recent activity feed', async ({ page }) => {
    await page.goto('/admin') // Refresh to reset navigation

    // Check for recent activity section
    await expect(page.locator('text=Recent Activity')).toBeVisible()
    await expect(page.locator('text=Latest changes and updates')).toBeVisible()

    // Check for mock activity items
    await expect(page.locator('text=New product "BizFibre Connect Ultra" submitted for approval')).toBeVisible()
    await expect(page.locator('text=Pricing updated for SkyFibre SMB Professional')).toBeVisible()
    await expect(page.locator('text=by John Smith')).toBeVisible()
  })

  test('should show notifications in header', async ({ page }) => {
    // Check for notification bell
    const notificationButton = page.locator('[data-testid="notification-bell"]')
    await expect(notificationButton).toBeVisible()

    // Check for notification badge
    await expect(page.locator('text=3').first()).toBeVisible() // Notification count

    // Click to open notifications dropdown
    await notificationButton.click()
    await expect(page.locator('text=3 pending approvals')).toBeVisible()
    await expect(page.locator('text=New product pending approval')).toBeVisible()
  })

  test('should display user menu in header', async ({ page }) => {
    // Check for user avatar/name in header
    await expect(page.locator('text=Test Admin')).toBeVisible()
    await expect(page.locator('text=super admin')).toBeVisible()

    // Click user menu
    const userMenuButton = page.locator('text=Test Admin').locator('..')
    await userMenuButton.click()

    // Check dropdown items
    await expect(page.locator('text=Profile Settings')).toBeVisible()
    await expect(page.locator('text=Sign out')).toBeVisible()
  })

  test('should handle sidebar navigation', async ({ page }) => {
    // Check sidebar is visible
    await expect(page.locator('text=Admin Panel')).toBeVisible()

    // Check navigation items
    await expect(page.locator('text=Dashboard')).toBeVisible()
    await expect(page.locator('text=Products')).toBeVisible()
    await expect(page.locator('text=Approvals')).toBeVisible()
    await expect(page.locator('text=Analytics')).toBeVisible()

    // Test navigation to products
    await page.click('text=All Products')
    await expect(page).toHaveURL('/admin/products')
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Sidebar should be collapsed on mobile
    const sidebar = page.locator('[data-testid="sidebar"]')
    await expect(sidebar).toHaveClass(/w-16/) // Collapsed width

    // Menu button should be visible
    const menuButton = page.locator('[data-testid="menu-button"]')
    await expect(menuButton).toBeVisible()

    // Click to expand sidebar
    await menuButton.click()
    await expect(sidebar).toHaveClass(/w-64/) // Expanded width
  })

  test('should show loading states', async ({ page }) => {
    // Mock slow loading
    await page.route('**/functions/v1/admin-auth', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ valid: true, user: {} })
      })
    })

    await page.goto('/admin')

    // Check for loading spinner
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()
  })

  test('should handle permission-based UI', async ({ page }) => {
    // Test with different user roles
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

    // Editor should see Add New Product but not Manage Users
    await expect(page.locator('text=Add New Product')).toBeVisible()

    // Manage Users should be disabled for non-super-admin
    const manageUsersButton = page.locator('text=Manage Users').locator('..')
    await expect(manageUsersButton).toHaveAttribute('disabled')
  })
})