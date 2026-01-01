import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import BuyPage from "./pages/BuyPage";
import RentPage from "./pages/RentPage";
import AirbnbPage from "./pages/AirbnbPage";
import PropertyDetailPage from "./pages/PropertyDetailPage";
import AuthPage from "./pages/auth/AuthPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminLandlordsPage from "./pages/admin/AdminLandlordsPage";
import AdminPropertiesPage from "./pages/admin/AdminPropertiesPage";
import LandlordDashboard from "./pages/landlord/LandlordDashboard";
import LandlordPropertiesPage from "./pages/landlord/LandlordPropertiesPage";
import AddPropertyPage from "./pages/landlord/AddPropertyPage";
import LandlordInquiriesPage from "./pages/landlord/LandlordInquiriesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/buy" element={<BuyPage />} />
            <Route path="/rent" element={<RentPage />} />
            <Route path="/airbnb" element={<AirbnbPage />} />
            <Route path="/property/:id" element={<PropertyDetailPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/landlords" element={<AdminLandlordsPage />} />
            <Route path="/admin/properties" element={<AdminPropertiesPage />} />
            <Route path="/landlord" element={<LandlordDashboard />} />
            <Route path="/landlord/properties" element={<LandlordPropertiesPage />} />
            <Route path="/landlord/add-property" element={<AddPropertyPage />} />
            <Route path="/landlord/inquiries" element={<LandlordInquiriesPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
