
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Services from "./pages/Services";
import SmallBusinessServices from "./pages/SmallBusinessServices";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";
import CaseStudies from "./pages/CaseStudies";
import Connectivity from "./pages/Connectivity";
import WifiAsService from "./pages/WifiAsService";
import FixedWireless from "./pages/FixedWireless";
import Fibre from "./pages/Fibre";
import Contact from "./pages/Contact";
import Resources from "./pages/Resources";
import Blog from "./pages/Blog";
import ITAssessment from "./pages/ITAssessment";

const queryClient = new QueryClient();

const App = () => (
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/small-business" element={<SmallBusinessServices />} />
            <Route path="/about" element={<About />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/case-studies" element={<CaseStudies />} />
            <Route path="/connectivity" element={<Connectivity />} />
            <Route path="/connectivity/wifi-as-a-service" element={<WifiAsService />} />
            <Route path="/connectivity/fixed-wireless" element={<FixedWireless />} />
            <Route path="/connectivity/fibre" element={<Fibre />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/resources/it-health" element={<ITAssessment />} />
            {/* Future pages will be added here */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);

export default App;
