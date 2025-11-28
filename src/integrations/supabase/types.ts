export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      artists: {
        Row: {
          act_type: string | null
          buy_fee: number | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          invoice_upload_url: string | null
          name: string
          notes: string | null
          phone: string | null
          post_multiplier: number | null
          pre_multiplier: number | null
          sell_fee: number | null
          status: string | null
          supplier_id: string | null
          updated_at: string | null
          user_id: string | null
          vat_rate: number | null
        }
        Insert: {
          act_type?: string | null
          buy_fee?: number | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          invoice_upload_url?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          post_multiplier?: number | null
          pre_multiplier?: number | null
          sell_fee?: number | null
          status?: string | null
          supplier_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          vat_rate?: number | null
        }
        Update: {
          act_type?: string | null
          buy_fee?: number | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          invoice_upload_url?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          post_multiplier?: number | null
          pre_multiplier?: number | null
          sell_fee?: number | null
          status?: string | null
          supplier_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "artists_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artists_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers_basic"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_series: {
        Row: {
          client_id: string | null
          created_at: string | null
          end_date: string
          id: string
          name: string
          pattern: string | null
          start_date: string
          status: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          end_date: string
          id?: string
          name: string
          pattern?: string | null
          start_date: string
          status?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          end_date?: string
          id?: string
          name?: string
          pattern?: string | null
          start_date?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_series_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          accounts_contact_id: string | null
          arrival_time: string | null
          artist_fee: number | null
          artist_id: string | null
          artist_paid: boolean | null
          artist_status: Database["public"]["Enums"]["booking_status"] | null
          balance_paid: boolean | null
          booking_date: string
          buy_fee: number | null
          client_contact_name: string | null
          client_fee: number | null
          client_id: string
          client_paid: boolean | null
          client_status: Database["public"]["Enums"]["booking_status"] | null
          commission_percent: number | null
          commission_rate: number | null
          confirmation_link: string | null
          contact_id: string | null
          created_at: string | null
          deposit_amount: number | null
          deposit_paid: boolean | null
          description: string | null
          end_time: string | null
          fee_model: Database["public"]["Enums"]["fee_model"] | null
          financial_type: Database["public"]["Enums"]["financial_mode"] | null
          finish_date: string | null
          finish_time: string | null
          gig_type_id: string | null
          id: string
          invoice_sent: boolean | null
          invoice_status: string | null
          invoiced: boolean | null
          job_code: string | null
          location_contact_name: string | null
          location_id: string | null
          notes: string | null
          performance_times: string | null
          placeholder: boolean | null
          profit_percent: number | null
          remittance_date: string | null
          remittance_received: boolean | null
          sell_fee: number | null
          series_id: string | null
          start_date: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["booking_status"] | null
          supplier_contact_name: string | null
          supplier_id: string | null
          team_id: string | null
          terms_template_id: string | null
          updated_at: string | null
          vat_applicable: boolean | null
          vat_in: number | null
          vat_out: number | null
          vat_rate: number | null
          venue_id: string | null
        }
        Insert: {
          accounts_contact_id?: string | null
          arrival_time?: string | null
          artist_fee?: number | null
          artist_id?: string | null
          artist_paid?: boolean | null
          artist_status?: Database["public"]["Enums"]["booking_status"] | null
          balance_paid?: boolean | null
          booking_date: string
          buy_fee?: number | null
          client_contact_name?: string | null
          client_fee?: number | null
          client_id: string
          client_paid?: boolean | null
          client_status?: Database["public"]["Enums"]["booking_status"] | null
          commission_percent?: number | null
          commission_rate?: number | null
          confirmation_link?: string | null
          contact_id?: string | null
          created_at?: string | null
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          description?: string | null
          end_time?: string | null
          fee_model?: Database["public"]["Enums"]["fee_model"] | null
          financial_type?: Database["public"]["Enums"]["financial_mode"] | null
          finish_date?: string | null
          finish_time?: string | null
          gig_type_id?: string | null
          id?: string
          invoice_sent?: boolean | null
          invoice_status?: string | null
          invoiced?: boolean | null
          job_code?: string | null
          location_contact_name?: string | null
          location_id?: string | null
          notes?: string | null
          performance_times?: string | null
          placeholder?: boolean | null
          profit_percent?: number | null
          remittance_date?: string | null
          remittance_received?: boolean | null
          sell_fee?: number | null
          series_id?: string | null
          start_date?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          supplier_contact_name?: string | null
          supplier_id?: string | null
          team_id?: string | null
          terms_template_id?: string | null
          updated_at?: string | null
          vat_applicable?: boolean | null
          vat_in?: number | null
          vat_out?: number | null
          vat_rate?: number | null
          venue_id?: string | null
        }
        Update: {
          accounts_contact_id?: string | null
          arrival_time?: string | null
          artist_fee?: number | null
          artist_id?: string | null
          artist_paid?: boolean | null
          artist_status?: Database["public"]["Enums"]["booking_status"] | null
          balance_paid?: boolean | null
          booking_date?: string
          buy_fee?: number | null
          client_contact_name?: string | null
          client_fee?: number | null
          client_id?: string
          client_paid?: boolean | null
          client_status?: Database["public"]["Enums"]["booking_status"] | null
          commission_percent?: number | null
          commission_rate?: number | null
          confirmation_link?: string | null
          contact_id?: string | null
          created_at?: string | null
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          description?: string | null
          end_time?: string | null
          fee_model?: Database["public"]["Enums"]["fee_model"] | null
          financial_type?: Database["public"]["Enums"]["financial_mode"] | null
          finish_date?: string | null
          finish_time?: string | null
          gig_type_id?: string | null
          id?: string
          invoice_sent?: boolean | null
          invoice_status?: string | null
          invoiced?: boolean | null
          job_code?: string | null
          location_contact_name?: string | null
          location_id?: string | null
          notes?: string | null
          performance_times?: string | null
          placeholder?: boolean | null
          profit_percent?: number | null
          remittance_date?: string | null
          remittance_received?: boolean | null
          sell_fee?: number | null
          series_id?: string | null
          start_date?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          supplier_contact_name?: string | null
          supplier_id?: string | null
          team_id?: string | null
          terms_template_id?: string | null
          updated_at?: string | null
          vat_applicable?: boolean | null
          vat_in?: number | null
          vat_out?: number | null
          vat_rate?: number | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_accounts_contact_id_fkey"
            columns: ["accounts_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_accounts_contact_id_fkey"
            columns: ["accounts_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_gig_type_id_fkey"
            columns: ["gig_type_id"]
            isOneToOne: false
            referencedRelation: "gig_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_park_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_park_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "booking_series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bookings_terms_template"
            columns: ["terms_template_id"]
            isOneToOne: false
            referencedRelation: "terms_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          accounts_contact_email: string | null
          accounts_contact_name: string | null
          accounts_contact_phone: string | null
          address: string | null
          billing_address: string | null
          code: string | null
          company_number: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          email_targets: Json | null
          id: string
          invoice_preferences: string | null
          is_venue_operator: boolean | null
          name: string
          notes: string | null
          status: string | null
          updated_at: string | null
          vat_number: string | null
        }
        Insert: {
          accounts_contact_email?: string | null
          accounts_contact_name?: string | null
          accounts_contact_phone?: string | null
          address?: string | null
          billing_address?: string | null
          code?: string | null
          company_number?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          email_targets?: Json | null
          id?: string
          invoice_preferences?: string | null
          is_venue_operator?: boolean | null
          name: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          vat_number?: string | null
        }
        Update: {
          accounts_contact_email?: string | null
          accounts_contact_name?: string | null
          accounts_contact_phone?: string | null
          address?: string | null
          billing_address?: string | null
          code?: string | null
          company_number?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          email_targets?: Json | null
          id?: string
          invoice_preferences?: string | null
          is_venue_operator?: boolean | null
          name?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          vat_number?: string | null
        }
        Relationships: []
      }
      contact_artists: {
        Row: {
          artist_id: string
          contact_id: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          role: string | null
        }
        Insert: {
          artist_id: string
          contact_id: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          role?: string | null
        }
        Update: {
          artist_id?: string
          contact_id?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_artists_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_artists_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_artists_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_artists_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_basic"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_clients: {
        Row: {
          client_id: string
          contact_id: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          role: string | null
        }
        Insert: {
          client_id: string
          contact_id: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          role?: string | null
        }
        Update: {
          client_id?: string
          contact_id?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_clients_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_clients_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_basic"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_locations: {
        Row: {
          contact_id: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          location_id: string
          role: string | null
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          location_id: string
          role?: string | null
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          location_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_locations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_locations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations_basic"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_suppliers: {
        Row: {
          contact_id: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          role: string | null
          supplier_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          role?: string | null
          supplier_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          role?: string | null
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_suppliers_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_suppliers_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers_basic"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_venues: {
        Row: {
          contact_id: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          role: string | null
          venue_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          role?: string | null
          venue_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          role?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_venues_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_venues_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_venues_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          client_id: string | null
          created_at: string | null
          department_id: string | null
          email: string | null
          id: string
          location_id: string | null
          mobile: string | null
          name: string
          notes: string | null
          phone: string | null
          status: string | null
          supplier_id: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          department_id?: string | null
          email?: string | null
          id?: string
          location_id?: string | null
          mobile?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          status?: string | null
          supplier_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          department_id?: string | null
          email?: string | null
          id?: string
          location_id?: string | null
          mobile?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string | null
          supplier_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_park_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_park_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers_basic"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          client_id: string | null
          created_at: string | null
          id: string
          name: string
          status: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          status?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      emails_queue: {
        Row: {
          approved_to_send: boolean | null
          attachments: Json | null
          booking_id: string | null
          created_at: string | null
          email_body: string | null
          email_subject: string | null
          id: string
          recipient_type: string | null
          recipients: Json | null
          sent: boolean | null
          sent_at: string | null
          type: string | null
        }
        Insert: {
          approved_to_send?: boolean | null
          attachments?: Json | null
          booking_id?: string | null
          created_at?: string | null
          email_body?: string | null
          email_subject?: string | null
          id?: string
          recipient_type?: string | null
          recipients?: Json | null
          sent?: boolean | null
          sent_at?: string | null
          type?: string | null
        }
        Update: {
          approved_to_send?: boolean | null
          attachments?: Json | null
          booking_id?: string | null
          created_at?: string | null
          email_body?: string | null
          email_subject?: string | null
          id?: string
          recipient_type?: string | null
          recipients?: Json | null
          sent?: boolean | null
          sent_at?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emails_queue_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_queue_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_public_view"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_types: {
        Row: {
          created_at: string | null
          id: string
          name: string
          post_multiplier: number | null
          pre_multiplier: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          post_multiplier?: number | null
          pre_multiplier?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          post_multiplier?: number | null
          pre_multiplier?: number | null
        }
        Relationships: []
      }
      invoice_actions: {
        Row: {
          action: string
          id: string
          invoice_id: string
          notes: string | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          action: string
          id?: string
          invoice_id: string
          notes?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          id?: string
          invoice_id?: string
          notes?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_actions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_batches: {
        Row: {
          batch_date: string
          client_id: string | null
          created_at: string | null
          id: string
          invoice_number: string | null
          notes: string | null
          sent: boolean | null
          sent_at: string | null
          status: string | null
          total_amount: number | null
        }
        Insert: {
          batch_date: string
          client_id?: string | null
          created_at?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          sent?: boolean | null
          sent_at?: string | null
          status?: string | null
          total_amount?: number | null
        }
        Update: {
          batch_date?: string
          client_id?: string | null
          created_at?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          sent?: boolean | null
          sent_at?: string | null
          status?: string | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_batches_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_due: number
          artist_payment_link: string | null
          booking_id: string
          created_at: string | null
          due_date: string
          id: string
          invoice_number: string | null
          payment_link: string | null
          sent_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount_due: number
          artist_payment_link?: string | null
          booking_id: string
          created_at?: string | null
          due_date: string
          id?: string
          invoice_number?: string | null
          payment_link?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_due?: number
          artist_payment_link?: string | null
          booking_id?: string
          created_at?: string | null
          due_date?: string
          id?: string
          invoice_number?: string | null
          payment_link?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_public_view"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          client_id: string | null
          created_at: string | null
          email: string | null
          ents_contact_email: string | null
          ents_contact_mobile: string | null
          ents_contact_name: string | null
          id: string
          map_link_url: string | null
          name: string
          notes: string | null
          phone: string | null
          postcode: string | null
          status: string | null
          updated_at: string | null
          upload_history: Json | null
        }
        Insert: {
          address?: string | null
          client_id?: string | null
          created_at?: string | null
          email?: string | null
          ents_contact_email?: string | null
          ents_contact_mobile?: string | null
          ents_contact_name?: string | null
          id?: string
          map_link_url?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          postcode?: string | null
          status?: string | null
          updated_at?: string | null
          upload_history?: Json | null
        }
        Update: {
          address?: string | null
          client_id?: string | null
          created_at?: string | null
          email?: string | null
          ents_contact_email?: string | null
          ents_contact_mobile?: string | null
          ents_contact_name?: string | null
          id?: string
          map_link_url?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          postcode?: string | null
          status?: string | null
          updated_at?: string | null
          upload_history?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "parks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          artist_portion: number | null
          booking_id: string
          created_at: string | null
          id: string
          invoice_id: string | null
          method: string | null
          notes: string | null
          payment_date: string | null
          payment_type: string | null
          status: string | null
        }
        Insert: {
          amount: number
          artist_portion?: number | null
          booking_id: string
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          method?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_type?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          artist_portion?: number | null
          booking_id?: string
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          method?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_type?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_public_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          email_preferences: Json | null
          full_name: string | null
          google_calendar_refresh_token: string | null
          google_calendar_token: string | null
          google_calendar_token_expiry: string | null
          id: string
          notification_settings: Json | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          email_preferences?: Json | null
          full_name?: string | null
          google_calendar_refresh_token?: string | null
          google_calendar_token?: string | null
          google_calendar_token_expiry?: string | null
          id: string
          notification_settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          email_preferences?: Json | null
          full_name?: string | null
          google_calendar_refresh_token?: string | null
          google_calendar_token?: string | null
          google_calendar_token_expiry?: string | null
          id?: string
          notification_settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          accounts_contact_email: string | null
          accounts_contact_name: string | null
          accounts_contact_phone: string | null
          address: string | null
          company_number: string | null
          contact_name: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          status: string | null
          updated_at: string | null
          vat_number: string | null
        }
        Insert: {
          accounts_contact_email?: string | null
          accounts_contact_name?: string | null
          accounts_contact_phone?: string | null
          address?: string | null
          company_number?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          vat_number?: string | null
        }
        Update: {
          accounts_contact_email?: string | null
          accounts_contact_name?: string | null
          accounts_contact_phone?: string | null
          address?: string | null
          company_number?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          vat_number?: string | null
        }
        Relationships: []
      }
      teams: {
        Row: {
          artist_ids: string[] | null
          created_at: string | null
          id: string
          name: string
          notes: string | null
          status: string | null
        }
        Insert: {
          artist_ids?: string[] | null
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          status?: string | null
        }
        Update: {
          artist_ids?: string[] | null
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          status?: string | null
        }
        Relationships: []
      }
      terms_templates: {
        Row: {
          active: boolean | null
          body_html: string | null
          category: string | null
          id: string
          last_updated: string | null
          template_name: string
        }
        Insert: {
          active?: boolean | null
          body_html?: string | null
          category?: string | null
          id?: string
          last_updated?: string | null
          template_name: string
        }
        Update: {
          active?: boolean | null
          body_html?: string | null
          category?: string | null
          id?: string
          last_updated?: string | null
          template_name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          buffer_hours: number | null
          capacity: number | null
          created_at: string | null
          id: string
          location_id: string | null
          name: string
          notes: string | null
          post_multiplier: number | null
          pre_multiplier: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          buffer_hours?: number | null
          capacity?: number | null
          created_at?: string | null
          id?: string
          location_id?: string | null
          name: string
          notes?: string | null
          post_multiplier?: number | null
          pre_multiplier?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          buffer_hours?: number | null
          capacity?: number | null
          created_at?: string | null
          id?: string
          location_id?: string | null
          name?: string
          notes?: string | null
          post_multiplier?: number | null
          pre_multiplier?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      artists_for_bookings: {
        Row: {
          act_type: string | null
          id: string | null
          name: string | null
        }
        Insert: {
          act_type?: string | null
          id?: string | null
          name?: string | null
        }
        Update: {
          act_type?: string | null
          id?: string | null
          name?: string | null
        }
        Relationships: []
      }
      bookings_public_view: {
        Row: {
          artist_id: string | null
          artist_status: Database["public"]["Enums"]["booking_status"] | null
          client_id: string | null
          client_status: Database["public"]["Enums"]["booking_status"] | null
          created_at: string | null
          description: string | null
          finish_date: string | null
          finish_time: string | null
          id: string | null
          location_id: string | null
          notes: string | null
          start_date: string | null
          start_time: string | null
          updated_at: string | null
          venue_id: string | null
        }
        Insert: {
          artist_id?: string | null
          artist_status?: Database["public"]["Enums"]["booking_status"] | null
          client_id?: string | null
          client_status?: Database["public"]["Enums"]["booking_status"] | null
          created_at?: string | null
          description?: string | null
          finish_date?: string | null
          finish_time?: string | null
          id?: string | null
          location_id?: string | null
          notes?: string | null
          start_date?: string | null
          start_time?: string | null
          updated_at?: string | null
          venue_id?: string | null
        }
        Update: {
          artist_id?: string | null
          artist_status?: Database["public"]["Enums"]["booking_status"] | null
          client_id?: string | null
          client_status?: Database["public"]["Enums"]["booking_status"] | null
          created_at?: string | null
          description?: string | null
          finish_date?: string | null
          finish_time?: string | null
          id?: string | null
          location_id?: string | null
          notes?: string | null
          start_date?: string | null
          start_time?: string | null
          updated_at?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_park_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_park_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts_basic: {
        Row: {
          client_id: string | null
          created_at: string | null
          department_id: string | null
          id: string | null
          name: string | null
          park_id: string | null
          supplier_id: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          department_id?: string | null
          id?: string | null
          name?: string | null
          park_id?: string | null
          supplier_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          department_id?: string | null
          id?: string | null
          name?: string | null
          park_id?: string | null
          supplier_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_park_id_fkey"
            columns: ["park_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_park_id_fkey"
            columns: ["park_id"]
            isOneToOne: false
            referencedRelation: "locations_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers_basic"
            referencedColumns: ["id"]
          },
        ]
      }
      locations_basic: {
        Row: {
          address: string | null
          client_id: string | null
          created_at: string | null
          id: string | null
          name: string | null
          postcode: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          postcode?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          postcode?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      showpro_summary: {
        Row: {
          active_bookings: number | null
          confirmed_bookings: number | null
          generated_at: string | null
          last_artist_update: string | null
          last_booking_update: string | null
          last_client_update: string | null
          last_email_update: string | null
          last_supplier_update: string | null
          outstanding_balance_value: number | null
          queued_emails: number | null
          sent_emails: number | null
          total_artists: number | null
          total_bookings: number | null
          total_clients: number | null
          total_suppliers: number | null
          unpaid_balances: number | null
          unpaid_deposits: number | null
        }
        Relationships: []
      }
      suppliers_basic: {
        Row: {
          address: string | null
          created_at: string | null
          id: string | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_artist_profit: {
        Args: { p_buy_fee: number; p_sell_fee: number }
        Returns: number
      }
      create_user_profile: {
        Args: { p_email: string; p_full_name?: string; p_user_id: string }
        Returns: undefined
      }
      generate_job_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "artist" | "front_desk" | "view_only"
      booking_status: "enquiry" | "pencil" | "confirmed" | "cancelled"
      fee_model: "commission" | "buy_sell"
      financial_mode: "commission" | "third_party"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "artist", "front_desk", "view_only"],
      booking_status: ["enquiry", "pencil", "confirmed", "cancelled"],
      fee_model: ["commission", "buy_sell"],
      financial_mode: ["commission", "third_party"],
    },
  },
} as const
