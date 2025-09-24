
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import Index from "./pages/Index";
import Services from "./pages/Services";
import SmallBusinessServices from "./pages/SmallBusinessServices";
import MidSizeBusinessServices from "./pages/MidSizeBusinessServices";
import GrowthReadyServices from "./pages/GrowthReadyServices";
import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";
import Bundles from "./pages/Bundles";
import Connectivity from "./pages/Connectivity";
import WifiAsService from "./pages/WifiAsService";
import FixedWireless from "./pages/FixedWireless";
import Fibre from "./pages/Fibre";
import Contact from "./pages/Contact";
import Resources from "./pages/Resources";
import ConnectivityGuide from "./pages/ConnectivityGuide";
import WiFiToolkit from "./pages/WiFiToolkit";
import ITAssessment from "./pages/ITAssessment";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

// Cloud pages and PowerBackupSolutions page
import CloudMigration from "./pages/CloudMigration";
import CloudHosting from "./pages/CloudHosting";
import CloudBackup from "./pages/CloudBackup";
import PowerBackupSolutions from "./pages/PowerBackupSolutions";
import SecurityServices from "./pages/SecurityServices";

// Virtual Desktops page
import VirtualDesktops from "./pages/VirtualDesktops";

// New Bundle pages
import BusinessConnect from "./pages/BusinessConnect";
import BusinessPro from "./pages/BusinessPro";
import HomeSohoResilience from "./pages/HomeSohoResilience";

// Internal Documentation pages
import InternalDocs from "./pages/InternalDocs";
import DesignTokens from "./pages/docs/DesignTokens";
import ComponentLibrary from "./pages/docs/ComponentLibrary";
import AccessibilityGuide from "./pages/docs/AccessibilityGuide";

// Admin pages
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminLogin } from "./pages/admin/AdminLogin";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { ProductManagement } from "./pages/admin/ProductManagement";
import { ApprovalWorkflow } from "./pages/admin/ApprovalWorkflow";

// Admin Documentation
import AdminDocsLayout from "./components/admin/docs/AdminDocsLayout";
import AdminOverview from "./pages/admin/docs/Overview";
import AdminAuthentication from "./pages/admin/docs/Authentication";
import AdminApiReference from "./pages/admin/docs/ApiReference";
import AdminTroubleshooting from "./pages/admin/docs/Troubleshooting";

// Client Forms
import { ClientForms } from "./pages/ClientForms";
import { UnjaniContractAuditForm } from "./components/forms/clients/unjani/ContractAuditForm";

// Protected Route
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// Design Playground - LOCAL ONLY (gitignored)
import { PlaygroundFonts } from "../design-playground/playground-fonts";
import { PlaygroundColors } from "../design-playground/playground-colors";
import { PlaygroundInteractions } from "../design-playground/playground-interactions";
import { PlaygroundAccordion } from "../design-playground/playground-accordion";
import { PlaygroundStyling } from "../design-playground/playground-styling";
import { PlaygroundCircleTel } from "../design-playground/playground-circletel";

// Create a QueryClient for React Query
const queryClient = new QueryClient();

