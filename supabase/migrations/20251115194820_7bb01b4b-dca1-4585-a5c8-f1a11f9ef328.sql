-- Create join tables for many-to-many relationships

-- Contact-Client relationships
CREATE TABLE IF NOT EXISTS public.contact_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  role text,
  is_primary boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(contact_id, client_id)
);

-- Contact-Artist relationships
CREATE TABLE IF NOT EXISTS public.contact_artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  artist_id uuid NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  role text,
  is_primary boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(contact_id, artist_id)
);

-- Contact-Supplier relationships
CREATE TABLE IF NOT EXISTS public.contact_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  role text,
  is_primary boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(contact_id, supplier_id)
);

-- Contact-Location relationships  
CREATE TABLE IF NOT EXISTS public.contact_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  role text,
  is_primary boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(contact_id, location_id)
);

-- Contact-Venue relationships
CREATE TABLE IF NOT EXISTS public.contact_venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  role text,
  is_primary boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(contact_id, venue_id)
);

-- Enable RLS on all join tables
ALTER TABLE public.contact_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_venues ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contact_clients
CREATE POLICY "contact_clients_read" ON public.contact_clients FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "contact_clients_manage" ON public.contact_clients FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)
);

-- RLS Policies for contact_artists
CREATE POLICY "contact_artists_read" ON public.contact_artists FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "contact_artists_manage" ON public.contact_artists FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)
);

-- RLS Policies for contact_suppliers
CREATE POLICY "contact_suppliers_read" ON public.contact_suppliers FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "contact_suppliers_manage" ON public.contact_suppliers FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)
);

-- RLS Policies for contact_locations
CREATE POLICY "contact_locations_read" ON public.contact_locations FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "contact_locations_manage" ON public.contact_locations FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)
);

-- RLS Policies for contact_venues
CREATE POLICY "contact_venues_read" ON public.contact_venues FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "contact_venues_manage" ON public.contact_venues FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_clients_contact ON public.contact_clients(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_clients_client ON public.contact_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_contact_artists_contact ON public.contact_artists(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_artists_artist ON public.contact_artists(artist_id);
CREATE INDEX IF NOT EXISTS idx_contact_suppliers_contact ON public.contact_suppliers(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_suppliers_supplier ON public.contact_suppliers(supplier_id);
CREATE INDEX IF NOT EXISTS idx_contact_locations_contact ON public.contact_locations(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_locations_location ON public.contact_locations(location_id);
CREATE INDEX IF NOT EXISTS idx_contact_venues_contact ON public.contact_venues(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_venues_venue ON public.contact_venues(venue_id);