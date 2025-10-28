import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "./lib/auth";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Bookings from "./pages/Bookings";
import NewBooking from "./pages/NewBooking";
import BookingDetails from "./pages/BookingDetails";
import Artists from "./pages/Artists";
import NewArtist from "./pages/NewArtist";
import ArtistDetails from "./pages/ArtistDetails";
import Clients from "./pages/Clients";
import NewClient from "./pages/NewClient";
import ClientDetails from "./pages/ClientDetails";
import Venues from "./pages/Venues";
import NewVenue from "./pages/NewVenue";
import VenueDetails from "./pages/VenueDetails";
import Locations from "./pages/Locations";
import NewLocation from "./pages/NewLocation";
import LocationDetails from "./pages/LocationDetails";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import DataImport from "./pages/DataImport";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Bookings />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <NewBooking />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <BookingDetails />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/artists"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Artists />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/artists/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <NewArtist />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/artists/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ArtistDetails />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/venues"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Venues />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/venues/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <NewVenue />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/venues/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <VenueDetails />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Clients />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <NewClient />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ClientDetails />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/locations"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Locations />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/locations/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <NewLocation />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/locations/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <LocationDetails />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ProtectedRoute>
                  <Layout>
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold mb-2">Payments</h2>
                      <p className="text-muted-foreground">Payment tracking coming soon</p>
                    </div>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices"
              element={
                <ProtectedRoute>
                  <Layout>
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold mb-2">Invoices</h2>
                      <p className="text-muted-foreground">Invoice management coming soon</p>
                    </div>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/import"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DataImport />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
