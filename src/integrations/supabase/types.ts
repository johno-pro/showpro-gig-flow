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
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          supplier_id: string | null
          updated_at: string | null
        }
        Insert: {
          act_type?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          act_type?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          supplier_id?: string | null
          updated_at?: string | null
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
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          end_date: string
          id?: string
          name: string
          pattern?: string | null
          start_date: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          end_date?: string
          id?: string
          name?: string
          pattern?: string | null
          start_date?: string
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
          artist_fee: number | null
          artist_id: string | null
          balance_paid: boolean | null
          booking_date: string
          client_fee: number | null
          client_id: string
          commission_rate: number | null
          contact_id: string | null
          created_at: string | null
          deposit_amount: number | null
          deposit_paid: boolean | null
          end_time: string | null
          fee_model: Database["public"]["Enums"]["fee_model"] | null
          id: string
          invoiced: boolean | null
          job_code: string | null
          location_id: string | null
          notes: string | null
          series_id: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["booking_status"] | null
          supplier_id: string | null
          team_id: string | null
          updated_at: string | null
          vat_applicable: boolean | null
          venue_id: string | null
        }
        Insert: {
          artist_fee?: number | null
          artist_id?: string | null
          balance_paid?: boolean | null
          booking_date: string
          client_fee?: number | null
          client_id: string
          commission_rate?: number | null
          contact_id?: string | null
          created_at?: string | null
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          end_time?: string | null
          fee_model?: Database["public"]["Enums"]["fee_model"] | null
          id?: string
          invoiced?: boolean | null
          job_code?: string | null
          location_id?: string | null
          notes?: string | null
          series_id?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          supplier_id?: string | null
          team_id?: string | null
          updated_at?: string | null
          vat_applicable?: boolean | null
          venue_id?: string | null
        }
        Update: {
          artist_fee?: number | null
          artist_id?: string | null
          balance_paid?: boolean | null
          booking_date?: string
          client_fee?: number | null
          client_id?: string
          commission_rate?: number | null
          contact_id?: string | null
          created_at?: string | null
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          end_time?: string | null
          fee_model?: Database["public"]["Enums"]["fee_model"] | null
          id?: string
          invoiced?: boolean | null
          job_code?: string | null
          location_id?: string | null
          notes?: string | null
          series_id?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          supplier_id?: string | null
          team_id?: string | null
          updated_at?: string | null
          vat_applicable?: boolean | null
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
        ]
      }
      clients: {
        Row: {
          accounts_contact_email: string | null
          accounts_contact_name: string | null
          accounts_contact_phone: string | null
          address: string | null
          code: string | null
          company_number: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          name: string
          notes: string | null
          updated_at: string | null
          vat_number: string | null
        }
        Insert: {
          accounts_contact_email?: string | null
          accounts_contact_name?: string | null
          accounts_contact_phone?: string | null
          address?: string | null
          code?: string | null
          company_number?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          updated_at?: string | null
          vat_number?: string | null
        }
        Update: {
          accounts_contact_email?: string | null
          accounts_contact_name?: string | null
          accounts_contact_phone?: string | null
          address?: string | null
          code?: string | null
          company_number?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string | null
          vat_number?: string | null
        }
        Relationships: []
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
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
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
      locations: {
        Row: {
          address: string | null
          client_id: string | null
          created_at: string | null
          email: string | null
          id: string
          map_link_url: string | null
          name: string
          notes: string | null
          phone: string | null
          postcode: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          client_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          map_link_url?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          postcode?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          client_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          map_link_url?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
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
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string | null
          id: string
          notes: string | null
          payment_date: string | null
          payment_type: string | null
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_type?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
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
        }
        Insert: {
          artist_ids?: string[] | null
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
        }
        Update: {
          artist_ids?: string[] | null
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
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
          capacity: number | null
          created_at: string | null
          id: string
          location_id: string | null
          name: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          id?: string
          location_id?: string | null
          name: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          id?: string
          location_id?: string | null
          name?: string
          notes?: string | null
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
      app_role: "admin" | "manager" | "artist"
      booking_status: "enquiry" | "pencil" | "confirmed" | "cancelled"
      fee_model: "commission" | "buy_sell"
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
      app_role: ["admin", "manager", "artist"],
      booking_status: ["enquiry", "pencil", "confirmed", "cancelled"],
      fee_model: ["commission", "buy_sell"],
    },
  },
} as const
