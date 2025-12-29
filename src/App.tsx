
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/admin/Dashboard";
import HeroBanners from "./pages/admin/HeroBanners";
import AboutUs from "./pages/admin/AboutUs";
import CorporateEntities from "./pages/admin/CorporateEntities";
import Articles from "./pages/admin/Articles";
import Certifications from "./pages/admin/Certifications";
import ProductCategories from "./pages/admin/ProductCategories";
import Products from "./pages/admin/Products";
import Careers from "./pages/admin/Careers";
import Applications from "./pages/admin/Applications";
import ContactInfo from "./pages/admin/ContactInfo";
import NotFound from "./pages/NotFound";
import AdminCompanyProfiles from "./pages/admin/AdminCompanyProfiles";
import FormSubmissions from "./pages/admin/FormSubmissions";
import ProductEmailAnalytics from "./pages/admin/ProductEmailAnalytics";
import Certificates from "./pages/admin/Certificates";
import TopProducts from "./pages/admin/TopProducts";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="hero-banners" element={<HeroBanners />} />
            <Route path="about-us" element={<AboutUs />} />
            <Route path="corporate-entities" element={<CorporateEntities />} />
            <Route path="certifications" element={<Certifications />} />
            <Route path="product-categories" element={<ProductCategories />} />
            <Route path="products" element={<Products />} />
            <Route path="top-products" element={<TopProducts />} />
            <Route path="articles" element={<Articles />} />
            <Route path="careers" element={<Careers />} />
            <Route path="applications" element={<Applications />} />
            <Route path="contact-info" element={<ContactInfo />} />
            <Route path="company-profiles-admin" element={<AdminCompanyProfiles />} />
            <Route path="form-submissions" element={<FormSubmissions />} />
            <Route path="product-email-analytics" element={<ProductEmailAnalytics />} />
            <Route path="certificates" element={<Certificates />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
