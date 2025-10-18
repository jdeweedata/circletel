# CircleTel Next.js Project Structure

This document provides a comprehensive overview of the CircleTel Next.js project structure.

## Project Tree

```
circletel-nextjs/
├── .claude/                            # Claude Code configuration
│   ├── agents/                         # Agent templates
│   │   └── agent-os/
│   │       ├── api-engineer.md
│   │       ├── backend-verifier.md
│   │       ├── database-engineer.md
│   │       ├── frontend-verifier.md
│   │       ├── implementation-verifier.md
│   │       ├── product-planner.md
│   │       ├── spec-initializer.md
│   │       ├── spec-researcher.md
│   │       ├── spec-verifier.md
│   │       ├── spec-writer.md
│   │       ├── tasks-list-creator.md
│   │       ├── testing-engineer.md
│   │       └── ui-designer.md
│   ├── commands/                       # Slash commands
│   │   └── agent-os/
│   │       ├── create-spec.md
│   │       ├── implement-spec.md
│   │       ├── new-spec.md
│   │       └── plan-product.md
│   ├── memory/                         # Modular memory architecture
│   │   ├── backend/
│   │   │   └── CLAUDE.md              # Backend API context
│   │   ├── cms/
│   │   │   └── CLAUDE.md              # Strapi CMS context
│   │   ├── frontend/
│   │   │   └── CLAUDE.md              # UI/components context
│   │   ├── infrastructure/
│   │   │   └── CLAUDE.md              # Deployment context
│   │   ├── integrations/
│   │   │   └── CLAUDE.md              # External API context
│   │   ├── product/
│   │   │   └── CLAUDE.md              # Features/roadmap context
│   │   └── testing/
│   │       └── CLAUDE.md              # E2E testing context
│   ├── skills/                         # Agent Skills (5 total)
│   │   ├── admin-setup/               # RBAC configuration
│   │   │   ├── SKILL.md
│   │   │   └── role-templates.json    # 17 role templates
│   │   ├── coverage-check/            # Multi-provider testing
│   │   │   ├── SKILL.md
│   │   │   ├── test-addresses.json
│   │   │   └── run-coverage-tests.ps1
│   │   ├── deployment-check/          # Pre-deployment validation
│   │   │   ├── SKILL.md
│   │   │   ├── check-env.js
│   │   │   └── run-deployment-check.ps1
│   │   ├── product-import/            # Excel import workflow
│   │   │   ├── SKILL.md
│   │   │   └── schema.json
│   │   ├── supabase-fetch/            # Database queries
│   │   │   ├── SKILL.md
│   │   │   ├── run-supabase.ps1
│   │   │   └── query-supabase.js
│   │   ├── README.md                  # Complete skills guide
│   │   ├── SKILLS_QUICK_REFERENCE.md  # One-page reference
│   │   ├── SKILLS_ARCHITECTURE.md     # System design
│   │   └── IMPLEMENTATION_SUMMARY.md  # Implementation details
│   ├── CLAUDE.md                       # Main project memory
│   ├── MEMORY_RESTRUCTURE_SUMMARY.md   # Memory migration notes
│   ├── SKILLS_QUICK_REFERENCE.md       # Skills quick reference
│   └── settings.local.json             # Local settings
├── .github/
│   └── workflows/
│       ├── production-deploy.yml
│       └── staging-deploy.yml
├── agent-os/
│   ├── product/
│   │   ├── mission.md
│   │   ├── README.md
│   │   ├── roadmap.md
│   │   └── tech-stack.md
│   ├── roles/
│   │   ├── implementers.yml
│   │   └── verifiers.yml
│   ├── standards/
│   │   ├── backend/
│   │   ├── frontend/
│   │   ├── global/
│   │   └── testing/
│   │       └── test-writing.md
│   └── config.yml
├── app/
│   ├── aceternity-demo/
│   │   └── page.tsx
│   ├── admin/
│   │   ├── billing/
│   │   ├── cms/
│   │   ├── dashboard/
│   │   ├── dev-assistant/
│   │   ├── login/
│   │   ├── pricing/
│   │   ├── products/
│   │   ├── service-packages/
│   │   ├── signup/
│   │   ├── users/
│   │   ├── workflow/
│   │   ├── zoho/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── admin-demo/
│   │   ├── analytics/
│   │   ├── cms/
│   │   ├── customers/
│   │   ├── orders/
│   │   ├── products/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── afrihost-demo/
│   │   └── page.tsx
│   ├── api/
│   │   ├── admin/
│   │   ├── agents/
│   │   ├── auth/
│   │   ├── dynamic-pricing/
│   │   ├── geocode/
│   │   ├── health/
│   │   ├── migrate/
│   │   ├── mtn-wholesale/
│   │   ├── orders/
│   │   ├── payment/
│   │   ├── products/
│   │   ├── strapi/
│   │   ├── test/
│   │   ├── uploads/
│   │   └── zoho/
│   │       ├── mcp/
│   │       └── test-connection/
│   │           └── route.ts
│   ├── auth/
│   │   ├── login/
│   │   └── register/
│   ├── bundles/
│   │   ├── business-pro/
│   │   └── page.tsx
│   ├── business/
│   │   ├── packages/
│   │   └── page.tsx
│   ├── campaigns/
│   │   └── [slug]/
│   │       └── page.tsx
│   ├── cloud/
│   │   ├── backup/
│   │   ├── hosting/
│   │   ├── migration/
│   │   └── virtual-desktops/
│   │       └── page.tsx
│   ├── connectivity/
│   │   ├── fibre/
│   │   ├── fixed-wireless/
│   │   ├── wifi-as-a-service/
│   │   └── page.tsx
│   ├── contact/
│   │   └── page.tsx
│   ├── deals/
│   │   └── [slug]/
│   │       └── page.tsx
│   ├── debug-env/
│   │   └── page.tsx
│   ├── demo/
│   │   ├── afrihost-style/
│   │   ├── verizon-style/
│   │   └── page.tsx
│   ├── devices/
│   │   ├── [slug]/
│   │   ├── mesh-wifi/
│   │   ├── tp-link-deco-x50/
│   │   └── wireless/
│   │       └── page.tsx
│   ├── fibre/
│   │   └── [type]/
│   │       └── page.tsx
│   ├── forms/
│   │   └── unjani/
│   │       └── contract-audit/
│   │           └── page.tsx
│   ├── home-internet/
│   │   ├── checkout/
│   │   ├── order/
│   │   ├── success/
│   │   └── page.tsx
│   ├── login/
│   │   └── admin/
│   │       └── page.tsx
│   ├── marketing/
│   │   └── [slug]/
│   │       └── page.tsx
│   ├── mtn-pricing-demo/
│   │   └── page.tsx
│   ├── order/
│   │   ├── account/
│   │   ├── confirmation/
│   │   ├── contact/
│   │   ├── installation/
│   │   ├── payment/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── packages/
│   │   ├── [leadId]/
│   │   ├── 5g-lte/
│   │   ├── business/
│   │   └── page.tsx
│   ├── pricing/
│   │   └── page.tsx
│   ├── pricing-demo/
│   │   └── page.tsx
│   ├── privacy/
│   │   └── page.tsx
│   ├── privacy-policy/
│   │   └── page.tsx
│   ├── products/
│   │   └── page.tsx
│   ├── promotions/
│   │   └── page.tsx
│   ├── resources/
│   │   ├── connectivity-guide/
│   │   ├── it-assessment/
│   │   ├── wifi-toolkit/
│   │   └── page.tsx
│   ├── services/
│   │   ├── growth-ready/
│   │   ├── mid-size/
│   │   ├── security/
│   │   ├── small-business/
│   │   └── page.tsx
│   ├── support/
│   │   └── page.tsx
│   ├── terms/
│   │   └── page.tsx
│   ├── terms-of-service/
│   │   └── page.tsx
│   ├── test/
│   │   ├── mtn-feasibility/
│   │   ├── mtn-feasibility-simple/
│   │   ├── mtn-standalone/
│   │   └── mtn-wholesale/
│   │       ├── page.tsx
│   │       └── README.md
│   ├── test-sidebar/
│   │   └── page.tsx
│   ├── test-sidebar-refactored/
│   │   └── page.tsx
│   ├── voip/
│   │   └── page.tsx
│   ├── wireless/
│   │   ├── checkout/
│   │   ├── order/
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── admin/
│   │   ├── layout/
│   │   └── products/
│   │       ├── AuditHistoryModal.tsx
│   │       └── PriceEditModal.tsx
│   ├── billing/
│   │   ├── AccountHeader.tsx
│   │   ├── AccountTabs.tsx
│   │   ├── BillingOverview.tsx
│   │   ├── CallDetailRecords.tsx
│   │   ├── CustomerDetailsSidebar.tsx
│   │   └── TransactionsList.tsx
│   ├── business/
│   │   ├── BusinessCoverageChecker.tsx
│   │   ├── BusinessFeatures.tsx
│   │   ├── BusinessHero.tsx
│   │   ├── BusinessPackageCard.tsx
│   │   └── TrustedBySection.tsx
│   ├── checkout/
│   │   ├── OrderConfirmation.tsx
│   │   └── SinglePageCheckout.tsx
│   ├── common/
│   │   └── RegisterInterestForm.tsx
│   ├── contact/
│   │   ├── ContactForm.tsx
│   │   ├── ContactFormRenderer.tsx
│   │   ├── ContactHero.tsx
│   │   ├── ContactInformation.tsx
│   │   ├── QuickActions.tsx
│   │   └── SupportHours.tsx
│   ├── deals/
│   │   ├── DealApplicationForm.tsx
│   │   ├── DealHero.tsx
│   │   └── DeviceConfigurator.tsx
│   ├── demo/
│   │   ├── DemoFAQSection.tsx
│   │   ├── DemoHero.tsx
│   │   ├── DemoPromotionalCarousel.tsx
│   │   ├── DemoSavingsSection.tsx
│   │   └── DemoTestimonials.tsx
│   ├── forms/
│   │   ├── clients/
│   │   ├── common/
│   │   ├── utils/
│   │   ├── BundleQuoteForm.tsx
│   │   └── README.md
│   ├── home/
│   │   ├── BlogPreview.tsx
│   │   ├── Hero.tsx
│   │   ├── LeadMagnet.tsx
│   │   ├── LeadMagnetForm.tsx
│   │   ├── LeadMagnetSuccess.tsx
│   │   ├── SampleItReport.tsx
│   │   ├── ServicesSnapshot.tsx
│   │   ├── SuccessStories.tsx
│   │   └── ValueProposition.tsx
│   ├── home-internet/
│   │   ├── checkout/
│   │   ├── order/
│   │   ├── CoverageHero.tsx
│   │   ├── HomeInternetPackages.tsx
│   │   ├── PackageCard.tsx
│   │   └── PackageFilters.tsx
│   ├── layout/
│   │   ├── Footer.tsx
│   │   └── Navbar.tsx
│   ├── marketing/
│   │   ├── MarketingHero.tsx
│   │   ├── MarketingSections.tsx
│   │   ├── PromotionCard.tsx
│   │   └── PromotionGrid.tsx
│   ├── navigation/
│   │   ├── Logo.tsx
│   │   ├── MobileMenu.tsx
│   │   ├── NavigationData.ts
│   │   └── NavigationMenu.tsx
│   ├── order/
│   │   ├── context/
│   │   ├── stages/
│   │   ├── wizard/
│   │   ├── CompactOrderSummary.tsx
│   │   ├── CoverageStage.tsx
│   │   ├── OrderSummary.tsx
│   │   ├── UnifiedOrderForm.tsx
│   │   └── UnifiedOrderProgress.tsx
│   ├── packages/
│   │   ├── PackageCard.tsx
│   │   ├── PackageComparison.tsx
│   │   └── PromotionBadge.tsx
│   ├── pricing/
│   │   └── DynamicPricingDisplay.tsx
│   ├── pricing-cards/
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── lte-dash.e1612f88.svg
│   │   ├── mtn-pricing-cards.html
│   │   ├── MTN.JO.D-4ef7f5cc.png
│   │   ├── PricingCards.css
│   │   └── PricingCards.tsx
│   ├── products/
│   │   ├── FAQAccordion.tsx
│   │   ├── HowItWorksSection.tsx
│   │   ├── PackageCard.tsx
│   │   ├── PricingComparisonTable.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ProductComparison.tsx
│   │   ├── ProductFilters.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ServicePageContent.tsx
│   │   └── SpecGrid.tsx
│   ├── providers/
│   │   ├── GoogleMapsPreloader.tsx
│   │   ├── OfflineProvider.tsx
│   │   ├── PWAProvider.tsx
│   │   └── QueryProvider.tsx
│   ├── rbac/
│   │   ├── PermissionGate.tsx
│   │   └── RoleTemplateSelector.tsx
│   ├── ui/
│   │   ├── icons/
│   │   ├── sidebar/
│   │   ├── accordion.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── alert.tsx
│   │   ├── aspect-ratio.tsx
│   │   ├── avatar.tsx
│   │   ├── background-beams.tsx
│   │   ├── badge.tsx
│   │   ├── breadcrumb.tsx
│   │   ├── button.tsx
│   │   ├── calendar.tsx
│   │   ├── card.tsx
│   │   ├── carousel.tsx
│   │   ├── chart.tsx
│   │   ├── checkbox.tsx
│   │   ├── collapsible.tsx
│   │   ├── command.tsx
│   │   ├── context-menu.tsx
│   │   ├── device-card.tsx
│   │   ├── dialog.tsx
│   │   ├── drawer.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── floating-dock.tsx
│   │   ├── form.tsx
│   │   ├── hover-border-gradient.tsx
│   │   ├── hover-card.tsx
│   │   ├── input-otp.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── menubar.tsx
│   │   ├── navigation-menu.tsx
│   │   ├── notification.tsx
│   │   ├── package-card.tsx
│   │   ├── pagination.tsx
│   │   ├── popover.tsx
│   │   ├── progress.tsx
│   │   ├── radio-group.tsx
│   │   ├── RecipeCard.tsx
│   │   ├── resizable.tsx
│   │   ├── scroll-area.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── sidebar-motion.tsx
│   │   ├── sidebar.tsx
│   │   ├── skeleton.tsx
│   │   ├── slider.tsx
│   │   ├── sonner.tsx
│   │   ├── spotlight.tsx
│   │   ├── switch.tsx
│   │   ├── tab-selector.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── text-reveal.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   ├── toaster.tsx
│   │   ├── toggle-group.tsx
│   │   ├── toggle.tsx
│   │   └── tooltip.tsx
│   ├── virtual-desktops/
│   │   ├── VirtualDesktopsBenefits.tsx
│   │   ├── VirtualDesktopsCTA.tsx
│   │   ├── VirtualDesktopsFeatures.tsx
│   │   ├── VirtualDesktopsHero.tsx
│   │   └── VirtualDesktopsPricing.tsx
│   ├── wireless/
│   │   ├── checkout/
│   │   ├── order/
│   │   ├── CircleTelPackages.tsx
│   │   ├── EnhancedWirelessPackagesSection.tsx
│   │   ├── ImprovedWirelessPackages.tsx
│   │   ├── pricing-packages-fix.css
│   │   ├── PricingPackages.css
│   │   ├── WhiteSpaceSolution.md
│   │   ├── WirelessFAQ.tsx
│   │   ├── WirelessFeatures.tsx
│   │   ├── WirelessHero.tsx
│   │   └── WirelessPackagesSection.tsx
│   ├── zoho/
│   │   ├── zoho-connection-status.tsx
│   │   ├── zoho-lead-form.tsx
│   │   └── zoho-quick-actions.tsx
│   ├── sidebar-demo-refactored.tsx
│   ├── sidebar-demo.tsx
│   └── wireless-packages-section.tsx
├── docs/
│   ├── admin/
│   │   ├── ADMIN_QUICK_START.md
│   │   ├── PRODUCT_ELEMENT_MAPPING.md
│   │   ├── PRODUCT_PRICING_ADMIN_GUIDE.md
│   │   └── README.md
│   ├── agents/
│   │   ├── DEV_ASSISTANT.md
│   │   └── QUICK_START.md
│   ├── analysis/
│   │   └── 404_ANALYSIS_REPORT.md
│   ├── architecture/
│   │   ├── COVERAGE_INTEGRATION_IMPLEMENTATION.md
│   │   ├── DESIGN_SYSTEM.md
│   │   ├── FTTB_COVERAGE_SYSTEM.md
│   │   ├── infrastructure-fallback-realtime-design.md
│   │   ├── PLAYWRIGHT_MTN_MAP_INTEGRATION.md
│   │   ├── REFACTORING_PLAN.md
│   │   └── sidebar-refactor-migration.md
│   ├── archive/
│   ├── business-requirements/
│   │   ├── Circle_Tel_Business_Requirements_Specification_v2.0_September_2025.md
│   │   ├── CircleTel_Digital_Solution_Requirements_v1.0.md
│   │   └── CircleTel_Digital_Solution_Requirements_v2_0.md
│   ├── claude-docs/
│   │   ├── agent-sdk/
│   │   └── memory-management/
│   │       ├── manage-claude-memory.md
│   │       └── memory-tool.md
│   ├── coverage-tests/
│   │   ├── bryanston-dr-108-20251015-142605/
│   │   └── bryanston-dr-108-20251015-142606/
│   │       ├── local-dev/
│   │       └── mtn-business/
│   ├── deployment/
│   │   ├── DEPLOYMENT_INSTRUCTIONS.md
│   │   ├── DEPLOYMENT.md
│   │   └── STAGING_SETUP_CHECKLIST.md
│   ├── development/
│   │   ├── analysis/
│   │   ├── architecture/
│   │   ├── epics/
│   │   ├── features/
│   │   ├── guides/
│   │   ├── qa/
│   │   ├── setup/
│   │   ├── standards/
│   │   ├── stories/
│   │   ├── CFC-001-01-TESTING-GUIDE.md
│   │   └── README.md
│   ├── environment-examples/
│   │   ├── .env.netcash.example
│   │   ├── .env.production.example
│   │   ├── .env.staging.example
│   │   └── README.md
│   ├── errors/
│   │   └── dynamic-pricing.txt
│   ├── features/
│   │   ├── MTN Feasibility API Integration/
│   │   ├── Feature_Addition_Spec_MTN_Feasibility_v1.0.md
│   │   ├── implementation-plan-ux-optimization.md
│   │   └── wireless-packages-integration.md
│   ├── guides/
│   ├── implementation/
│   │   ├── FTTB_IMPLEMENTATION_SUMMARY.md
│   │   └── SME_SKYFIBRE_IMPLEMENTATION.md
│   ├── integrations/
│   │   ├── mtn/
│   │   ├── CIRCLETEL_CUSTOMER_API_FINDINGS.md
│   │   ├── COVERAGE_API_FEASIBILITY_ANALYSIS.md
│   │   ├── COVERAGE_API_KEY_FINDINGS.md
│   │   ├── IMPLEMENTATION_COMPLETE.md
│   │   ├── INTEGRATION_PLAN.md
│   │   ├── INVESTIGATION_SUMMARY.md
│   │   ├── PLAYWRIGHT_API_TEST_RESULTS.md
│   │   ├── PRODUCTION_COVERAGE_API_ENDPOINTS.md
│   │   ├── SUPERSONIC_API_DISCOVERY.md
│   │   ├── SUPERSONIC_API_INVESTIGATION_RESULTS.md
│   │   ├── SUPERSONIC_ARCHITECTURE.md
│   │   ├── SUPERSONIC_IMPLEMENTATION_GUIDE.md
│   │   ├── SUPERSONIC_INTEGRATION_FINAL_RECOMMENDATIONS.md
│   │   ├── SUPERSONIC_INTEGRATION_SPEC.md
│   │   ├── SUPERSONIC_REGIONAL_COVERAGE_ANALYSIS.md
│   │   ├── SUPERSONIC_SETUP_CHECKLIST.md
│   │   ├── zoho_deployment_guide.md
│   │   └── zoho_mcp_documentation.md
│   ├── marketing/
│   │   ├── IMPLEMENTATION-SUMMARY.md
│   │   ├── quick-start-guide.md
│   │   ├── README.md
│   │   └── SETUP.md
│   ├── products/
│   │   ├── active/
│   │   ├── portfolio/
│   │   ├── CircleTel_Product_Portfolio_Overview.md
│   │   ├── INDEX.md
│   │   ├── Product_Integration_Summary.md
│   │   └── skyfibre-pricing-table.md
│   ├── project-notes/
│   │   ├── AFRIHOST_STYLE_IMPLEMENTATION.md
│   │   ├── MARKETING_CMS_COMPLETED.md
│   │   ├── NEXT_ACTIONS
│   │   ├── PROJECT_KNOWLEDGE_BMAD.md
│   │   └── test-coverage-enhancements.md
│   ├── rbac/
│   │   └── RBAC_SYSTEM_GUIDE.md
│   ├── setup/
│   │   ├── admin-auth-setup.md
│   │   ├── AUTHENTICATION_SETUP.md
│   │   ├── QUICK_START_PRODUCTION_AUTH.md
│   │   └── SUPABASE_AUTH_USER_CREATION.md
│   ├── technical/
│   │   ├── dfa/
│   │   ├── email/
│   │   ├── afrihost_ui_implementation.md
│   │   ├── api-endpoints.docx
│   │   ├── coverage_enhancement_plan.md
│   │   └── DESIGN_SYSTEM.md
│   ├── testing/
│   │   ├── customer-journey/
│   │   └── MTN_CIRCLETEL_COMPARISON.md
│   ├── user-journey/
│   │   ├── supersonic-consumer-signup/
│   │   ├── vox-business-analysis/
│   │   ├── web-africa-coverage-analysis/
│   │   ├── Afrihost-Fibre-Journey-Screen 03.png
│   │   ├── Afrihost-Fibre-Journey-Screen 04 - upsell.png
│   │   ├── Afrihost-Fibre-Journey-Screen 05- upsell.png
│   │   └── Afrihost-Fibre-Journey-Screen 06 -payment method.png
│   ├── zoho/
│   │   └── zoho_mcp_documentation.md
│   ├── CHROME_MCP_SETUP.md
│   ├── COVERAGE_ACCURACY_VERIFICATION.md
│   ├── COVERAGE_CHECKER_FIXES_AND_ROADMAP.md
│   ├── COVERAGE_INTEGRATION_SUCCESS.md
│   ├── DOCUMENTATION_CLEANUP_OCT_2025.md
│   ├── LIVE_COVERAGE_INTEGRATION_SUMMARY.md
│   ├── QUICK_FIX_REFERENCE.md
│   └── README.md
├── hooks/
│   ├── use-campaigns.ts
│   ├── use-deals.ts
│   ├── use-home-internet-packages.ts
│   ├── use-marketing-pages.ts
│   ├── use-mobile.ts
│   ├── use-mobile.tsx
│   ├── use-product-packages.ts
│   ├── use-product-realtime.ts
│   ├── use-products.ts
│   ├── use-promotions.ts
│   ├── use-service-pages.ts
│   ├── use-strapi.ts
│   ├── use-toast.ts
│   ├── use-zoho-mcp.ts
│   ├── useAdminAuth.ts
│   ├── useContactForm.ts
│   ├── useDynamicPricing.ts
│   ├── usePermissions.ts
│   ├── usePricingHistory.ts
│   ├── usePricingRules.ts
│   └── useRealtimeSync.ts
├── integrations/
│   └── supabase/
│       ├── client.ts
│       └── server.ts
├── journey/
│   ├── admin/
│   │   ├── admin-coverage-module-review.md
│   │   ├── analytics-feature-test-results.md
│   │   ├── analytics-test-screenshot.png
│   │   └── real-analytics-integration-success.md
│   ├── mtn-testing/
│   │   ├── corrected-mtn-product-mapping.md
│   │   ├── coverage-implementation-review.md
│   │   ├── mtn-coverage-verification-report.md
│   │   └── tarana-detection-fixes-success.md
│   ├── circletel-localhost-test-results.md
│   ├── circletel-vs-supersonic-comparison.md
│   ├── coverage-journey-verification-summary.md
│   ├── localhost-circletel-homepage.png
│   └── supersonic-user-journey-report.md
├── lib/
│   ├── agents/
│   │   └── dev-assistant-config.ts
│   ├── auth/
│   │   ├── __tests__/
│   │   ├── api-auth.ts
│   │   ├── constants.ts
│   │   ├── dev-auth-service.ts
│   │   ├── prod-auth-service.ts
│   │   └── session-storage.ts
│   ├── order/
│   │   └── types.ts
│   ├── payment/
│   │   ├── netcash-config.ts
│   │   └── netcash-service.ts
│   ├── rbac/
│   │   ├── permissions.ts
│   │   ├── role-templates.ts
│   │   └── types.ts
│   ├── services/
│   │   ├── pricing-service.ts
│   │   ├── product-service.ts
│   │   ├── products-client.ts
│   │   ├── products.ts
│   │   ├── service-packages-client.ts
│   │   └── supabase.ts
│   ├── supabase/
│   │   └── client.ts
│   ├── types/
│   │   ├── agents.ts
│   │   ├── billing.ts
│   │   ├── coverage-providers.ts
│   │   ├── home-internet.ts
│   │   ├── products.ts
│   │   ├── service-packages.ts
│   │   ├── strapi.ts
│   │   ├── wireless-packages.ts
│   │   └── zoho.ts
│   ├── utils/
│   │   ├── aceternity.ts
│   │   └── google-maps.ts
│   ├── googleMapsLoader.ts
│   ├── mock-promotions.ts
│   ├── strapi-client.ts
│   ├── supabase.ts
│   ├── utils.ts
│   ├── wireless-packages-config.json
│   ├── zoho-api-client.ts
│   ├── zoho-mcp-client.ts
│   └── zoho-mcp-direct-client.ts
├── public/
│   ├── devices/
│   │   ├── tp-link-deco-x50/
│   │   ├── tozed-x100-angle.png
│   │   ├── tozed-x100-back.png
│   │   ├── tozed-x100-front.png
│   │   ├── tozed-x100-pro-black.png
│   │   └── tozed-x100-side.png
│   ├── icons/
│   │   ├── icon-128x128.txt
│   │   ├── icon-144x144.png
│   │   ├── icon-144x144.svg
│   │   ├── icon-144x144.txt
│   │   ├── icon-152x152.txt
│   │   ├── icon-192x192.png
│   │   ├── icon-192x192.txt
│   │   ├── icon-384x384.txt
│   │   ├── icon-512x512.png
│   │   ├── icon-512x512.txt
│   │   ├── icon-72x72.txt
│   │   └── icon-96x96.txt
│   ├── images/
│   │   ├── icons/
│   │   ├── packages/
│   │   └── payment-logos/
│   │       ├── amex.png
│   │       ├── mastercard.png
│   │       ├── netcash-horizontal.png
│   │       ├── ssl-secure.png
│   │       └── visa.png
│   ├── lovable-uploads/
│   │   └── 0d94be75-5c0a-44bf-95fa-777a85da966e.png
│   ├── products/
│   │   └── tp-link-deco-x50-3pack.webp
│   ├── afrihost-wireless-demo.css
│   ├── afrihost-wireless-demo.html
│   ├── afrihost-wireless-demo.js
│   ├── circletel-logo.png
│   ├── favicon.ico
│   ├── icon.svg
│   ├── manifest.json
│   ├── sw.js
│   ├── whatsapp-icon.svg
│   └── workbox-00a24876.js
├── scripts/
│   ├── analyze-api-recording.ts
│   ├── apply-migration.js
│   ├── apply-skyfibre-migration.js
│   ├── check-migration.js
│   ├── direct-migration.js
│   ├── generate-icons.js
│   ├── import-afrihost-devices.ts
│   ├── migrate-excel-products.ts
│   ├── query-skyfibre.sql
│   ├── setup-strapi-marketing.sh
│   ├── test-chrome-mcp.js
│   ├── test-circletel-api-simple.ts
│   ├── test-circletel-customer-api.ts
│   ├── test-circletel-portal-with-playwright.ts
│   ├── test-coverage-api-recording.ts
│   ├── test-customer-journey-complete.ts
│   ├── test-dynamic-pricing.ts
│   ├── test-live-mtn-api.js
│   ├── test-mtn-api.js
│   ├── test-mtn-coverage-detailed.ts
│   ├── test-mtn-enhanced-headers.ts
│   ├── test-mtn-parser.ts
│   ├── test-mtn-wholesale-api.js
│   ├── test-mtn-wholesale-page.ts
│   ├── test-mtn-wms-direct.sh
│   ├── test-supersonic-direct-api.ts
│   ├── test-supersonic-integration.ts
│   ├── test-supersonic-with-delay.ts
│   ├── trigger-migration.js
│   ├── verify-migration.js
│   └── verify-product-pricing.ts
├── services/
│   ├── coverageApi.ts
│   ├── googleMaps.ts
│   └── supabase.ts
├── strapi-cms/
│   ├── config/
│   │   ├── admin.ts
│   │   ├── api.ts
│   │   ├── database.ts
│   │   ├── middlewares.ts
│   │   ├── plugins.ts
│   │   ├── rbac-marketing.md
│   │   └── server.ts
│   ├── database/
│   │   └── migrations/
│   │       └── .gitkeep
│   ├── public/
│   │   ├── uploads/
│   │   └── robots.txt
│   ├── src/
│   │   ├── admin/
│   │   ├── api/
│   │   ├── components/
│   │   ├── extensions/
│   │   └── index.ts
│   ├── .env
│   ├── .env.example
│   ├── favicon.png
│   ├── package.json
│   ├── README.md
│   └── tsconfig.json
├── supabase/
│   ├── .temp/
│   │   ├── cli-latest
│   │   ├── gotrue-version
│   │   ├── pooler-url
│   │   ├── postgres-version
│   │   ├── project-ref
│   │   ├── rest-version
│   │   └── storage-version
│   ├── functions/
│   │   ├── _shared/
│   │   ├── admin-approval-workflow/
│   │   ├── admin-auth/
│   │   ├── admin-product-management/
│   │   ├── admin-signup/
│   │   ├── check-coverage/
│   │   ├── check-fttb-coverage/
│   │   ├── send-audit-notification/
│   │   ├── unjani-form-submission/
│   │   ├── zoho-callback/
│   │   └── zoho-crm/
│   │       └── index.ts
│   ├── migrations/
│   │   ├── 20241228_add_sample_products.sql
│   │   ├── 20241228_create_products_tables.sql
│   │   ├── 20241229000001_create_products_real_circletel_data.sql
│   │   ├── 20250101000001_create_coverage_system_tables.sql
│   │   ├── 20250130000001_create_product_audit_logs.sql
│   │   ├── 20250131000001_create_admin_users.sql
│   │   ├── 20250131000002_create_service_type_mapping.sql
│   │   ├── 20250131000003_add_mtn_5g_lte_packages.sql
│   │   ├── 20250201000001_create_orders_table.sql
│   │   ├── 20250201000002_add_payment_columns_to_orders.sql
│   │   ├── 20250201000003_create_pending_admin_users.sql
│   │   ├── 20250201000004_add_test_admin_account.sql
│   │   ├── 20250201000005_create_rbac_system.sql
│   │   ├── 20250923_create_unjani_contract_audits.sql
│   │   ├── 20250928000001_create_cjf_001_tables.sql
│   │   ├── 20250929000002_create_coverage_maps_table.sql
│   │   ├── 20251004000001_add_phase1_tracking_to_coverage_leads.sql
│   │   ├── 20251005000001_add_customer_type_to_packages.sql
│   │   ├── 20251005000002_create_fttb_providers_system.sql
│   │   ├── 20251005000003_add_sme_skyfibre_packages.sql
│   │   ├── 20251005000004_fix_product_category_mapping.sql
│   │   ├── 20251005000005_fix_consumer_package_visibility.sql
│   │   ├── 20251005000006_create_service_packages_audit_log.sql
│   │   ├── 20251013000001_add_dynamic_pricing_system.sql
│   │   ├── 20251015000001_update_skyfibre_to_tarana_specifications.sql
│   │   ├── 20251016000001_create_product_catalogue.sql
│   │   ├── 20251215000001_create_admin_product_catalogue.sql
│   │   ├── 20251230000001_create_otp_verifications.sql
│   │   └── 20251230000002_create_customers_and_orders.sql
│   └── config.toml
├── test-results/
│   ├── .last-run.json
│   ├── api-analysis-report.txt
│   └── coverage-api-recording-2025-10-16T08-14-00-150Z.json
├── tests/
│   ├── e2e/
│   │   └── supersonic-integration.spec.ts
│   └── unit/
│       ├── supersonic-mapper.test.ts
│       └── technology-detector.test.ts
├── types/
│   └── tabler-icons.d.ts
├── uploads/
│   └── coverage-maps/
│       ├── mtn-1759173688162-20250716-mtn-sa.kmz
│       ├── mtn-1759174055806-20250716-mtn-sa.kmz
│       ├── mtn-1759175809635-20250716-mtn-sa.kmz
│       └── mtn-1759176178077-20250716-mtn-sa.kmz
├── .env
├── .env.example
├── .env.local
├── .env.local.example
├── .eslintrc.json
├── .gitignore
├── .mcp.json
├── AGENTS.md
├── CLAUDE.md
├── CODEBASE_REVIEW.md
├── components.json
├── MANUAL_MIGRATION.sql
├── mtn-coverage-cache.sql
├── next-env.d.ts
├── next.config.js
├── nul
├── package.json
├── postcss.config.js
├── structure.txt
├── SUPERSONIC_IMPLEMENTATION_SUMMARY.md
├── SUPERSONIC_QUICK_REFERENCE.md
├── tailwind.config.ts
├── test-analytics-api.js
├── test-analytics-simple.js
├── tsconfig.json
├── tsconfig.tsbuildinfo
└── vercel.json
```

