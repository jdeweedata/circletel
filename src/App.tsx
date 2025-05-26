
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Services from "./pages/Services";
import SmallBusinessServices from "./pages/SmallBusinessServices";
import MidSizeBusinessServices from "./pages/MidSizeBusinessServices";
import GrowthReadyServices from "./pages/GrowthReadyServices";
import About from "./pages/About";
import AboutTeam from "./pages/AboutTeam";
import AboutCertifications from "./pages/AboutCertifications";
import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";
import Bundles from "./pages/Bundles";
import CaseStudies from "./pages/CaseStudies";
import Connectivity from "./pages/Connectivity";
import WifiAsService from "./pages/WifiAsService";
import FixedWireless from "./pages/FixedWireless";
import Fibre from "./pages/Fibre";
import Contact from "./pages/Contact";
import Resources from "./pages/Resources";
import ConnectivityGuide from "./pages/ConnectivityGuide";
import WiFiToolkit from "./pages/WiFiToolkit";
import Blog from "./pages/Blog";
import BlogArchive from "./pages/BlogArchive";
import BlogLoadSheddingSolutions from "./pages/BlogLoadSheddingSolutions";
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
            
            {/* About routes */}
            <Route path="/about" element={<About />} />
            <Route path="/about/team" element={<AboutTeam />} />
            <Route path="/about/certifications" element={<AboutCertifications />} />
            
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/bundles" element={<Bundles />} />
            <Route path="/case-studies" element={<CaseStudies />} />
            
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
            
            {/* Blog routes */}
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/archive" element={<BlogArchive />} />
            <Route path="/blog/stay-operational-during-load-shedding" element={<BlogLoadSheddingSolutions />} />
            
            {/* Additional routes */}
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            
            {/* 404 page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);

export default App;
