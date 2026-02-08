import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { BottomNav } from "@/components/BottomNav";
import { Loader2 } from "lucide-react";

// Lazy-loaded pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const BuyPage = lazy(() => import("./pages/BuyPage"));
const RentPage = lazy(() => import("./pages/RentPage"));
const AirbnbPage = lazy(() => import("./pages/AirbnbPage"));
const AgentsPage = lazy(() => import("./pages/AgentsPage"));
const PropertyDetailPage = lazy(() => import("./pages/PropertyDetailPage"));
const AuthPage = lazy(() => import("./pages/auth/AuthPage"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminLandlordsPage = lazy(() => import("./pages/admin/AdminLandlordsPage"));
const AdminPropertiesPage = lazy(() => import("./pages/admin/AdminPropertiesPage"));
const AdminListingsPage = lazy(() => import("./pages/admin/AdminListingsPage"));
const AdminRevenuePage = lazy(() => import("./pages/admin/AdminRevenuePage"));
const AdminAirbnbPage = lazy(() => import("./pages/admin/AdminAirbnbPage"));
const LandlordDashboard = lazy(() => import("./pages/landlord/LandlordDashboard"));
const LandlordPropertiesPage = lazy(() => import("./pages/landlord/LandlordPropertiesPage"));
const AddPropertyPage = lazy(() => import("./pages/landlord/AddPropertyPage"));
const EditPropertyPage = lazy(() => import("./pages/landlord/EditPropertyPage"));
const LandlordInquiriesPage = lazy(() => import("./pages/landlord/LandlordInquiriesPage"));
const LandlordMessagesPage = lazy(() => import("./pages/landlord/LandlordMessagesPage"));
const UserDashboard = lazy(() => import("./pages/user/UserDashboard"));
const UserInquiriesPage = lazy(() => import("./pages/user/UserInquiriesPage"));
const UserFavoritesPage = lazy(() => import("./pages/user/UserFavoritesPage"));
const UserMessagesPage = lazy(() => import("./pages/user/UserMessagesPage"));
const UserBookingsPage = lazy(() => import("./pages/user/UserBookingsPage"));
const LandlordAirbnbPage = lazy(() => import("./pages/landlord/LandlordAirbnbPage"));
const UserBookingDetailPage = lazy(() => import("./pages/user/UserBookingDetailPage"));
const LandlordBookingDetailPage = lazy(() => import("./pages/landlord/LandlordBookingDetailPage"));
const LandlordProfilePage = lazy(() => import("./pages/landlord/LandlordProfilePage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 minutes — data stays fresh, no refetch on mount
      gcTime: 10 * 60 * 1000,     // 10 minutes — keep unused data in cache
      refetchOnWindowFocus: false, // Don't refetch when user tabs back
      retry: 1,                   // Only retry once on failure
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FavoritesProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen flex flex-col">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/buy" element={<BuyPage />} />
                  <Route path="/rent" element={<RentPage />} />
                  <Route path="/airbnb" element={<AirbnbPage />} />
                  <Route path="/agents" element={<AgentsPage />} />
                  <Route path="/property/:id" element={<PropertyDetailPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<AdminUsersPage />} />
                  <Route path="/admin/landlords" element={<AdminLandlordsPage />} />
                  <Route path="/admin/properties" element={<AdminPropertiesPage />} />
                  <Route path="/admin/listings" element={<AdminListingsPage />} />
                  <Route path="/admin/revenue" element={<AdminRevenuePage />} />
                  <Route path="/admin/airbnb" element={<AdminAirbnbPage />} />
                  <Route path="/landlord" element={<LandlordDashboard />} />
                  <Route path="/landlord/properties" element={<LandlordPropertiesPage />} />
                  <Route path="/landlord/add-property" element={<AddPropertyPage />} />
                  <Route path="/landlord/edit-property/:id" element={<EditPropertyPage />} />
                  <Route path="/landlord/inquiries" element={<LandlordInquiriesPage />} />
                  <Route path="/landlord/messages" element={<LandlordMessagesPage />} />
                  <Route path="/dashboard" element={<UserDashboard />} />
                  <Route path="/dashboard/messages" element={<UserMessagesPage />} />
                  <Route path="/dashboard/inquiries" element={<UserInquiriesPage />} />
                  <Route path="/dashboard/favorites" element={<UserFavoritesPage />} />
                  <Route path="/dashboard/bookings" element={<UserBookingsPage />} />
                  <Route path="/dashboard/bookings/:id" element={<UserBookingDetailPage />} />
                  <Route path="/landlord/airbnb-bookings" element={<LandlordAirbnbPage />} />
                  <Route path="/landlord/airbnb-bookings/:id" element={<LandlordBookingDetailPage />} />
                  <Route path="/landlord/profile" element={<LandlordProfilePage />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <BottomNav />
            </div>
          </BrowserRouter>
      </TooltipProvider>
      </FavoritesProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
