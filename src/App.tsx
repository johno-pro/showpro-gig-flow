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
import Contacts from "./pages/Contacts";
import NewContact from "./pages/NewContact";
import ContactDetails from "./pages/ContactDetails";
import Suppliers from "./pages/Suppliers";
import NewSupplier from "./pages/NewSupplier";
import SupplierDetails from "./pages/SupplierDetails";
import Departments from "./pages/Departments";
import Teams from "./pages/Teams";
import NewTeam from "./pages/NewTeam";
import TeamDetails from "./pages/TeamDetails";
import Payments from "./pages/Payments";
import NewPayment from "./pages/NewPayment";
import PaymentDetails from "./pages/PaymentDetails";
import PaymentsRemittance from "./pages/PaymentsRemittance";
import EmailsQueue from "./pages/EmailsQueue";
import InvoiceBatches from "./pages/InvoiceBatches";
import NewInvoiceBatch from "./pages/NewInvoiceBatch";
import InvoiceBatchDetails from "./pages/InvoiceBatchDetails";
import BookingSeries from "./pages/BookingSeries";
import NewBookingSeries from "./pages/NewBookingSeries";
import BookingSeriesDetails from "./pages/BookingSeriesDetails";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import DataImport from "./pages/DataImport";
import FixArtistLinks from "./pages/FixArtistLinks";

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
              path="/contacts"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Contacts />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/contacts/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <NewContact />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/contacts/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ContactDetails />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/suppliers"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suppliers />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/suppliers/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <NewSupplier />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/suppliers/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SupplierDetails />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/departments"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Departments />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teams"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Teams />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teams/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <NewTeam />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teams/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TeamDetails />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Payments />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <NewPayment />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PaymentDetails />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/remittance"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PaymentsRemittance />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/emails-queue"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EmailsQueue />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoice-batches"
              element={
                <ProtectedRoute>
                  <Layout>
                    <InvoiceBatches />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoice-batches/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <NewInvoiceBatch />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoice-batches/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <InvoiceBatchDetails />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/booking-series"
              element={
                <ProtectedRoute>
                  <Layout>
                    <BookingSeries />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/booking-series/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <NewBookingSeries />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/booking-series/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <BookingSeriesDetails />
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
            <Route
              path="/fix-artist-links"
              element={
                <ProtectedRoute>
                  <Layout>
                    <FixArtistLinks />
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