## Key Directory Overview

### Application Structure (`/app`)
- **Admin Panel** (`/admin`) - Complete administrative interface with:
  - Billing system
  - CMS management
  - Dashboard
  - Dev assistant (AI-powered)
  - Products management
  - Service packages
  - User management
  - Workflow automation
  - Zoho CRM integration

- **Public Pages** - Customer-facing pages including:
  - Business packages and solutions
  - Home internet offerings
  - Wireless packages
  - Promotional campaigns and deals
  - Contact and support
  - Resources and guides

- **API Routes** (`/api`) - Backend endpoints for:
  - Admin operations
  - AI agents
  - Authentication
  - Coverage checking
  - Dynamic pricing
  - Payment processing (Netcash)
  - Product management
  - Zoho integration

### Components (`/components`)
- **60+ UI Components** - Built on shadcn/ui and Radix UI
- **Business Logic Components** - Billing, checkout, forms, orders
- **Marketing Components** - Promotions, campaigns, landing pages
- **RBAC Components** - PermissionGate, RoleTemplateSelector
- **Provider Components** - PWA, offline support, React Query

### Claude Configuration (`/.claude`)
- **Memory Architecture** - Modular domain-specific contexts (7 domains)
  - Backend, Frontend, Infrastructure, Integrations, CMS, Product, Testing
