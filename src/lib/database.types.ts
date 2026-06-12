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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      abandoned_carts: {
        Row: {
          cart_data: Json
          clerk_user_id: string | null
          created_at: string | null
          customer_email: string | null
          customer_phone: string | null
          id: string
          last_active_at: string | null
          status: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          cart_data: Json
          clerk_user_id?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          id?: string
          last_active_at?: string | null
          status?: string
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          cart_data?: Json
          clerk_user_id?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          id?: string
          last_active_at?: string | null
          status?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      agricultural_shrinkage_logs: {
        Row: {
          id: string
          log_type: string
          logged_at: string | null
          loss_reason: string | null
          product_id: string
          quantity_kg: number
        }
        Insert: {
          id?: string
          log_type: string
          logged_at?: string | null
          loss_reason?: string | null
          product_id: string
          quantity_kg: number
        }
        Update: {
          id?: string
          log_type?: string
          logged_at?: string | null
          loss_reason?: string | null
          product_id?: string
          quantity_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "agricultural_shrinkage_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor: string
          category: string
          details: string | null
          id: string
          metadata: Json | null
          target: string
          timestamp: string | null
        }
        Insert: {
          action: string
          actor: string
          category: string
          details?: string | null
          id?: string
          metadata?: Json | null
          target: string
          timestamp?: string | null
        }
        Update: {
          action?: string
          actor?: string
          category?: string
          details?: string | null
          id?: string
          metadata?: Json | null
          target?: string
          timestamp?: string | null
        }
        Relationships: []
      }
      b2b_credit_profiles: {
        Row: {
          credit_balance: number | null
          credit_days_remaining: number | null
          credit_limit: number | null
          id: string
          tier: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          credit_balance?: number | null
          credit_days_remaining?: number | null
          credit_limit?: number | null
          id?: string
          tier: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          credit_balance?: number | null
          credit_days_remaining?: number | null
          credit_limit?: number | null
          id?: string
          tier?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      business_applications: {
        Row: {
          address: string
          applicant_email: string
          applicant_name: string
          business_name: string
          business_type: string
          clerk_user_id: string
          created_at: string | null
          id: string
          monthly_volume: string | null
          municipality: string
          nit: string | null
          notes: string | null
          phone: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          address: string
          applicant_email: string
          applicant_name: string
          business_name: string
          business_type: string
          clerk_user_id: string
          created_at?: string | null
          id?: string
          monthly_volume?: string | null
          municipality: string
          nit?: string | null
          notes?: string | null
          phone: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          address?: string
          applicant_email?: string
          applicant_name?: string
          business_name?: string
          business_type?: string
          clerk_user_id?: string
          created_at?: string | null
          id?: string
          monthly_volume?: string | null
          municipality?: string
          nit?: string | null
          notes?: string | null
          phone?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: []
      }
      buying_templates: {
        Row: {
          created_at: string | null
          id: string
          last_used_at: string | null
          product_list: Json
          template_name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          product_list?: Json
          template_name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          product_list?: Json
          template_name?: string
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          assigned_rep: string | null
          business_name: string | null
          clerk_user_id: string
          created_at: string | null
          credit_limit: number | null
          current_balance: number | null
          email: string | null
          full_name: string | null
          last_order_at: string | null
          nit: string | null
          payment_terms: string | null
          phone: string | null
          tier: string | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          assigned_rep?: string | null
          business_name?: string | null
          clerk_user_id: string
          created_at?: string | null
          credit_limit?: number | null
          current_balance?: number | null
          email?: string | null
          full_name?: string | null
          last_order_at?: string | null
          nit?: string | null
          payment_terms?: string | null
          phone?: string | null
          tier?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          assigned_rep?: string | null
          business_name?: string | null
          clerk_user_id?: string
          created_at?: string | null
          credit_limit?: number | null
          current_balance?: number | null
          email?: string | null
          full_name?: string | null
          last_order_at?: string | null
          nit?: string | null
          payment_terms?: string | null
          phone?: string | null
          tier?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_operational_ledgers: {
        Row: {
          closed_at: string | null
          closed_by_user: string
          id: string
          operational_date: string
          total_orders_processed: number
          total_revenue_collected: number
        }
        Insert: {
          closed_at?: string | null
          closed_by_user: string
          id?: string
          operational_date: string
          total_orders_processed?: number
          total_revenue_collected?: number
        }
        Update: {
          closed_at?: string | null
          closed_by_user?: string
          id?: string
          operational_date?: string
          total_orders_processed?: number
          total_revenue_collected?: number
        }
        Relationships: []
      }
      global_settings: {
        Row: {
          id: string
          track_inventory: boolean
          updated_at: string | null
        }
        Insert: {
          id?: string
          track_inventory?: boolean
          updated_at?: string | null
        }
        Update: {
          id?: string
          track_inventory?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      kit_items: {
        Row: {
          id: string
          kit_id: string | null
          product_id: string | null
          quantity: number
        }
        Insert: {
          id?: string
          kit_id?: string | null
          product_id?: string | null
          quantity?: number
        }
        Update: {
          id?: string
          kit_id?: string | null
          product_id?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "kit_items_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kit_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      kits: {
        Row: {
          banner_url: string | null
          created_at: string | null
          fixed_price: number
          id: string
          name: string
          slug: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          banner_url?: string | null
          created_at?: string | null
          fixed_price: number
          id?: string
          name: string
          slug: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          banner_url?: string | null
          created_at?: string | null
          fixed_price?: number
          id?: string
          name?: string
          slug?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      marketing_leads: {
        Row: {
          assigned_to: string | null
          business_name: string | null
          business_type: string
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string
          source: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          business_name?: string | null
          business_type: string
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone: string
          source?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          business_name?: string | null
          business_type?: string
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string
          source?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          price_at_purchase: number
          product_id: string
          product_name: string
          quantity: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          price_at_purchase: number
          product_id: string
          product_name: string
          quantity: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          price_at_purchase?: number
          product_id?: string
          product_name?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          clerk_user_id: string | null
          conflict_reason: string | null
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          delivery_address: string
          delivery_municipality: string
          id: string
          is_conflicted: boolean | null
          notes: string | null
          payment_method: string
          purchase_tier: string | null
          scheduled_delivery_date: string | null
          status: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          clerk_user_id?: string | null
          conflict_reason?: string | null
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          delivery_address: string
          delivery_municipality: string
          id?: string
          is_conflicted?: boolean | null
          notes?: string | null
          payment_method: string
          purchase_tier?: string | null
          scheduled_delivery_date?: string | null
          status?: string
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          clerk_user_id?: string | null
          conflict_reason?: string | null
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          delivery_address?: string
          delivery_municipality?: string
          id?: string
          is_conflicted?: boolean | null
          notes?: string | null
          payment_method?: string
          purchase_tier?: string | null
          scheduled_delivery_date?: string | null
          status?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          base_cost: number
          category: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_in_season: boolean
          name: string
          price_micro: number
          price_restaurant: number
          price_retail: number
          stock_quantity: number
          subcategory: string | null
          unit: string
          updated_at: string | null
        }
        Insert: {
          base_cost?: number
          category: string
          created_at?: string | null
          description?: string | null
          id: string
          image_url?: string | null
          is_active?: boolean
          is_in_season?: boolean
          name: string
          price_micro?: number
          price_restaurant?: number
          price_retail?: number
          stock_quantity?: number
          subcategory?: string | null
          unit: string
          updated_at?: string | null
        }
        Update: {
          base_cost?: number
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_in_season?: boolean
          name?: string
          price_micro?: number
          price_restaurant?: number
          price_retail?: number
          stock_quantity?: number
          subcategory?: string | null
          unit?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          contact_name: string | null
          created_at: string | null
          email: string | null
          farm_location: string | null
          id: string
          name: string
          phone: string | null
          status: string
          supplied_categories: string[] | null
          updated_at: string | null
        }
        Insert: {
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          farm_location?: string | null
          id?: string
          name: string
          phone?: string | null
          status?: string
          supplied_categories?: string[] | null
          updated_at?: string | null
        }
        Update: {
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          farm_location?: string | null
          id?: string
          name?: string
          phone?: string | null
          status?: string
          supplied_categories?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          address: string | null
          business_name: string | null
          delivery_zones: Json | null
          hours: string | null
          id: string
          micro_margin: number | null
          nit: string | null
          notifications: Json | null
          phone: string | null
          retail_margin: number | null
          updated_at: string | null
          wholesale_margin: number | null
        }
        Insert: {
          address?: string | null
          business_name?: string | null
          delivery_zones?: Json | null
          hours?: string | null
          id?: string
          micro_margin?: number | null
          nit?: string | null
          notifications?: Json | null
          phone?: string | null
          retail_margin?: number | null
          updated_at?: string | null
          wholesale_margin?: number | null
        }
        Update: {
          address?: string | null
          business_name?: string | null
          delivery_zones?: Json | null
          hours?: string | null
          id?: string
          micro_margin?: number | null
          nit?: string | null
          notifications?: Json | null
          phone?: string | null
          retail_margin?: number | null
          updated_at?: string | null
          wholesale_margin?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