const App = () => (
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Main routes */}
            <Route path="/" element={<Index />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/small-business" element={<SmallBusinessServices />} />
            <Route path="/services/mid-size" element={<MidSizeBusinessServices />} />
            <Route path="/services/growth-ready" element={<GrowthReadyServices />} />
            <Route path="/services/security" element={<SecurityServices />} />
            
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/bundles" element={<Bundles />} />
            
            {/* Bundle pages */}
            <Route path="/bundles/business-connect" element={<BusinessConnect />} />
            <Route path="/bundles/business-pro" element={<BusinessPro />} />
            <Route path="/bundles/home-soho-resilience" element={<HomeSohoResilience />} />
            
            {/* Connectivity routes */}
            <Route path="/connectivity" element={<Connectivity />} />
            <Route path="/connectivity/wifi-as-a-service" element={<WifiAsService />} />
            <Route path="/connectivity/fixed-wireless" element={<FixedWireless />} />
            <Route path="/connectivity/fibre" element={<Fibre />} />
            
            {/* Cloud routes */}
            <Route path="/cloud/migration" element={<CloudMigration />} />
            <Route path="/cloud/hosting" element={<CloudHosting />} />
            <Route path="/cloud/backup" element={<CloudBackup />} />
            <Route path="/cloud/virtual-desktops" element={<VirtualDesktops />} />
            
            {/* Resources routes */}
            <Route path="/resources" element={<Resources />} />
            <Route path="/resources/it-health" element={<ITAssessment />} />
            <Route path="/resources/power-backup" element={<PowerBackupSolutions />} />
            <Route path="/resources/connectivity-guide" element={<ConnectivityGuide />} />
            <Route path="/resources/wifi-toolkit" element={<WiFiToolkit />} />
            
            {/* Additional routes */}
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />

            {/* Internal Documentation routes - Team access only */}
            <Route path="/internal-docs" element={<InternalDocs />} />
            <Route path="/internal-docs/tokens" element={<DesignTokens />} />
            <Route path="/internal-docs/atoms" element={<ComponentLibrary />} />
            <Route path="/internal-docs/molecules" element={<ComponentLibrary />} />
            <Route path="/internal-docs/organisms" element={<ComponentLibrary />} />
            <Route path="/internal-docs/typography" element={<DesignTokens />} />
            <Route path="/internal-docs/spacing" element={<DesignTokens />} />
            <Route path="/internal-docs/icons" element={<DesignTokens />} />
            <Route path="/internal-docs/examples" element={<ComponentLibrary />} />
            <Route path="/internal-docs/accessibility" element={<AccessibilityGuide />} />
            <Route path="/internal-docs/performance" element={<ComponentLibrary />} />

            {/* Admin routes - Protected */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<ProductManagement />} />
              <Route path="approvals" element={<ApprovalWorkflow />} />

              {/* Client Forms routes - Admin only */}
              <Route path="forms" element={
                <ProtectedRoute requiredRole="editor">
                  <ClientForms />
                </ProtectedRoute>
              } />
            </Route>

            {/* Admin Documentation routes - Protected */}
            <Route path="/admin/docs" element={<AdminDocsLayout />}>
              <Route index element={<Navigate to="/admin/docs/overview" replace />} />
              <Route path="overview" element={<AdminOverview />} />
              <Route path="authentication" element={<AdminAuthentication />} />
              <Route path="api-reference" element={<AdminApiReference />} />
              <Route path="troubleshooting" element={<AdminTroubleshooting />} />
              <Route path="product-management" element={<AdminOverview />} />
              <Route path="workflows" element={<AdminOverview />} />
              <Route path="user-management" element={<AdminOverview />} />
              <Route path="database" element={<AdminOverview />} />
              <Route path="realtime" element={<AdminOverview />} />
              <Route path="error-codes" element={<AdminTroubleshooting />} />
            </Route>

            {/* Public Client Forms */}
            <Route path="/forms/unjani/contract-audit" element={<UnjaniContractAuditForm />} />

            {/* Legacy forms redirect - redirect to admin (except unjani which is public) */}
            <Route path="/forms" element={<Navigate to="/admin/login" replace />} />

            {/* Design Playground - LOCAL DEVELOPMENT ONLY */}
            {process.env.NODE_ENV === 'development' && (
              <>
                <Route path="/playground/fonts" element={<PlaygroundFonts />} />
                <Route path="/playground/colors" element={<PlaygroundColors />} />
                <Route path="/playground/interactions" element={<PlaygroundInteractions />} />
                <Route path="/playground/accordion" element={<PlaygroundAccordion />} />
                <Route path="/playground/styling" element={<PlaygroundStyling />} />
                <Route path="/playground/circletel" element={<PlaygroundCircleTel />} />
              </>
            )}

            {/* 404 page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
      <Analytics />
    </QueryClientProvider>
  </React.StrictMode>
);

export default App;