- **Skills System** - 5 automated workflows with progressive disclosure
  - `deployment-check` - Pre-deployment validation
  - `coverage-check` - Multi-provider testing
  - `product-import` - Excel → Supabase imports
  - `admin-setup` - RBAC configuration (17 roles, 100+ permissions)
  - `supabase-fetch` - Database queries (9 operations)
- **Agent Templates** - 13 specialized AI agents
- **Slash Commands** - Custom workflow commands

### Documentation (`/docs`)
- **Claude Docs** - Memory management, skills guide
- **Admin Guides** - Quick start, pricing guide, product mapping
- **Agents** - Dev assistant documentation
- **Architecture** - Coverage system, FTTB implementation, design system
- **Business Requirements** - Comprehensive specifications
- **Deployment** - Production and staging setup guides
- **Integrations** - MTN, Supersonic, Zoho documentation
- **Marketing** - CMS guides and quick starts
- **RBAC** - Complete role-based access control guide
- **Setup** - Authentication and Supabase setup

### Backend Library (`/lib`)
- **Auth** - Dev/production authentication services
- **Agents** - AI-powered development assistant configuration
- **RBAC** - Permissions, role templates, type definitions (100+ permissions, 17 role templates)
- **Services** - Pricing, products, Supabase client
- **Types** - TypeScript definitions for all entities
- **Payment** - Netcash integration

