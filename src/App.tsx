import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import TermsLibrary from "./pages/TermsLibrary";
import InvoiceBatches from "./pages/InvoiceBatches";
import NewInvoiceBatch from "./pages/NewInvoiceBatch";
import InvoiceBatchDetails from "./pages/InvoiceBatchDetails";
import InvoiceDetails from "./pages/InvoiceDetails";
import BookingSeries from "./pages/BookingSeries";
import NewBookingSeries from "./pages/NewBookingSeries";
import BookingSeriesDetails from "./pages/BookingSeriesDetails";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import DataImport from "./pages/DataImport";
import DataManagement from "./pages/DataManagement";
import FixArtistLinks from "./pages/FixArtistLinks";
import Diary from "./pages/Diary";
import JobExplorer from "./pages/JobExplorer";
import AdminUsers from "./pages/AdminUsers";
import RolesPermissions from "./pages/RolesPermissions";
import ProfileSettings from "./pages/ProfileSettings";
import CompanySettings from "./pages/CompanySettings";

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
              path="/terms-library"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TermsLibrary />
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
            <Route path="/invoices" element={<Navigate to="/invoice-batches" replace />} />
            <Route
              path="/invoices/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <InvoiceDetails />
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
              path="/data-management"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DataManagement />
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
            <Route
              path="/diary"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Diary />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/job-explorer"
              element={
                <ProtectedRoute>
                  <Layout>
                    <JobExplorer />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AdminUsers />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/roles"
              element={
                <ProtectedRoute>
                  <Layout>
                    <RolesPermissions />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile-settings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProfileSettings />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/company-settings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CompanySettings />
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
