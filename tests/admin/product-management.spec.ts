import { test, expect } from '@playwright/test'

test.describe('Product Management', () => {
  // Mock authentication for product management tests
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

    // Mock products API
    await page.route('**/functions/v1/admin-product-management', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: '1',
              name: 'BizFibre Connect Lite',
              slug: 'bizfibre-connect-lite',
              category: 'business_fibre',
              service_type: 'Fibre',
              speed_down: 10,
              speed_up: 10,
              status: 'approved',
              is_featured: false,
              created_at: '2024-01-15T10:00:00Z',
              updated_at: '2024-01-15T10:00:00Z',
              pricing: [{
                price_regular: 1699,
                approval_status: 'approved'
              }]
            },
            {
              id: '2',
              name: 'BizFibre Connect Ultra',
              slug: 'bizfibre-connect-ultra',
              category: 'business_fibre',
              service_type: 'Fibre',
              speed_down: 200,
              speed_up: 200,
              status: 'pending',
              is_featured: true,
              created_at: '2024-01-20T14:30:00Z',
              updated_at: '2024-01-20T14:30:00Z',
              pricing: [{
                price_regular: 4373,
                approval_status: 'pending'
              }]
            },
            {
              id: '3',
              name: 'SkyFibre SMB Essential',
              slug: 'skyfibre-smb-essential',
              category: 'fixed_wireless_business',
              service_type: 'Fixed Wireless',
              speed_down: 50,
              speed_up: 50,
              status: 'approved',
              is_featured: false,
              created_at: '2024-01-10T09:15:00Z',
              updated_at: '2024-01-18T16:45:00Z',
              pricing: [{
                price_regular: 1899,
                price_promo: 1299,
                approval_status: 'approved'
              }]
            }
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 3,
            pages: 1
          }
        })
      })
    })

    await page.goto('/admin/products')
  })

  test('should display product management page', async ({ page }) => {
    // Check page title and description
    await expect(page.locator('h1')).toContainText('Product Management')
    await expect(page.locator('text=Manage your product catalogue and pricing')).toBeVisible()

    // Check Add Product button
    await expect(page.locator('text=Add Product')).toBeVisible()
  })

  test('should display products table with data', async ({ page }) => {
    // Wait for products to load
    await expect(page.locator('text=Products (3)')).toBeVisible()

    // Check table headers
    await expect(page.locator('text=Product')).toBeVisible()
    await expect(page.locator('text=Category')).toBeVisible()
    await expect(page.locator('text=Speed')).toBeVisible()
    await expect(page.locator('text=Price')).toBeVisible()
    await expect(page.locator('text=Status')).toBeVisible()
    await expect(page.locator('text=Updated')).toBeVisible()
    await expect(page.locator('text=Actions')).toBeVisible()

    // Check product data
    await expect(page.locator('text=BizFibre Connect Lite')).toBeVisible()
    await expect(page.locator('text=BizFibre Connect Ultra')).toBeVisible()
    await expect(page.locator('text=SkyFibre SMB Essential')).toBeVisible()

    // Check status badges
    await expect(page.locator('text=Approved')).toBeVisible()
    await expect(page.locator('text=Pending')).toBeVisible()

    // Check featured badge
    await expect(page.locator('text=Featured')).toBeVisible()
  })

  test('should filter products by search term', async ({ page }) => {
    // Wait for products to load
    await expect(page.locator('text=Products (3)')).toBeVisible()

    // Search for specific product
    const searchInput = page.locator('input[placeholder="Search products..."]')
    await searchInput.fill('BizFibre')

    // Should show only BizFibre products
    await expect(page.locator('text=BizFibre Connect Lite')).toBeVisible()
    await expect(page.locator('text=BizFibre Connect Ultra')).toBeVisible()
    await expect(page.locator('text=SkyFibre SMB Essential')).not.toBeVisible()

    // Clear search
    await searchInput.clear()
    await expect(page.locator('text=SkyFibre SMB Essential')).toBeVisible()
  })

  test('should filter products by category', async ({ page }) => {
    // Wait for products to load
    await expect(page.locator('text=Products (3)')).toBeVisible()

    // Filter by Business Fibre category
    await page.click('text=Category')
    await page.click('text=Business Fibre')

    // Should show only business fibre products
    await expect(page.locator('text=BizFibre Connect Lite')).toBeVisible()
    await expect(page.locator('text=BizFibre Connect Ultra')).toBeVisible()
    await expect(page.locator('text=SkyFibre SMB Essential')).not.toBeVisible()

    // Reset filter
    await page.click('text=Category')
    await page.click('text=All Categories')
    await expect(page.locator('text=SkyFibre SMB Essential')).toBeVisible()
  })

  test('should filter products by status', async ({ page }) => {
    // Wait for products to load
    await expect(page.locator('text=Products (3)')).toBeVisible()

    // Filter by pending status
    await page.click('text=Status')
    await page.click('text=Pending')

    // Should show only pending products
    await expect(page.locator('text=BizFibre Connect Ultra')).toBeVisible()
    await expect(page.locator('text=BizFibre Connect Lite')).not.toBeVisible()
    await expect(page.locator('text=SkyFibre SMB Essential')).not.toBeVisible()
  })

  test('should display product actions dropdown', async ({ page }) => {
    // Wait for products to load
    await expect(page.locator('text=Products (3)')).toBeVisible()

    // Click on first product's actions menu
    const firstActionButton = page.locator('button').filter({ hasText: '⋯' }).first()
    await firstActionButton.click()

    // Check dropdown options
    await expect(page.locator('text=View Details')).toBeVisible()
    await expect(page.locator('text=Edit')).toBeVisible()
    await expect(page.locator('text=Duplicate')).toBeVisible()
    await expect(page.locator('text=Archive')).toBeVisible()
  })

  test('should navigate to product details', async ({ page }) => {
    // Wait for products to load
    await expect(page.locator('text=Products (3)')).toBeVisible()

    // Click on actions menu and view details
    const firstActionButton = page.locator('button').filter({ hasText: '⋯' }).first()
    await firstActionButton.click()
    await page.click('text=View Details')

    // Should navigate to product details page
    await expect(page).toHaveURL('/admin/products/1')
  })

  test('should navigate to add new product', async ({ page }) => {
    // Click Add Product button
    await page.click('text=Add Product')

    // Should navigate to new product page
    await expect(page).toHaveURL('/admin/products/new')
  })

  test('should display pricing information correctly', async ({ page }) => {
    // Wait for products to load
    await expect(page.locator('text=Products (3)')).toBeVisible()

    // Check regular pricing
    await expect(page.locator('text=R1,699')).toBeVisible()
    await expect(page.locator('text=R4,373')).toBeVisible()

    // Check promotional pricing
    await expect(page.locator('text=Promo: R1,299')).toBeVisible()
  })

  test('should display speed information correctly', async ({ page }) => {
    // Wait for products to load
    await expect(page.locator('text=Products (3)')).toBeVisible()

    // Check speed display for symmetrical connections
    await expect(page.locator('text=10 Mbps')).toBeVisible() // Symmetrical
    await expect(page.locator('text=200 Mbps')).toBeVisible() // Symmetrical
    await expect(page.locator('text=50 Mbps')).toBeVisible() // Symmetrical
  })

  test('should show empty state when no products match filters', async ({ page }) => {
    // Wait for products to load
    await expect(page.locator('text=Products (3)')).toBeVisible()

    // Search for non-existent product
    const searchInput = page.locator('input[placeholder="Search products..."]')
    await searchInput.fill('NonExistentProduct')

    // Should show empty state
    await expect(page.locator('text=No products found matching your criteria')).toBeVisible()
  })

  test('should show loading state', async ({ page }) => {
    // Mock slow API response
    await page.route('**/functions/v1/admin-product-management', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], pagination: { total: 0 } })
      })
    })

    await page.goto('/admin/products')

    // Check for loading skeleton
    await expect(page.locator('.animate-pulse')).toBeVisible()
  })

  test('should handle permission-based actions', async ({ page }) => {
    // Test with editor role (can edit but not approve)
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

    // Editor should see Add Product button
    await expect(page.locator('text=Add Product')).toBeVisible()

    // Check actions dropdown
    const firstActionButton = page.locator('button').filter({ hasText: '⋯' }).first()
    await firstActionButton.click()

    // Should see Edit but Archive might be restricted
    await expect(page.locator('text=Edit')).toBeVisible()
  })

  test('should update URL with filter parameters', async ({ page }) => {
    // Apply search filter
    const searchInput = page.locator('input[placeholder="Search products..."]')
    await searchInput.fill('BizFibre')

    // URL should include search parameter
    await expect(page).toHaveURL(/search=BizFibre/)

    // Apply category filter
    await page.click('text=Category')
    await page.click('text=Business Fibre')

    // URL should include category parameter
    await expect(page).toHaveURL(/category=business_fibre/)
  })
})