### Database (`/supabase`)
- **30+ Migrations** - Comprehensive database schema including:
  - Products and packages
  - Coverage system
  - Orders and customers
  - RBAC system
  - Dynamic pricing
  - Audit logging

- **Edge Functions** - Serverless functions for:
  - Admin authentication and workflows
  - Coverage checking (FTTB, general)
  - Zoho CRM operations

### Testing & Scripts (`/scripts`)
- Coverage API testing (MTN, Supersonic)
- Migration utilities
- Product verification
- Integration testing

### Additional Features
- **Strapi CMS** (`/strapi-cms`) - Headless CMS for marketing content
- **PWA Support** - Service worker, offline functionality, manifest
- **Agent OS** - AI-powered development workflow system
- **Journey Tracking** - User journey documentation and test results

## Tech Stack Summary

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **CMS**: Strapi
- **Auth**: Supabase Auth + Custom RBAC
- **State**: Zustand + React Query
- **Payment**: Netcash
- **Testing**: Playwright
- **Deployment**: Vercel
- **AI Integration**: Claude Agent SDK
- **Development Tools**: Claude Code with Skills + Modular Memory

## Claude Code Integration

### Modular Memory System (Token Efficient)
- **Main Memory**: `.claude/CLAUDE.md` (1,500 tokens)
- **Domain Contexts**: 7 specialized memory files (2,000 tokens each)
- **Efficiency**: Load only 1 domain at a time = 3,500 tokens vs 10,000+ previously
- **Reduction**: 85% decrease in wasted context

### Skills System (Automated Workflows)
| Skill | Purpose | Token Cost |
|-------|---------|------------|
| deployment-check | TypeScript + Build + Env validation | ~2k tokens |
| coverage-check | Multi-provider API testing | ~2.5k tokens |
| product-import | Excel validation + Supabase import | ~2k tokens |
| admin-setup | RBAC with 17 roles, 100+ permissions | ~3k tokens |
| supabase-fetch | Database queries (9 operations) | ~1.5k tokens |

**Total**: 5 skills, 17 files, 89% token reduction vs manual approach

### Quick Commands
```bash
# Pre-deployment validation
powershell -File .claude/skills/deployment-check/run-deployment-check.ps1

# Coverage testing
powershell -File .claude/skills/coverage-check/run-coverage-tests.ps1

# Database queries
powershell -File .claude/skills/supabase-fetch/run-supabase.ps1 -Operation stats
```

**Documentation**: See `.claude/skills/README.md` for complete guide

---

*Last updated: October 17, 2025*
*Project Structure Version: 2.0 (Added Claude Code integration)*
