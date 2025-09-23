import { test, expect } from '@playwright/test'

test.describe('Admin System End-to-End Flow', () => {
  test('should complete full admin workflow', async ({ page }) => {
    // Step 1: Login to admin system
    await page.goto('/admin/login')

    // Mock successful login
    await page.route('**/functions/v1/admin-auth', async route => {
      if (route.request().method() === 'POST') {
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
      } else {
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
      }
    })

    // Fill login form
    await page.fill('input[type="email"]', 'admin@circletel.co.za')
    await page.fill('input[type="password"]', 'testpassword')
    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await expect(page).toHaveURL('/admin')
    await expect(page.locator('text=Welcome back, Test!')).toBeVisible()

    // Step 2: Navigate to product management
    await page.click('text=All Products')
    await expect(page).toHaveURL('/admin/products')

    // Mock products API
    await page.route('**/functions/v1/admin-product-management', async route => {
      if (route.request().method() === 'GET') {
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
                name: 'Test New Product',
                slug: 'test-new-product',
                category: 'business_fibre',
                service_type: 'Fibre',
                speed_down: 100,
                speed_up: 100,
                status: 'pending',
                is_featured: false,
                created_at: '2024-01-22T10:00:00Z',
                updated_at: '2024-01-22T10:00:00Z',
                pricing: [{
                  price_regular: 2999,
                  approval_status: 'pending'
                }]
              }
            ],
            pagination: {
              page: 1,
              limit: 20,
              total: 2,
              pages: 1
            }
          })
        })
      } else if (route.request().method() === 'POST') {
        // Mock product creation
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              id: '2',
              name: 'Test New Product',
              slug: 'test-new-product',
              category: 'business_fibre',
              status: 'draft'
            }
          })
        })
      }
    })

    // Should see products list
    await expect(page.locator('text=Product Management')).toBeVisible()
    await expect(page.locator('text=BizFibre Connect Lite')).toBeVisible()

    // Step 3: Test filtering functionality
    await page.fill('input[placeholder="Search products..."]', 'BizFibre')
    await expect(page.locator('text=BizFibre Connect Lite')).toBeVisible()

    // Clear search
    await page.fill('input[placeholder="Search products..."]', '')

    // Step 4: Test category filtering
    await page.click('text=Category')
    await page.click('text=Business Fibre')
    await expect(page.locator('text=BizFibre Connect Lite')).toBeVisible()

    // Reset filter
    await page.click('text=Category')
    await page.click('text=All Categories')

    // Step 5: Navigate to add new product
    await page.click('text=Add Product')
    await expect(page).toHaveURL('/admin/products/new')

    // Step 6: Test product actions menu
    await page.goBack()
    await expect(page).toHaveURL('/admin/products')

    // Click actions menu for first product
    const actionButton = page.locator('button').filter({ hasText: '⋯' }).first()
    await actionButton.click()

    // Check dropdown options
    await expect(page.locator('text=View Details')).toBeVisible()
    await expect(page.locator('text=Edit')).toBeVisible()
    await expect(page.locator('text=Duplicate')).toBeVisible()
    await expect(page.locator('text=Archive')).toBeVisible()

    // Click View Details
    await page.click('text=View Details')
    await expect(page).toHaveURL('/admin/products/1')

    // Step 7: Navigate to approvals
    await page.click('a[href="/admin/approvals"]')
    await expect(page).toHaveURL('/admin/approvals')

    // Mock approvals API
    await page.route('**/functions/v1/admin-approval-workflow*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: '1',
              product_id: '2',
              change_type: 'create',
              status: 'pending',
              requested_by: '1',
              requested_at: '2024-01-22T10:00:00Z',
              admin_products: {
                name: 'Test New Product',
                category: 'business_fibre'
              },
              admin_users: {
                full_name: 'Test Admin',
                email: 'admin@circletel.co.za'
              }
            }
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            pages: 1
          }
        })
      })
    })

    // Should see pending approvals (if any)
    // This would show actual pending items in a real system

    // Step 8: Test navigation back to dashboard
    await page.click('a[href="/admin"]')
    await expect(page).toHaveURL('/admin')
    await expect(page.locator('text=Welcome back, Test!')).toBeVisible()

    // Step 9: Test notifications
    const notificationButton = page.locator('[data-testid="notification-bell"]')
    await notificationButton.click()
    await expect(page.locator('text=3 pending approvals')).toBeVisible()

    // Step 10: Test user menu and logout
    const userMenuButton = page.locator('text=Test Admin').locator('..')
    await userMenuButton.click()
    await expect(page.locator('text=Profile Settings')).toBeVisible()
    await expect(page.locator('text=Sign out')).toBeVisible()

    // Mock logout
    await page.route('**/auth/v1/logout', async route => {
      await route.fulfill({ status: 200 })
    })

    await page.click('text=Sign out')
    await expect(page).toHaveURL('/admin/login')
  })

  test('should handle product approval workflow', async ({ page }) => {
    // Setup authenticated session
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

    // Mock approvals API with pending items
    await page.route('**/functions/v1/admin-approval-workflow**', async route => {
      const url = new URL(route.request().url())

      if (url.pathname.includes('/pending')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                id: '1',
                product_id: '2',
                change_type: 'update',
                old_value: { name: 'Old Product Name', price_regular: 2000 },
                new_value: { name: 'Updated Product Name', price_regular: 2500 },
                reason: 'Price adjustment for market competitiveness',
                status: 'pending',
                requested_by: '2',
                requested_at: '2024-01-22T10:00:00Z',
                admin_products: {
                  name: 'Test Product',
                  category: 'business_fibre'
                },
                admin_users: {
                  full_name: 'Test Editor',
                  email: 'editor@circletel.co.za'
                }
              }
            ],
            pagination: {
              page: 1,
              limit: 20,
              total: 1,
              pages: 1
            }
          })
        })
      } else if (url.pathname.includes('/approve')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Change approved successfully'
          })
        })
      }
    })

    // Navigate to approvals page
    await page.goto('/admin/approvals')

    // Should see pending approval
    await expect(page.locator('text=Test Product')).toBeVisible()
    await expect(page.locator('text=Price adjustment for market competitiveness')).toBeVisible()

    // Click approve button (would need to implement this in the UI)
    // await page.click('button:has-text("Approve")')
    // await expect(page.locator('text=Change approved successfully')).toBeVisible()
  })

  test('should handle different user roles correctly', async ({ page }) => {
    // Test with editor role
    await page.addInitScript(() => {
      localStorage.setItem('admin_session', JSON.stringify({
        access_token: 'test-token',
        refresh_token: 'test-refresh'
      }))
      localStorage.setItem('admin_user', JSON.stringify({
        id: '2',
        email: 'editor@circletel.co.za',
        full_name: 'Test Editor',
        role: 'editor',
        permissions: {}
      }))
    })

    await page.route('**/functions/v1/admin-auth', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          valid: true,
          user: {
            id: '2',
            email: 'editor@circletel.co.za',
            full_name: 'Test Editor',
            role: 'editor',
            permissions: {}
          }
        })
      })
    })

    await page.goto('/admin')

    // Editor should see basic dashboard
    await expect(page.locator('text=Welcome back, Test!')).toBeVisible()

    // Should see Add Product (editor can create)
    await expect(page.locator('text=Add New Product')).toBeVisible()

    // Should not see Manage Users (admin only)
    const manageUsersButton = page.locator('text=Manage Users').locator('..')
    await expect(manageUsersButton).toHaveAttribute('disabled')

    // Review Approvals should be disabled (only managers can approve)
    const reviewApprovalsButton = page.locator('text=Review Approvals').locator('..')
    await expect(reviewApprovalsButton).toHaveAttribute('disabled')
  })

  test('should handle network errors gracefully', async ({ page }) => {
    await page.goto('/admin/login')

    // Mock network error
    await page.route('**/functions/v1/admin-auth', async route => {
      await route.abort('failed')
    })

    await page.fill('input[type="email"]', 'admin@circletel.co.za')
    await page.fill('input[type="password"]', 'testpassword')
    await page.click('button[type="submit"]')

    // Should show error message
    await expect(page.locator('text=Login failed')).toBeVisible({ timeout: 10000 })
  })

  test('should maintain responsive design across different screen sizes', async ({ page }) => {
    // Test desktop
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/admin/login')

    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('h1')).toContainText('Admin Login')

    // Test tablet
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('input[type="email"]')).toBeVisible()

    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('h1')).toContainText('Admin Login')
  })
})