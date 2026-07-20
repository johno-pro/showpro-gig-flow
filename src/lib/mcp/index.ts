import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listBookings from "./tools/list-bookings";
import getBooking from "./tools/get-booking";
import listArtists from "./tools/list-artists";
import listClients from "./tools/list-clients";
import listVenues from "./tools/list-venues";
import listInvoices from "./tools/list-invoices";

// The OAuth issuer MUST be the direct Supabase host, built from the project ref
// at build time so this module stays import-safe (no runtime env reads).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "showpro-mcp",
  title: "ShowPro Booking System",
  version: "0.1.0",
  instructions:
    "Tools for the ShowPro entertainment booking system. Use these to look up bookings, artists, clients, venues, and invoices for the signed-in user. All tools respect the user's row-level security and return only data the user is permitted to see.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listBookings, getBooking, listArtists, listClients, listVenues, listInvoices],
});
