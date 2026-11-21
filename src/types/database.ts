// Généré par : npx supabase gen types typescript --remote=<ref> --schema public (ne pas éditer)
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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: number
          meta: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: never
          meta?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: never
          meta?: Json
        }
        Relationships: []
      }
      auth_attempts: {
        Row: {
          attempts: number
          locked_until: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          locked_until?: string | null
          phone: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          locked_until?: string | null
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          amount: number
          created_at: string
          deposit: number
          end_at: string
          id: string
          listing_id: string
          method: Database["public"]["Enums"]["payment_method"] | null
          paid: number
          ref: string
          start_at: string
          status: Database["public"]["Enums"]["booking_status"]
          title_snapshot: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          deposit?: number
          end_at: string
          id?: string
          listing_id: string
          method?: Database["public"]["Enums"]["payment_method"] | null
          paid?: number
          ref?: string
          start_at: string
          status?: Database["public"]["Enums"]["booking_status"]
          title_snapshot: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          deposit?: number
          end_at?: string
          id?: string
          listing_id?: string
          method?: Database["public"]["Enums"]["payment_method"] | null
          paid?: number
          ref?: string
          start_at?: string
          status?: Database["public"]["Enums"]["booking_status"]
          title_snapshot?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          attributes: Json
          city: string | null
          created_at: string
          description: Json
          id: string
          image_urls: string[]
          is_published: boolean
          kind: Database["public"]["Enums"]["listing_kind"]
          lat: number | null
          legacy_id: string | null
          lng: number | null
          owner_id: string | null
          price: number
          price_unit: string
          title: string
          updated_at: string
        }
        Insert: {
          attributes?: Json
          city?: string | null
          created_at?: string
          description?: Json
          id?: string
          image_urls?: string[]
          is_published?: boolean
          kind: Database["public"]["Enums"]["listing_kind"]
          lat?: number | null
          legacy_id?: string | null
          lng?: number | null
          owner_id?: string | null
          price: number
          price_unit: string
          title: string
          updated_at?: string
        }
        Update: {
          attributes?: Json
          city?: string | null
          created_at?: string
          description?: Json
          id?: string
          image_urls?: string[]
          is_published?: boolean
          kind?: Database["public"]["Enums"]["listing_kind"]
          lat?: number | null
          legacy_id?: string | null
          lng?: number | null
          owner_id?: string | null
          price?: number
          price_unit?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          country_code: string
          created_at: string
          email: string | null
          first_name: string
          id: string
          is_blocked: boolean
          lang: string
          last_name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          country_code?: string
          created_at?: string
          email?: string | null
          first_name?: string
          id: string
          is_blocked?: boolean
          lang?: string
          last_name?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          country_code?: string
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          is_blocked?: boolean
          lang?: string
          last_name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          currency: string
          id: string
          idempotency_key: string | null
          kind: Database["public"]["Enums"]["wallet_tx_kind"]
          label_key: string | null
          label_text: string | null
          label_vars: Json
          method: Database["public"]["Enums"]["payment_method"] | null
          status: Database["public"]["Enums"]["wallet_tx_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          idempotency_key?: string | null
          kind: Database["public"]["Enums"]["wallet_tx_kind"]
          label_key?: string | null
          label_text?: string | null
          label_vars?: Json
          method?: Database["public"]["Enums"]["payment_method"] | null
          status?: Database["public"]["Enums"]["wallet_tx_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          idempotency_key?: string | null
          kind?: Database["public"]["Enums"]["wallet_tx_kind"]
          label_key?: string | null
          label_text?: string | null
          label_vars?: Json
          method?: Database["public"]["Enums"]["payment_method"] | null
          status?: Database["public"]["Enums"]["wallet_tx_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_dashboard_stats: { Args: never; Returns: Json }
      admin_resolve_withdrawal: {
        Args: { p_approve: boolean; p_tx_id: string }
        Returns: undefined
      }
      admin_set_booking_status: {
        Args: {
          p_booking_id: string
          p_status: Database["public"]["Enums"]["booking_status"]
        }
        Returns: undefined
      }
      admin_set_user_blocked: {
        Args: { p_blocked: boolean; p_user: string }
        Returns: undefined
      }
      admin_wallet_adjust: {
        Args: { p_amount: number; p_reason: string; p_user: string }
        Returns: undefined
      }
      cancel_booking: {
        Args: { p_booking_id: string }
        Returns: {
          amount: number
          created_at: string
          deposit: number
          end_at: string
          id: string
          listing_id: string
          method: Database["public"]["Enums"]["payment_method"] | null
          paid: number
          ref: string
          start_at: string
          status: Database["public"]["Enums"]["booking_status"]
          title_snapshot: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_booking: {
        Args: {
          p_end: string
          p_listing: string
          p_start: string
          p_with_driver?: boolean
        }
        Returns: {
          amount: number
          created_at: string
          deposit: number
          end_at: string
          id: string
          listing_id: string
          method: Database["public"]["Enums"]["payment_method"] | null
          paid: number
          ref: string
          start_at: string
          status: Database["public"]["Enums"]["booking_status"]
          title_snapshot: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_all_busy_slots: {
        Args: { p_from: string; p_to: string }
        Returns: {
          end_at: string
          listing_ref: string
          start_at: string
        }[]
      }
      get_busy_slots: {
        Args: { p_from: string; p_listing_id: string; p_to: string }
        Returns: {
          end_at: string
          start_at: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      log_audit: {
        Args: {
          p_action: string
          p_entity: string
          p_entity_id: string
          p_meta: Json
        }
        Returns: undefined
      }
      pay_booking_wallet: {
        Args: { p_booking_id: string; p_full?: boolean }
        Returns: {
          amount: number
          created_at: string
          deposit: number
          end_at: string
          id: string
          listing_id: string
          method: Database["public"]["Enums"]["payment_method"] | null
          paid: number
          ref: string
          start_at: string
          status: Database["public"]["Enums"]["booking_status"]
          title_snapshot: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      request_withdrawal: {
        Args: {
          p_amount: number
          p_method: Database["public"]["Enums"]["payment_method"]
        }
        Returns: {
          amount: number
          booking_id: string | null
          created_at: string
          currency: string
          id: string
          idempotency_key: string | null
          kind: Database["public"]["Enums"]["wallet_tx_kind"]
          label_key: string | null
          label_text: string | null
          label_vars: Json
          method: Database["public"]["Enums"]["payment_method"] | null
          status: Database["public"]["Enums"]["wallet_tx_status"]
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "wallet_transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      wallet_balance: { Args: never; Returns: number }
      wallet_balance_of: { Args: { p_user: string }; Returns: number }
    }
    Enums: {
      app_role: "admin"
      booking_status: "pending" | "confirmed" | "cancelled"
      listing_kind: "vehicle_sale" | "vehicle_rental" | "housing"
      payment_method: "wallet" | "momo" | "cash"
      wallet_tx_kind: "in" | "out"
      wallet_tx_status: "pending" | "completed" | "failed"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin"],
      booking_status: ["pending", "confirmed", "cancelled"],
      listing_kind: ["vehicle_sale", "vehicle_rental", "housing"],
      payment_method: ["wallet", "momo", "cash"],
      wallet_tx_kind: ["in", "out"],
      wallet_tx_status: ["pending", "completed", "failed"],
    },
  },
} as const
